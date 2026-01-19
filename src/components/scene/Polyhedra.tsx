import { useMemo } from 'react';
import * as THREE from 'three';
import type { Atom } from '../../core/types';
import { ConvexGeometry } from 'three-stdlib';
import { ELEMENT_COLORS } from '../../core/constants/materials';
// @ts-ignore
import './FresnelMaterial'; // Register <fresnelMaterial />

interface PolyhedraProps {
    atoms: Atom[];
    visible: boolean;
    showEdges?: boolean;
    clippingPlanes: THREE.Plane[];
    elementSettings?: { [key: string]: { scale: number; visible: boolean; color: string } };
}

export const Polyhedra = ({ atoms, visible, showEdges = true, clippingPlanes, elementSettings = {} }: PolyhedraProps) => {
    const polys = useMemo(() => {
        if (!visible) return [];

        const centers = atoms.filter(a => ['Co', 'Ni', 'Mn', 'Fe', 'P'].includes(a.element));
        const geoms: { id: string, geometry: THREE.BufferGeometry, color: string, element: string }[] = [];

        centers.forEach(center => {
            const neighbors: THREE.Vector3[] = [];
            const p1 = new THREE.Vector3(...center.position);

            atoms.forEach(other => {
                if (other.element !== 'O') return;

                const p2 = new THREE.Vector3(...other.position);
                const dist = p1.distanceTo(p2);
                let maxDist = 2.4;
                if (center.element === 'P') maxDist = 1.9;

                if (dist < maxDist && dist > 0.1) {
                    neighbors.push(p2);
                }
            });

            if (neighbors.length >= 4) {
                try {
                    const geometry = new ConvexGeometry(neighbors);
                    const settings = elementSettings[center.element];
                    let color = ELEMENT_COLORS[center.element] || '#888888';
                    if (settings && settings.color) color = settings.color;

                    geoms.push({
                        id: center.id + '_poly',
                        geometry,
                        color,
                        element: center.element
                    });
                } catch (e) {
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
                    {/* @ts-ignore */}
                    <fresnelMaterial
                        color={poly.color}
                        intensity={1.2}  // Reduced from 2.5
                        opacity={0.5}    // Reduced opacity
                        transparent
                        depthWrite={false}
                        side={THREE.DoubleSide}
                        clippingPlanes={clippingPlanes}
                        blending={THREE.NormalBlending} // Fix: Additive was too bright
                    />
                    {showEdges && (
                        <lineSegments>
                            <edgesGeometry args={[poly.geometry]} />
                            <lineBasicMaterial
                                color={poly.color} // Use same color just brighter/distinct
                                opacity={0.15} // Much subtler (was 0.6)
                                transparent
                                clippingPlanes={clippingPlanes}
                                blending={THREE.AdditiveBlending}
                            />
                        </lineSegments>
                    )}
                </mesh>
            ))}
        </group>
    );
};
