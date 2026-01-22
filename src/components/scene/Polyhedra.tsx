import { useMemo } from 'react';
import * as THREE from 'three';
import type { Atom } from '../../core/types';
import { ConvexGeometry } from 'three-stdlib';
import { ELEMENT_COLORS } from '../../core/constants/materials';
import { BOND_DISTANCE } from '../../core/constants/geometry';

interface PolyhedraProps {
    atoms: Atom[];
    visible: boolean;
    showEdges?: boolean;
    material?: 'Matte' | 'Glass' | 'Basic' | 'Glossy' | 'Frosted';
    clippingPlanes: THREE.Plane[];
    elementSettings?: { [key: string]: { scale: number; visible: boolean; color: string } };
}

export const Polyhedra = ({ atoms, visible, showEdges = true, material = 'Matte', clippingPlanes, elementSettings = {} }: PolyhedraProps) => {
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
                const maxDist = center.element === 'P'
                    ? BOND_DISTANCE.PHOSPHORUS_OXYGEN
                    : BOND_DISTANCE.METAL_OXYGEN;

                if (dist < maxDist && dist > BOND_DISTANCE.MIN_DISTANCE) {
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

    // Get material props based on selected material
    const getMaterialProps = (color: string) => {
        switch (material) {
            case 'Glass':
                return {
                    color,
                    opacity: 0.2,
                    transparent: true,
                    roughness: 0.1,
                    metalness: 0.0,
                    transmission: 0.9,
                    thickness: 0.5,
                    envMapIntensity: 1.0,
                    ior: 1.5
                };
            case 'Basic':
                return {
                    color,
                    opacity: 0.35,
                    transparent: true
                };
            case 'Glossy':
                return {
                    color,
                    opacity: 0.5,
                    transparent: true,
                    roughness: 0.2,
                    metalness: 0.0,
                    clearcoat: 1.0,
                    clearcoatRoughness: 0.1,
                    envMapIntensity: 0.5
                };
            case 'Frosted':
                return {
                    color,
                    opacity: 0.45,
                    transparent: true,
                    roughness: 0.5,
                    metalness: 0.0,
                    transmission: 0.5,
                    thickness: 0.5,
                    envMapIntensity: 0.3
                };
            case 'Matte':
            default:
                return {
                    color,
                    opacity: 0.5,
                    transparent: true,
                    roughness: 0.9,
                    metalness: 0.8,
                    clearcoat: 0.1,
                    clearcoatRoughness: 0.8,
                    transmission: 0,
                    thickness: 0.5,
                    ior: 1.45,
                    reflectivity: 0.05,
                    envMapIntensity: 0.2
                };
        }
    };

    if (!visible) return null;

    return (
        <group>
            {polys.map(poly => {
                const materialProps = getMaterialProps(poly.color);
                return (
                    <mesh key={poly.id} geometry={poly.geometry}>
                        {material === 'Basic' ? (
                            <meshBasicMaterial
                                {...materialProps}
                                depthWrite={false}
                                side={THREE.DoubleSide}
                                clippingPlanes={clippingPlanes}
                            />
                        ) : (
                            <meshPhysicalMaterial
                                {...materialProps}
                                depthWrite={false}
                                side={THREE.DoubleSide}
                                clippingPlanes={clippingPlanes}
                            />
                        )}
                        {showEdges && (
                            <lineSegments>
                                <edgesGeometry args={[poly.geometry]} />
                                <lineBasicMaterial
                                    color={poly.color}
                                    opacity={0.35}
                                    transparent
                                    clippingPlanes={clippingPlanes}
                                />
                            </lineSegments>
                        )}
                    </mesh>
                );
            })}
        </group>
    );
};
