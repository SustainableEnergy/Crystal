/**
 * Type definitions for the Crystal Structure application
 */

// Visual Settings Interface
export interface VisualSettings {
    enableBloom: boolean;
    enableVignette: boolean;
    backlightIntensity: number;
    aoIntensity: number;
    aoRadius: number;
    aoDistanceFalloff: number;
    aoColor: string;
}

// Element Settings Interface
export interface ElementSetting {
    visible: boolean;
    scale: number;
    color: string;
}

export type ElementSettings = Record<string, ElementSetting>;

// Space Group Info Interface
export interface SpaceGroupInfo {
    material: string;
    unitCell: {
        a: number;
        b: number;
        c: number;
        alpha: number;
        beta: number;
        gamma: number;
    };
}

// Material Props Interface
export interface MaterialProps {
    roughness: number;
    metalness: number;
    clearcoat: number;
    transmission: number;
    ior: number;
    thickness: number;
    emissiveIntensity: number;
    transparent?: boolean;
    opacity?: number;
}

// Event Detail Interfaces
export interface StructureChangeEventDetail {
    structure: string;
    cifData?: string;
}

export interface SnapshotRequestEventDetail {
    transparent?: boolean;
    resolution?: number;
}

export interface HighResSnapshotEventDetail {
    transparent?: boolean;
    resolution: number;
    currentStructure: string;
}
