# Maplibre compass pro [![npm](https://img.shields.io/npm/v/maplibre-compass-pro.svg)](https://www.npmjs.com/package/maplibre-compass-pro) [![npm downloads](https://img.shields.io/npm/dm/maplibre-compass-pro.svg)](https://www.npmjs.com/package/maplibre-compass-pro)

Professional, good looking compass, suitable for use in all kinds of maplibre-based projects, inspired by Jack Sparrow's compass.

![demo](./demo.png)

## [LIVE DEMO](https://codesandbox.io/p/sandbox/peaceful-mirzakhani-tv38ck)

## Main features:

- old fashioned compass rose
- predefined sizes (from 'xs' to 'xl')
- typescript support
- possibility to visualize pitch
- ease integration with maplibre-gl

## Integration with maplibre

```js
import 'maplibre-gl/dist/maplibre-gl.css'
import 'maplibre-compass-pro/dist/style.css'
import maplibregl from 'maplibre-gl'
import { Compass } from 'maplibre-compass-pro'

const map = new maplibregl.Map({
  container: 'map',
  style: '/mapStyle.json',
  center: [14.5, 53.4],
  zoom: 11,
})

const compass = new Compass({ size: 'sm' })
map.addControl(compass, 'bottom-left')
```

Compass props:

```ts
type CompassProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' // default 'md'
  visualizePitch?: boolean // default false
  onClick?: () => void // default map.resetNorthPitch
}
```

You can omit props object so that all defaults will be used.

## Integration with React

If you're working in React environment consider using [react-map-gl](https://visgl.github.io/react-map-gl/) as maplibre wrapper, together with [map-gl-compass-pro](https://www.npmjs.com/package/map-gl-compass-pro). As for now there are tiny differences between those 2 packages (in view only) - but they will be aligned soon. It's also possible to wrap maplibre-compass-pro with [use-control hook](https://visgl.github.io/react-map-gl/docs/api-reference/use-control).
