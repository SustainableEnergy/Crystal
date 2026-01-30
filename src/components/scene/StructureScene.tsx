import { useMemo, useRef, useState, useEffect } from 'react';
import { useControls, folder, buttonGroup } from 'leva';
import * as THREE from 'three';
import { generateNCM } from '../../core/builders/NCMBuilder';
import { generateLFP } from '../../core/builders/LFPBuilder';
import { generateLMFP } from '../../core/builders/LMFPBuilder';
import { generateLLO } from '../../core/builders/LLOBuilder';
import { generateLMR } from '../../core/builders/LMRBuilder';
import { generateO3 } from '../../core/builders/O3Builder';
import { generateP2 } from '../../core/builders/P2Builder';
import { MATERIALS, getMaterialFamily, MATERIAL_FAMILIES, ELEMENT_COLORS, ELEMENT_PRIORITY, ELEMENT_RADII } from '../../core/constants/materials';
import { parseCIF } from '../../core/utils/CIFParser';
import { Atoms } from './Atoms';
import { Polyhedra } from './Polyhedra';
import { LiAnimation } from './LiAnimation';
import { LabeledAxes } from './LabeledAxes';
import { OrbitControls, Environment, PerspectiveCamera, OrthographicCamera } from '@react-three/drei';
import { exportScene } from '../../core/utils/Exporter';
import { CAMERA } from '../../core/constants/geometry';
import type { Atom } from '../../core/types';
import type { ElementSettings, VisualSettings } from '../../types';

import { ErrorBoundary } from '../UI/ErrorBoundary';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// --- SUB-COMPONENT: DYNAMIC ELEMENT CONTROLS ---
const ElementController = ({
    atoms,
    onChange
}: {
    atoms: Atom[],
    onChange: (settings: ElementSettings) => void
}) => {
    const uniqueElements = useMemo(() => {
        if (!atoms) return [];
        const elements = Array.from(new Set(atoms.map(a => a.element)));

        // Define priority order for cathode materials (from centralized config)
        return elements.sort((a, b) => {
            const indexA = ELEMENT_PRIORITY.indexOf(a);
            const indexB = ELEMENT_PRIORITY.indexOf(b);

            // If both are in priority list, sort by priority
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            // If only a is in priority, a comes first
            if (indexA !== -1) return -1;
            // If only b is in priority, b comes first
            if (indexB !== -1) return 1;
            // Both are not in priority, sort alphabetically
            return a.localeCompare(b);
        });
    }, [atoms]);

    const schema = useMemo(() => {
        return uniqueElements.reduce((acc, el) => {
            // Li and Na are visible by default, all others are hidden
            const defaultVisible = el === 'Li' || el === 'Na';

            acc[el] = folder({
                [`${el}_visible`]: { value: defaultVisible, label: 'Visible' },
                [`${el}_scale`]: { value: 1.0, min: 0, max: 2, label: 'Size' },
                [`${el}_color`]: { value: ELEMENT_COLORS[el] || '#cccccc', label: 'Color' }
            });
            return acc;
        }, {} as any);
    }, [uniqueElements]);

    // Force Leva to re-render when uniqueElements changes
    const values = useControls('⚛️ Element Settings', schema, [uniqueElements.join(',')]);

    useEffect(() => {
        const settings: ElementSettings = {};
        uniqueElements.forEach(el => {
            settings[el] = {
                visible: (values as any)[`${el}_visible`] ?? true,
                scale: (values as any)[`${el}_scale`] ?? 1.0,
                color: (values as any)[`${el}_color`] ?? (ELEMENT_COLORS[el] || '#cccccc')
            };
        });
        onChange(settings);
    }, [values, uniqueElements, onChange]);

    return null;
};

// --- MAIN COMPONENT ---
interface StructureSceneProps {
    onSpaceGroupUpdate?: (info: { material: string; unitCell: any }) => void;
    onElementSettingsChange?: (settings: ElementSettings) => void;
    onVisualSettingsChange?: (settings: VisualSettings) => void;
    liAnimating?: boolean; // When true, Li charge/discharge animation is active
    isMobile?: boolean;
    isOrthographic?: boolean;
}

