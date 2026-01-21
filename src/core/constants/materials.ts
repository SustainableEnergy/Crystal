// Material definitions for cathode structures
export interface MaterialMetadata {
    id: string;
    name: string;
    displayName: string;
    spaceGroup: string;
    spaceGroupNumber: number;
    crystalSystem: string;
    description: string;
    defaultUnitCell: {
        nx: number;
        ny: number;
        nz: number;
    };
}

// Material IDs as constants
export const MATERIAL_IDS = {
    NCM_811: 'NCM-811',
    NCM_622: 'NCM-622',
    NCM_111: 'NCM-111',
    LFP: 'LFP',
    LMFP: 'LMFP',
} as const;

// Base material families (without variant suffixes)
export const MATERIAL_FAMILIES = {
    NCM: 'NCM',
    LFP: 'LFP',
    LMFP: 'LMFP',
} as const;

// Material metadata registry
export const MATERIALS: Record<string, MaterialMetadata> = {
    [MATERIAL_IDS.NCM_811]: {
        id: MATERIAL_IDS.NCM_811,
        name: 'NCM-811',
        displayName: 'NCM811 (Ni:Co:Mn = 8:1:1)',
        spaceGroup: 'R-3m',
        spaceGroupNumber: 166,
        crystalSystem: 'Trigonal (Rhombohedral)',
        description: 'Layered structure with rhombohedral symmetry',
        defaultUnitCell: { nx: 6, ny: 6, nz: 3 },
    },
    [MATERIAL_IDS.NCM_622]: {
        id: MATERIAL_IDS.NCM_622,
        name: 'NCM-622',
        displayName: 'NCM622 (Ni:Co:Mn = 6:2:2)',
        spaceGroup: 'R-3m',
        spaceGroupNumber: 166,
        crystalSystem: 'Trigonal (Rhombohedral)',
        description: 'Layered structure with rhombohedral symmetry',
        defaultUnitCell: { nx: 6, ny: 6, nz: 3 },
    },
    [MATERIAL_IDS.NCM_111]: {
        id: MATERIAL_IDS.NCM_111,
        name: 'NCM-111',
        displayName: 'NCM111 (Ni:Co:Mn = 1:1:1)',
        spaceGroup: 'R-3m',
        spaceGroupNumber: 166,
        crystalSystem: 'Trigonal (Rhombohedral)',
        description: 'Layered structure with rhombohedral symmetry',
        defaultUnitCell: { nx: 6, ny: 6, nz: 3 },
    },
    [MATERIAL_IDS.LFP]: {
        id: MATERIAL_IDS.LFP,
        name: 'LFP',
        displayName: 'LFP (LiFePO₄)',
        spaceGroup: 'Pnma',
        spaceGroupNumber: 62,
        crystalSystem: 'Orthorhombic',
        description: 'Olivine structure with orthorhombic symmetry',
        defaultUnitCell: { nx: 3, ny: 3, nz: 6 },
    },
    [MATERIAL_IDS.LMFP]: {
        id: MATERIAL_IDS.LMFP,
        name: 'LMFP',
        displayName: 'LMFP (LiMn₀.₃₅Fe₀.₆₅PO₄)',
        spaceGroup: 'Pnma',
        spaceGroupNumber: 62,
        crystalSystem: 'Orthorhombic',
        description: 'Olivine structure with Mn/Fe solid solution (35%/65%)',
        defaultUnitCell: { nx: 3, ny: 3, nz: 6 },
    },
};

// List of all supported materials (for UI display order)
export const SUPPORTED_MATERIALS = [
    MATERIALS[MATERIAL_IDS.NCM_811],
    MATERIALS[MATERIAL_IDS.NCM_622],
    MATERIALS[MATERIAL_IDS.NCM_111],
    MATERIALS[MATERIAL_IDS.LFP],
    MATERIALS[MATERIAL_IDS.LMFP],
];

