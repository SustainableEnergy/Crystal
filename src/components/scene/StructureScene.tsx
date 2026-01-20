import { useMemo, useRef, useState, useEffect } from 'react';
import { useControls, folder, buttonGroup } from 'leva';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { generateNCM } from '../../core/builders/NCMBuilder';
import { generateLFP } from '../../core/builders/LFPBuilder';
import { generateLMFP } from '../../core/builders/LMFPBuilder';
import { MATERIALS, getMaterialFamily, MATERIAL_FAMILIES } from '../../core/constants/materials';
import { parseCIF } from '../../core/utils/CIFParser';
import { Atoms } from './Atoms';
import { Bonds } from './Bonds';
import { Polyhedra } from './Polyhedra';
import { Center, OrbitControls, Environment } from '@react-three/drei';
import { EffectComposer, SSAO, Bloom } from '@react-three/postprocessing';
import { exportScene } from '../../core/utils/Exporter';
import { captureHighRes } from '../../core/utils/SnapshotUtil';
import type { Atom } from '../../core/types';

import { ErrorBoundary } from '../UI/ErrorBoundary';
import { ELEMENT_COLORS } from '../../core/constants/materials';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

// --- SUB-COMPONENT: DYNAMIC ELEMENT CONTROLS ---
const ElementController = ({
    atoms,
    onChange
}: {
    atoms: Atom[],
    onChange: (settings: any) => void
}) => {
    const uniqueElements = useMemo(() => {
        if (!atoms) return [];
        const elements = Array.from(new Set(atoms.map(a => a.element)));

        // Define priority order for cathode materials
        const priorityOrder = ['Li', 'Ni', 'Co', 'Mn', 'Fe', 'P', 'O'];

        return elements.sort((a, b) => {
            const indexA = priorityOrder.indexOf(a);
            const indexB = priorityOrder.indexOf(b);

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
            // Li is visible by default, all others are hidden
            const defaultVisible = el === 'Li';

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
        const settings: any = {};
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
export const StructureScene = ({ onSpaceGroupUpdate, isMobile = false }: { onSpaceGroupUpdate?: (info: any) => void, isMobile?: boolean }) => {
    const groupRef = useRef<THREE.Group>(null);
    const orbitRef = useRef<any>(null);

    const [cifAtoms, setCifAtoms] = useState<Atom[]>([]);
    const [elementSettings, setElementSettings] = useState<any>({});

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
        nx: { value: defaults.nx, min: 1, max: 10, step: 1, label: 'X Repeat', render: () => [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP].includes(getMaterialFamily(material)) },
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

        ny: { value: defaults.ny, min: 1, max: 10, step: 1, label: 'Y Repeat', render: () => [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP].includes(getMaterialFamily(material)) },
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

        nz: { value: defaults.nz, min: 1, max: 10, step: 1, label: 'Z Repeat', render: () => [MATERIAL_FAMILIES.NCM, MATERIAL_FAMILIES.LFP, MATERIAL_FAMILIES.LMFP].includes(getMaterialFamily(material)) },
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
        showBonds, showPolyhedra, showPolyhedraEdges, showAxes,
        clipXMin, clipXMax, clipYMin, clipYMax, clipZMin, clipZMax,
        enableSSAO, ssaoIntensity, enableBloom, enableFog, fogNear, fogFar, backlightIntensity
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
            showBonds: { value: false, label: 'Show Bonds' },
            showPolyhedra: { value: true, label: 'Show Polyhedra' },
            showPolyhedraEdges: { value: true, label: 'Polyhedra Edges', render: (get) => get('🎨 Visual Style.Display.showPolyhedra') },
            showAxes: { value: false, label: 'Show Pivot' },
        }),
        'Clipping': folder({
            clipXMin: { value: 0, min: 0, max: 100, label: 'Clip X Min' },
            clipXMax: { value: 100, min: 0, max: 100, label: 'Clip X Max' },
            clipYMin: { value: 0, min: 0, max: 100, label: 'Clip Y Min' },
            clipYMax: { value: 100, min: 0, max: 100, label: 'Clip Y Max' },
            clipZMin: { value: 0, min: 0, max: 100, label: 'Clip Z Min' },
            clipZMax: { value: 100, min: 0, max: 100, label: 'Clip Z Max' },
        }),
        'Effects (Beta)': folder({
            enableSSAO: { value: true, label: 'Enable Volume (SSAO)' },
            ssaoIntensity: { value: 40, min: 0, max: 100, label: 'Volume Strength', render: (get) => get('🎨 Visual Style.Effects (Beta).enableSSAO') },
            enableBloom: { value: true, label: 'Enable Glow (Bloom)' },
            enableFog: { value: true, label: 'Enable Depth Fog' },
            fogNear: { value: 10, min: 0, max: 50, label: 'Fog Start', render: (get) => get('🎨 Visual Style.Effects (Beta).enableFog') },
            fogFar: { value: 80, min: 20, max: 200, label: 'Fog End', render: (get) => get('🎨 Visual Style.Effects (Beta).enableFog') },
            backlightIntensity: { value: 2.0, min: 0, max: 5, label: 'Rim Light' }
        })
    });

    // Listen for structure change events
    useEffect(() => {
        const handleStructureChange = (e: any) => {
            const { structure } = e.detail;
            console.log('Structure change event:', structure);
            setMaterial(structure);

            // Trigger camera reset
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
        return () => window.removeEventListener('structure-change', handleStructureChange);
    }, []);

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
            'studio': { key: 1.5, fill: 0.5, rim: 0.8, ambient: 0.5, env: 'studio' },
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
            let data;
            const baseMaterial = getMaterialFamily(material);

            switch (baseMaterial as any) {
                case MATERIAL_FAMILIES.NCM: data = generateNCM(nx, ny, nz, ncmRatio as any); break;
                case MATERIAL_FAMILIES.LFP: data = generateLFP(nx, ny, nz); break;
                case MATERIAL_FAMILIES.LMFP: data = generateLMFP(nx, ny, nz); break;
                case 'CIF':
                case 'CIF Option':
                    data = { atoms: cifAtoms, unitCell: { a: 10, b: 10, c: 10, alpha: 90, beta: 90, gamma: 90 } };
                    break;
                default: data = generateNCM(nx, ny, nz, '811');
            }

            // Emit space group update event
            if (onSpaceGroupUpdate) {
                onSpaceGroupUpdate({ material, unitCell: data.unitCell });
            }
            window.dispatchEvent(new CustomEvent('space-group-update', {
                detail: { material, unitCell: data.unitCell }
            }));

            return data;
        } catch (e) {
            console.error("Structure Generation Error", e);
            return { atoms: [], unitCell: { a: 10, b: 10, c: 10, alpha: 90, beta: 90, gamma: 90 } };
        }
    }, [material, nx, ny, nz, ncmRatio, onSpaceGroupUpdate]);

    const materialProps = useMemo(() => {
        const base = { roughness, metalness, clearcoat, clearcoatRoughness: 0.2, transmission, ior, thickness, emissiveIntensity, opacity: 1, transparent: false };
        switch (preset) {
            case 'Ceramic': return { ...base, roughness: 0.3, metalness: 0.1, clearcoat: 0.8 }; // Increased roughness, reduced clearcoat
            case 'Metallic': return { ...base, roughness: 0.4, metalness: 0.8, clearcoat: 0.1 }; // Increased roughness
            case 'Matte': return { ...base, roughness: 0.8, metalness: 0.0, clearcoat: 0.0 };
            case 'Glass': return { ...base, roughness: 0.1, metalness: 0.0, transmission: 0.95, ior: 1.5, thickness: 1.0, transparent: true, opacity: 0.3 };
            case 'Plastic': return { ...base, roughness: 0.2, metalness: 0.0, clearcoat: 0.3 };
            case 'Emissive': return { ...base, roughness: 0.1, metalness: 0.0, emissive: '#ffffff', emissiveIntensity: 2.0 };
            default: return base;
        }
    }, [preset, roughness, metalness, clearcoat, transmission, ior, thickness, emissiveIntensity]);

    const planes = useMemo(() => {
        const maxDist = 50;
        const p = [];

        // X Axis
        if (clipXMin > 0) p.push(new THREE.Plane(new THREE.Vector3(1, 0, 0), -(clipXMin / 100) * maxDist));
        if (clipXMax < 100) p.push(new THREE.Plane(new THREE.Vector3(-1, 0, 0), (clipXMax / 100) * maxDist));

        // Y Axis
        if (clipYMin > 0) p.push(new THREE.Plane(new THREE.Vector3(0, 1, 0), -(clipYMin / 100) * maxDist));
        if (clipYMax < 100) p.push(new THREE.Plane(new THREE.Vector3(0, -1, 0), (clipYMax / 100) * maxDist));

        // Z Axis
        if (clipZMin > 0) p.push(new THREE.Plane(new THREE.Vector3(0, 0, 1), -(clipZMin / 100) * maxDist));
        if (clipZMax < 100) p.push(new THREE.Plane(new THREE.Vector3(0, 0, -1), (clipZMax / 100) * maxDist));

        return p;
    }, [clipXMin, clipXMax, clipYMin, clipYMax, clipZMin, clipZMax]);

    // Apply lighting to Three scene via refs
    useEffect(() => {
        // Lighting intensity is handled via App.tsx props pass
    }, [keyIntensity, fillIntensity, rimIntensity, ambientIntensity]);

    // Custom rotation axis handling
    // Note: OrbitControls auto-rotate always rotates around Y axis
    // Rotating the entire scene causes visual jumps, so we keep it simple
    // Users can manually rotate the view to see different perspectives

    // Camera reset handler
    useEffect(() => {
        const handleReset = () => {
            if (orbitRef.current) {
                orbitRef.current.reset();
            }
        };
        window.addEventListener('reset-camera', handleReset);
        return () => window.removeEventListener('reset-camera', handleReset);
    }, []);

    // High-res snapshot handler with useThree access
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        const handleHighResSnapshot = (e: any) => {
            const { transparent, resolution = 2 } = e.detail || {};

            try {
                // Store ALL background-related elements
                const originalBackground = scene.background;
                const originalFog = scene.fog;
                const originalEnvironment = scene.environment;

                // Apply transparent background if requested
                if (transparent) {
                    scene.background = null;
                    scene.fog = null;
                    scene.environment = null;
                }

                // 1. Calculate Bounding Sphere (simpler and more reliable)
                let captureCamera = camera;

                if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
                    const perspCamera = camera as THREE.PerspectiveCamera;

                    if (groupRef.current) {
                        // Calculate bounding box first
                        const bbox = new THREE.Box3().setFromObject(groupRef.current);

                        if (!bbox.isEmpty()) {
                            // Get bounding sphere from box
                            const center = bbox.getCenter(new THREE.Vector3());
                            const size = bbox.getSize(new THREE.Vector3());
                            const radius = size.length() / 2; // Diagonal / 2 = sphere radius

                            // Get current viewing direction (preserve angle)
                            const viewDir = perspCamera.getWorldDirection(new THREE.Vector3());

                            // Calculate distance to fit sphere in FOV
                            const fov = perspCamera.fov * (Math.PI / 180);
                            const distance = radius / Math.sin(fov / 2);

                            // Add 10% padding
                            const finalDistance = distance * 1.1;

                            // Position camera behind center, along current view direction
                            const framedCamera = perspCamera.clone();
                            framedCamera.position.copy(
                                center.clone().sub(viewDir.multiplyScalar(finalDistance))
                            );
                            framedCamera.lookAt(center);
                            framedCamera.updateProjectionMatrix();

                            console.log('[Snapshot] Simple framing:', {
                                center,
                                radius,
                                distance: finalDistance,
                                cameraPos: framedCamera.position
                            });

                            captureCamera = framedCamera;
                        } else {
                            console.warn('[Snapshot] Bounding box empty, using current camera');
                        }
                    }
                }

                // Capture using utility
                if ((captureCamera as THREE.PerspectiveCamera).isPerspectiveCamera) {
                    captureHighRes(gl, scene, captureCamera as THREE.PerspectiveCamera, {
                        resolution: resolution,
                        transparent: transparent || false,
                        autoFrame: true,
                        filename: `cathode-${material}-${resolution}x-${Date.now()}.png`
                    });
                } else {
                    console.warn('Snapshot only supports PerspectiveCamera');
                    alert('Snapshot failed: Camera type not supported.');
                }

                // Restore ALL original states
                scene.background = originalBackground;
                scene.fog = originalFog;
                scene.environment = originalEnvironment;
            } catch (error) {
                console.error('High-res snapshot failed:', error);
                alert('Snapshot failed. Check console.');
            }
        };

        window.addEventListener('high-res-snapshot', handleHighResSnapshot);
        return () => window.removeEventListener('high-res-snapshot', handleHighResSnapshot);
    }, [gl, scene, camera, material]);

    const effects = [];
    if (enableSSAO) effects.push(<SSAO key="ssao" intensity={ssaoIntensity} radius={0.03} luminanceInfluence={0.5} />);
    if (enableBloom) effects.push(<Bloom key="bloom" intensity={0.5} luminanceThreshold={0.85} radius={0.6} mipmapBlur />);

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
                ambientIntensity: lightingValues.ambient
            }}>
                <color attach="background" args={['#f8f9fa']} />
                {enableFog && <fog attach="fog" args={['#f8f9fa', fogNear, fogFar]} />}

                {/* Backlight for Rim Effect */}
                <directionalLight position={[0, 5, -10]} intensity={backlightIntensity} color="#ffffff" />
                <directionalLight position={[0, -5, -10]} intensity={backlightIntensity * 0.5} color="#cbd5e1" />

                <Environment preset={lightingValues.env as any} blur={0.6} />
                <Center key={material} position={[0, isMobile ? 2.0 : 0, 0]} onCentered={() => {
                    // Force re-render after centering to fix disappearing atoms
                    // This is a common fix for Center component issues
                }}>
                    <group ref={groupRef}>
                        <Atoms
                            atoms={structureData.atoms}
                            clippingPlanes={planes}
                            radiusScale={radiusScale}
                            elementSettings={elementSettings}
                            materialProps={materialProps}
                        />
                        <Bonds atoms={structureData.atoms} visible={showBonds} />
                        <Polyhedra
                            atoms={structureData.atoms}
                            visible={showPolyhedra}
                            showEdges={showPolyhedraEdges} // Controlled by Leva
                            clippingPlanes={planes}
                            elementSettings={elementSettings}
                        />
                        {showAxes && <axesHelper args={[5]} />}
                    </group>
                </Center>

                {/* Post Processing Effects */}
                {effects.length > 0 && (
                    <EffectComposer>
                        {effects}
                    </EffectComposer>
                )}
            </group>

            <OrbitControls
                ref={orbitRef}
                makeDefault
                autoRotate={autoRotate}
                autoRotateSpeed={autoRotateSpeed}
                dampingFactor={0.05}
            />
        </ErrorBoundary>
    );
};

// Export Button Component
export const ExportButton = ({ onClick }: { onClick: () => void }) => (
    <button
        onClick={onClick}
        style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            padding: '12px 24px',
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
            pointerEvents: 'auto'
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
        Export 3D Model
    </button>
);