export const StructureScene = ({
    onSpaceGroupUpdate,
    onElementSettingsChange,
    onVisualSettingsChange,
    liAnimating = false,
    isMobile = false,
    isOrthographic = false
}: StructureSceneProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const orbitRef = useRef<any>(null);

    // Keep track of camera position/target/zoom to sync between modes
    const cameraStateRef = useRef<{
        position: THREE.Vector3 | null,
        target: THREE.Vector3 | null,
        zoom: number,
        calibratedZoom?: number // Store the zoom calculated during transition
    }>({
        position: null,
        target: null,
        zoom: 40, // Default ortho zoom
        calibratedZoom: undefined
    });

    // Update stored state on every control change
    const handleControlsChange = (e: any) => {
        if (!e?.target?.object || !e?.target?.target) return;

        const camera = e.target.object;
        const target = e.target.target;

        // For Orthographic, use zoom property. For Perspective, distance matters.
        // We calculate distance on the fly when needed.
        const currentZoom = camera.type === 'OrthographicCamera' ? camera.zoom : 1;

        cameraStateRef.current = {
            position: camera.position.clone(),
            target: target.clone(),
            zoom: currentZoom
        };
    };

    // Track previous mode to trigger synchronous updates
    const prevIsOrthographic = useRef(isOrthographic);

    // Detect mode change
    if (prevIsOrthographic.current !== isOrthographic) {
        const state = cameraStateRef.current;

        // Only adjust ZOOM when going to Orthographic mode
        // This prevents the "too far" issue (Zoom=1) without messing up Perspective position
        if (isOrthographic && state.position && state.target) {
            const distance = state.position.distanceTo(state.target);

            // Calculate matching zoom based on FOV 30 geometry & Standard Screen Height
            // Formula: Zoom = ScreenHeight / (2 * distance * tan(FOV/2))
            // Assuming ScreenHeight ~ 900px, K = 900 / (2 * tan(15deg)) ≈ 1680 -> 1700
            const calibrationConstant = 1700;
            const newZoom = calibrationConstant / distance;

            cameraStateRef.current.zoom = newZoom;
            cameraStateRef.current.calibratedZoom = newZoom; // Persist this for reset/material change
        }

        // When going back to Perspective, we DO NOT change position/target.
        // We simply switch projection, respecting the user's wish to "keep settings".

        prevIsOrthographic.current = isOrthographic;
    }

    const [cifAtoms, setCifAtoms] = useState<Atom[]>([]);
    const [elementSettings, setElementSettings] = useState<ElementSettings>({});

    // Emit element settings changes to parent
    useEffect(() => {
        if (onElementSettingsChange && Object.keys(elementSettings).length > 0) {
            onElementSettingsChange(elementSettings);
        }
    }, [elementSettings, onElementSettingsChange]);

    // Structure state from external events
    const [material, setMaterial] = useState('NCM-811');
    const [ncmRatio, setNcmRatio] = useState('811');

    // Get default values based on material
    const getDefaultCellSize = () => {
        const materialData = MATERIALS[material];
        return materialData?.defaultUnitCell || { nx: 4, ny: 4, nz: 4 };
    };

    const defaults = getDefaultCellSize();

    // Hierarchical Controls - Material removed from Leva
    // Hierarchical Controls - Material removed from Leva
    const [unitCellParams, setUnitCell] = useControls('Unit Cell', () => ({
        nx: { value: defaults.nx, min: 1, max: 10, step: 1, label: 'X Repeat', render: () => [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP, MATERIAL_FAMILIES.LLO, MATERIAL_FAMILIES.LMR, MATERIAL_FAMILIES.SIB_O3, MATERIAL_FAMILIES.SIB_P2].includes(getMaterialFamily(material)) },
        'adj_x': buttonGroup({
            '-': (get) => {
                const val = get('Unit Cell.nx');
                if (typeof val === 'number') setUnitCell({ nx: Math.max(1, val - 1) });
            },
            '+': (get) => {
                const val = get('Unit Cell.nx');
                if (typeof val === 'number') setUnitCell({ nx: Math.min(10, val + 1) });
            },
        }),

        ny: { value: defaults.ny, min: 1, max: 10, step: 1, label: 'Y Repeat', render: () => [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP, MATERIAL_FAMILIES.LLO, MATERIAL_FAMILIES.LMR, MATERIAL_FAMILIES.SIB_O3, MATERIAL_FAMILIES.SIB_P2].includes(getMaterialFamily(material)) },
        'adj_y': buttonGroup({
            '-': (get) => {
                const val = get('Unit Cell.ny');
                if (typeof val === 'number') setUnitCell({ ny: Math.max(1, val - 1) });
            },
            '+': (get) => {
                const val = get('Unit Cell.ny');
                if (typeof val === 'number') setUnitCell({ ny: Math.min(10, val + 1) });
            },
        }),

        nz: { value: defaults.nz, min: 1, max: 10, step: 1, label: 'Z Repeat', render: () => [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP, MATERIAL_FAMILIES.LLO, MATERIAL_FAMILIES.LMR, MATERIAL_FAMILIES.SIB_O3, MATERIAL_FAMILIES.SIB_P2].includes(getMaterialFamily(material) as any) },
        'adj_z': buttonGroup({
            '-': (get) => {
                const val = get('Unit Cell.nz');
                if (typeof val === 'number') setUnitCell({ nz: Math.max(1, val - 1) });
            },
            '+': (get) => {
                const val = get('Unit Cell.nz');
                if (typeof val === 'number') setUnitCell({ nz: Math.min(10, val + 1) });
            },
        }),
    }), [material]); // Dependency ensures reconstruction if needed, but useEffect handles value update

    const { nx, ny, nz } = unitCellParams;

    // Force update Leva controls when material changes
    useEffect(() => {
        const d = getDefaultCellSize();
        setUnitCell({ nx: d.nx, ny: d.ny, nz: d.nz });
    }, [material, setUnitCell]);



    const {
        preset, radiusScale,
        roughness, metalness, clearcoat, transmission, ior, thickness, emissiveIntensity,
        showPolyhedra, showPolyhedraEdges, polyhedraMaterial, showAxes,
        clipX, clipY, clipZ,
        enableBloom, enableVignette, backlightIntensity,
        aoIntensity, aoRadius, aoDistanceFalloff, aoColor
    } = useControls('🎨 Visual Style', {
        'Material': folder({
            preset: { options: ['Ceramic', 'Metallic', 'Matte', 'Glass', 'Plastic', 'Emissive', 'Custom'], value: 'Matte' },
            radiusScale: { value: 1.0, min: 0.1, max: 2.0, step: 0.1, label: 'Atom Size' },
        }),
        'PBR Settings': folder({
            roughness: { value: 0.2, min: 0, max: 1, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
            metalness: { value: 0.5, min: 0, max: 1, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
            clearcoat: { value: 1.0, min: 0, max: 1, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
            transmission: { value: 0, min: 0, max: 1, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
            ior: { value: 1.5, min: 1, max: 2.33, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
            thickness: { value: 0, min: 0, max: 5, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
            emissiveIntensity: { value: 0, min: 0, max: 10, render: (get) => get('🎨 Visual Style.Material.preset') === 'Custom' },
        }),
        'Display': folder({
            showPolyhedra: { value: true, label: 'Show Polyhedra' },
            showPolyhedraEdges: { value: true, label: 'Polyhedra Edges', render: (get) => get('🎨 Visual Style.Display.showPolyhedra') },
            polyhedraMaterial: { options: ['Matte', 'Glass', 'Basic', 'Glossy', 'Frosted'], value: 'Matte', label: 'Polyhedra Material', render: (get) => get('🎨 Visual Style.Display.showPolyhedra') },
            showAxes: { value: false, label: 'Show Pivot' },
        }, { collapsed: false }),
        'Clipping': folder({
            clipX: { value: [0, 100], min: 0, max: 100, label: 'Clip X' },
            clipY: { value: [0, 100], min: 0, max: 100, label: 'Clip Y' },
            clipZ: { value: [0, 100], min: 0, max: 100, label: 'Clip Z' },
        }),
        'Effects': folder({
            aoIntensity: { value: 0.3, min: 0, max: 2, label: 'SSAO Intensity' },
            aoRadius: { value: 5.0, min: 1, max: 10, label: 'SSAO Radius' },
            aoDistanceFalloff: { value: 1.0, min: 0, max: 2, label: 'SSAO Falloff' },
            aoColor: { value: '#000000', label: 'SSAO Color' },
            enableBloom: { value: true, label: 'Enable Bloom' },
            enableVignette: { value: false, label: 'Enable Vignette' },
            backlightIntensity: { value: 2.0, min: 0, max: 5, label: 'Rim Light' }
        }),
    });

    // Handle visual setting changes
    useEffect(() => {
        if (onVisualSettingsChange) {
            onVisualSettingsChange({
                enableBloom, enableVignette, backlightIntensity,
                aoIntensity, aoRadius, aoDistanceFalloff, aoColor
            });
        }
    }, [onVisualSettingsChange, enableBloom, enableVignette, backlightIntensity, aoIntensity, aoRadius, aoDistanceFalloff, aoColor]);

    // Listen for structure change events
    useEffect(() => {
        const handleStructureChange = (e: any) => {
            const { structure } = e.detail;
            console.log('Structure change event:', structure);
            setMaterial(structure);

            // Trigger camera reset (dispatched to window, caught below)
            window.dispatchEvent(new Event('reset-camera'));

            // Handle CIF data loading
            if (structure === 'CIF Option' && (e.detail as any).cifData) {
                const cifContent = (e.detail as any).cifData;
                try {
                    const result = parseCIF(cifContent);
                    if (result.atoms.length > 0) {
                        setCifAtoms(result.atoms);
                        console.log(`Loaded ${result.atoms.length} atoms from CIF`);
                    }
                } catch (err) {
                    console.error("Failed to parse CIF", err);
                    alert("Failed to parse CIF file");
                }
            }

            // Extract NCM ratio if present
            if (structure.startsWith('NCM-')) {
                const ratio = structure.split('-')[1];
                setNcmRatio(ratio);
            }
        };

        window.addEventListener('structure-change', handleStructureChange);

        // Reset Logic moved to separate useEffect below to ensure consistent behavior

        return () => {
            window.removeEventListener('structure-change', handleStructureChange);
            window.removeEventListener('structure-change', handleStructureChange);
        };
    }, []);

    // Separate useEffect for Camera Control Events (Align & Reset)
    useEffect(() => {
        // Handle Camera Reset - Explicitly restore defaults
        const handleResetCamera = () => {
            console.log('[StructureScene] Resetting Camera to Defaults');
            if (orbitRef.current) {
                // Instead of reset(), we manually set position/target to ensure it matches fresh load state
                const camera = orbitRef.current.object;

                // 1. Reset Target first to calculate distance correctly
                const targetY = isMobile ? CAMERA.MOBILE_Y_OFFSET : 0;
                orbitRef.current.target.set(0, targetY, 0);

                // 2. Reset Position
                camera.position.set(...CAMERA.DEFAULT_POSITION);

                // 3. Adjust Zoom if Orthographic
                if (camera.type === 'OrthographicCamera') {
                    // Use calibrated zoom if available, otherwise default
                    // This ensures the "first switch" calibration is inherited
                    const preservedZoom = cameraStateRef.current.calibratedZoom || CAMERA.DEFAULT_ORTHO_ZOOM;
                    camera.zoom = preservedZoom;
                    camera.updateProjectionMatrix();
                }

                orbitRef.current.update();
                setAutoRotate(true);

                // Update internal ref
                cameraStateRef.current.position = camera.position.clone();
                cameraStateRef.current.target = orbitRef.current.target.clone();
                cameraStateRef.current.zoom = camera.zoom;
            }
        };

        const handleAlignCamera = (e: any) => {
            console.log('[StructureScene] Received align-camera event', e.detail);
            const { axis } = e.detail;

            if (!orbitRef.current) {
                console.warn('[StructureScene] orbitRef missing during alignment');
                return;
            }

            // Stop rotation
            setAutoRotate(false);

            // Calculate distance based on DEFAULT_POSITION (Reset State)
            // CAMERA.DEFAULT_POSITION is a vector3 array
            const defaultPos = new THREE.Vector3().fromArray(CAMERA.DEFAULT_POSITION);
            const distance = defaultPos.length();

            const target = cameraStateRef.current.target || new THREE.Vector3(0, isMobile ? CAMERA.MOBILE_Y_OFFSET : 0, 0);

            let newPos = new THREE.Vector3();

            // Set position relative to target
            // Axis Vector * Distance
            switch (axis) {
                case 'x':
                    newPos.set(distance, 0, 0); // Right view
                    break;
                case 'y':
                    newPos.set(0, distance, 0); // Top view
                    break;
                case 'z':
                    newPos.set(0, 0, distance); // Front view
                    break;
                case 'iso':
                    // Material-specific Isometric Views
                    const isLayered = [
                        MATERIAL_FAMILIES.NCM,
                        MATERIAL_FAMILIES.LLO,
                        MATERIAL_FAMILIES.SIB_O3,
                        MATERIAL_FAMILIES.SIB_P2,
                        'LCO' as any // Temporary cast until LCO is added to constants
                    ].some(fam => getMaterialFamily(material) === fam);

                    // Layered structures look best when viewed slightly from above to show hexagonal lattice + stacking
                    // [1, 1, 0.5] was too low (side-like). Increased Z to 1.25 for true isometric feel.
                    if (isLayered) {
                        newPos.set(1, 1, 1.25).normalize().multiplyScalar(distance);
                    } else {
                        // Standard Isometric for others (Spinels, Olivines)
                        newPos.set(1, 1, 1).normalize().multiplyScalar(distance);
                    }
                    break;
            }

            const camera = orbitRef.current.object;
            const finalPos = target.clone().add(newPos);

            camera.position.copy(finalPos);

            // Special handling for Y-axis (Top view) to ensure proper orientation
            // Without this, looking from Top might be disoriented
            if (axis === 'y') {
                camera.up.set(0, 0, -1); // Top of screen = -Z (Back) -> Standard Map View
            } else {
                camera.up.set(0, 1, 0); // Standard Y-up
            }

            orbitRef.current.update();
            cameraStateRef.current.position = camera.position.clone();

            // Force re-render of frame to update view immediately
            // invalidate(); // If using frame loop on demand
        };

        window.addEventListener('align-camera', handleAlignCamera);
        window.addEventListener('reset-camera', handleResetCamera);

        return () => {
            window.removeEventListener('align-camera', handleAlignCamera);
            window.removeEventListener('reset-camera', handleResetCamera);
        };
    }, [isMobile]); // Re-bind if mobility changes (affects target offset)

    const [autoRotate, setAutoRotate] = useState(true);
    const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.5);

    // Camera controls with manual state for keyboard shortcuts
    useControls('Camera', {
        'Auto Rotate': {
            value: autoRotate,
            onChange: (v) => setAutoRotate(v)
        },
        'Rotate Speed': {
            value: autoRotateSpeed,
            min: 0.1,
            max: 10,
            onChange: (v) => setAutoRotateSpeed(v),
            render: (get) => get('Camera.Auto Rotate')
        },
    });

    // Keyboard shortcuts - Space to toggle auto-rotate
    useKeyboardShortcuts({
        'Space': () => {
            setAutoRotate(prev => !prev);
        }
    });

    // Lighting Controls with Presets
    const { lightingPreset, keyIntensity, fillIntensity, rimIntensity, ambientIntensity } = useControls('💡 Lighting', {
        lightingPreset: {
            options: {
                'Studio': 'studio',
                'Outdoor': 'outdoor',
                'Dramatic': 'dramatic',
                'Soft': 'soft',
                'Custom': 'custom'
            },
            value: 'studio',
            label: 'Preset'
        },
        keyIntensity: { value: 1.5, min: 0, max: 5, label: 'Key Light', render: (get) => get('💡 Lighting.lightingPreset') === 'custom' },
        fillIntensity: { value: 0.5, min: 0, max: 3, label: 'Fill Light', render: (get) => get('💡 Lighting.lightingPreset') === 'custom' },
        rimIntensity: { value: 0.8, min: 0, max: 3, label: 'Rim Light', render: (get) => get('💡 Lighting.lightingPreset') === 'custom' },
        ambientIntensity: { value: 0.3, min: 0, max: 2, label: 'Ambient', render: (get) => get('💡 Lighting.lightingPreset') === 'custom' },
    });

    // Apply lighting preset values - Refactored for cleaner logic
    const lightingValues = useMemo(() => {
        const presets = {
            'studio': { key: 0.8, fill: 1.0, rim: 0.4, ambient: 1.0, env: 'studio' },
            'outdoor': { key: 2.0, fill: 0.8, rim: 0.3, ambient: 0.7, env: 'forest' },
            'dramatic': { key: 3.0, fill: 0.2, rim: 1.5, ambient: 0.2, env: 'city' },
            'soft': { key: 0.5, fill: 0.4, rim: 0.2, ambient: 0.9, env: 'sunset' },
            'custom': { key: keyIntensity, fill: fillIntensity, rim: rimIntensity, ambient: ambientIntensity, env: 'studio' }
        };
        return presets[lightingPreset as keyof typeof presets] || presets['studio'];
    }, [lightingPreset, keyIntensity, fillIntensity, rimIntensity, ambientIntensity]);

    const handleExport = () => {
        if (groupRef.current) exportScene(groupRef.current);
    };

    // Listen for export events from App
    useEffect(() => {
        const handleExportEvent = () => handleExport();
        window.addEventListener('export-model', handleExportEvent);
        return () => window.removeEventListener('export-model', handleExportEvent);
    }, []);

    const structureData = useMemo(() => {
        try {
            let data: { atoms: Atom[], unitCell?: any, params?: any };
            let baseMaterial = getMaterialFamily(material);

            // Special handling for SiB: Use full ID as family to match switch cases
            if (material.startsWith('SiB-')) {
                baseMaterial = material as any;
            }

            switch (baseMaterial) {
                case MATERIAL_FAMILIES.NCM:
                    data = generateNCM(nx, ny, nz, ncmRatio as any);
                    break;
                case MATERIAL_FAMILIES.LFP:
                    data = generateLFP(nx, ny, nz);
                    break;
                case MATERIAL_FAMILIES.LMFP:
                    data = generateLMFP(nx, ny, nz);
                    break;
                case MATERIAL_FAMILIES.LLO:
                    data = generateLLO(nx, ny, nz);
                    break;
                case MATERIAL_FAMILIES.LMR:
                    data = generateLMR(nx, ny, nz);
                    break;
                case MATERIAL_FAMILIES.SIB_O3:
                    data = generateO3(nx, ny, nz);
                    break;
                case MATERIAL_FAMILIES.SIB_P2:
                    data = generateP2(nx, ny, nz);
                    break;
                default:
                    if (material === 'CIF Option' || material === 'CIF') {
                        data = { atoms: cifAtoms, unitCell: { a: 10, b: 10, c: 10, alpha: 90, beta: 90, gamma: 90 } };
                    } else {
                        data = generateNCM(nx, ny, nz, '811');
                    }
            }

            return { atoms: data.atoms, cellParams: (data.unitCell || data.params) };
        } catch (e) {
            console.error("Structure Generation Error", e);
            return { atoms: [], cellParams: {} };
        }
    }, [material, nx, ny, nz, ncmRatio, cifAtoms]);

    // Handle side effects (updates) in useEffect to avoid infinite loops
    useEffect(() => {
        if (!structureData.cellParams) return;

        // Emit space group update event
        if (onSpaceGroupUpdate) {
            onSpaceGroupUpdate({ material, unitCell: structureData.cellParams });
        }
        window.dispatchEvent(new CustomEvent('space-group-update', {
            detail: { material, unitCell: structureData.cellParams }
        }));
    }, [structureData, material, onSpaceGroupUpdate]);

    // Debug: Check if atoms are actually generated (development only)
    useEffect(() => {
        if (import.meta.env.DEV) {
            console.log("StructureScene: structureData update:", {
                atomCount: structureData.atoms?.length,
                sampleAtom: structureData.atoms?.[0],
                cellParams: structureData.cellParams
            });
        }
    }, [structureData]);

    // Calculate Bounding Box Center manually to ensure precise centering
    const sceneCenterOffset = useMemo(() => {
        if (!structureData.atoms || structureData.atoms.length === 0) return [0, 0, 0] as [number, number, number];

        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        let validCount = 0;

        for (const atom of structureData.atoms) {
            if (!atom.position || atom.position.length < 3) continue;
            const [x, y, z] = atom.position;
            // Less aggressive check, just ensure it's a number
            if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') continue;

            if (x < minX) minX = x;
            if (y < minY) minY = y;
            if (z < minZ) minZ = z;
            if (x > maxX) maxX = x;
            if (y > maxY) maxY = y;
            if (z > maxZ) maxZ = z;
            validCount++;
        }

        if (validCount === 0 || minX === Infinity) return [0, 0, 0] as [number, number, number];

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;

        return [-centerX, -centerY + (isMobile ? CAMERA.MOBILE_Y_OFFSET : 0), -centerZ] as [number, number, number];
    }, [structureData.atoms, isMobile]);
    // Dynamic Clipping Planes logic
    const planes = useMemo(() => {
        const p = [];
        if (!structureData.atoms || structureData.atoms.length === 0) return [];

        let minLocalX = Infinity, minLocalY = Infinity, minLocalZ = Infinity;
        let maxLocalX = -Infinity, maxLocalY = -Infinity, maxLocalZ = -Infinity;

        structureData.atoms.forEach(a => {
            const [x, y, z] = a.position;
            minLocalX = Math.min(minLocalX, x); maxLocalX = Math.max(maxLocalX, x);
            minLocalY = Math.min(minLocalY, y); maxLocalY = Math.max(maxLocalY, y);
            minLocalZ = Math.min(minLocalZ, z); maxLocalZ = Math.max(maxLocalZ, z);
        });

        const dx = maxLocalX - minLocalX;
        const dy = maxLocalY - minLocalY;
        const dz = maxLocalZ - minLocalZ;

        // The entire model is shifted by sceneCenterOffset in world space
        const [offX, offY, offZ] = sceneCenterOffset;

        // helper to get world coordinate from local normalize ratio
        const getWorldCoord = (min: number, delta: number, ratio: number, offset: number) => {
            return (min + delta * ratio / 100) + offset;
        };

        // Extract min/max from range values
        const [clipXMin, clipXMax] = clipX;
        const [clipYMin, clipYMax] = clipY;
        const [clipZMin, clipZMax] = clipZ;


        // Standard non-rotated mapping
        // Clip X -> Normal (1, 0, 0)
        // Clip Y -> Normal (0, 1, 0)
        // Clip Z -> Normal (0, 0, 1)

        if (clipXMin > 0) p.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), -getWorldCoord(minLocalX, dx, clipXMin, offX)));
        if (clipXMax < 100) p.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), getWorldCoord(minLocalX, dx, clipXMax, offX)));

        if (clipYMin > 0) p.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -getWorldCoord(minLocalY, dy, clipYMin, offY)));
        if (clipYMax < 100) p.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), getWorldCoord(minLocalY, dy, clipYMax, offY)));

        if (clipZMin > 0) p.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -getWorldCoord(minLocalZ, dz, clipZMin, offZ)));
        if (clipZMax < 100) p.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), getWorldCoord(minLocalZ, dz, clipZMax, offZ)));

        return p;
    }, [structureData.atoms, sceneCenterOffset, clipX, clipY, clipZ]);

    // Material definitions based on preset
    const materialProps = useMemo(() => {
        const base = {
            roughness: 0.2,
            metalness: 0.5,
            clearcoat: 1.0,
            transmission: 0,
            ior: 1.5,
            thickness: 0,
            emissive: '#000000',
            emissiveIntensity: 0
        };

        if (preset === 'Ceramic') return { ...base, roughness: 0.1, metalness: 0.1, clearcoat: 0.8 };
        if (preset === 'Metallic') return { ...base, roughness: 0.2, metalness: 0.9, clearcoat: 1.0 };
        if (preset === 'Matte') return { ...base, roughness: 1.0, metalness: 0.0, clearcoat: 0 };
        if (preset === 'Glass') return { ...base, roughness: 0, metalness: 0, transmission: 1.0, ior: 1.5, thickness: 2.0, transparent: true, opacity: 0.5 };
        if (preset === 'Plastic') return { ...base, roughness: 0.4, metalness: 0.0, clearcoat: 0.5 };
        if (preset === 'Emissive') return { ...base, roughness: 0.5, metalness: 0, emissive: '#ffffff', emissiveIntensity: 2.0 };
        if (preset === 'Custom') return {
            roughness, metalness, clearcoat, transmission, ior, thickness,
            emissive: emissiveIntensity > 0 ? '#ffffff' : '#000000',
            emissiveIntensity
        };

        return base;
    }, [preset, roughness, metalness, clearcoat, transmission, ior, thickness, emissiveIntensity]);


    return (
        <ErrorBoundary name="StructureScene">
            <ElementController
                atoms={structureData.atoms}
                onChange={setElementSettings}
            />

            {/* Pass lighting intensities to parent */}
            <group userData={{
                keyIntensity: lightingValues.key,
                fillIntensity: lightingValues.fill,
                rimIntensity: lightingValues.rim,
                ambientIntensity: lightingValues.ambient,
                aoIntensity,
                aoRadius,
                aoDistanceFalloff,
                aoColor
            }}>

                {/* Backlight for Rim Effect */}
                <directionalLight position={[0, 5, -10]} intensity={backlightIntensity} color="#ffffff" />
                <directionalLight position={[0, -5, -10]} intensity={backlightIntensity * 0.5} color="#cbd5e1" />

                <Environment preset={lightingValues.env as any} blur={0.6} />

                {/* Apply manual center offset to the entire group */}
                <group ref={groupRef} position={sceneCenterOffset}>
                    <Atoms
                        atoms={structureData.atoms}
                        clippingPlanes={planes}
                        radiusScale={radiusScale}
                        elementSettings={elementSettings}
                        materialProps={materialProps}
                        liAnimating={liAnimating}
                    />

                    {/* Li Charge/Discharge Animation */}
                    <LiAnimation
                        liAtoms={structureData.atoms.filter(a => a.element === 'Li')}
                        isAnimating={liAnimating}
                        liColor={elementSettings['Li']?.color || ELEMENT_COLORS['Li'] || '#0277BD'}
                        liRadius={(ELEMENT_RADII['Li'] || 0.36) * radiusScale * (elementSettings['Li']?.scale || 1)}
                        materialId={material}
                        materialProps={materialProps}
                        clippingPlanes={planes}
                    />

                    <Polyhedra
                        atoms={structureData.atoms}
                        visible={showPolyhedra}
                        showEdges={showPolyhedraEdges}
                        material={polyhedraMaterial as 'Matte' | 'Glass' | 'Basic' | 'Glossy' | 'Frosted'}
                        clippingPlanes={planes}
                        elementSettings={elementSettings}
                    />
                </group>

                {/* LabeledAxes outside offset group to show true rotation center (World Origin) */}
                {showAxes && <LabeledAxes size={5} />}
            </group>

            {/* Camera Management */}
            {isOrthographic ? (
                <OrthographicCamera
                    makeDefault
                    position={cameraStateRef.current.position || CAMERA.DEFAULT_POSITION}
                    zoom={cameraStateRef.current.zoom} // Dynamic zoom
                    near={0.1}
                    far={200}
                />
            ) : (
                <PerspectiveCamera
                    makeDefault
                    position={cameraStateRef.current.position || CAMERA.DEFAULT_POSITION}
                    fov={CAMERA.DEFAULT_FOV}
                    near={0.1}
                    far={200}
                />
            )}

            <OrbitControls
                key={`orbit-${material}`} // Removed isOrthographic from key to prevent re-mount
                ref={orbitRef}
                makeDefault
                autoRotate={autoRotate}
                autoRotateSpeed={1.0}
                dampingFactor={0.05}
                target={cameraStateRef.current.target || [0, isMobile ? CAMERA.MOBILE_Y_OFFSET : 0, 0]}
                onChange={handleControlsChange}
                minPolarAngle={0}
                maxPolarAngle={Math.PI} // Allow full vertical rotation (0 to 180 deg)
            />
        </ErrorBoundary >
    );
};

// Export Button Component
export const ExportButton = ({ onClick, style = {} }: { onClick: () => void; style?: React.CSSProperties }) => (
    <button
        onClick={onClick}
        style={{
            padding: '12px 18px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            zIndex: 1000,
            pointerEvents: 'auto',
            ...style
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
        }}
    >
        Export
    </button>
);
