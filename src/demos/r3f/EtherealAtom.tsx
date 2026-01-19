import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float } from '@react-three/drei';
import * as THREE from 'three';

// --- Types ---
interface EtherealAtomProps {
    count?: number;
    color?: string;
    coreColor?: string;
    size?: number;
}

// --- Shader Definitions ---

const vertexShader = `
  uniform float time;
  uniform float size;
  attribute float randomness;
  varying float vDistance;
  varying float vAlpha;

  // Simple pseudo-random noise function
  float hash(float n) { return fract(sin(n) * 43758.5453123); }
  
  // 3D Noise function (simplified for performance)
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
    
    // Organic movement using noise
    // We displace based on position and time
    float noiseFreq = 0.5;
    float noiseAmp = 0.3;
    vec3 noisePos = vec3(pos.x * noiseFreq + time, pos.y * noiseFreq + time, pos.z * noiseFreq);
    
    pos.x += cos(time * randomness + pos.y) * 0.1;
    pos.y += sin(time * randomness + pos.x) * 0.1;
    pos.z += noise(noisePos) * noiseAmp;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    // Size attenuation
    gl_PointSize = size * (300.0 / -mvPosition.z);
    
    // Pass distance from center to fragment shader for fading
    vDistance = length(position); // distance from original center
    
    // Calculate alpha based on density (closer to center = more opaque)
    // We adjust this in Fragment shader, but can pass hints here
  }
`;

const fragmentShader = `
  uniform vec3 color;
  uniform vec3 coreColor;
  
  varying float vDistance;

  void main() {
    // Circular particle shape
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float ll = length(xy);
    if (ll > 0.5) discard;

    // Soft edge
    float alpha = (0.5 - ll) * 2.0;
    
    // Gradient color based on distance from center (Core vs Outer Shell)
    // vDistance 0 -> Core, vDistance High -> Shell
    vec3 finalColor = mix(coreColor, color, smoothstep(0.0, 2.0, vDistance));
    
    // Fade out further particles more
    float fade = 1.0 - smoothstep(0.0, 4.0, vDistance);
    
    gl_FragColor = vec4(finalColor, alpha * fade);
  }
`;

const EtherealAtom: React.FC<EtherealAtomProps> = ({
    count = 3000,
    color = '#61dafb',
    coreColor = '#ffffff',
    size = 0.15
}) => {
    const pointsRef = useRef<THREE.Points>(null);

    const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);

    // Generate particles
    const particles = useMemo(() => {
        const positions = new Float32Array(count * 3);
        const randomness = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            // Probability distribution: Dense center, sparse outer
            // Using inverse gaussian-ish approximation for radius
            const r = (Math.random() < 0.4) ? Math.random() * 1.0 : Math.random() * 3.5;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);

            randomness[i] = Math.random();
        }

        return { positions, randomness };
    }, [count]);

    const uniforms = useMemo(() => ({
        time: { value: 0 },
        size: { value: size },
        color: { value: new THREE.Color(color) },
        coreColor: { value: new THREE.Color(coreColor) }
    }), [color, coreColor, size]);

    useFrame((state) => {
        if (shaderMaterialRef.current) {
            shaderMaterialRef.current.uniforms.time.value = state.clock.elapsedTime;
        }
        if (pointsRef.current) {
            // Slow overall rotation
            pointsRef.current.rotation.y = state.clock.elapsedTime * 0.05;
            pointsRef.current.rotation.z = state.clock.elapsedTime * 0.02;
        }
    });

    return (
        <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            < points ref={pointsRef} >
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[particles.positions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-randomness"
                        args={[particles.randomness, 1]}
                    />
                </bufferGeometry>
                <shaderMaterial
                    ref={shaderMaterialRef}
                    uniforms={uniforms}
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    transparent
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </points >

            {/* Optional Core Glow Mesh for extra punch */}
            < mesh >
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshBasicMaterial color={coreColor} transparent opacity={0.8} />
            </mesh >
        </Float >
    );
};

export default EtherealAtom;
