import { useMemo, useRef, useState, useEffect } from 'react';
import { useControls, folder, button, monitor } from 'leva';
import * as THREE from 'three';
import { generateNCM } from '../../core/builders/NCMBuilder';
import { generateLFP } from '../../core/builders/LFPBuilder';
import { parseCIF } from '../../core/utils/CIFParser';
import { Atoms } from './Atoms';
import { Bonds } from './Bonds';
import { Polyhedra } from './Polyhedra';
import { Center, OrbitControls } from '@react-three/drei';
import { exportScene } from '../../core/utils/Exporter';
import type { Atom } from '../../core/types';
import { v4 as uuidv4 } from 'uuid';
import { ErrorBoundary } from '../UI/ErrorBoundary';
import { ELEMENT_COLORS } from './Materials';

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
export const StructureScene = ({ onSpaceGroupUpdate }: { onSpaceGroupUpdate?: (info: any) => void }) => {
    const groupRef = useRef<THREE.Group>(null);
    const orbitRef = useRef<any>(null);

    const [customAtoms, setCustomAtoms] = useState<Atom[]>([]);
    const [cifAtoms, setCifAtoms] = useState<Atom[]>([]);
    const [elementSettings, setElementSettings] = useState<any>({});

    // Hierarchical Controls - NCM as default, LCO removed
    const { material, nx, ny, nz, ncmRatio } = useControls('📦 Structure', {
        material: { options: ['NCM', 'LFP', 'LEGO', 'CIF Option'], value: 'NCM', label: 'Type' },
        'Unit Cell': folder({
            nx: { value: 4, min: 1, max: 10, step: 1, label: 'X Repeat', render: (get) => ['NCM', 'LFP'].includes(get('📦 Structure.material')) },
            ny: { value: 4, min: 1, max: 10, step: 1, label: 'Y Repeat', render: (get) => ['NCM', 'LFP'].includes(get('📦 Structure.material')) },
            nz: { value: 4, min: 1, max: 10, step: 1, label: 'Z Repeat', render: (get) => ['NCM', 'LFP'].includes(get('📦 Structure.material')) },
        }),
        ncmRatio: { options: ['811', '622', '111'], value: '811', label: 'NCM Ratio', render: (get) => get('📦 Structure.material') === 'NCM' }
    });

    useControls('🧱 LEGO Builder', {
        legoElement: { options: ['Li', 'Co', 'Ni', 'Mn', 'Fe', 'P', 'O'], value: 'Li' },
        'Position': folder({
            legoX: { value: 0, step: 0.1, label: 'X' },
            legoY: { value: 0, step: 0.1, label: 'Y' },
            legoZ: { value: 0, step: 0.1, label: 'Z' },
        }),
        'ADD ATOM (+)': button((get) => {
            const el = get('🧱 LEGO Builder.legoElement');
            const x = get('🧱 LEGO Builder.Position.legoX');
            const y = get('🧱 LEGO Builder.Position.legoY');
            const z = get('🧱 LEGO Builder.Position.legoZ');
            setCustomAtoms(prev => [...prev, { id: uuidv4(), element: el, position: [x, y, z] }]);
        }),
        'CLEAR ALL': button(() => setCustomAtoms([]))
    }, { render: (get) => get('📦 Structure.material') === 'LEGO' });

    useControls('📄 CIF Import', {
        'Paste CIF Data': button(() => {
            const text = prompt("Paste CIF Content Here:");
            if (text) {
                const result = parseCIF(text);
                if (result.atoms.length > 0) {
                    setCifAtoms(result.atoms);
                    alert(`Loaded ${result.atoms.length} atoms.`);
                } else {
                    alert("Failed to parse. Check console.");
                }
            }
        }),
        'Status': monitor(() => cifAtoms.length > 0 ? `${cifAtoms.length} Atoms` : '-', { graph: false })
    }, { render: (get) => get('📦 Structure.material') === 'CIF Option' });

    const {
        preset, radiusScale,
        roughness, metalness, clearcoat, transmission, ior, thickness, emissiveIntensity,
        showBonds, showPolyhedra, showAxes,
        clipX, clipY, clipZ
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
            showPolyhedra: { value: true, label: 'Show Polyhedra', render: (get) => !['LEGO', 'CIF Option'].includes(get('📦 Structure.material')) },
            showAxes: { value: false, label: 'Show Pivot' },
            showUnitCell: { value: false, label: 'Unit Cell Box' },
        }),
        'Clipping': folder({
            clipX: { value: 100, min: 0, max: 100, label: 'Clip X' },
            clipY: { value: 100, min: 0, max: 100, label: 'Clip Y' },
            clipZ: { value: 100, min: 0, max: 100, label: 'Clip Z' },
        })
    });

    const { autoRotate, autoRotateSpeed } = useControls('🎥 Camera', {
        autoRotate: { value: true },
        autoRotateSpeed: { value: 1.5, min: 0.1, max: 10, render: (get) => get('🎥 Camera.autoRotate') },
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

    // Apply lighting preset values
    const lightingValues = useMemo(() => {
        switch (lightingPreset) {
            case 'studio': return { key: 1.5, fill: 0.5, rim: 0.8, ambient: 0.5 };
            case 'outdoor': return { key: 2.0, fill: 0.8, rim: 0.3, ambient: 0.7 };
            case 'dramatic': return { key: 3.0, fill: 0.2, rim: 1.5, ambient: 0.2 };
            case 'soft': return { key: 0.8, fill: 0.6, rim: 0.4, ambient: 0.8 };
            case 'custom': return { key: keyIntensity, fill: fillIntensity, rim: rimIntensity, ambient: ambientIntensity };
            default: return { key: 1.5, fill: 0.5, rim: 0.8, ambient: 0.5 };
        }
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
            switch (material) {
                case 'NCM': data = generateNCM(nx, ny, nz, ncmRatio as any); break;
                case 'LFP': data = generateLFP(nx, ny, nz); break;
                case 'LEGO': data = { atoms: customAtoms, unitCell: { a: 10, b: 10, c: 10, alpha: 90, beta: 90, gamma: 90 } }; break;
                case 'CIF Option': data = { atoms: cifAtoms, unitCell: { a: 10, b: 10, c: 10, alpha: 90, beta: 90, gamma: 90 } }; break;
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
    }, [material, nx, ny, nz, ncmRatio, customAtoms, cifAtoms, onSpaceGroupUpdate]);

    const materialProps = useMemo(() => {
        const base = { roughness, metalness, clearcoat, clearcoatRoughness: 0.1, transmission, ior, thickness, emissiveIntensity, opacity: 1, transparent: false };
        switch (preset) {
            case 'Ceramic': return { ...base, roughness: 0.1, metalness: 0.1, clearcoat: 1.0 };
            case 'Metallic': return { ...base, roughness: 0.3, metalness: 1.0, clearcoat: 0.0 };
            case 'Matte': return { ...base, roughness: 0.9, metalness: 0.0, clearcoat: 0.0 };
            case 'Glass': return { ...base, roughness: 0.05, metalness: 0.0, transmission: 0.95, ior: 1.5, thickness: 1.0, transparent: true, opacity: 0.3 };
            case 'Plastic': return { ...base, roughness: 0.1, metalness: 0.0, clearcoat: 0.5 };
            case 'Emissive': return { ...base, roughness: 0.1, metalness: 0.0, emissive: '#ffffff', emissiveIntensity: 2.0 };
            default: return base;
        }
    }, [preset, roughness, metalness, clearcoat, transmission, ior, thickness, emissiveIntensity]);

    const planes = useMemo(() => {
        const maxDist = 50;
        return [
            clipX < 100 ? new THREE.Plane(new THREE.Vector3(-1, 0, 0), (clipX / 100) * maxDist) : null,
            clipY < 100 ? new THREE.Plane(new THREE.Vector3(0, -1, 0), (clipY / 100) * maxDist) : null,
            clipZ < 100 ? new THREE.Plane(new THREE.Vector3(0, 0, -1), (clipZ / 100) * maxDist) : null,
        ].filter(Boolean) as THREE.Plane[];
    }, [clipX, clipY, clipZ]);

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
                <Center>
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
                            clippingPlanes={planes}
                            elementSettings={elementSettings}
                        />
                        {showAxes && <axesHelper args={[5]} />}
                    </group>
                </Center>
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
            position: 'absolute',
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
        📦 Export 3D Model
    </button>
);

