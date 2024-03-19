import 'maplibre-gl/dist/maplibre-gl.css'
import './maplibre.css'
import maplibregl from 'maplibre-gl'
import { Compass } from './compass';

const map = new maplibregl.Map({
  container: 'map',
  style: '/mapStyle.json',
  center: [14.5, 53.4],
  zoom: 11
});


let idx = 0
const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

const compass = new Compass({ size: 'md' })
map.addControl(compass)

// setInterval(() => {
// compass.changeSize(sizes[idx++ % sizes.length])
// }, 1_000)
