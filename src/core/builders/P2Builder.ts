import type { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * P2-type Na-ion Cathode Builder (e.g., Na0.67MnO2)
 * Structure: Hexagonal P6_3/mmc (194)
 * - 2-layer repeat unit (AB BA oxygen stacking)
 * - Na ions in Prismatic sites (Trigonal Prisms)
 * - Na sites: Na1 (Face-sharing with TM) and Na2 (Edge-sharing with TM)
 * - Typically Na-deficient (x ~ 0.67)
 */

export const generateP2 = (nx = 1, ny = 1, nz = 1): StructureData => {
    // Crystallographic Data for P2-Na0.67MnO2
    const a = 2.88;
    const c = 11.20; // 2 layers

    const z_o = 0.09; // Oxygen z-parameter

    const atomList: Atom[] = [];

    // Probability of Na occupancy (Total ~ 0.67)
    // Na1 (2b, face-sharing) is less stable than Na2 (2d, edge-sharing) due to electrostatic repulsion?
    // Often Na1 occupancy < Na2 occupancy.
    // Let's assume average random occupancy for simplicity: 0.67 total.
    // However, in reality, Na1 and Na2 have different occupancies.
    // Simulating: Na1 ~ 0.24, Na2 ~ 0.43 (Total 0.67)
    // Simulating: Na1 ~ 0.24, Na2 ~ 0.43 (Total 0.67)
    // (0.35 + 0.82) / 2 ~= 0.58... slightly low. Let's adjust.
    // Na1 site count = 2, Na2 site count = 2 per cell.
    // Total Na = 2*p1 + 2*p2. Target 2*0.67*2 = 2.68? No Formula unit is Na0.67 Mn O2. Z=2.
    // Cell content: Na(1.34) Mn2 O4.
    // Capacity: 1.34 atoms distributed over 4 sites (2b + 2d). 1.34/4 = 0.335 average.
    // Wait, P2 unit cell Z=2.
    // Sites: 2b (2 sites), 2d (2 sites). Total 4 potential Na sites.
    // We need 1.34 Na atoms. 1.34 / 4 = 33.5% total occupancy? 
    // Ah, Na0.67 refers to Na per TM. TM=2. So Na=1.34.
    // Yes. So average occupancy is 0.335.
    // Let's set P(Na1) = 0.2, P(Na2) = 0.47.

    const PROB_NA1 = 0.20;
    const PROB_NA2 = 0.47;

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

    const normalize = (v: number) => {
        const result = (v % 1.0 + 1.0) % 1.0;
        return result < 0.0001 ? 0.0 : (result > 0.9999 ? 0.0 : result);
    };

    // Unit Cell Atoms (P63/mmc)
    // TM at 2a: (0,0,0), (0,0,0.5)
    const tm_sites = [
        [0, 0, 0],
        [0, 0, 0.5]
    ];

    // O at 4f: (1/3, 2/3, z), (2/3, 1/3, z+0.5), (2/3, 1/3, -z), (1/3, 2/3, -z+0.5)
    // -z is 1-z. -z+0.5 is 1-z+0.5 = 1.5-z -> 0.5-z
    const o_sites = [
        [1.0 / 3.0, 2.0 / 3.0, z_o],
        [2.0 / 3.0, 1.0 / 3.0, z_o + 0.5],
        [2.0 / 3.0, 1.0 / 3.0, 1.0 - z_o],
        [1.0 / 3.0, 2.0 / 3.0, 0.5 - z_o]
    ];

    // Na1 at 2b: (0,0,1/4), (0,0,3/4)
    const na1_sites = [
        [0, 0, 0.25],
        [0, 0, 0.75]
    ];

    // Na2 at 2d: (1/3, 2/3, 3/4), (2/3, 1/3, 1/4)
    const na2_sites = [
        [1.0 / 3.0, 2.0 / 3.0, 0.75],
        [2.0 / 3.0, 1.0 / 3.0, 0.25]
    ];

    // Generate Supercell
    for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
            for (let iz = 0; iz < nz; iz++) {

                // TM
                tm_sites.forEach(([sx, sy, sz]) => {
                    addAtom(ix + sx, iy + sy, iz + sz, 'Mn'); // Assuming Mn-based P2
                });

                // Oxygen
                o_sites.forEach(([sx, sy, sz]) => {
                    addAtom(ix + sx, iy + sy, iz + normalize(sz), 'O');
                });

                // Na1 (2b) - Conditional
                na1_sites.forEach(([sx, sy, sz]) => {
                    if (Math.random() < PROB_NA1) {
                        addAtom(ix + sx, iy + sy, iz + sz, 'Na');
                    }
                });

                // Na2 (2d) - Conditional
                na2_sites.forEach(([sx, sy, sz]) => {
                    if (Math.random() < PROB_NA2) {
                        addAtom(ix + sx, iy + sy, iz + sz, 'Na');
                    }
                });
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
