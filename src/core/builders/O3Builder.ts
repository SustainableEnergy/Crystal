import type { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * O3-type Na-ion Cathode Builder (e.g., NaNi0.5Mn0.5O2)
 * Structure: Rhombohedral R-3m
 * - Similar to LiCoO2 / NCM but with Na instead of Li.
 * - Larger unit cell due to larger Na ion.
 */

export const generateO3 = (nx = 1, ny = 1, nz = 1): StructureData => {
    // Crystallographic Data for O3-NaNi0.5Mn0.5O2
    // Space Group: R-3m (166)
    const a = 2.95;
    const c = 15.90; // Significantly larger than Li-O3 (~14.2)

    const z_o = 0.27; // Oxygen z-parameter

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

    // Align layers (carry over from LCO/NCM logic)
    const z_shift = -1.0 / 6.0;

    const normalize = (v: number) => {
        const result = (v % 1.0 + 1.0) % 1.0;
        return result < 0.0001 ? 0.0 : (result > 0.9999 ? 0.0 : result);
    };

    // TM Mixing Logic (Ni0.5 Mn0.5)
    // Random mixing
    const getTMElement = () => {
        return Math.random() < 0.5 ? 'Ni' : 'Mn';
    };

    // Generate Supercell
    for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
            for (let iz = 0; iz < nz; iz++) {

                // Apply R-3m centering shifts
                for (const [sx, sy, sz] of shifts) {

                    // Site 3a (0,0,0): TM Layer (Ni/Mn mixed)
                    const z_tm = normalize(sz + 0.0 + z_shift);
                    addAtom(ix + sx, iy + sy, iz + z_tm, getTMElement());

                    // Site 3b (0,0,0.5): Na Layer
                    const z_na = normalize(sz + 0.5 + z_shift);
                    addAtom(ix + sx, iy + sy, iz + z_na, 'Na');

                    // Site 6c (0,0,z): Oxygen
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
        unitCell: {
            a: a,
            b: a,
            c: c,
            alpha: 90,
            beta: 90,
            gamma: 120
        }
    };
};
