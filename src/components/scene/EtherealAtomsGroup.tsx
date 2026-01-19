import React, { useMemo, useRef, useEffect, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Atom } from '../../core/types';

interface EtherealAtomsGroupProps {
    atoms: Atom[];
    particlesPerAtom?: number;
    color?: string;
    coreColor?: string;
    size?: number;
    radius?: number; // Cloud radius
}

// --- Electron Cloud Shader (Particle Based) ---
const cloudVertexShader = `
  uniform float time;
  uniform float size;
  
  attribute float randomness;
  attribute vec3 aAtomCenter;
  
  varying float vDistance;

  // Simple pseudo-random noise
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  
  // 3D Noise function (simplified)
  float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 57.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 57.0), hash(n + 58.0), f.x), f.y),
               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 170.0), hash(n + 171.0), f.x), f.y), f.z);
  }

  void main() {
    vec3 pos = position;
    vec3 localPos = pos - aAtomCenter;
    
    // Organic movement noise
    float noiseFreq = 0.5;
    float noiseAmp = 0.3;
    
    vec3 noiseInput = vec3(localPos.x * noiseFreq + time, localPos.y * noiseFreq + time, localPos.z * noiseFreq);
    vec3 displacement = vec3(
        cos(time * randomness + localPos.y) * 0.1,
        sin(time * randomness + localPos.x) * 0.1,
        noise(noiseInput) * noiseAmp
    );
    
    vec3 finalPos = pos + displacement;

    vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z);
    vDistance = length(localPos + displacement); 
  }
`;

const cloudFragmentShader = `
  uniform vec3 color;
  uniform vec3 coreColor;
  
  varying float vDistance;

  void main() {
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if (ll > 0.5) discard;

    // Softer, cloud-like puff
    float alpha = (0.5 - ll) * 1.5; // Softer edge
    
    // Color mixing
    vec3 finalColor = mix(coreColor, color, smoothstep(0.0, 0.5, vDistance));
    
    // Bloom boost (Make it glow soft)
    finalColor *= 2.0;
    
    // Fade out
    float fade = 1.0 - smoothstep(0.2, 2.2, vDistance);
    
    gl_FragColor = vec4(finalColor, alpha * fade * 0.8);
  }
`;

export const EtherealAtomsGroup: React.FC<EtherealAtomsGroupProps> = ({
    atoms,
    particlesPerAtom = 200,
    color = '#61dafb',
    coreColor = '#ffffff',
    size = 0.15,
    radius = 0.6
}) => {
    const pointsRef = useRef<THREE.Points>(null);
    const materialRef = useRef<THREE.ShaderMaterial>(null);
    const nucleusRef = useRef<THREE.InstancedMesh>(null);

    // Stable color
    const stableColor = useMemo(() => new THREE.Color(color), [color]);

    const stableCoreColor = useMemo(() => {
        // If coreColor is passed, use it, else tint 'color' towards white
        if (coreColor && coreColor !== '#ffffff') return new THREE.Color(coreColor);
        return new THREE.Color(color).lerp(new THREE.Color('#ffffff'), 0.7);
    }, [color, coreColor]);


    // 1. Generate Cloud Geometry Data (Merged Particles)
    const { positions, randomness, atomCenters } = useMemo(() => {
        const totalParticles = atoms.length * particlesPerAtom;
        const pos = new Float32Array(totalParticles * 3);
        const rnd = new Float32Array(totalParticles);
        const centers = new Float32Array(totalParticles * 3);

        let idx = 0;

        atoms.forEach(atom => {
            const [ax, ay, az] = atom.position;

            for (let i = 0; i < particlesPerAtom; i++) {
                // Tighter distribution for "Solid" look
                const isCore = Math.random() < 0.7;
                const dist = Math.random();
                // Distribution density
                const r = (isCore) ? dist * radius * 0.8 : (0.8 + dist * 0.6) * radius;

                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);

                const lx = r * Math.sin(phi) * Math.cos(theta);
                const ly = r * Math.sin(phi) * Math.sin(theta);
                const lz = r * Math.cos(phi);

                pos[idx * 3] = ax + lx;
                pos[idx * 3 + 1] = ay + ly;
                pos[idx * 3 + 2] = az + lz;

                centers[idx * 3] = ax;
                centers[idx * 3 + 1] = ay;
                centers[idx * 3 + 2] = az;

                rnd[idx] = Math.random();
                idx++;
            }
        });

        return { positions: pos, randomness: rnd, atomCenters: centers };
    }, [atoms, particlesPerAtom, radius]);

    // 2. Setup Nucleus Instances
    const nucleusGeo = useMemo(() => new THREE.SphereGeometry(radius * 0.3, 16, 16), [radius]);

    // Use LayoutEffect to ensure matrix update before paint (Fixes visibility race condition)
    useLayoutEffect(() => {
        const dummy = new THREE.Object3D();
        if (nucleusRef.current) {
            // Explicit count set for safety
            nucleusRef.current.count = atoms.length;

            atoms.forEach((atom, i) => {
                dummy.position.set(atom.position[0], atom.position[1], atom.position[2]);
                dummy.scale.setScalar(1.0);
                dummy.updateMatrix();
                nucleusRef.current!.setMatrixAt(i, dummy.matrix);
            });
            nucleusRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [atoms, radius]);

    const uniforms = useMemo(() => ({
        time: { value: 0 },
        size: { value: size },
        color: { value: stableColor },
        coreColor: { value: stableCoreColor }
    }), [stableColor, stableCoreColor, size]);

    useFrame((state) => {
        if (materialRef.current) {
            materialRef.current.uniforms.time.value = state.clock.elapsedTime;
        }
    });

    if (atoms.length === 0) return null;

    return (
        <group>
            {/* Electron Cloud (Particles) */}
            <points ref={pointsRef} frustumCulled={false}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-randomness"
                        args={[randomness, 1]}
                    />
                    <bufferAttribute
                        attach="attributes-aAtomCenter"
                        args={[atomCenters, 3]}
                    />
                </bufferGeometry>
                <shaderMaterial
                    ref={materialRef}
                    uniforms={uniforms}
                    vertexShader={cloudVertexShader}
                    fragmentShader={cloudFragmentShader}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points>

            {/* Solid Nucleus (Matte) */}
            <instancedMesh
                ref={nucleusRef}
                args={[nucleusGeo, undefined, atoms.length]}
                count={atoms.length}
                frustumCulled={false}
            >
                <meshStandardMaterial
                    color={stableColor}
                    roughness={0.9} // Matte
                    metalness={0.0} // Non-metallic
                    emissive={stableColor}
                    emissiveIntensity={0.2}
                />
            </instancedMesh>
        </group>
    );
};
