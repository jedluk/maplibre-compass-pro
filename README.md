# Maplibre compass pro [![npm](https://img.shields.io/npm/v/maplibre-compass-pro.svg)](https://www.npmjs.com/package/maplibre-compass-pro) [![npm downloads](https://img.shields.io/npm/dm/maplibre-compass-pro.svg)](https://www.npmjs.com/package/maplibre-compass-pro)

Professional, good looking compass, suitable for use in all kinds of maplibre-based projects, inspired by Jack Sparrow's compass.

![demo](./demo.png)

## [LIVE DEMO](https://codesandbox.io/p/sandbox/peaceful-mirzakhani-tv38ck)

## Main features:

- old fashioned compass rose
- predefined sizes (from 'xs' to 'xl')
- typescript support
- possibility to visualize pitch
- possibility to display cardinal directions
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

Remember to import compass styles 🙏🙏🙏 at top of the file.

Compass props:

```ts
type CompassProps = {
	size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' // default 'md'
	visualizePitch?: boolean // default false
	displayDirections?: boolean // default false (use cardinal directions instead of needle)
	onClick?: () => void // default map.resetNorthPitch
}
```

You can omit props object so that all defaults will be used.

## Using compass API

It's possible to update compass size, or toggle between needle/cardinal directions using its API. See code snippet below:

```js
const compass = new Compass({ size: 'sm' }) // set size 'sm' as initial value, needle is used as default
map.addControl(compass, 'bottom-left')

// change compass size
compass.changeSize('lg')

// display cardinal directions instead of needle
compass.toggle()
// back to needle in 3 seconds
setTimeout(() => {
	compass.toggle()
}, 3000)
```

## Placement

Compass position is determined by second argument of addControl function. You can pick one of: _top-left_, _top-right_, _bottom-left_, and _bottom-right_. Default position is _bottom-left_. If you want to move the compass away from the corner please override maplibre class, like below:

```css
.maplibregl-ctrl-bottom-left {
	left: 10px;
	bottom: 10px;
}
```

## Integration with React

If you work in React environment consider using [react-map-gl](https://visgl.github.io/react-map-gl/) as maplibre wrapper, together with [map-gl-compass-pro](https://www.npmjs.com/package/map-gl-compass-pro) (official wrapper for mapibre-compass-pro). Code snippet:

```tsx
import 'maplibre-gl/dist/maplibre-gl.css'

import Map from 'react-map-gl/maplibre'
import Compass from 'maplibre-compass-pro'
import { useState } from 'react'

export function DemoApp() {
	const [compassSize, setCompassSize] = useState('md')
	const [displayDirection, setDisplayDirection] = useState(true)

	return (
		<Map
			style={{ width: '100%', height: '100vh' }}
			mapStyle="/<your_map_style>.json"
		>
			<Compass size={compassSize} displayDirection={displayDirection} />
		</Map>
	)
}
```