// Type for material family names
export type MaterialFamily = typeof MATERIAL_FAMILIES[keyof typeof MATERIAL_FAMILIES];

// Helper function to get material family from full ID
export const getMaterialFamily = (materialId: string): MaterialFamily => {
    return materialId.split('-')[0] as MaterialFamily;
};

// Helper function to check if material supports unit cell controls
export const supportsUnitCellControls = (materialId: string): boolean => {
    const family = getMaterialFamily(materialId);
    const supportedFamilies: MaterialFamily[] = [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP];
    return supportedFamilies.includes(family);
};


// --- ELEMENT PROPERTIES ---

export const ELEMENT_COLORS: { [key: string]: string } = {
    Li: '#0277BD', // Premium Azure
    Ni: '#00897B', // Deep Mint (Teal) - Less neon, more distinct
    Co: '#EF6C00', // Burnt Orbit (Dark Orange) - Richer tone
    Mn: '#7E57C2', // Royal Violet - Balanced purple
    Al: '#546E7A', // Blue Grey (Deep metal) - Distinct from Li
    Fe: '#8D6E63', // Iron Bronze (Earth tone)
    P: '#6D4C41', // Deep Earth
    O: '#1A237E', // Midnight Depth (Navy) - Contrast for light bg
    Na: '#FBC02D', // Sodium Gold
    Mg: '#F57F17', // Orange/Yellow
};

export const ELEMENT_RADII: { [key: string]: number } = {
    Li: 0.36,   // Li+ (Reduced to 80% of 0.45)
    O: 0.80,    // O2-
    Co: 0.35,   // Co3+
    Ni: 0.40,   // Ni2+
    Mn: 0.35,   // Mn3+/Mn4+
    Fe: 0.40,   // Fe2+
    P: 0.25,    // P5+
    Na: 0.60,   // Na (Larger than Li)
    Mg: 0.45,
    Al: 0.35,
};

// Element display priority for UI sorting
export const ELEMENT_PRIORITY = ['Li', 'Ni', 'Co', 'Mn', 'Fe', 'P', 'O', 'Na', 'Mg', 'Al'];

// Material family to elements mapping
export const MATERIAL_ELEMENTS: Record<string, string[]> = {
    'NCM': ['Li', 'Ni', 'Co', 'Mn', 'O'],
    'LFP': ['Li', 'Fe', 'P', 'O'],
    'LMFP': ['Li', 'Mn', 'Fe', 'P', 'O'],
    'LCO': ['Li', 'Co', 'O'],
};

// Li Animation Configuration per Material Family
export interface LiAnimationConfig {
    migrationAxis: 'xy' | 'z' | 'xyz';  // Allowed Li movement direction
    extractionRate: number;              // Percentage of Li that leaves (0-1)
    migrationDistance: number;           // How far Li moves before disappearing (in Angstroms)
}

export const LI_ANIMATION_CONFIG: Record<string, LiAnimationConfig> = {
    'NCM': {
        migrationAxis: 'xy',      // Li migrates in xy plane (layered structure)
        extractionRate: 0.60,     // 60% Li extracted
        migrationDistance: 8,
    },
    'LFP': {
        migrationAxis: 'z',       // Li migrates along z axis (1D channels)
        extractionRate: 0.85,     // 85% Li extracted
        migrationDistance: 10,
    },
    'LMFP': {
        migrationAxis: 'z',       // Same as LFP
        extractionRate: 0.85,
        migrationDistance: 10,
    },
    'LCO': {
        migrationAxis: 'xy',      // Layered like NCM
        extractionRate: 0.50,
        migrationDistance: 8,
    },
};

// Helper to get Li animation config from material ID
export const getLiAnimationConfig = (materialId: string): LiAnimationConfig => {
    const family = getMaterialFamily(materialId);
    return LI_ANIMATION_CONFIG[family] || LI_ANIMATION_CONFIG['NCM']; // Default to NCM
};

