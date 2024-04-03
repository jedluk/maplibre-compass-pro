import { DIRECTION_ICONS } from "./icons"

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