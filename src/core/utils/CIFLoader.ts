import type { StructureData } from '../types';

// This module is for future CIF file loading functionality
// Currently using parseCIF from CIFParser.ts instead

export const loadCIFFile = async (file: File): Promise<StructureData> => {
    const text = await file.text();
    // Import parseCIF dynamically to avoid circular dependencies
    const { parseCIF } = await import('./CIFParser');
    return parseCIF(text);
};
