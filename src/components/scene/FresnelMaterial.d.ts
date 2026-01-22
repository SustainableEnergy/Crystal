/**
 * Type declaration for FresnelMaterial
 */

import * as THREE from 'three';

declare global {
    namespace JSX {
        interface IntrinsicElements {
            fresnelMaterial: {
                color?: string | THREE.Color;
                intensity?: number;
                opacity?: number;
                transparent?: boolean;
                depthWrite?: boolean;
                side?: THREE.Side;
                clippingPlanes?: THREE.Plane[];
                blending?: THREE.Blending;
            };
        }
    }
}

export { };
