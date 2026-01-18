import type { Atom, StructureData } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Robust, dependency-free CIF Parser for Browser
export const parseCIF = (cifText: string): StructureData => {
    try {
        const lines = cifText.split('\n');

        let a = 10, b = 10, c = 10;
        let alpha = 90, beta = 90, gamma = 90;

        const atoms: Atom[] = [];

        // 1. Parse Cell Parameters
        // Regex to match "_cell_length_a  10.123" or "_cell_length_a 10.123(5)"
        const getParam = (name: string, defaultVal: number) => {
            const regex = new RegExp(`${name}\\s+([0-9.]+)`);
            const match = cifText.match(regex);
            return match ? parseFloat(match[1]) : defaultVal;
        };

        a = getParam('_cell_length_a', 10);
        b = getParam('_cell_length_b', 10);
        c = getParam('_cell_length_c', 10);
        alpha = getParam('_cell_angle_alpha', 90);
        beta = getParam('_cell_angle_beta', 90);
        gamma = getParam('_cell_angle_gamma', 90);

        // 2. Parse Atom Sites
        // Strategy: Find the loop for atom sites, find indices of columns, then parse rows.

        // Simplified approach: Look for lines starting with element symbol or label, containing coords.
        // Usually inside "loop_ ... _atom_site_label ... _atom_site_fract_x ..."

        // Let's find the headers first to know the order.
        let loopHeaders: string[] = [];
        let inLoop = false;
        let inAtomLoop = false;
        let atomLoopIndices: any = {};

        // Clean comments
        const cleanLines = lines.map(cols => cols.split('#')[0].trim()).filter(l => l.length > 0);

        for (let i = 0; i < cleanLines.length; i++) {
            const line = cleanLines[i];

            if (line.startsWith('loop_')) {
                inLoop = true;
                loopHeaders = [];
                continue;
            }

            if (inLoop && line.startsWith('_')) {
                loopHeaders.push(line);
                if (line.includes('_atom_site_label') || line.includes('_atom_site_type_symbol')) {
                    inAtomLoop = true;
                }
            } else if (inLoop && !line.startsWith('_')) {
                // This is a data line. 
                if (inAtomLoop) {
                    // We just found the start of data. Map headers to indices.
                    loopHeaders.forEach((h, idx) => {
                        if (h.includes('_atom_site_label')) atomLoopIndices.label = idx;
                        if (h.includes('_atom_site_type_symbol')) atomLoopIndices.symbol = idx;
                        if (h.includes('_atom_site_fract_x')) atomLoopIndices.x = idx;
                        if (h.includes('_atom_site_fract_y')) atomLoopIndices.y = idx;
                        if (h.includes('_atom_site_fract_z')) atomLoopIndices.z = idx;
                    });

                    // Stop header collecting
                    // Parse this line and following lines
                    const parseAtomLine = (l: string) => {
                        const parts = l.split(/\s+/);
                        if (parts.length < loopHeaders.length) return; // incomplete

                        // Get Element
                        let el = 'X';
                        if (atomLoopIndices.symbol !== undefined) el = parts[atomLoopIndices.symbol];
                        else if (atomLoopIndices.label !== undefined) el = parts[atomLoopIndices.label];

                        // Strip charge/numbers from element (e.g. Li1+ -> Li)
                        el = el.replace(/[0-9.+\-]+/g, '');

                        const fx = parseFloat(parts[atomLoopIndices.x]);
                        const fy = parseFloat(parts[atomLoopIndices.y]);
                        const fz = parseFloat(parts[atomLoopIndices.z]);

                        if (!isNaN(fx)) {
                            // Fractional to Cartesian
                            const alphaRad = alpha * Math.PI / 180;
                            const betaRad = beta * Math.PI / 180;
                            const gammaRad = gamma * Math.PI / 180;

                            // General conversion
                            const cy = b * fy * Math.sin(gammaRad) + c * fz * ((Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad));
                            const cz = c * fz * (Math.sqrt(1 - Math.cos(alphaRad) ** 2 - Math.cos(betaRad) ** 2 - Math.cos(gammaRad) ** 2 + 2 * Math.cos(alphaRad) * Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad));
                            const cx = a * fx + b * fy * Math.cos(gammaRad) + c * fz * Math.cos(betaRad);

                            atoms.push({
                                id: uuidv4(),
                                element: el,
                                position: [cx, cy, cz]
                            });
                        }
                    };

                    parseAtomLine(line);

                    // Continue until next loop or end or non-data
                    for (let j = i + 1; j < cleanLines.length; j++) {
                        const nextLine = cleanLines[j];
                        if (nextLine.startsWith('loop_') || nextLine.startsWith('_') || nextLine.startsWith('data_')) {
                            i = j - 1;
                            break;
                        }
                        parseAtomLine(nextLine);
                    }

                    inLoop = false; // Reset for next loop
                    inAtomLoop = false;
                } else {
                    // Start of data for a non-atom loop
                    inLoop = false;
                }
            }
        }

        // Fallback if no atoms found (e.g. invalid file)
        if (atoms.length === 0) throw new Error("No atoms parsed");

        return {
            atoms,
            unitCell: { a, b, c, alpha, beta, gamma }
        };

    } catch (e) {
        console.error("Manual CIF Parse Error", e);
        return { atoms: [], unitCell: { a: 10, b: 10, c: 10, alpha: 90, beta: 90, gamma: 90 } };
    }
}
