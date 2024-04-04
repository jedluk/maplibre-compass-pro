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
	_map?: Map
	size: NonNullable<CompassProps['size']>
	visualizePitch: boolean
	displayDirection: boolean
	compassElement?: HTMLDivElement
	customClick?: () => void

	constructor({
		size = 'md',
		visualizePitch = false,
		displayDirection = false,
		onClick,
	}: CompassProps = {}) {
		this.size = size
		this.visualizePitch = visualizePitch
		this.displayDirection = displayDirection
		this.customClick = onClick
	}

	onAdd(map: Map): HTMLElement {
		this._map = map
		map.on('rotate', this.handleMapJog)
		map.on('pitch', this.handleMapJog)
		return this.createCompassElement()
	}

	onRemove(map: Map): void {
		map.off('rotate', this.handleMapJog)
		map.off('pitch', this.handleMapJog)
	}

	getDefaultPosition() {
		return 'bottom-left' as const
	}

	changeSize = (size: NonNullable<CompassProps['size']>) => {
		this.size = size
		this.compassElement?.setAttribute('data-size', this.size)
		this.compassElement?.parentElement?.setAttribute('data-size', this.size)
	}

	handleClick = () => {
		if (this.customClick) {
			this.customClick()
		} else {
			this._map?.resetNorthPitch()
		}
	}

	handleMapJog = () => {
		if (!this._map || !this.compassElement) {
			return
		}

		const bearing = -1 * this._map.getBearing()
		let transform = `rotate(${bearing}deg)`
		if (this.visualizePitch) {
			const pitch = this._map.getPitch()
			transform += ` rotateX(${pitch}deg)`
		}
		this.compassElement.style.transform = transform

		if (this.displayDirection) {
			const shieldElement = this.compassElement.lastElementChild
			if (!shieldElement) {
				return
			}
			const icon = mapBearingToIcon(bearing)
			if (shieldElement.firstChild) {
				shieldElement.replaceChild(icon, shieldElement.firstChild)
			} else {
				shieldElement.appendChild(icon)
			}
		}
	}

	createCompassElement = (): HTMLElement => {
		const container = document.createElement('div')
		container.id = 'compass'
		container.classList.add('compass-pro-wrapper')
		container.setAttribute('data-size', this.size)

		const compass = document.createElement('div')
		compass.classList.add('compass-pro')
		compass.setAttribute('data-size', this.size)
		compass.addEventListener('click', this.handleClick)

		const children: HTMLElement[] = []

		for (let i = 1; i <= 6; i++) {
			const needle = document.createElement('div')
			needle.classList.add('needle')
			children.push(needle)
		}

		const innerFace = document.createElement('div')
		innerFace.classList.add('inner-face')
		children.push(innerFace)

		if (this.displayDirection) {
			innerFace.appendChild(mapBearingToIcon(0))
		} else {
			const needleNorth = document.createElement('div')
			needleNorth.classList.add('needlde-north')
			children.push(needleNorth)
		}

		compass.append(...children)
		this.compassElement = compass
		container.append(compass)

		return container
	}
}
