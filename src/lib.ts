import { DIRECTION_ICONS } from './icons'

export function mapBearingToIcon(bearing: number) {
	if (bearing > -135 && bearing < -45) {
		return DIRECTION_ICONS.east
	} else if (bearing >= -45 && bearing < 45) {
		return DIRECTION_ICONS.north
	} else if (bearing >= 45 && bearing < 135) {
		return DIRECTION_ICONS.west
	} else {
		return DIRECTION_ICONS.south
	}
}

// initial bearing of the great circle leading from one [lng, lat] to another
export function bearingBetween(from: [number, number], to: [number, number]) {
	const toRadians = (degrees: number) => (degrees * Math.PI) / 180
	const [fromLat, toLat] = [toRadians(from[1]), toRadians(to[1])]
	const deltaLng = toRadians(to[0] - from[0])

	const y = Math.sin(deltaLng) * Math.cos(toLat)
	const x =
		Math.cos(fromLat) * Math.sin(toLat) -
		Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)

	return (Math.atan2(y, x) * 180) / Math.PI
}

// azimuth (clockwise from north) and altitude of the sun, both in degrees
export function sunPosition(date: Date, lng: number, lat: number) {
	const toRadians = (degrees: number) => (degrees * Math.PI) / 180
	const toDegrees = (radians: number) => (radians * 180) / Math.PI
	// days since J2000.0
	const days = date.getTime() / 86_400_000 - 10_957.5

	const anomaly = toRadians(357.528 + 0.9856003 * days)
	const eclipticLng = toRadians(
		280.46 +
			0.9856474 * days +
			1.915 * Math.sin(anomaly) +
			0.02 * Math.sin(2 * anomaly),
	)
	const obliquity = toRadians(23.439 - 0.0000004 * days)
	const rightAscension = Math.atan2(
		Math.cos(obliquity) * Math.sin(eclipticLng),
		Math.cos(eclipticLng),
	)
	const declination = Math.asin(Math.sin(obliquity) * Math.sin(eclipticLng))
	const siderealTime = toRadians(280.46061837 + 360.98564736629 * days + lng)
	const hourAngle = siderealTime - rightAscension
	const latitude = toRadians(lat)

	const altitude = Math.asin(
		Math.sin(latitude) * Math.sin(declination) +
			Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle),
	)
	const azimuth = Math.atan2(
		Math.sin(hourAngle),
		Math.cos(hourAngle) * Math.sin(latitude) -
			Math.tan(declination) * Math.cos(latitude),
	)
	return { azimuth: toDegrees(azimuth) + 180, altitude: toDegrees(altitude) }
}
