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
    materialProps?: any; // User's material settings
}

// Animation cycle: 4s charge + 3s pause + 4s discharge + 3s pause = 14s total
const CHARGE_DURATION = 4;
const PAUSE_DURATION = 3;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2; // 14 seconds

// Generate random direction based on migration axis
// Note: In Three.js, Y is up. Crystal's "xy plane" maps to XZ in Three.js
// Crystal's "z axis" maps to Y in Three.js
const getRandomDirection = (axis: LiAnimationConfig['migrationAxis']): THREE.Vector3 => {
    switch (axis) {
        case 'xy':
            // XY plane in crystal = XZ plane in Three.js (horizontal)
            const angleXY = Math.random() * Math.PI * 2;
            return new THREE.Vector3(Math.cos(angleXY), 0, Math.sin(angleXY)).normalize();
        case 'z':
            // Z axis in crystal = Y axis in Three.js (vertical)
            return new THREE.Vector3(0, Math.random() > 0.5 ? 1 : -1, 0);
        case 'xyz':
        default:
            return new THREE.Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5
            ).normalize();
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
    materialProps = defaultMaterialProps
}: LiAnimationProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number | null>(null);

    // Get animation config for this material
    const animConfig = useMemo(() => getLiAnimationConfig(materialId), [materialId]);

    // Determine which Li atoms will move (based on extraction rate)
    const { movingAtomIndices, atomDirections } = useMemo(() => {
        const numToMove = Math.floor(liAtoms.length * animConfig.extractionRate);

        // Create shuffled indices
        const indices = liAtoms.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        // Select first numToMove indices as moving atoms
        const movingSet = new Set(indices.slice(0, numToMove));

        // Generate directions for each moving atom
        const directions: THREE.Vector3[] = liAtoms.map(() =>
            getRandomDirection(animConfig.migrationAxis)
        );

        return {
            movingAtomIndices: movingSet,
            atomDirections: directions
        };
    }, [liAtoms, animConfig, materialId]);

    // Reset on animation stop
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

    // Calculate animation state (0 = gone, 1 = present)
    const getAnimationState = (elapsed: number): { t: number; phase: 'charging' | 'charged' | 'discharging' | 'discharged' } => {
        const cycleTime = elapsed % CYCLE_DURATION;

        if (cycleTime < CHARGE_DURATION) {
            const progress = cycleTime / CHARGE_DURATION;
            return { t: 1 - progress, phase: 'charging' };
        } else if (cycleTime < CHARGE_DURATION + PAUSE_DURATION) {
            return { t: 0, phase: 'charged' };
        } else if (cycleTime < CHARGE_DURATION * 2 + PAUSE_DURATION) {
            const progress = (cycleTime - CHARGE_DURATION - PAUSE_DURATION) / CHARGE_DURATION;
            return { t: progress, phase: 'discharging' };
        } else {
            return { t: 1, phase: 'discharged' };
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

                        // Fade out: stays visible until 50% progress, then fades
                        if (child.material instanceof THREE.MeshPhysicalMaterial) {
                            child.material.transparent = true;
                            const fadeProgress = t < 0.5 ? t * 2 : 1;
                            child.material.opacity = fadeProgress;
                        }
                    } else {
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
