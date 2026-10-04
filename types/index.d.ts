import { IControl } from 'maplibre-gl';
import { Map as Map_2 } from 'maplibre-gl';

export declare class Compass implements IControl {
    #private;
    constructor({ size, visualizePitch, displayDirection, onClick, theme, pointTo, }?: CompassProps);
    onAdd(map: Map_2): HTMLElement;
    onRemove(map: Map_2): void;
    getDefaultPosition(): "bottom-left";
    changeSize(size: NonNullable<CompassProps['size']>): void;
    toggle(): void;
    setPointTo(pointTo: CompassProps['pointTo']): void;
}

export declare type CompassProps = {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    displayDirection?: boolean;
    visualizePitch?: boolean;
    onClick?: () => void;
    theme?: 'classic' | '3d';
    /** [lng, lat] the needle is drawn to instead of north (3d theme only) */
    pointTo?: [number, number] | null;
};

export { }
