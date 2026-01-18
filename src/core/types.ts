export type Vector3 = [number, number, number];

export interface Atom {
    id: string;
    element: string; // 'Li', 'Co', 'O', 'Fe', 'P'
    position: Vector3; // Cartesian coordinates
    color?: string; // Hex color override
    radius?: number; // Override default radius
}

export interface UnitCellParams {
    a: number;
    b: number;
    c: number;
    alpha: number;
    beta: number;
    gamma: number;
}

export interface StructureData {
    atoms: Atom[];
    unitCell: UnitCellParams;
}
