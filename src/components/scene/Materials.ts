// Realistic ionic/covalent radii in Angstroms
// Based on Shannon ionic radii and crystallographic data
// 
// SCIENTIFIC VALIDATION:
// For NCM/LCO structures with a=2.816Å, b=2.816Å:
// - Nearest metal-metal distance in ab-plane: a = 2.816Å
// - Metal-oxygen bond distances: typically 1.9-2.1Å
// - Oxygen-oxygen distances: ~2.8Å
//
// Display radii are SCALED DOWN from ionic radii for visualization clarity
// (actual ionic radii would cause severe overlap at 100% scale)
// Visual scale factor applied via radiusScale parameter (default 1.0)

export const ELEMENT_COLORS: { [key: string]: string } = {
    Li: '#0277BD', // Premium Azure
    Ni: '#00897B', // Deep Mint (Teal) - Less neon, more distinct
    Co: '#EF6C00', // Burnt Orbit (Dark Orange) - Richer tone
    Mn: '#7E57C2', // Royal Violet - Balanced purple
    Al: '#546E7A', // Blue Grey (Deep metal) - Distinct from Li
    Fe: '#8D6E63', // Iron Bronze (Earth tone)
    P: '#6D4C41', // Deep Earth
    O: '#1A237E', // Midnight Depth (Navy) - Contrast for light bg
};

// Display radii optimized for visualization (reduced from true ionic radii)
// True ionic radii: Li+=0.76Å, O2-=1.40Å, Co3+=0.545Å would overlap severely
// These values are ~50-60% of true ionic radii for clear structure visualization
export const ELEMENT_RADII: { [key: string]: number } = {
    Li: 0.45,   // Li+ (reduced from 0.76Å for clarity)
    O: 0.80,    // O2- (reduced from 1.40Å to prevent overlap)
    Co: 0.35,   // Co3+ (reduced from 0.545Å)
    Ni: 0.40,   // Ni2+ (reduced from 0.69Å)
    Mn: 0.35,   // Mn3+/Mn4+ (reduced from 0.58Å)
    Fe: 0.40,   // Fe2+ (reduced from 0.645Å)
    P: 0.25,    // P5+ (reduced from 0.38Å)
};

// RATIO VERIFICATION for a=2.816Å lattice:
// At default radiusScale=1.0:
// - Li radius: 0.45Å (16% of lattice parameter a) ✓
// - O radius: 0.80Å (28% of lattice parameter a) ✓
// - Co/Ni/Mn radius: 0.35-0.40Å (12-14% of a) ✓
//
// Nearest neighbor check (metal at origin, oxygen at ~2.0Å):
// Sum of radii: Co(0.35) + O(0.80) = 1.15Å << 2.0Å bond length ✓
// Atoms do NOT overlap, leaving clear space for bonds
