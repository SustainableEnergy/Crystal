import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getLiAnimationConfig } from '../../core/constants/materials';

interface LiAnimationProps {
    liAtoms: Array<{ id: string; position: [number, number, number] }>;
    isAnimating: boolean;
    liColor: string;
    liRadius: number;
    materialId: string;
    materialProps?: any;
    clippingPlanes?: THREE.Plane[];
    enableEthereal?: boolean;
}

const CHARGE_DURATION = 4;
const PAUSE_DURATION = 3;
const CYCLE_DURATION = (CHARGE_DURATION + PAUSE_DURATION) * 2;
const MAX_DELAY = 1.5;

const seededRandom = (seed: number): number => {
    const x = Math.sin(seed * 9999) * 10000;
    return x - Math.floor(x);
};

const defaultMaterialProps = {
    roughness: 0.15,
    metalness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.1,
    opacity: 1,
};

export const LiAnimation = ({
    liAtoms,
    isAnimating,
    liColor,
    liRadius,
    materialId,
    materialProps = defaultMaterialProps,
    clippingPlanes,
    enableEthereal = false
}: LiAnimationProps) => {
    // Two meshes: One for solid rendering (perfect match), one for fading (artifact free)
    const solidMeshRef = useRef<THREE.InstancedMesh>(null);
    const fadeMeshRef = useRef<THREE.InstancedMesh>(null);
    const startTimeRef = useRef<number | null>(null);

    const config = useMemo(() => getLiAnimationConfig(materialId), [materialId]);
    const sphereGeometry = useMemo(() => new THREE.SphereGeometry(liRadius, 24, 24), [liRadius]);

    const directions = useMemo(() => {
        if (liAtoms.length === 0) return [];
        const center = new THREE.Vector3();
        liAtoms.forEach(a => center.add(new THREE.Vector3(...a.position)));
        center.divideScalar(liAtoms.length);

        return liAtoms.map(atom => {
            const vec = new THREE.Vector3(...atom.position).sub(center);
            if (vec.lengthSq() < 0.0001) return new THREE.Vector3(0, 0, 1);

            if (config.migrationAxis === 'z') {
                return new THREE.Vector3(0, 0, Math.sign(vec.z) || 1);
            } else if (config.migrationAxis === 'xy') {
                vec.z = 0;
                vec.normalize();
                return vec;
            }
            return vec.normalize();
        });
    }, [liAtoms, config.migrationAxis]);

    // Simple Opacity Shader for the FADE mesh only
    const onBeforeCompile = useMemo(() => (shader: any) => {
        shader.vertexShader = `
            attribute float instanceOpacity;
            varying float vInstanceOpacity;
            ${shader.vertexShader}
        `.replace(
            '#include <begin_vertex>',
            `
            #include <begin_vertex>
            vInstanceOpacity = instanceOpacity;
            `
        );
        shader.fragmentShader = `
            varying float vInstanceOpacity;
            ${shader.fragmentShader}
        `.replace(
            '#include <dithering_fragment>',
            `
            #include <dithering_fragment>
            gl_FragColor.a *= vInstanceOpacity;
            `
        );
    }, []);

    useEffect(() => {
        startTimeRef.current = null;
    }, [materialId, isAnimating]);

    useFrame((state) => {
        if (!solidMeshRef.current || !fadeMeshRef.current || liAtoms.length === 0 || !isAnimating) return;

        const time = state.clock.getElapsedTime();
        if (startTimeRef.current === null) startTimeRef.current = time;

        const relTime = (time - startTimeRef.current) % CYCLE_DURATION;

        const solidMesh = solidMeshRef.current;
        const fadeMesh = fadeMeshRef.current;
        const dummy = new THREE.Object3D();

        // Only fadeMesh needs opacity attribute update
        const opacityAttr = fadeMesh.geometry.getAttribute('instanceOpacity') as THREE.InstancedBufferAttribute;

        liAtoms.forEach((atom, i) => {
            const seed = i * 123.45 + (materialId.charCodeAt(0) || 0);
            const randomThreshold = seededRandom(seed);
            const isExtractable = seededRandom(seed + 999) < config.extractionRate;

            let isSolid = true; // Default to solid state
            let currentOpacity = 1;
            let offset = new THREE.Vector3(0, 0, 0);

            if (isExtractable) {
                const atomDelay = randomThreshold * MAX_DELAY;
                const dir = directions[i];

                if (relTime < CHARGE_DURATION) {
                    const effectiveTime = Math.max(0, relTime - atomDelay);
                    const flightDuration = CHARGE_DURATION - MAX_DELAY;
                    const progress = Math.min(1, effectiveTime / flightDuration);

                    if (progress > 0.85) {
                        // Switch to Fade Mode
                        isSolid = false;
                        currentOpacity = 1 - ((progress - 0.85) / 0.15);
                    }
                    if (progress >= 0.99) {
                        currentOpacity = 0;
                        isSolid = false;
                    }

                    const dist = progress * config.migrationDistance;
                    offset.copy(dir).multiplyScalar(dist);
                } else if (relTime < CHARGE_DURATION + PAUSE_DURATION) {
                    isSolid = false;
                    currentOpacity = 0;
                } else if (relTime < (CHARGE_DURATION * 2) + PAUSE_DURATION) {
                    const dischargeTime = relTime - (CHARGE_DURATION + PAUSE_DURATION);
                    const effectiveTime = Math.max(0, dischargeTime - atomDelay);
                    const flightDuration = CHARGE_DURATION - MAX_DELAY;
                    const progress = Math.min(1, effectiveTime / flightDuration);

                    if (progress < 0.15) {
                        // Switch to Fade Mode
                        isSolid = false;
                        currentOpacity = progress / 0.15;
                    }

                    const invProgress = 1 - progress;
                    const dist = invProgress * config.migrationDistance;
                    offset.copy(dir).multiplyScalar(dist);
                } else {
                    isSolid = true;
                    currentOpacity = 1;
                }
            }

            // Shared Position Logic
            dummy.position.set(atom.position[0] + offset.x, atom.position[1] + offset.y, atom.position[2] + offset.z);
            dummy.updateMatrix();

            // Apply to Meshes based on State
            if (isSolid) {
                // Show Solid, Hide Fade
                dummy.scale.setScalar(1);
                dummy.updateMatrix();
                solidMesh.setMatrixAt(i, dummy.matrix);

                dummy.scale.setScalar(0); // Hide fade
                dummy.updateMatrix();
                fadeMesh.setMatrixAt(i, dummy.matrix);
            } else {
                // Hide Solid, Show Fade
                dummy.scale.setScalar(0); // Hide solid
                dummy.updateMatrix();
                solidMesh.setMatrixAt(i, dummy.matrix);

                dummy.scale.setScalar(1);
                dummy.updateMatrix();
                fadeMesh.setMatrixAt(i, dummy.matrix);

                if (opacityAttr) opacityAttr.setX(i, currentOpacity);
            }
        });

        solidMesh.instanceMatrix.needsUpdate = true;
        fadeMesh.instanceMatrix.needsUpdate = true;
        if (opacityAttr) opacityAttr.needsUpdate = true;
    });

    if (liAtoms.length === 0 || !isAnimating) return null;

    const finalColor = enableEthereal ? new THREE.Color(liColor).lerp(new THREE.Color('#ffffff'), 0.5) : liColor;
    const finalEmissive = enableEthereal ? new THREE.Color(liColor).multiplyScalar(3) : liColor;

    // Note: Ethereal glow behaves best with transparency, but we respect the Solid/Fade split
    // For Fade mesh, we use default depthWrite=false to solve artifacts.

    return (
        <group>
            {/* SOLID MESH: Perfectly opaque, writes depth, matches Atomes.tsx */}
            <instancedMesh
                ref={solidMeshRef}
                args={[sphereGeometry, undefined, liAtoms.length]}
                frustumCulled={false}
                renderOrder={0}
                castShadow={true} // Shadows allowed on solid
                receiveShadow={true}
            >
                <meshPhysicalMaterial
                    {...defaultMaterialProps}
                    {...materialProps}
                    color={finalColor}
                    emissive={finalEmissive}
                    emissiveIntensity={materialProps?.emissiveIntensity || 1}
                    transparent={false} // OPAQUE
                    depthWrite={true}
                    clippingPlanes={clippingPlanes}
                    clipShadows
                />
            </instancedMesh>

            {/* FADE MESH: Transparent, no depth write (NO ARTIFACTS), smooth fade */}
            <instancedMesh
                ref={fadeMeshRef}
                args={[sphereGeometry, undefined, liAtoms.length]}
                frustumCulled={false}
                renderOrder={-1} // Draw before transparent polyhedra
                castShadow={false}
                receiveShadow={false}
            >
                <instancedBufferAttribute
                    attach="geometry-attributes-instanceOpacity"
                    args={[new Float32Array(liAtoms.length).fill(1), 1]}
                />
                <meshPhysicalMaterial
                    {...defaultMaterialProps}
                    {...materialProps}
                    color={finalColor}
                    emissive={finalEmissive}
                    emissiveIntensity={materialProps?.emissiveIntensity || 1}
                    transparent={true} // TRANSPARENT
                    depthWrite={false} // NO DEPTH WRITE -> NO BLACK ARTIFACT
                    onBeforeCompile={onBeforeCompile}
                    clippingPlanes={clippingPlanes}
                    clipShadows={false}
                />
            </instancedMesh>
        </group>
    );
};
