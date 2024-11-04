import './compass.css'
import { type IControl, type Map } from 'maplibre-gl'
import { mapBearingToIcon } from './lib'

export type CompassProps = {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	displayDirection?: boolean
	visualizePitch?: boolean
	onClick?: () => void
}

export class Compass implements IControl {
	#map?: Map
	#size: NonNullable<CompassProps['size']>
	#visualizePitch: boolean
	#displayCardinalDirection: boolean
	#compassElement?: HTMLDivElement
	#lastBearingIcon?: SVGSVGElement
	#customClick?: () => void

	constructor({
		size = 'md',
		visualizePitch = false,
		displayDirection = false,
		onClick,
	}: CompassProps = {}) {
		this.#size = size
		this.#visualizePitch = visualizePitch
		this.#displayCardinalDirection = displayDirection
		this.#customClick = onClick
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

		this.#compassElement.style.transform = this.#deduceTransformProperty(clockwiseBearing, pitch)
		if (this.#displayCardinalDirection) {
			this.#replaceDirectionIcon(clockwiseBearing)
		}
	}

	onAdd(map: Map): HTMLElement {
		this.#map = map
		map.on('rotate', this.#handleMapJog)
		map.on('pitch', this.#handleMapJog)
		return this.#createCompassElement()
	}

	onRemove(map: Map): void {
		map.off('rotate', this.#handleMapJog)
		map.off('pitch', this.#handleMapJog)
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
}
