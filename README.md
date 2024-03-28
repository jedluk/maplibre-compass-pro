# Maplibre compass pro

Professional, good looking compass, suitable for use in all kinds of maplibre-based projects, inspired by Jack Sparrow's compass.

![demo](./demo.png)

Main features:

- old fashioned compass rose
- predefined sizes (from 'xs' to 'xl')
- typescript support
- possibility to visualize pitch
- ease integration with maplibre-gl

## Integration with maplibre

```js
import 'maplibre-compass-pro/dist/style.css'
import maplibregl from 'maplibre-gl'
import { Compass } from 'maplibre-compass-pro'

const map = new maplibregl.Map({
  container: 'map',
  style: '/mapStyle.json',
  center: [14.5, 53.4],
  zoom: 11,
})

const compass = new Compass({ size: 'sm' }) // see compass props below
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
