import './compass.css'
import { type IControl, type Map } from 'maplibre-gl'
import { DIRECTION_ICONS } from './icons'

export type CompassProps = {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	literals?: boolean
	visualizePitch?: boolean
	onClick?: () => void
}

export class Compass implements IControl {
	_map?: Map
	size: NonNullable<CompassProps['size']>
	icons: typeof DIRECTION_ICONS
	visualizePitch: boolean
	literals: boolean
	compassElement?: HTMLDivElement
	innerFace?: HTMLImageElement
	customClick?: () => void

	constructor({
		size = 'md',
		visualizePitch = false,
		literals = false,
		onClick,
	}: CompassProps = {}) {
		this.size = size
		this.visualizePitch = visualizePitch
		this.literals = literals
		this.customClick = onClick
		this.icons = DIRECTION_ICONS
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
		const shieldElement = this.compassElement.querySelector('.inner-face')
		if (this.literals && shieldElement instanceof Element) {
			// remove previous icon if exists
			if (shieldElement.firstChild) {
				shieldElement.removeChild(shieldElement.firstChild)
			}

			if (bearing > -135 && bearing < -45) {
				shieldElement.appendChild(this.icons.east)
			} else if (bearing >= -45 && bearing < 45) {
				shieldElement.appendChild(this.icons.north)
			} else if (bearing >= 45 && bearing < 135) {
				shieldElement.appendChild(this.icons.west)
			} else {
				shieldElement.appendChild(this.icons.south)
			}
		}
		this.compassElement.style.transform = transform
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

		if (this.literals) {
			innerFace.appendChild(this.icons.north)
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
