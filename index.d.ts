/// <reference types="maplibre-gl" />

import { IControl } from 'maplibre-gl';
import { Map as Map_2 } from 'maplibre-gl';

export declare class Compass implements IControl {
    _map?: Map_2;
    size: NonNullable<CompassProps['size']>;
    visualizePitch: boolean;
    displayDirection: boolean;
    compassElement?: HTMLDivElement;
    customClick?: () => void;
    constructor({ size, visualizePitch, displayDirection, onClick, }?: CompassProps);
    onAdd(map: Map_2): HTMLElement;
    onRemove(map: Map_2): void;
    getDefaultPosition(): "bottom-left";
    changeSize: (size: NonNullable<CompassProps['size']>) => void;
    handleClick: () => void;
    handleMapJog: () => void;
    toggle: () => void;
    createNeedle(): HTMLDivElement;
    createCompassElement: () => HTMLElement;
}

export declare type CompassProps = {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    displayDirection?: boolean;
    visualizePitch?: boolean;
    onClick?: () => void;
};

export { }
