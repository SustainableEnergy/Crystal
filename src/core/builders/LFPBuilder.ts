import type { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const generateLFP = (nx = 1, ny = 1, nz = 1): StructureData => {
    // LiFePO4 (Olivine) Data
    // Space Group: Pnma (62)
    const a = 10.33;
    const b = 6.01;
    const c = 4.69;

    const atomList: Atom[] = [];

    // Pnma Symmetry Operators (Standard Setting)
    // x,y,z; -x+1/2,-y,z+1/2; -x,y+1/2,-z; x+1/2,-y+1/2,-z+1/2
    // -x,-y,-z; x+1/2,y,-z-1/2; x,-y+1/2,z; -x+1/2,y+1/2,z+1/2
    const applySymmetry = (x: number, y: number, z: number): [number, number, number][] => {
        const ops = [
            [x, y, z],
            [-x + 0.5, -y, z + 0.5],
            [-x, y + 0.5, -z],
            [x + 0.5, -y + 0.5, -z + 0.5],
            [-x, -y, -z],
            [x + 0.5, y, -z - 0.5],
            [x, -y + 0.5, z],
            [-x + 0.5, y + 0.5, z + 0.5]
        ];
        // Normalize to 0-1 range
        return ops.map(([px, py, pz]) => {
            px = px % 1; if (px < 0) px += 1;
            py = py % 1; if (py < 0) py += 1;
            pz = pz % 1; if (pz < 0) pz += 1;
            return [px, py, pz] as [number, number, number];
        });
    };

    const addAtomType = (fracX: number, fracY: number, fracZ: number, element: string) => {
        const coords = applySymmetry(fracX, fracY, fracZ);
        // Remove duplicates (naive check)
        const uniqueCoords: [number, number, number][] = [];

        coords.forEach(c => {
            const isDup = uniqueCoords.some(u =>
                Math.abs(u[0] - c[0]) < 0.01 &&
                Math.abs(u[1] - c[1]) < 0.01 &&
                Math.abs(u[2] - c[2]) < 0.01
            );
            if (!isDup) uniqueCoords.push(c);
        });

        uniqueCoords.forEach(([fx, fy, fz]) => {
            // Expand Supercell
            for (let ix = 0; ix < nx; ix++) {
                for (let iy = 0; iy < ny; iy++) {
                    for (let iz = 0; iz < nz; iz++) {
                        atomList.push({
                            id: uuidv4(),
                            element,
                            position: [
                                (fx + ix) * a,
                                (fy + iy) * b,
                                (fz + iz) * c
                            ]
                        });
                    }
                }
            }
        });
    };

    // Fractional Coordinates from Literature (Pnma, ICSD 56291)
    // Reference: J. Solid State Chem. 2005, 178, 2575
    addAtomType(0.0, 0.0, 0.0, 'Li'); // Li 4a (0,0,0)
    addAtomType(0.2818, 0.25, 0.9744, 'Fe'); // Fe 4c
    addAtomType(0.0947, 0.25, 0.4180, 'P'); // P 4c
    addAtomType(0.0973, 0.25, 0.7434, 'O'); // O1 4c
    addAtomType(0.4567, 0.25, 0.2061, 'O'); // O2 4c
    addAtomType(0.1652, 0.0466, 0.2843, 'O'); // O3 8d

    return {
        atoms: atomList,
        unitCell: { a, b, c, alpha: 90, beta: 90, gamma: 90 }
    };
};
