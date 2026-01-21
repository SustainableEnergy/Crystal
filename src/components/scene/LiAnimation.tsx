import { useRef, useMemo, useCallback } from 'react';
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
}

// Animation timing:
// Total cycle: 7s charge + 2s pause + 7s discharge + 2s pause = 18s
const CHARGE_DURATION = 7;
const PAUSE_DURATION = 2;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2;
const MAX_DELAY = 3.5;

// Seeded random for stable selection
const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

// Smooth easing
const easeInOutQuad = (t: number): number => {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

// Calculate outward direction
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
            const distToMinX = Math.abs(atomPos[0] - bounds.min[0]);
            const distToMaxX = Math.abs(atomPos[0] - bounds.max[0]);
            const distToMinY = Math.abs(atomPos[1] - bounds.min[1]);
            const distToMaxY = Math.abs(atomPos[1] - bounds.max[1]);
            const nearestX = distToMinX < distToMaxX ? -1 : 1;
            const nearestY = distToMinY < distToMaxY ? -1 : 1;
            return Math.min(distToMinX, distToMaxX) <= Math.min(distToMinY, distToMaxY)
                ? new THREE.Vector3(nearestX, 0, 0)
                : new THREE.Vector3(0, nearestY, 0);
        case 'z':
            const distToMinZ = Math.abs(atomPos[2] - bounds.min[2]);
            const distToMaxZ = Math.abs(atomPos[2] - bounds.max[2]);
            return new THREE.Vector3(0, 0, distToMinZ <= distToMaxZ ? -1 : 1);
        default:
            const dir = new THREE.Vector3(atomPos[0] - centerX, atomPos[1] - centerY, atomPos[2] - centerZ);
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
    materialProps = defaultMaterialProps
}: LiAnimationProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const startTimeRef = useRef<number | null>(null);

    const animConfig = useMemo(() => getLiAnimationConfig(materialId), [materialId]);

    // Shared geometry for performance
    const sphereGeometry = useMemo(() => new THREE.SphereGeometry(liRadius, 24, 24), [liRadius]);

    // Calculate bounds
    const bounds = useMemo(() => {
        if (liAtoms.length === 0) {
            return { min: [0, 0, 0] as [number, number, number], max: [0, 0, 0] as [number, number, number] };
        }
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
    }, [liAtoms]);

    // Pre-calculate animation data with SEEDED random for stability
    const animationData = useMemo(() => {
        if (liAtoms.length === 0) return { isMoving: [], directions: [], delays: [] };

        const center = [
            (bounds.min[0] + bounds.max[0]) / 2,
            (bounds.min[1] + bounds.max[1]) / 2,
            (bounds.min[2] + bounds.max[2]) / 2
        ];

        let maxDist = 0;
        const distances = liAtoms.map(atom => {
            const d = Math.sqrt(
                Math.pow(atom.position[0] - center[0], 2) +
                Math.pow(atom.position[1] - center[1], 2) +
                Math.pow(atom.position[2] - center[2], 2)
            );
            maxDist = Math.max(maxDist, d);
            return d;
        });

        const numToMove = Math.floor(liAtoms.length * animConfig.extractionRate);

        // SEEDED random shuffle (stable based on atom count as seed)
        const seed = liAtoms.length * 1000 + materialId.charCodeAt(0);
        const indices = liAtoms.map((_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(seededRandom(seed + i) * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const movingSet = new Set(indices.slice(0, numToMove));

        const isMoving: boolean[] = [];
        const directions: THREE.Vector3[] = [];
        const delays: number[] = [];

        liAtoms.forEach((atom, i) => {
            isMoving.push(movingSet.has(i));
            directions.push(getOutwardDirection(atom.position, bounds, animConfig.migrationAxis));
            const normalizedDist = maxDist > 0 ? distances[i] / maxDist : 0;
            delays.push((1 - normalizedDist) * MAX_DELAY);
        });

        return { isMoving, directions, delays };
    }, [liAtoms, animConfig, bounds, materialId]);

    const getAtomProgress = useCallback((elapsed: number, delay: number) => {
        const cycleTime = elapsed % CYCLE_DURATION;
        if (cycleTime < CHARGE_DURATION) {
            const atomTime = Math.max(0, cycleTime - delay);
            const atomDuration = CHARGE_DURATION - MAX_DELAY;
            return 1 - easeInOutQuad(Math.min(1, atomTime / atomDuration));
        } else if (cycleTime < CHARGE_DURATION + PAUSE_DURATION) {
            return 0;
        } else if (cycleTime < CHARGE_DURATION * 2 + PAUSE_DURATION) {
            const phaseStart = CHARGE_DURATION + PAUSE_DURATION;
            const reverseDelay = MAX_DELAY - delay;
            const atomTime = Math.max(0, cycleTime - phaseStart - reverseDelay);
            const atomDuration = CHARGE_DURATION - MAX_DELAY;
            return easeInOutQuad(Math.min(1, atomTime / atomDuration));
        } else {
            return 1;
        }
    }, []);

    // Optimized animation loop
    useFrame((state) => {
        if (!isAnimating || !groupRef.current) {
            startTimeRef.current = null;
            return;
        }

        if (startTimeRef.current === null) {
            startTimeRef.current = state.clock.elapsedTime;
        }

        const elapsed = state.clock.elapsedTime - startTimeRef.current;
        const children = groupRef.current.children;

        for (let i = 0; i < children.length; i++) {
            const mesh = children[i] as THREE.Mesh;
            if (!mesh.isMesh || !liAtoms[i]) continue;

            const originalPos = liAtoms[i].position;

            if (animationData.isMoving[i]) {
                const t = getAtomProgress(elapsed, animationData.delays[i]);
                const dir = animationData.directions[i];
                const distance = (1 - t) * animConfig.migrationDistance;

                mesh.position.set(
                    originalPos[0] + dir.x * distance,
                    originalPos[1] + dir.y * distance,
                    originalPos[2] + dir.z * distance
                );

                const mat = mesh.material as THREE.MeshPhysicalMaterial;
                mat.transparent = true;
                mat.opacity = t < 0.3 ? t / 0.3 : 1;
            } else {
                mesh.position.set(originalPos[0], originalPos[1], originalPos[2]);
                const mat = mesh.material as THREE.MeshPhysicalMaterial;
                mat.opacity = 1;
                mat.transparent = false;
            }
        }
    });

    if (!isAnimating || liAtoms.length === 0) return null;

    return (
        <group ref={groupRef}>
            {liAtoms.map((atom) => (
                <mesh key={atom.id} position={atom.position} geometry={sphereGeometry}>
                    <meshPhysicalMaterial
                        color={liColor}
                        transparent
                        {...materialProps}
                    />
                </mesh>
            ))}
        </group>
    );
};
