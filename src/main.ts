import 'maplibre-gl/dist/maplibre-gl.css'
import './main.css'
import maplibregl from 'maplibre-gl'
import { Compass, CompassProps } from './compass'

const map = new maplibregl.Map({
	container: 'map',
	style: '/mapStyleDev.json',
	center: [21.017532, 52.237049],
	zoom: 11,
})

const options: CompassProps = {
	size: 'md',
	visualizePitch: true,
	displayDirection: false,
	theme: 'classic',
}

let compass = new Compass(options)

map.addControl(compass, 'bottom-left')

map.on('load', function () {
	document
		.getElementById('size-selector')
		?.addEventListener('change', function (evt) {
			const { value } = evt.target as HTMLSelectElement
			options.size = value as NonNullable<CompassProps['size']>
			compass.changeSize(options.size)
		})
	document
		.getElementById('kind-selector')
		?.addEventListener('change', function () {
			options.displayDirection = !options.displayDirection
			compass.toggle()
		})
	document
		.getElementById('theme-selector')
		?.addEventListener('change', function (evt) {
			const { value } = evt.target as HTMLSelectElement
			options.theme = value as NonNullable<CompassProps['theme']>
			// theme is picked once, when compass gets created
			map.removeControl(compass)
			compass = new Compass(options)
			map.addControl(compass, 'bottom-left')
		})
})
