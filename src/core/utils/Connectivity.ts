import type { Atom } from '../types';

export type Bond = [Vector3, Vector3];
type Vector3 = [number, number, number];

export const computeBonds = (atoms: Atom[], maxDistance: number = 2.5): Bond[] => {
    const bonds: Bond[] = [];
    // const start = performance.now();

    for (let i = 0; i < atoms.length; i++) {
        for (let j = i + 1; j < atoms.length; j++) {
            const p1 = atoms[i].position;
            const p2 = atoms[j].position;

            const dx = p1[0] - p2[0];
            const dy = p1[1] - p2[1];
            const dz = p1[2] - p2[2];

            const distSq = dx * dx + dy * dy + dz * dz;

            if (distSq < maxDistance * maxDistance) {
                const el1 = atoms[i].element;
                const el2 = atoms[j].element;

                const isOxygen1 = el1 === 'O';
                const isOxygen2 = el2 === 'O';

                if (isOxygen1 || isOxygen2) {
                    bonds.push([p1, p2]);
                }
            }
        }
    }
    return bonds;
};
