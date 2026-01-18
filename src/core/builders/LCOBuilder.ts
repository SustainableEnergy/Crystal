import type { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const generateLCO = (nx = 3, ny = 3, nz = 1): StructureData => {
    // LiCoO2 Crystallographic Data (R-3m, Hexagonal Setting)
    const a = 2.816;
    const c = 14.052;

    // Fractional Coordinates (R-3m space group, hexagonal setting)
    // Reference: COD/ICSD crystallographic databases
    // Li: (0, 0, 0) - 3a Wyckoff position
    // Co: (0, 0, 0.5) - 3b Wyckoff position  
    // O: (0, 0, z) where z = 0.2604 - 6c Wyckoff position
    // R-3m centering: (0,0,0), (2/3,1/3,1/3), (1/3,2/3,2/3)

    const z_o = 0.2604; // Oxygen z-parameter (from experimental data)

    const atomList: Atom[] = [];

    // Helper to add atom converted to Cartesian
    const addAtom = (fracX: number, fracY: number, fracZ: number, element: string) => {
        // Hexagonal to Cartesian Transformation
        const x_cart = (fracX * a) + (fracY * a * Math.cos(2 * Math.PI / 3));
        const y_cart = (fracY * a * Math.sin(2 * Math.PI / 3));
        const z_cart = fracZ * c;

        atomList.push({
            id: uuidv4(),
            element,
            position: [x_cart, y_cart, z_cart],
        });
    };

    // Rhombohedral shifts for R-3m centering (hexagonal setting)
    const shifts = [
        [0, 0, 0],
        [2 / 3, 1 / 3, 1 / 3],
        [1 / 3, 2 / 3, 2 / 3]
    ];

    // Z-shift to align Polyhedra (TM) to 0, 1/3, 2/3 for visual continuity
    // Original (hex setting 0,0,0): Li at 0, Co at 0.5.
    // Shift -1/6: Co(0.5) -> 0.33, Co(0.16) -> 0.0.
    // This puts dense polyhedra layers at integer boundaries and 1/3, 2/3.
    const z_shift = -1.0 / 6.0;

    const normalize = (v: number) => {
        const result = (v % 1.0 + 1.0) % 1.0;
        return result < 0.0001 ? 0.0 : (result > 0.9999 ? 0.0 : result);
    };

    // Generate Supercell
    for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
            for (let iz = 0; iz < nz; iz++) {

                // Apply R-3m centering shifts
                for (const [sx, sy, sz] of shifts) {

                    // Li at 3a: (0, 0, 0)
                    const z_li = normalize(sz + 0.0 + z_shift);
                    addAtom(ix + sx, iy + sy, iz + z_li, 'Li');

                    // Co at 3b: (0, 0, 0.5)
                    const z_co = normalize(sz + 0.5 + z_shift);
                    addAtom(ix + sx, iy + sy, iz + z_co, 'Co');

                    // O at 6c: (0, 0, z) and (0, 0, -z)
                    const z_o1 = normalize(sz + z_o + z_shift);
                    addAtom(ix + sx, iy + sy, iz + z_o1, 'O');

                    const z_o2 = normalize(sz + (1.0 - z_o) + z_shift);
                    addAtom(ix + sx, iy + sy, iz + z_o2, 'O');
                }
            }
        }
    }

    return {
        atoms: atomList,
        unitCell: { a, b: a, c, alpha: 90, beta: 90, gamma: 120 }
    };
};
