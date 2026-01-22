/**
 * Geometric constants for crystal structure calculations
 */

// Bond distance thresholds (in Angstroms)
export const BOND_DISTANCE = {
    METAL_OXYGEN: 2.4,
    PHOSPHORUS_OXYGEN: 1.9,
    MIN_DISTANCE: 0.1,
} as const;

// UI Layout constants
export const UI_LAYOUT = {
    LEVA_PANEL_WIDTH: 420,
    DESKTOP_TOP_MARGIN: 20,
    DESKTOP_BOTTOM_MARGIN: 30,
    MOBILE_HEADER_HEIGHT: 56,
    MOBILE_FOOTER_HEIGHT: 70,
    Z_INDEX: {
        LEVA_DESKTOP: 999,
        LEVA_MOBILE: 998,
        EXPORT_BUTTON: 1000,
        HEADER: 100,
        FOOTER: 999,
    },
} as const;

// Camera constants
export const CAMERA = {
    DEFAULT_POSITION: [30, 20, 80] as [number, number, number],
    DEFAULT_FOV: 45,
    MOBILE_Y_OFFSET: 2.0,
} as const;
