import { useMemo } from 'react';
import * as THREE from 'three';
import type { Atom } from '../../core/types';
import { ConvexGeometry } from 'three-stdlib';
import { ELEMENT_COLORS } from './Materials';

interface PolyhedraProps {
    atoms: Atom[];
    visible: boolean;
    clippingPlanes: THREE.Plane[];
    elementSettings?: { [key: string]: { scale: number; visible: boolean; color: string } };
}

export const Polyhedra = ({ atoms, visible, clippingPlanes, elementSettings = {} }: PolyhedraProps) => {
    const polys = useMemo(() => {
        if (!visible) return [];

        // ONLY transition metals and P form coordination polyhedra centers
        // Oxygen is EXCLUDED - it's the coordinating ligand, not the center
        const centers = atoms.filter(a => ['Co', 'Ni', 'Mn', 'Fe', 'P'].includes(a.element));

        const geoms: { id: string, geometry: THREE.BufferGeometry, color: string, element: string }[] = [];

        centers.forEach(center => {
            const neighbors: THREE.Vector3[] = [];
            const p1 = new THREE.Vector3(...center.position);

            // Find ONLY oxygen atoms as coordinating ligands
            atoms.forEach(other => {
                // Skip if not oxygen
                if (other.element !== 'O') return;

                const p2 = new THREE.Vector3(...other.position);
                const dist = p1.distanceTo(p2);

                // Metal-Oxygen coordination bond distances
                let maxDist = 2.4; // Transition metal-O octahedral

                if (center.element === 'P') {
                    maxDist = 1.9; // P-O tetrahedral (shorter)
                }

                if (dist < maxDist && dist > 0.1) {
                    neighbors.push(p2);
                }
            });

            // Need at least 4 oxygen atoms to form a coordination polyhedron
            if (neighbors.length >= 4) {
                try {
                    const geometry = new ConvexGeometry(neighbors);

                    // Determine color from element settings
                    const settings = elementSettings[center.element];
                    let color = ELEMENT_COLORS[center.element] || '#888888';

                    if (settings && settings.color) {
                        color = settings.color;
                    }

                    geoms.push({
                        id: center.id + '_poly',
                        geometry,
                        color,
                        element: center.element
                    });
                } catch (e) {
                    // ConvexGeometry might fail for coplanar points
                    console.warn(`Failed to create polyhedron for ${center.element} at`, center.position);
                }
            }
        });

        return geoms;

    }, [atoms, visible, elementSettings]);

    if (!visible) return null;

    return (
        <group>
            {polys.map(poly => (
                <mesh key={poly.id} geometry={poly.geometry}>
                    <meshPhysicalMaterial
                        color={poly.color}
                        transparent
                        opacity={0.35}
                        roughness={0.7}
                        metalness={0.0}
                        clearcoat={0.0}
                        transmission={0.0}
                        side={THREE.DoubleSide}
                        clippingPlanes={clippingPlanes}
                        clipShadows
                    />
                    <lineSegments>
                        <edgesGeometry args={[poly.geometry]} />
                        <lineBasicMaterial
                            color="#888888"
                            opacity={0.12}
                            transparent
                            clippingPlanes={clippingPlanes}
                        />
                    </lineSegments>
                </mesh>
            ))}
        </group>
    );
};
