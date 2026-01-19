import React from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import EtherealAtom from './EtherealAtom';

const EtherealAtomDemoPage: React.FC = () => {
    return (
        <div style={{ width: '100vw', height: '100vh', background: '#050510' }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
                {/* Lights */}
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />

                {/* Background Environment */}
                <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

                {/* The Ethereal Atom */}
                <EtherealAtom
                    count={4000}
                    color="#61dafb"
                    coreColor="#ffffff"
                    size={0.12}
                />

                {/* Post Processing */}
                <EffectComposer enableNormalPass={false}>
                    {/* 
               luminanceThreshold: 0.2 -> brighter than 0.2 will bloom 
               luminanceSmoothing: 0.9 -> smooth transition
               intensity: 1.5 -> strong bloom
            */}
                    <Bloom
                        luminanceThreshold={0.2}
                        luminanceSmoothing={0.9}
                        height={300}
                        intensity={1.5}
                    />
                </EffectComposer>

                {/* Controls */}
                <OrbitControls enableZoom={true} autoRotate autoRotateSpeed={0.5} />
            </Canvas>

            {/* Overlay UI */}
            <div style={{
                position: 'absolute',
                bottom: 30,
                left: 30,
                color: 'white',
                fontFamily: 'sans-serif',
                pointerEvents: 'none'
            }}>
                <h1 style={{ margin: 0, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
                    Quantum Probability Cloud
                </h1>
                <p style={{ margin: '5px 0 0 0', opacity: 0.7, fontSize: '0.9rem' }}>
                    React Three Fiber • Custom Shaders • Post-Processing
                </p>
            </div>
        </div>
    );
};

export default EtherealAtomDemoPage;
