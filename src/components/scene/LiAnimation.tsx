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
    crystalCenter?: [number, number, number]; // Center of the crystal structure
}

// Animation cycle: 4s charge + 3s pause + 4s discharge + 3s pause = 14s total
const CHARGE_DURATION = 4;
const PAUSE_DURATION = 3;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2;

// Calculate outward direction from crystal center, constrained to the migration axis
const getOutwardDirection = (
    atomPos: [number, number, number],
    center: [number, number, number],
    axis: LiAnimationConfig['migrationAxis']
): THREE.Vector3 => {
    const dx = atomPos[0] - center[0];
    const dy = atomPos[1] - center[1];
    const dz = atomPos[2] - center[2];

    switch (axis) {
        case 'xy':
            // NCM: Layered structure - Li moves in XZ plane (horizontal in Three.js)
            // Move away from center in XZ plane
            const dirXZ = new THREE.Vector3(dx, 0, dz);
            if (dirXZ.lengthSq() < 0.01) {
                // If too close to center, pick random XZ direction
                const angle = Math.random() * Math.PI * 2;
                return new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
            }
            return dirXZ.normalize();

        case 'z':
            // LFP/Olivine: 1D channels along Y axis (vertical in Three.js)
            // Move up or down based on position relative to center
            return new THREE.Vector3(0, dy >= 0 ? 1 : -1, 0);

        case 'xyz':
        default:
            // Move radially outward
            const dir3D = new THREE.Vector3(dx, dy, dz);
            if (dir3D.lengthSq() < 0.01) {
                return new THREE.Vector3(1, 0, 0);
            }
            return dir3D.normalize();
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
    crystalCenter = [0, 0, 0]
}: LiAnimationProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number | null>(null);

    const animConfig = useMemo(() => getLiAnimationConfig(materialId), [materialId]);

    // Calculate crystal center from all Li atoms if not provided
    const effectiveCenter = useMemo((): [number, number, number] => {
        if (crystalCenter[0] !== 0 || crystalCenter[1] !== 0 || crystalCenter[2] !== 0) {
            return crystalCenter;
        }
        if (liAtoms.length === 0) return [0, 0, 0];

        const sum = liAtoms.reduce(
            (acc, atom) => [
                acc[0] + atom.position[0],
                acc[1] + atom.position[1],
                acc[2] + atom.position[2]
            ],
            [0, 0, 0]
        );
        return [
            sum[0] / liAtoms.length,
            sum[1] / liAtoms.length,
            sum[2] / liAtoms.length
        ];
    }, [liAtoms, crystalCenter]);

    // Select which Li atoms will move and calculate their outward directions
    const { movingAtomIndices, atomDirections } = useMemo(() => {
        const numToMove = Math.floor(liAtoms.length * animConfig.extractionRate);

        // Shuffle indices for random selection
        const indices = liAtoms.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        const movingSet = new Set(indices.slice(0, numToMove));

        // Calculate outward direction for each atom
        const directions: THREE.Vector3[] = liAtoms.map((atom) =>
            getOutwardDirection(atom.position, effectiveCenter, animConfig.migrationAxis)
        );

        return { movingAtomIndices: movingSet, atomDirections: directions };
    }, [liAtoms, animConfig, effectiveCenter]);

    // Reset when animation stops
    useEffect(() => {
        if (!isAnimating && groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                if (child instanceof THREE.Mesh) {
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
                if (child instanceof THREE.Mesh) {
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
                        // Non-moving atoms stay in place with full opacity
                        child.position.set(...liAtoms[i].position);
                        if (child.material instanceof THREE.MeshPhysicalMaterial) {
                            child.material.opacity = 1;
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
