import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LiAnimationProps {
    liAtoms: Array<{ id: string; position: [number, number, number] }>;
    isAnimating: boolean;
    liColor: string;
    liRadius: number;
}

// Animation cycle: 4s charge + 3s pause + 4s discharge + 3s pause = 14s total
const CHARGE_DURATION = 4;
const PAUSE_DURATION = 3;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2; // 14 seconds

export const LiAnimation = ({ liAtoms, isAnimating, liColor, liRadius }: LiAnimationProps) => {
    const groupRef = useRef<THREE.Group>(null);
    const particlesRef = useRef<THREE.Points>(null);
    const startTimeRef = useRef<number | null>(null);

    // Create particle geometry for flying effect
    const { particlePositions, particleVelocities, originalPositions } = useMemo(() => {
        const positions: number[] = [];
        const velocities: number[] = [];
        const originals: number[] = [];

        // 10 particles per Li atom for trail effect
        const particlesPerAtom = 10;

        liAtoms.forEach(atom => {
            for (let i = 0; i < particlesPerAtom; i++) {
                // Start at atom position
                positions.push(atom.position[0], atom.position[1], atom.position[2]);
                originals.push(atom.position[0], atom.position[1], atom.position[2]);

                // Random upward velocity with some spread
                velocities.push(
                    (Math.random() - 0.5) * 2,  // X spread
                    Math.random() * 3 + 2,      // Y upward (2-5)
                    (Math.random() - 0.5) * 2   // Z spread
                );
            }
        });

        return {
            particlePositions: new Float32Array(positions),
            particleVelocities: velocities,
            originalPositions: originals
        };
    }, [liAtoms]);

    // Calculate animation state (0 = gone, 1 = present)
    const getAnimationState = (elapsed: number): { t: number; phase: 'charging' | 'charged' | 'discharging' | 'discharged' } => {
        const cycleTime = elapsed % CYCLE_DURATION;

        if (cycleTime < CHARGE_DURATION) {
            // Charging: Li leaving (1 → 0)
            const progress = cycleTime / CHARGE_DURATION;
            return { t: 1 - progress, phase: 'charging' };
        } else if (cycleTime < CHARGE_DURATION + PAUSE_DURATION) {
            // Charged state: Li gone
            return { t: 0, phase: 'charged' };
        } else if (cycleTime < CHARGE_DURATION * 2 + PAUSE_DURATION) {
            // Discharging: Li returning (0 → 1)
            const progress = (cycleTime - CHARGE_DURATION - PAUSE_DURATION) / CHARGE_DURATION;
            return { t: progress, phase: 'discharging' };
        } else {
            // Discharged state: Li present
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
        const { t, phase } = getAnimationState(elapsed);

        // Animate Li atoms (scale and opacity)
        if (groupRef.current) {
            groupRef.current.children.forEach((child, i) => {
                if (child instanceof THREE.Mesh) {
                    // Scale: shrink when leaving
                    child.scale.setScalar(t);

                    // Position: float upward when leaving
                    const originalY = liAtoms[i]?.position[1] || 0;
                    const flyHeight = (1 - t) * 5; // Fly up to 5 units
                    child.position.y = originalY + flyHeight;

                    // Opacity
                    if (child.material instanceof THREE.MeshPhysicalMaterial) {
                        child.material.transparent = true;
                        child.material.opacity = t;
                    }
                }
            });
        }

        // Animate particles (flying away effect during charging)
        if (particlesRef.current && phase === 'charging') {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            const particlesPerAtom = 10;

            for (let i = 0; i < liAtoms.length; i++) {
                for (let j = 0; j < particlesPerAtom; j++) {
                    const idx = (i * particlesPerAtom + j) * 3;
                    const velIdx = idx;

                    // Particles fly upward
                    positions[idx] += particleVelocities[velIdx] * 0.02;
                    positions[idx + 1] += particleVelocities[velIdx + 1] * 0.02;
                    positions[idx + 2] += particleVelocities[velIdx + 2] * 0.02;
                }
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }

        // Reset particles when discharging starts
        if (phase === 'discharging' && particlesRef.current) {
            const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
            for (let i = 0; i < originalPositions.length; i++) {
                positions[i] = originalPositions[i];
            }
            particlesRef.current.geometry.attributes.position.needsUpdate = true;
        }
    });

    if (!isAnimating || liAtoms.length === 0) return null;

    return (
        <group>
            {/* Li atoms as spheres */}
            <group ref={groupRef}>
                {liAtoms.map((atom) => (
                    <mesh key={atom.id} position={atom.position}>
                        <sphereGeometry args={[liRadius, 32, 32]} />
                        <meshPhysicalMaterial
                            color={liColor}
                            transparent
                            opacity={1}
                            roughness={0.15}
                            metalness={0.5}
                            clearcoat={1.0}
                        />
                    </mesh>
                ))}
            </group>

            {/* Particle trail effect */}
            <points ref={particlesRef}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particlePositions, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    color={liColor}
                    size={0.15}
                    transparent
                    opacity={0.6}
                    sizeAttenuation
                    blending={THREE.AdditiveBlending}
                />
            </points>
        </group>
    );
};
