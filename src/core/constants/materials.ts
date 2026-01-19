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
