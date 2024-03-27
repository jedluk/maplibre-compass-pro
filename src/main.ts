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


const compass = new Compass({ size: 'md', visualizePitch: false })
map.addControl(compass, 'bottom-left')
