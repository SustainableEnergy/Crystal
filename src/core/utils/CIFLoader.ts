import { StructureData, Atom } from '../types';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import { parseCifText } from 'crystcif-parse';
import * as THREE from 'three';

export const loadCIF = (cifText: string): StructureData => {
    try {
        const result = parseCifText(cifText);
        if (!result || !result.data || !result.data.block1) { // Basic check, might need robust block finding
            throw new Error("Invalid CIF format");
        }
        
        const data = result.data[Object.keys(result.data)[0]]; // Get first block

        // 1. Get Lattice Parameters
        const a = parseFloat(data._cell_length_a);
        const b = parseFloat(data._cell_length_b);
        const c = parseFloat(data._cell_length_c);
        const alpha = parseFloat(data._cell_angle_alpha);
        const beta = parseFloat(data._cell_angle_beta);
        const gamma = parseFloat(data._cell_angle_gamma);

        // 2. Parse Atoms
        // Standard CIF tags for atoms: _atom_site_label, _atom_site_type_symbol, _atom_site_fract_x, ...
        const labels = data._atom_site_label;
        const symbols = data._atom_site_type_symbol || labels; // Fallback
        const fractX = data._atom_site_fract_x;
        const fractY = data._atom_site_fract_y;
        const fractZ = data._atom_site_fract_z;

        if (!labels || !fractX || !fractY || !fractZ) {
             throw new Error("No atomic coordinates found in CIF");
        }

        const atoms: Atom[] = [];
        const count = labels.length;

        // Cartesian Conversion Matrix
        // https://en.wikipedia.org/wiki/Fractional_coordinates#Cartesian_coordinates
        const alphaRad = alpha * Math.PI / 180;
        const betaRad = beta * Math.PI / 180;
        const gammaRad = gamma * Math.PI / 180;

        const v = Math.sqrt(1 - Math.cos(alphaRad)**2 - Math.cos(betaRad)**2 - Math.cos(gammaRad)**2 + 2 * Math.cos(alphaRad) * Math.cos(betaRad) * Math.cos(gammaRad));

        const toCartesian = (u: number, v_frac: number, w: number) => {
            const x = a * u + b * Math.cos(gammaRad) * v_frac + c * Math.cos(betaRad) * w;
            const y = b * Math.sin(gammaRad) * v_frac + c * (Math.cos(alphaRad) - Math.cos(betaRad)*Math.cos(gammaRad)) / Math.sin(gammaRad) * w;
            const z = c * v / Math.sin(gammaRad) * w;
            return [x, y, z];
        };
        
        // Simple simplified orthogonal case if abg=90? No, rely on general formula usually best.
        // Actually standard formula:
        // x = ax + b*y*cos(gamma) + c*z*cos(beta)
        // y = b*y*sin(gamma) + c*z*(cos(alpha) - cos(beta)cos(gamma))/sin(gamma)
        // z = c*z*V/sin(gamma)
        
        for(let i=0; i<count; i++) {
             // Clean symbol (remove numbers, charges) e.g., "Fe2+" -> "Fe"
             let el = symbols[i].replace(/[0-9+\-]/g, '');
             // Capitalize first, lowercase second if exists? 
             // Usually CIF symbols are already correct or like 'Fe'
             
             const u = parseFloat(fractX[i]);
             const v_val = parseFloat(fractY[i]);
             const w = parseFloat(fractZ[i]);

             const [x,y,z] = toCartesian(u, v_val, w);

             atoms.push({
                 id: uuidv4(),
                 element: el,
                 position: [x, y, z]
             });
        }
        
        return {
            atoms,
            unitCell: { a, b, c, alpha, beta, gamma }
        };

    } catch (e) {
        console.error("CIF Parse Error", e);
        // Return empty or dummy
        return { atoms: [], unitCell: { a:10, b:10, c:10, alpha:90, beta:90, gamma:90 }};
    }
}
