import type { StructureData, Atom } from '../types';
import { generateLFP } from './LFPBuilder';

export const generateLMFP = (
    nx = 3,
    ny = 3,
    nz = 6,
): StructureData => {
    // Reuse LFP structure but replace 35% of Fe with Mn
    const baseStructure = generateLFP(nx, ny, nz);

    // Define Mn probability (35% Mn, 65% Fe)
    const mnProbability = 0.35;

    const newAtoms: Atom[] = baseStructure.atoms.map(atom => {
        if (atom.element === 'Fe') {
            // Randomly substitute Fe with Mn based on probability
            const isMn = Math.random() < mnProbability;
            return isMn ? { ...atom, element: 'Mn' } : atom;
        }
        return atom;
    });

    return {
        ...baseStructure,
        atoms: newAtoms
    };
};
