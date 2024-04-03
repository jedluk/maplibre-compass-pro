import 'maplibre-gl/dist/maplibre-gl.css'
import './maplibre.css'
import maplibregl from 'maplibre-gl'
import { Compass } from './compass'

const map = new maplibregl.Map({
	container: 'map',
	style: '/mapStyleDev.json',
	center: [21.017532, 52.237049],
	zoom: 11,
})

const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

sizes.slice(2, 3).forEach((size) => {
	map.addControl(new Compass({ size, visualizePitch: true }), 'bottom-left')
})
