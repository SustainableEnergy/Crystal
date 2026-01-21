import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLiAnimationConfig, type LiAnimationConfig } from '../../core/constants/materials';

interface LiAnimationProps {
    liAtoms: Array<{ id: string; position: [number, number, number] }>;
    isAnimating: boolean;
    liColor: string;
    liRadius: number;
    materialId: string;
    materialProps?: any;
    crystalBounds?: { min: [number, number, number]; max: [number, number, number] };
}

// Animation cycle: 4s charge + 3s pause + 4s discharge + 3s pause = 14s total
const CHARGE_DURATION = 4;
const PAUSE_DURATION = 3;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2;

// Calculate outward direction toward nearest edge based on migration axis
const getOutwardDirection = (
    atomPos: [number, number, number],
    bounds: { min: [number, number, number]; max: [number, number, number] },
    axis: LiAnimationConfig['migrationAxis']
): THREE.Vector3 => {
    const centerX = (bounds.min[0] + bounds.max[0]) / 2;
    const centerY = (bounds.min[1] + bounds.max[1]) / 2;
    const centerZ = (bounds.min[2] + bounds.max[2]) / 2;

    switch (axis) {
        case 'xy':
            // NCM: Pick X or Y direction based on which edge is closer
            const distToMinX = Math.abs(atomPos[0] - bounds.min[0]);
            const distToMaxX = Math.abs(atomPos[0] - bounds.max[0]);
            const distToMinY = Math.abs(atomPos[1] - bounds.min[1]);
            const distToMaxY = Math.abs(atomPos[1] - bounds.max[1]);

            const minXDist = Math.min(distToMinX, distToMaxX);
            const minYDist = Math.min(distToMinY, distToMaxY);

            if (minXDist <= minYDist) {
                // Move in X direction toward nearest X edge
                return new THREE.Vector3(atomPos[0] < centerX ? -1 : 1, 0, 0);
            } else {
                // Move in Y direction toward nearest Y edge
                return new THREE.Vector3(0, atomPos[1] < centerY ? -1 : 1, 0);
            }

        case 'z':
            // LFP: Move in Z direction toward nearest Z edge
            const distToMinZ = Math.abs(atomPos[2] - bounds.min[2]);
            const distToMaxZ = Math.abs(atomPos[2] - bounds.max[2]);

            if (distToMinZ <= distToMaxZ) {
                return new THREE.Vector3(0, 0, -1);
            } else {
                return new THREE.Vector3(0, 0, 1);
            }

        case 'xyz':
        default:
            // Radial outward
            const dx = atomPos[0] - centerX;
            const dy = atomPos[1] - centerY;
            const dz = atomPos[2] - centerZ;
            const dir = new THREE.Vector3(dx, dy, dz);
            return dir.lengthSq() > 0.01 ? dir.normalize() : new THREE.Vector3(1, 0, 0);
    }
};

const defaultMaterialProps = {
    roughness: 0.15,
    metalness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
};

export const LiAnimation = ({
    liAtoms,
    isAnimating,
    liColor,
    liRadius,
    materialId,
    materialProps = defaultMaterialProps,
    crystalBounds
}: LiAnimationProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number | null>(null);

    const animConfig = useMemo(() => getLiAnimationConfig(materialId), [materialId]);

    // Calculate bounds from all Li atoms if not provided
    const effectiveBounds = useMemo(() => {
        if (crystalBounds) return crystalBounds;
        if (liAtoms.length === 0) return { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] };

        const min: [number, number, number] = [Infinity, Infinity, Infinity];
        const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

        liAtoms.forEach(atom => {
            min[0] = Math.min(min[0], atom.position[0]);
            min[1] = Math.min(min[1], atom.position[1]);
            min[2] = Math.min(min[2], atom.position[2]);
            max[0] = Math.max(max[0], atom.position[0]);
            max[1] = Math.max(max[1], atom.position[1]);
            max[2] = Math.max(max[2], atom.position[2]);
        });

        return { min, max };
    }, [liAtoms, crystalBounds]);

    // Select which Li atoms will move and their directions
    const { movingAtomIndices, atomDirections } = useMemo(() => {
        const numToMove = Math.floor(liAtoms.length * animConfig.extractionRate);

        // Shuffle for random selection
        const indices = liAtoms.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const movingSet = new Set(indices.slice(0, numToMove));

        // Calculate outward direction for each atom
        const directions: THREE.Vector3[] = liAtoms.map((atom) =>
            getOutwardDirection(atom.position, effectiveBounds, animConfig.migrationAxis)
        );

        return { movingAtomIndices: movingSet, atomDirections: directions };
    }, [liAtoms, animConfig, effectiveBounds]);

    // Reset when animation stops
    useEffect(() => {
        if (!isAnimating && groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                if (child instanceof THREE.Mesh && liAtoms[i]) {
                    child.position.set(...liAtoms[i].position);
                    if (child.material instanceof THREE.MeshPhysicalMaterial) {
                        child.material.opacity = 1;
                    }
                }
            });
        }
    }, [isAnimating, liAtoms]);

    const getAnimationState = (elapsed: number) => {
        const cycleTime = elapsed % CYCLE_DURATION;

        if (cycleTime < CHARGE_DURATION) {
            return { t: 1 - cycleTime / CHARGE_DURATION, phase: 'charging' as const };
        } else if (cycleTime < CHARGE_DURATION + PAUSE_DURATION) {
            return { t: 0, phase: 'charged' as const };
        } else if (cycleTime < CHARGE_DURATION * 2 + PAUSE_DURATION) {
            return { t: (cycleTime - CHARGE_DURATION - PAUSE_DURATION) / CHARGE_DURATION, phase: 'discharging' as const };
        } else {
            return { t: 1, phase: 'discharged' as const };
        }
    };

    useFrame((state) => {
        if (!isAnimating) {
            startTimeRef.current = null;
            return;
        }

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const { t } = getAnimationState(elapsed);

        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                if (child instanceof THREE.Mesh && liAtoms[i]) {
                    const isMoving = movingAtomIndices.has(i);

                    if (isMoving) {
                        const originalPos = liAtoms[i].position;
                        const direction = atomDirections[i];
                        const distance = (1 - t) * animConfig.migrationDistance;

                        child.position.set(
                            originalPos[0] + direction.x * distance,
                            originalPos[1] + direction.y * distance,
                            originalPos[2] + direction.z * distance
                        );

                        // Fade out after moving halfway
                        if (child.material instanceof THREE.MeshPhysicalMaterial) {
                            child.material.transparent = true;
                            child.material.opacity = t < 0.5 ? t * 2 : 1;
                        }
                    } else {
                        // Non-moving atoms: keep at original position, full opacity
                        child.position.set(...liAtoms[i].position);
                        if (child.material instanceof THREE.MeshPhysicalMaterial) {
                            child.material.opacity = 1;
                            child.material.transparent = false;
                        }
                    }
                }
            });
        }
    });

    if (!isAnimating || liAtoms.length === 0) return null;

    return (
        <group ref={groupRef}>
            {liAtoms.map((atom) => (
                <mesh key={atom.id} position={atom.position}>
                    <sphereGeometry args={[liRadius, 32, 32]} />
                    <meshPhysicalMaterial
                        color={liColor}
                        transparent
                        opacity={1}
                        {...materialProps}
                    />
                </mesh>
            ))}
        </group>
    );
};
