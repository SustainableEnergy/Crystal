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
// Each Li atom has a staggered delay (0 to 3.5s) based on distance from center
const CHARGE_DURATION = 7;  // Longer for staggered effect
const PAUSE_DURATION = 2;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2;
const MAX_DELAY = 3.5; // Maximum delay for innermost atoms (outer start at 0)

// Smooth easing function
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
            // NCM layered: Li moves in X or Y direction (toward nearest edge)
            const distToMinX = Math.abs(atomPos[0] - bounds.min[0]);
            const distToMaxX = Math.abs(atomPos[0] - bounds.max[0]);
            const distToMinY = Math.abs(atomPos[1] - bounds.min[1]);
            const distToMaxY = Math.abs(atomPos[1] - bounds.max[1]);

            const nearestX = distToMinX < distToMaxX ? -1 : 1;
            const nearestY = distToMinY < distToMaxY ? -1 : 1;
            const minXDist = Math.min(distToMinX, distToMaxX);
            const minYDist = Math.min(distToMinY, distToMaxY);

            return minXDist <= minYDist
                ? new THREE.Vector3(nearestX, 0, 0)
                : new THREE.Vector3(0, nearestY, 0);

        case 'z':
            // LFP olivine: Li moves along b-axis (Z in Three.js)
            const distToMinZ = Math.abs(atomPos[2] - bounds.min[2]);
            const distToMaxZ = Math.abs(atomPos[2] - bounds.max[2]);
            return new THREE.Vector3(0, 0, distToMinZ <= distToMaxZ ? -1 : 1);

        default:
            const dir = new THREE.Vector3(
                atomPos[0] - centerX,
                atomPos[1] - centerY,
                atomPos[2] - centerZ
            );
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

    // Pre-calculate animation data: moving atoms, directions, delays
    const animationData = useMemo(() => {
        if (liAtoms.length === 0) return { isMoving: [], directions: [], delays: [] };

        const center = [
            (bounds.min[0] + bounds.max[0]) / 2,
            (bounds.min[1] + bounds.max[1]) / 2,
            (bounds.min[2] + bounds.max[2]) / 2
        ];

        // Calculate max distance from center for normalization
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

        // RANDOM selection of which atoms move (not distance-based)
        const indices = liAtoms.map((_, i) => i);
        // Fisher-Yates shuffle
        for (let i = indices.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }
        const movingSet = new Set(indices.slice(0, numToMove));

        // Calculate per-atom data
        const isMoving: boolean[] = [];
        const directions: THREE.Vector3[] = [];
        const delays: number[] = [];

        liAtoms.forEach((atom, i) => {
            isMoving.push(movingSet.has(i));
            directions.push(getOutwardDirection(atom.position, bounds, animConfig.migrationAxis));

            // Delay based on distance: outer atoms (dist=max) have 0 delay,
            // inner atoms have up to MAX_DELAY
            const normalizedDist = maxDist > 0 ? distances[i] / maxDist : 0;
            delays.push((1 - normalizedDist) * MAX_DELAY);
        });

        return { isMoving, directions, delays };
    }, [liAtoms, animConfig, bounds]);

    // Get animation progress for a single atom with delay
    const getAtomProgress = useCallback((elapsed: number, delay: number) => {
        const cycleTime = elapsed % CYCLE_DURATION;

        // Charging phase (with delay)
        if (cycleTime < CHARGE_DURATION) {
            const atomTime = Math.max(0, cycleTime - delay);
            const atomDuration = CHARGE_DURATION - MAX_DELAY;
            const progress = Math.min(1, atomTime / atomDuration);
            return 1 - easeInOutQuad(progress); // 1 = present, 0 = gone
        }
        // Charged pause
        else if (cycleTime < CHARGE_DURATION + PAUSE_DURATION) {
            return 0;
        }
        // Discharging phase (reverse delay: outer comes back last)
        else if (cycleTime < CHARGE_DURATION * 2 + PAUSE_DURATION) {
            const phaseStart = CHARGE_DURATION + PAUSE_DURATION;
            const phaseTime = cycleTime - phaseStart;
            // Reverse delay: inner atoms come back first
            const reverseDelay = MAX_DELAY - delay;
            const atomTime = Math.max(0, phaseTime - reverseDelay);
            const atomDuration = CHARGE_DURATION - MAX_DELAY;
            const progress = Math.min(1, atomTime / atomDuration);
            return easeInOutQuad(progress);
        }
        // Discharged pause
        else {
            return 1;
        }
    }, []);

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
            const child = children[i];
            if (!(child instanceof THREE.Mesh) || !liAtoms[i]) continue;

            if (animationData.isMoving[i]) {
                const t = getAtomProgress(elapsed, animationData.delays[i]);
                const originalPos = liAtoms[i].position;
                const direction = animationData.directions[i];
                const distance = (1 - t) * animConfig.migrationDistance;

                child.position.set(
                    originalPos[0] + direction.x * distance,
                    originalPos[1] + direction.y * distance,
                    originalPos[2] + direction.z * distance
                );

                // Fade out: visible at t=1, fade from t=0.3 to t=0
                const mat = child.material as THREE.MeshPhysicalMaterial;
                mat.transparent = true;
                mat.opacity = t < 0.3 ? t / 0.3 : 1;
            } else {
                // Non-moving atom
                child.position.set(...liAtoms[i].position);
                const mat = child.material as THREE.MeshPhysicalMaterial;
                mat.opacity = 1;
                mat.transparent = false;
            }
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
                        {...materialProps}
                    />
                </mesh>
            ))}
        </group>
    );
};
