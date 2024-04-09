/// <reference types="maplibre-gl" />

import { IControl } from 'maplibre-gl';
import { Map as Map_2 } from 'maplibre-gl';

export declare class Compass implements IControl {
    #private;
    constructor({ size, visualizePitch, displayDirection, onClick, }?: CompassProps);
    onAdd(map: Map_2): HTMLElement;
    onRemove(map: Map_2): void;
    getDefaultPosition(): "bottom-left";
    changeSize(size: NonNullable<CompassProps['size']>): void;
    toggle(): void;
}

export declare type CompassProps = {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    displayDirection?: boolean;
    visualizePitch?: boolean;
    onClick?: () => void;
};

export { }
