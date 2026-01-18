import { Suspense, useRef, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SSAO } from '@react-three/postprocessing'
import { Leva } from 'leva'
import { StructureScene, ExportButton } from './components/scene/StructureScene'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { SpaceGroupPanel } from './components/UI/SpaceGroupPanel'
import { MobileHeader } from './components/UI/MobileHeader'
import { useIsMobile } from './hooks/useMediaQuery'
import * as THREE from 'three'

// Dynamic Lights Component that responds to lighting values
function DynamicLights() {
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const fillLightRef = useRef<THREE.DirectionalLight>(null);
  const rimLightRef = useRef<THREE.DirectionalLight>(null);
  const ambientLightRef = useRef<THREE.AmbientLight>(null);
  const { scene } = useThree();

  useFrame(() => {
    const structureGroup = scene.children.find((child: any) => child.userData?.keyIntensity !== undefined);

    if (structureGroup && structureGroup.userData) {
      if (keyLightRef.current) keyLightRef.current.intensity = structureGroup.userData.keyIntensity || 1.5;
      if (fillLightRef.current) fillLightRef.current.intensity = structureGroup.userData.fillIntensity || 0.5;
      if (rimLightRef.current) rimLightRef.current.intensity = structureGroup.userData.rimIntensity || 0.8;
      if (ambientLightRef.current) ambientLightRef.current.intensity = structureGroup.userData.ambientIntensity || 0.5;
    }
  });

  return (
    <>
      <ambientLight ref={ambientLightRef} intensity={0.5} color="#f0f0ff" />
      <hemisphereLight args={['#87ceeb', '#1a1a1a', 0.4]} position={[0, 50, 0]} />
      <directionalLight
        ref={keyLightRef}
        position={[5, 8, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0001}
      />
      <directionalLight ref={fillLightRef} position={[-5, 3, -3]} intensity={0.5} color="#B0C4DE" />
      <directionalLight ref={rimLightRef} position={[0, -3, -5]} intensity={0.8} color="#FFE4E1" />
      <pointLight position={[10, 10, 10]} intensity={0.2} decay={2} />
      <pointLight position={[-10, 5, -5]} intensity={0.15} decay={2} />
    </>
  );
}

function App() {
  const sceneRef = useRef<any>(null);
  const [showExport, setShowExport] = useState(false);
  const [spaceGroupInfo, setSpaceGroupInfo] = useState({
    material: 'NCM',
    unitCell: { a: 2.816, b: 2.816, c: 14.052, alpha: 90, beta: 90, gamma: 120 }
  });

  // Mobile responsive state
  const isMobile = useIsMobile();
  const [spaceGroupOpen, setSpaceGroupOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  const handleResetCamera = () => {
    const event = new CustomEvent('reset-camera');
    window.dispatchEvent(event);
  };

  useEffect(() => {
    const handleSpaceGroupUpdate = (e: any) => {
      setSpaceGroupInfo(e.detail);
    };
    window.addEventListener('space-group-update', handleSpaceGroupUpdate);
    return () => window.removeEventListener('space-group-update', handleSpaceGroupUpdate);
  }, []);

  return (
    <ErrorBoundary name="App Root">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          onToggleSpaceGroup={() => setSpaceGroupOpen(!spaceGroupOpen)}
          onToggleControls={() => setControlsOpen(!controlsOpen)}
          spaceGroupOpen={spaceGroupOpen}
          controlsOpen={controlsOpen}
        />
      )}

      {/* Leva Controls - Responsive positioning */}
      <div style={{
        position: 'fixed',
        top: isMobile ? (controlsOpen ? '56px' : '-1000px') : '0',
        right: isMobile ? '0' : '0',
        left: isMobile ? '0' : 'auto',
        width: isMobile ? '100%' : 'auto',
        zIndex: isMobile ? 998 : 'auto',
        transition: 'top 0.3s ease',
        maxHeight: isMobile ? 'calc(100vh - 56px)' : 'auto',
        overflowY: isMobile ? 'auto' : 'visible'
      }}>
        <Leva
          theme={{
            colors: {
              highlight1: '#667eea',
              highlight2: '#764ba2',
              elevation1: '#1a1a1a',
              elevation2: '#242424',
              elevation3: '#2e2e2e',
              accent1: '#667eea',
              accent2: '#764ba2',
              accent3: '#8b5cf6',
              folderWidgetColor: '$accent2',
              folderTextColor: '$highlight1',
              highlight3: '#FFF8F0',
              vivid1: '#ffaa00',
            },
            fonts: {
              mono: '"SF Mono", "Cascadia Code", "Fira Code", ui-monospace, monospace',
              sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            },
            fontSizes: {
              root: '12px',
              toolTip: '11px'
            },
            sizes: {
              rootWidth: isMobile ? '100%' : '400px',
              controlWidth: '160px',
              scrubberWidth: '14px',
              scrubberHeight: '14px',
              rowHeight: '28px',
              folderTitleHeight: '36px',
              checkboxSize: '20px',
              monitorHeight: '64px',
              titleBarHeight: '44px'
            },
            radii: {
              xs: '4px',
              sm: '6px',
              lg: '10px'
            }
          }}
          titleBar={{
            title: '⚙️ Controls',
            drag: !isMobile,
            filter: true
          }}
          collapsed={false}
          oneLineLabels={false}
          flat={false}
          hideCopyButton={false}
          hidden={isMobile && !controlsOpen}
        />
      </div>

      <style>{`
        .leva__label,
        .leva__value,
        .leva__folder .leva__folder-title,
        .leva-c-kWgxhW label,
        .leva-c-ijeNkD label,  
        .leva-c-kWgxhW > div:first-child,
        .leva-c-ijeNkD > div:first-child {
          color: #FFF8F0 !important;
        }
        
        .leva-c-kWgxhW input:not([type="color"]),
        .leva-c-ijeNkD input:not([type="color"]),
        .leva__control input:not([type="color"]) {
          color: #FFF8F0 !important;
        }

        .leva__color-input,
        input[type="color"] {
          /* Let Leva handle color pickers naturally */
        }

        @media (max-width: 767px) {
          .leva-c-ksNwjm {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div style={{ width: '100vw', height: '100vh', background: '#050505' }}>
        <Canvas
          camera={{ position: [0, 0, 60], fov: 60 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: false,
            toneMappingExposure: 1.0,
            localClippingEnabled: true
          }}
          onCreated={({ gl }) => {
            sceneRef.current = gl;
            setShowExport(true);
          }}
        >
          <color attach="background" args={['#0a0a0a']} />

          <Environment
            preset="studio"
            environmentIntensity={0.4}
            backgroundBlurriness={0.8}
          />

          <DynamicLights />

          <Suspense fallback={null}>
            <StructureScene onSpaceGroupUpdate={setSpaceGroupInfo} />
          </Suspense>

          <ContactShadows
            position={[0, -2.5, 0]}
            opacity={0.15}
            scale={25}
            blur={3}
            far={4}
          />

          <EffectComposer>
            <Bloom
              luminanceThreshold={0.9}
              mipmapBlur
              intensity={0.4}
              radius={0.6}
              levels={8}
            />
            <Vignette eskil={false} offset={0.05} darkness={0.7} />
            <SSAO
              radius={0.3}
              intensity={20}
              luminanceInfluence={0.6}
            />
          </EffectComposer>
        </Canvas>
      </div>

      {/* Space Group Panel - Responsive */}
      <SpaceGroupPanel
        material={spaceGroupInfo.material}
        unitCell={spaceGroupInfo.unitCell}
        isMobile={isMobile}
        isOpen={isMobile ? spaceGroupOpen : true}
      />

      {/* Desktop Title */}
      {!isMobile && (
        <>
          <div style={{ position: 'absolute', top: 30, left: 30, pointerEvents: 'none', color: '#888', zIndex: 10 }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 300, color: 'white', letterSpacing: '-0.02em' }}>Cathode Visualizer</h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6 }}>High-Fidelity Crystal Engine</p>
          </div>

          <div style={{ position: 'absolute', bottom: 30, right: 30, pointerEvents: 'none', color: '#666', zIndex: 10, textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Universal 3D Asset Generator</p>
          </div>
        </>
      )}

      {/* Reset View Button - Responsive */}
      <button
        onClick={handleResetCamera}
        style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '30px',
          left: isMobile ? '16px' : '220px',
          padding: isMobile ? '10px 16px' : '12px 20px',
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: '600',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
          transition: 'all 0.3s ease',
          zIndex: 1000,
          pointerEvents: 'auto',
          minHeight: '44px'
        }}
        onMouseEnter={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isMobile) {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
          }
        }}
      >
        Reset View
      </button>

      {/* Export Button - Responsive */}
      {showExport && (
        <div style={{
          position: 'fixed',
          bottom: isMobile ? '16px' : '30px',
          right: isMobile ? '16px' : '30px',
          zIndex: 1000
        }}>
          <ExportButton onClick={() => {
            const event = new CustomEvent('export-model');
            window.dispatchEvent(event);
          }} />
        </div>
      )}
    </ErrorBoundary>
  )
}

export default App
