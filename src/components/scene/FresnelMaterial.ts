import * as THREE from 'three';
import { extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';

export const FresnelMaterial = shaderMaterial(
    {
        color: new THREE.Color('#38bdf8'),
        intensity: 1.5,
        opacity: 0.8 // Max opacity at rim
    },
    // Vertex Shader
    `
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      vViewPosition = -mvPosition.xyz;
    }
  `,
    // Fragment Shader
    `
    uniform vec3 color;
    uniform float intensity;
    uniform float opacity;
    
    varying vec3 vNormal;
    varying vec3 vViewPosition;
    
    void main() {
      // Fresnel calculation
      vec3 viewDir = normalize(vViewPosition);
      float fresnel = dot(viewDir, vNormal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 3.0); // Sharpen rim
      
      // Calculate alpha: Very transparent at center, more opaque at rim
      float alpha = fresnel * opacity;
      
      // Boost color intensity at rim
      vec3 finalColor = color * (1.0 + fresnel * intensity);
      
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ FresnelMaterial });
