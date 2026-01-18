import type { StructureData, Atom } from '../types';
import { generateLCO } from './LCOBuilder';

export const generateNCM = (
    nx = 3,
    ny = 3,
    nz = 1,
    ratio: '811' | '622' | '111' = '811'
): StructureData => {
    // Reuse LCO structure but replace Co with Ni/Co/Mn
    const baseStructure = generateLCO(nx, ny, nz);

    // Define probabilities
    let probs: { [key: string]: number };
    if (ratio === '811') probs = { Ni: 0.8, Co: 0.1, Mn: 0.1 };
    else if (ratio === '622') probs = { Ni: 0.6, Co: 0.2, Mn: 0.2 };
    else probs = { Ni: 0.33, Co: 0.33, Mn: 0.33 };

    const newAtoms: Atom[] = baseStructure.atoms.map(atom => {
        if (atom.element === 'Co') {
            const r = Math.random();
            let newEl = 'Ni';
            if (r < probs.Ni) newEl = 'Ni';
            else if (r < probs.Ni + probs.Co) newEl = 'Co';
            else newEl = 'Mn';

            return { ...atom, element: newEl };
        }
        return atom;
    });

    return {
        ...baseStructure,
        atoms: newAtoms
    };
};
