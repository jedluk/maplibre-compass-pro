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

const compass = new Compass({
	size: 'md',
	visualizePitch: true,
	displayDirection: false,
	theme: 'classic',
})

map.addControl(compass, 'bottom-left')

map.on('load', function () {
	document
		.getElementById('size-selector')
		?.addEventListener('change', function (evt) {
			const { value } = evt.target as HTMLSelectElement
			compass.changeSize(value as NonNullable<CompassProps['size']>)
		})
	document
		.getElementById('kind-selector')
		?.addEventListener('change', function () {
			compass.toggle()
		})
	document
		.getElementById('theme-selector')
		?.addEventListener('change', function (evt) {
			const { value } = evt.target as HTMLSelectElement
			compass.setTheme(value as NonNullable<CompassProps['theme']>)
		})
})
