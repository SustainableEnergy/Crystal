import type { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';

/**
 * LLO (Li2MnO3) Structure Builder
 * Generates a Lithium-Rich Layered Oxide structure with C2/m symmetry.
 * 
 * To align visually with NCM (upright stacking), we generate a 3-layer supercell
 * effectively removing the macroscopic monoclinic tilt from the visualization box.
 * 
 * Unit Cell (Pseudo-Orthogonal Supercell Block):
 * a ≈ 4.93 Å
 * b ≈ 8.53 Å
 * c_block ≈ 14.2 Å (3 layers * ~4.73 Å)
 */

export const generateLLO = (nx = 1, ny = 1, nz = 1): StructureData => {
    // 1. Crystallographic Parameters
    const a = 4.937;
    const b = 8.532;
    // Single slab height (vertical distance). 
    // Derived from c * sin(beta) of monoclinic cell (5.03 * sin(109.46) ≈ 4.74)
    const layerHeight = 4.74;
    const c_block = layerHeight * 3; // 3-layer repeating unit

    // 2. Atomic Positions in one C2/m Layer (Monoclinic setting, projected to Rectangular)
    // Relative to layer origin.
    // TM Layer at z=0, Li Layer at z=0.5 (relative to single slab thickness)

    // TM Layer (z=0): Honeycomb ordering of Li and Mn
    // Li: 2b (0, 1/2, 0)
    // Mn: 4g (0, 0.333, 0) - approximations for ideal honeycomb
    // Applied C-centering adds (1/2, 1/2, 0)

    const singleLayerAtoms = [
        // --- TM Layer (z=0) ---
        // Li (2b) + Centering
        // Li (2b) + Centering -> Mark as TM-layer Li
        { element: 'Li', frac: [0, 0.5, 0], layer: 'TM' },
        { element: 'Li', frac: [0.5, 0.0, 0], layer: 'TM' }, // shifted by 0.5,0.5

        // Mn (4g) + Centering. y ~ 1/3 and 2/3
        { element: 'Mn', frac: [0, 0.3333, 0] },
        { element: 'Mn', frac: [0, 0.6667, 0] },
        { element: 'Mn', frac: [0.5, 0.8333, 0] }, // 0.33 + 0.5
        { element: 'Mn', frac: [0.5, 0.1667, 0] }, // 0.66 + 0.5 - 1.0

        // --- Oxygen Layer 1 (z ~ 0.25) ---
        // 4i and 8j positions roughly form hexagonal close packing above/below TM
        // Simplified to ideal positions for visualization
        // x ~ 0.25?
        // In rectangular cell of this size, O positions are roughly at:
        // x=0.25, y=0, y=0.5...
        // Let's use the explicit coordinates from previous builder but flattened to slab
        // O: x~0.22, z~0.22 (relative to c_mono). In slab (h=1), z ~ 0.22 * (5.03/4.74) ~ 0.23
        { element: 'O', frac: [0.22, 0.0, 0.23] },
        { element: 'O', frac: [-0.22, 0.0, -0.23] }, // -z becomes 1-0.23 = 0.77
        { element: 'O', frac: [0.72, 0.5, 0.23] }, // Centering: 0.22+0.5, 0+0.5
        { element: 'O', frac: [0.28, 0.5, -0.23] },

        // O2 (8j): x~0.24, y~0.32
        { element: 'O', frac: [0.24, 0.32, 0.23] },
        { element: 'O', frac: [-0.24, 0.32, -0.23] },
        { element: 'O', frac: [0.24, -0.32, 0.23] },
        { element: 'O', frac: [-0.24, -0.32, -0.23] },
        // Centering for O2
        { element: 'O', frac: [0.74, 0.82, 0.23] },
        { element: 'O', frac: [0.26, 0.82, -0.23] },
        { element: 'O', frac: [0.74, 0.18, 0.23] },
        { element: 'O', frac: [0.26, 0.18, -0.23] },

        // --- Li Slab Layer (z=0.5) ---
        // Pure Li layer. 
        // 4h (0, 0.167, 0.5) and 2c (0, 0, 0.5)
        { element: 'Li', frac: [0, 0, 0.5] }, // 2c
        { element: 'Li', frac: [0.5, 0.5, 0.5] }, // 2c centering

        { element: 'Li', frac: [0, 0.1667, 0.5] }, // 4h
        { element: 'Li', frac: [0, 0.8333, 0.5] }, // -y
        { element: 'Li', frac: [0.5, 0.6667, 0.5] }, // 4h centering
        { element: 'Li', frac: [0.5, 0.3333, 0.5] }, // ...
    ];

    const atomList: Atom[] = [];

    // O3-type Stacking Shifts for Monoclinic Cell (beta ~ 109 deg)
    // Shift is approximately -a/3 along X per layer.
    // Layer 0: 0
    // Layer 1: -1/3
    // Layer 2: -2/3 (or +1/3)
    const layerShifts = [0, 2 / 3, 1 / 3]; // Standard ABC stacking shifts (modulo 1.0)

    const normalize = (v: number) => {
        const res = ((v % 1.0) + 1.0) % 1.0;
        return res < 0.001 ? 0.0 : (res > 0.999 ? 0.0 : res);
    };

    // 3. Supercell Generation
    // Visual Alignment Shift (same as NCM): -1/6 to align TM layer to integers?
    // In NCM (R-3m with c=14), NCM layers are at 0, 1/3, 2/3.
    // LLO here is generated as stacked layers.
    // TM is at 0. Li is at 0.5.
    // NCM has TM at 0 (after shift 0.5->0.33->?? No wait).
    // In LCOBuilder: "Shift -1/6: Co(0.5) -> 0.33". Wait, Co was at 0.5.
    // Here TM is at 0.0.
    // If we want TM at 0.0, we don't need shift? 
    // Ah, NCM puts TM at 0 relative to what? 
    // LCOBuilder: "Li at 0, Co at 0.5". Shift -1/6 -> Li at -0.16 (0.83), Co at 0.33.
    // So NCM has TM at 0.33, 0.66, 0.0? 
    // Actually visual "Base" usually is TM layer.
    // If LLO TM is at 0.0, it's already at the "integers".
    // But maybe user feels Li at 0.5 is "sticking out" at the top?
    // If we shift by -0.5, Li becomes 0.0? No TM becomes -0.5.

    // User said "NCM has correction". NCM Co is at 0.5 initially. 
    // After -1/6 shift -> 0.333.
    // So NCM TM layers are at 1/3, 2/3, 0. (0.33, 0.66, 1.0).
    // LLO TM layers here are at 0.0.
    // If we want LLO TM to match NCM's 0.33 style? 
    // Or maybe the user means Li layer is at the very top/bottom and looks cut off?

    // Let's try shifting so that the bulk looks centered or "Lithium doesn't stick out".
    // If we have layers 0, 1, 2. 
    // Top of Layer 2 is Z=3.0?
    // Atom Z = zBase + fz*height.
    // Li is at 0.5.
    // Top Li is at 2.5 * height.
    // If we shift -1/6 (relative to layer):
    // Z -= 0.166 * height.
    // TM becomes -0.166. Li becomes 0.333.
    // This pushes the bottom TM layer slightly out of the box (negative).
    // But via wrap-around (modulo), it might be 0.833.

    // Let's apply exactly the same relative shift logic: -1/6.
    const zShiftFraction = -1.0 / 6.0;

    for (let ix = 0; ix < nx; ix++) {
        for (let iy = 0; iy < ny; iy++) {
            // Each nz generates a 3-layer block
            for (let izBlock = 0; izBlock < nz; izBlock++) {

                // Generate 3 layers within the block
                for (let layerIdx = 0; layerIdx < 3; layerIdx++) {
                    const shiftX = layerShifts[layerIdx];

                    // Vertical offset for this layer
                    const zBase = (izBlock * c_block) + (layerIdx * layerHeight);

                    singleLayerAtoms.forEach(template => {
                        // Apply Shift + Repeat
                        // normalize x/y to keep within unit cell bounding box logic if desired,
                        // but for visualization we just let it expand.
                        // However, to keep "crystal" valid, we wrap fractionals.

                        let fx = template.frac[0] + shiftX;
                        let fy = template.frac[1];
                        let fz = template.frac[2]; // 0 (TM) or 0.5 (Li) or 0.25 (O) relative to layer height

                        // Handle Oxygen z-offset correctly
                        // If z is negative (e.g. -0.23), it means "below" the layer center.
                        // But since we stack layers 0, 1, 2... 	
                        // Layer 0 center is at z=0? No.
                        // Layer 0 TM is at 0. Layer 0 Li is at 0.5 * height.
                        // O is at +0.23 * height.
                        // So absolute Z is zBase + fz * layerHeight.

                        // BUT: If O has -0.23, it belongs to the bottom of THIS layer.
                        // We normalize Z to be positive or just use Cartesian.
                        // fz is 0..1 relative to layer? 
                        // In template: -0.23.
                        // normalize(fz) -> 0.77. 
                        // 0.77 * 4.74 = 3.6.
                        // So TM is at 0, Li is at 2.37. O is at 3.6? 
                        // Wait, Standard structure: TM(0) - O(0.25) - Li(0.5) - O(0.75) - TM(1.0).
                        // My template values: O at 0.23 and -0.23.
                        // -0.23 corresponds to 0.77 (upper O of previous layer? or bottom O of this layer?).
                        // For visualization, we just use absolute Z.

                        // Map fractional x,y to cartesian grid
                        const x_cart = (ix + normalize(fx)) * a;
                        const y_cart = (iy + normalize(fy)) * b;

                        // Z is purely vertical (Upright stacking)
                        // Normalize fz first
                        let fz_norm = normalize(fz);

                        // Apply visual shift (modulo 1.0 logic handled by rendering or just absolute?)
                        // If we shift linear Z, we just subtract.
                        fz_norm = normalize(fz_norm + zShiftFraction);

                        const z_cart = zBase + (fz_norm * layerHeight);

                        atomList.push({
                            id: uuidv4(),
                            element: template.element,
                            position: [x_cart, y_cart, z_cart],
                            layer: (template as any).layer
                        });
                    });
                }
            }
        }
    }

    return {
        atoms: atomList,
        unitCell: {
            a: a,
            b: b,
            c: c_block,
            alpha: 90,
            beta: 90, // Effectively orthogonal supercell
            gamma: 90
        }
    };
};
