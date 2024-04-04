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

map.addControl(
	new Compass({
		size: sizes[2],
		visualizePitch: false,
		displayDirection: true,
	}),
	'bottom-left',
)
