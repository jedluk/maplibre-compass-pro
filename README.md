# Maplibre compass pro

Professional compass for all kind of maplibre-based maps, inspired by Jack Sparrow's compass.

![demo](./demo.png)

Main features:

- old fashioned compass rose
- predefined sizes (from 'xs' to 'xl')
- typescript support
- possibility to visualize pitch
- ease integration with maplibre-gl

## Integration with maplibre

```js
import maplibregl from 'maplibre-gl'
import { Compass } from './compass'

const map = new maplibregl.Map({
  container: 'map',
  style: '/mapStyle.json',
  center: [14.5, 53.4],
  zoom: 11,
})

const compass = new Compass({ size: 'md', visualizePitch: false })
map.addControl(compass, 'bottom-left')
```

Compass props:

```ts
type CompassProps = {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  visualizePitch?: boolean
  onClick?: () => void
}
```
