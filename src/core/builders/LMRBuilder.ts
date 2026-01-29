import type { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * LMR (Lithium-Manganese Rich) Structure Builder
 * Represents a solid solution of Li2MnO3 and LiMO2.
 * Now implemented as a Rhombohedral (R-3m) Solid Solution.
 * 
 * Target Composition: Li1.13 TM0.87 O2
 * - Layer Structure (R-3m, Hexagonal Setting):
 *   - 3a (0,0,0): TM Layer (Li 13%, TM 87% Mixed)
 *   - 3b (0,0,0.5): Li Layer (100% Li)
 *   - 6c (0,0,z): Oxygen (z ~ 0.26)
 * 
 * TM Layer Dist (Sum = 1.0):
 * - Excess Li: 0.13
 * - TM Total: 0.87 
 *   - Ni (35%): 0.3045
 *   - Co ( 5%): 0.0435
 *   - Mn (60%): 0.5220
 */

export const generateLMR = (nx = 1, ny = 1, nz = 1): StructureData => {
    // 1. Crystallographic Parameters (NCM/LCO-like Hexagonal)
    const a = 2.85; // Typical for NCM
    const c = 14.23; // Typical for NCM (~4.74 * 3)

    const z_o = 0.26; // Oxygen parameter

    // 2. Define Probabilities for TM Layer Sites (3a)
    const PROBS = {
        Li: 0.13,
        Ni: 0.3045,
        Co: 0.0435,
        Mn: 0.5220
    };

    const getTMElement = () => {
        const r = Math.random();
        if (r < PROBS.Li) return 'Li';
        if (r < PROBS.Li + PROBS.Ni) return 'Ni';
        if (r < PROBS.Li + PROBS.Ni + PROBS.Co) return 'Co';
        return 'Mn';
    };

    const atomList: Atom[] = [];

    // Helper to add atom converted to Cartesian
    const addAtom = (fracX: number, fracY: number, fracZ: number, element: string, layer: string | undefined = undefined) => {
        // Hexagonal to Cartesian Transformation
        const x_cart = (fracX * a) + (fracY * a * Math.cos(2 * Math.PI / 3));
        const y_cart = (fracY * a * Math.sin(2 * Math.PI / 3));
        const z_cart = fracZ * c;

        atomList.push({
            id: uuidv4(),
            element,
            position: [x_cart, y_cart, z_cart],
            ...(layer ? { layer } : {})
        });
    };

    // Rhombohedral shifts for R-3m centering (hexagonal setting)
    const shifts = [
        [0, 0, 0],
        [2 / 3, 1 / 3, 1 / 3],
        [1 / 3, 2 / 3, 2 / 3]
    ];

    // Z-shift to align visible layers nicely (optional, carried over from LCO)
    // 3b (Li layer) is at 0.5. 3a (TM layer) is at 0.0.
    // LCOBuilder shifts by -1/6 to put TM layers at integer boundaries?
    // Let's stick to LCOBuilder's alignment for consistency.
    const z_shift = -1.0 / 6.0;

    const normalize = (v: number) => {
        const result = (v % 1.0 + 1.0) % 1.0;
        return result < 0.0001 ? 0.0 : (result > 0.9999 ? 0.0 : result);
    };

    // 3. Generate Supercell
    for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
            for (let iz = 0; iz < nz; iz++) {

                // Apply R-3m centering shifts
                for (const [sx, sy, sz] of shifts) {

                    // Site 3a (0,0,0): TM Layer (Mixed)
                    const tmElement = getTMElement();
                    const z_tm = normalize(sz + 0.0 + z_shift); // 3a is at 0
                    // If tmElement is Li, tag it as TM-layer Li
                    addAtom(ix + sx, iy + sy, iz + z_tm, tmElement, tmElement === 'Li' ? 'TM' : undefined);

                    // Site 3b (0,0,0.5): Li Layer (Pure)
                    const z_li = normalize(sz + 0.5 + z_shift); // 3b is at 0.5
                    addAtom(ix + sx, iy + sy, iz + z_li, 'Li');

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
