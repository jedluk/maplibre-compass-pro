import './compass.css'
import { type IControl, type Map } from 'maplibre-gl'

export type CompassProps = {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
	literals?: boolean
	visualizePitch?: boolean
	onClick?: () => void
}

export class Compass implements IControl {
	_map?: Map
	size: NonNullable<CompassProps['size']>
	visualizePitch: boolean
	literals: boolean
	compassElement?: HTMLDivElement
	literalElement?: HTMLImageElement
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
		if (this.literals && this.literalElement) {
			if (bearing > -135 && bearing < -45) {
				this.literalElement.src = '/east.svg'
				this.literalElement.style.transform = 'rotate(90deg)'
			} else if (bearing >= -45 && bearing < 45) {
				this.literalElement.src = '/north.svg'
				this.literalElement.style.transform = ''
			} else if (bearing >= 45 && bearing < 135) {
				this.literalElement.src = '/west.svg'
				this.literalElement.style.transform = 'rotate(-90deg)'
			} else {
				this.literalElement.src = '/south.svg'
				this.literalElement.style.transform = 'rotate(180deg)'
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
			const img = document.createElement('img')
			img.src = '/north.svg'
			this.literalElement = img
			innerFace.appendChild(img)
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
