import './compass.css'
import { type IControl, type Map } from 'maplibre-gl'
import { bearingBetween, mapBearingToIcon } from './lib'
import { Scene } from './scene'

export type CompassProps = {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	displayDirection?: boolean
	visualizePitch?: boolean
	onClick?: () => void
	theme?: 'classic' | '3d'
	/** [lng, lat] the needle is drawn to instead of north (3d theme only) */
	pointTo?: [number, number] | null
}

export class Compass implements IControl {
	#map?: Map
	#size: NonNullable<CompassProps['size']>
	#visualizePitch: boolean
	#displayCardinalDirection: boolean
	#compassElement?: HTMLDivElement
	#lastBearingIcon?: SVGSVGElement
	#customClick?: () => void
	#theme: NonNullable<CompassProps['theme']>
	#pointTo?: CompassProps['pointTo']
	#scene?: Scene

	constructor({
		size = 'md',
		visualizePitch = false,
		displayDirection = false,
		onClick,
		theme = 'classic',
		pointTo,
	}: CompassProps = {}) {
		this.#size = size
		this.#visualizePitch = visualizePitch
		this.#displayCardinalDirection = displayDirection
		this.#customClick = onClick
		this.#theme = theme
		this.#pointTo = pointTo
	}

	#createNeedle() {
		const needleNorth = document.createElement('div')
		needleNorth.classList.add('needlde-north')
		return needleNorth
	}

	#createCompassElement() {
		const container = document.createElement('div')
		container.id = 'compass'
		container.classList.add('compass-pro-wrapper')
		container.setAttribute('data-size', this.#size)

		// falls back to classic look when there is no WebGL around
		this.#scene = this.#theme === '3d' ? Scene.create() : undefined
		if (this.#scene) {
			const { element } = this.#scene
			element.setAttribute('data-size', this.#size)
			element.addEventListener('click', this.#handleClick)
			this.#compassElement = element
			container.append(element)
			this.#handleMapJog()
			return container
		}

		const compass = document.createElement('div')
		compass.classList.add('compass-pro')
		compass.setAttribute('data-size', this.#size)
		compass.addEventListener('click', this.#handleClick)

		const children: HTMLElement[] = []

		for (let i = 1; i <= 6; i++) {
			const needle = document.createElement('div')
			needle.classList.add('needle')
			children.push(needle)
		}

		const innerFace = document.createElement('div')
		innerFace.classList.add('inner-face')
		children.push(innerFace)

		if (this.#displayCardinalDirection) {
			const directionIcon = mapBearingToIcon(0)
			innerFace.appendChild(directionIcon)
		} else {
			const needle = this.#createNeedle()
			children.push(needle)
		}

		compass.append(...children)
		this.#compassElement = compass
		container.append(compass)

		return container
	}

	#handleClick = () => {
		if (this.#customClick) {
			this.#customClick()
		} else {
			this.#map?.resetNorthPitch()
		}
	}

	#deduceTransformProperty = (clockwiseBearing: number, pitch: number) => {
		let transform = `rotate(${clockwiseBearing}deg)`
		if (this.#visualizePitch) {
			transform += ` rotateX(${pitch}deg)`
		}
		return transform
	}

	#replaceDirectionIcon = (clockwiseBearing: number) => {
		const shieldElement = this.#compassElement!.lastElementChild
		if (!shieldElement) {
			return
		}
		const icon = mapBearingToIcon(clockwiseBearing)
		if (shieldElement.firstChild) {
			if (icon !== this.#lastBearingIcon) {
				shieldElement.replaceChild(icon, shieldElement.firstChild)
				this.#lastBearingIcon = icon
			}
		} else {
			// we draw icon for the very first time
			shieldElement.appendChild(icon)
		}
	}

	#handleMapJog = () => {
		if (!this.#map || !this.#compassElement) {
			return
		}

		const bearing = this.#map.getBearing()
		const pitch = this.#map.getPitch()
		const clockwiseBearing = -1 * bearing

		if (this.#scene) {
			const { lng, lat } = this.#map.getCenter()
			this.#scene.update(
				bearing,
				this.#visualizePitch ? pitch : 0,
				[lng, lat],
				this.#pointTo ? bearingBetween([lng, lat], this.#pointTo) : 0,
			)
			this.#scene.setIcon(
				this.#displayCardinalDirection
					? mapBearingToIcon(clockwiseBearing)
					: null,
			)
			return
		}

		this.#compassElement.style.transform = this.#deduceTransformProperty(
			clockwiseBearing,
			pitch,
		)
		if (this.#displayCardinalDirection) {
			this.#replaceDirectionIcon(clockwiseBearing)
		}
	}

	onAdd(map: Map): HTMLElement {
		this.#map = map
		map.on('rotate', this.#handleMapJog)
		map.on('pitch', this.#handleMapJog)
		if (this.#theme === '3d') {
			// sun wanders as the map is panned, so does the place needle is drawn to
			map.on('moveend', this.#handleMapJog)
		}
		if (this.#pointTo) {
			map.on('move', this.#handleMapJog)
		}
		return this.#createCompassElement()
	}

	onRemove(map: Map): void {
		map.off('rotate', this.#handleMapJog)
		map.off('pitch', this.#handleMapJog)
		map.off('moveend', this.#handleMapJog)
		map.off('move', this.#handleMapJog)
		// leave nothing behind, so API called afterwards has nothing to act on
		this.#compassElement?.parentElement?.remove()
		this.#scene?.destroy()
		this.#scene = undefined
		this.#compassElement = undefined
		this.#map = undefined
	}

	getDefaultPosition() {
		return 'bottom-left' as const
	}

	changeSize(size: NonNullable<CompassProps['size']>) {
		this.#size = size
		this.#compassElement?.setAttribute('data-size', this.#size)
		this.#compassElement?.parentElement?.setAttribute('data-size', this.#size)
	}

	toggle() {
		if (!this.#compassElement || !this.#map) {
			return
		}
		this.#displayCardinalDirection = !this.#displayCardinalDirection
		if (this.#scene) {
			this.#handleMapJog()
			return
		}
		if (this.#displayCardinalDirection) {
			const bearing = this.#map.getBearing()
			const directionIcon = mapBearingToIcon(-1 * bearing)
			// remove needle
			this.#compassElement.lastChild?.remove()
			// append to shield
			this.#compassElement.lastChild?.appendChild(directionIcon)
		} else {
			const shieldElement = this.#compassElement.lastElementChild
			shieldElement?.removeChild(shieldElement.firstChild as Node)
			const needle = this.#createNeedle()
			this.#compassElement.appendChild(needle)
		}
	}

	setPointTo(pointTo: CompassProps['pointTo']) {
		this.#pointTo = pointTo
		this.#map?.off('move', this.#handleMapJog)
		if (pointTo) {
			// needle has to follow map panning as well
			this.#map?.on('move', this.#handleMapJog)
		}
		this.#handleMapJog()
	}
}
