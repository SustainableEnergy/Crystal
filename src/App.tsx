import { Suspense, useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, ContactShadows } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, N8AO } from '@react-three/postprocessing'
import { Leva } from 'leva'
import { StructureScene, ExportButton } from './components/scene/StructureScene'
import { ErrorBoundary } from './components/UI/ErrorBoundary'
import { SpaceGroupPanel } from './components/UI/SpaceGroupPanel'
import { MobileHeader } from './components/UI/MobileHeader'
import { StructureSelector } from './components/UI/StructureSelector'
import { Legend } from './components/UI/Legend'
import { ScreenshotManager } from './components/utils/ScreenshotManager'
import { useIsMobile } from './hooks/useMediaQuery'
import { UI_LAYOUT } from './core/constants/geometry'
import type { VisualSettings, ElementSetting } from './types'
import * as THREE from 'three'

// Dynamic Lights Component
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
  const [showExport, setShowExport] = useState(false);
  const [spaceGroupInfo, setSpaceGroupInfo] = useState({
    material: 'NCM',
    unitCell: { a: 2.816, b: 2.816, c: 14.052, alpha: 90, beta: 90, gamma: 120 }
  });

  // Mobile responsive state
  const isMobile = useIsMobile();
  const [spaceGroupOpen, setSpaceGroupOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [structureSelectorOpen, setStructureSelectorOpen] = useState(false);

  // New states
  const [currentStructure, setCurrentStructure] = useState('NCM-811');
  // const [showBackground, setShowBackground] = useState(true); // Removed unused state
  const [elementColors, setElementColors] = useState<Record<string, string>>({});
  const [liAnimating, setLiAnimating] = useState(false); // Li charge/discharge animation
  const [isOrthographic, setIsOrthographic] = useState(false);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>({
    enableBloom: true,
    enableVignette: false,
    backlightIntensity: 2.0,
    aoIntensity: 1.0,
    aoRadius: 5.0,
    aoDistanceFalloff: 1.0,
    aoColor: '#000000'
  });

  // Handler for visual settings changes
  const handleVisualSettingsChange = useCallback((settings: VisualSettings) => {
    setVisualSettings(settings);
  }, []);

  // Handler for element settings changes from StructureScene
  // Use useCallback to prevent infinite render loops when passed as prop
  const handleElementSettingsChange = useCallback((settings: Record<string, ElementSetting>) => {
    setElementColors(prev => {
      const colors: Record<string, string> = {};
      const newKeys = Object.keys(settings);
      const prevKeys = Object.keys(prev);

      // Populate new colors object
      for (const [element, data] of Object.entries(settings)) {
        colors[element] = data.color;
      }

      // Check for changes (keys added/removed or colors changed)
      let changed = false;

      if (newKeys.length !== prevKeys.length) {
        changed = true;
      } else {
        // Same length, check if keys and values match
        for (const key of newKeys) {
          if (prev[key] !== colors[key]) {
            changed = true;
            break;
          }
        }
      }

      return changed ? colors : prev;
    });
  }, []);

  const handleResetCamera = useCallback(() => {
    const event = new CustomEvent('reset-camera');
    window.dispatchEvent(event);
  }, []);

  const handleStructureChange = useCallback((structure: string, ncmRatioOrCifData?: string) => {
    let finalStructure = structure;

    if (structure === 'NCM' && ncmRatioOrCifData) {
      finalStructure = `NCM-${ncmRatioOrCifData}`;
    }

    setCurrentStructure(finalStructure);
    const event = new CustomEvent('structure-change', {
      detail: { structure: finalStructure, cifData: structure === 'CIF Option' ? ncmRatioOrCifData : undefined }
    });
    window.dispatchEvent(event);
    window.dispatchEvent(event);
    setStructureSelectorOpen(false);
  }, []);

  const handleAlignView = (axis: 'x' | 'y' | 'z' | 'iso') => {
    window.dispatchEvent(new CustomEvent('align-camera', { detail: { axis } }));
  };

  const [isCapturing, setIsCapturing] = useState(false);

  const handleHighResSnapshot = (resolution: '4K' | '8K' = '4K') => {
    // 1. Calculate Scale dynamically
    // 4K ~ 3840px width, 8K ~ 7680px width
    const targetWidth = resolution === '8K' ? 7680 : 3840;
    // Ensure minimum scale of 1 (prevent downscaling on ultra-wide monitors?)
    // Actually if screen is 1920, scale 2 is 4K. 
    // We limit max scale to prevent WebGL crash (max texture size usually 16k).
    let scale = targetWidth / window.innerWidth;

    // Safety clamp: scaling too high can crash browser
    // Limit to 12x initially (ScreenshotManager will further clamp based on actual GPU limit)
    if (scale > 12) scale = 12;
    if (scale < 1) scale = 1;

    console.log(`[App] Snapshot ${resolution}: Scale ${scale.toFixed(2)}x`);

    // 2. Hide artifacts (Shadows, etc)
    setIsCapturing(true);

    // 3. Wait/Trigger
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('high-res-snapshot', {
        detail: { scale, name: `cathode-${currentStructure}-${resolution}` }
      }));
    }, 100);
  };

  const handleCaptureComplete = useCallback(() => {
    setIsCapturing(false);
  }, []);

  // Reset animation when material changes
  useEffect(() => {
    setLiAnimating(false);
  }, [currentStructure]);

  // Space Group Info now handled directly via onSpaceGroupUpdate prop instead of event duplicate

  return (
    <ErrorBoundary name="App Root">
      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          onToggleSpaceGroup={() => setSpaceGroupOpen(!spaceGroupOpen)}
          onToggleControls={() => setControlsOpen(!controlsOpen)}
          onToggleStructureSelector={() => setStructureSelectorOpen(!structureSelectorOpen)}
          spaceGroupOpen={spaceGroupOpen}
          controlsOpen={controlsOpen}
          onToggleLiAnimation={() => setLiAnimating(!liAnimating)}
          liAnimating={liAnimating}
          onToggleOrthographic={() => setIsOrthographic(!isOrthographic)}
          isOrthographic={isOrthographic}
        />
      )}

      {/* Desktop Top Bar */}
      {!isMobile && (
        <div style={{
          position: 'fixed',
          top: `${UI_LAYOUT.DESKTOP_TOP_MARGIN}px`,
          left: `${UI_LAYOUT.DESKTOP_TOP_MARGIN}px`,
          right: `${UI_LAYOUT.LEVA_PANEL_WIDTH + UI_LAYOUT.DESKTOP_TOP_MARGIN}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: UI_LAYOUT.Z_INDEX.HEADER,
          pointerEvents: 'none'
        }}>
          <div style={{ pointerEvents: 'auto' }}>
            <h1 style={{ margin: 0, fontSize: '2rem', fontWeight: 300, color: 'white', letterSpacing: '-0.02em' }}>
              Cathode Visualizer
            </h1>
            <p style={{ margin: 0, fontSize: '0.9rem', opacity: 0.6, color: '#888' }}>
              High-Fidelity Crystal Engine
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', pointerEvents: 'auto' }}>
            <button
              onClick={() => setLiAnimating(!liAnimating)}
              style={{
                padding: '10px 16px',
                background: liAnimating
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'rgba(255, 255, 255, 0.08)',
                border: liAnimating ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: liAnimating ? '0 4px 15px rgba(16, 185, 129, 0.4)' : 'none'
              }}
            >
              {liAnimating ? 'Stop Li' : 'Li Cycle'}
            </button>
            <StructureSelector
              currentStructure={currentStructure}
              onStructureChange={handleStructureChange}
              isMobile={false}
            />
          </div>
        </div>
      )}

      {/* Mobile: Structure Selector Modal */}
      {isMobile && structureSelectorOpen && (
        <StructureSelector
          currentStructure={currentStructure}
          onStructureChange={handleStructureChange}
          isMobile={true}
          onClose={() => setStructureSelectorOpen(false)}
        />
      )}

      {/* Leva Controls - Responsive */}
      <div style={{
        position: 'fixed',
        top: isMobile ? (controlsOpen ? '56px' : '-1000px') : '0',
        right: '0',
        left: isMobile ? '0' : 'auto',
        width: isMobile ? '100%' : 'auto',
        zIndex: isMobile ? UI_LAYOUT.Z_INDEX.LEVA_MOBILE : UI_LAYOUT.Z_INDEX.LEVA_DESKTOP,
        transition: 'top 0.3s ease',
        maxHeight: isMobile ? `calc(100vh - ${UI_LAYOUT.MOBILE_HEADER_HEIGHT}px - ${UI_LAYOUT.MOBILE_FOOTER_HEIGHT}px - 10px)` : '95vh',
        overflowY: 'auto',
        paddingBottom: isMobile ? '10px' : '0'
      }}>
        <Leva
          flat
          titleBar={false}
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
              mono: '"Pretendard GOV", "Consolas", "SF Mono", "Cascadia Code", ui-monospace, monospace',
              sans: '"Pretendard GOV", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", Arial, sans-serif'
            },
            fontSizes: {
              root: '13px',
              toolTip: '12px'
            },
            sizes: {
              rootWidth: isMobile ? '100%' : `${UI_LAYOUT.LEVA_PANEL_WIDTH}px`,
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

          collapsed={false}
          oneLineLabels={false}

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

        @media (max-width: 767px) {
          .leva-c-ksNwjm {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div style={{
        width: '100vw',
        height: isMobile ? `calc(100vh - ${UI_LAYOUT.MOBILE_FOOTER_HEIGHT}px)` : '100vh',
        background: '#050505'
      }}>
        <Canvas
          onCreated={() => {
            // GlCanvas logic removed
            setShowExport(true);
          }}
          dpr={[1, 2]}
          gl={{
            antialias: false,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2,
            localClippingEnabled: true,
            preserveDrawingBuffer: true,
            powerPreference: "high-performance"
          }}
        >
          <color attach="background" args={['#0a0a0a']} />
          <Environment preset="studio" environmentIntensity={0.2} backgroundBlurriness={0.8} />
          <DynamicLights />
          <Suspense fallback={null}>
            <StructureScene
              onSpaceGroupUpdate={setSpaceGroupInfo}
              onElementSettingsChange={handleElementSettingsChange}
              onVisualSettingsChange={handleVisualSettingsChange}
              liAnimating={liAnimating}
              isMobile={isMobile}
              isOrthographic={isOrthographic}
            />
            <ScreenshotManager onCaptureComplete={handleCaptureComplete} />
          </Suspense>
          {!isCapturing && (
            <ContactShadows
              name="contact-shadows"
              position={[0, -2.5, 0]}
              opacity={0.15}
              scale={25}
              blur={3}
              far={4}
            />
          )}
          <EffectComposer multisampling={0} enableNormalPass>
            <>
              {visualSettings.enableBloom ? <Bloom luminanceThreshold={0.9} mipmapBlur intensity={0.5} radius={0.6} /> : null}
              <N8AO
                intensity={visualSettings.aoIntensity}
                aoRadius={visualSettings.aoRadius}
                distanceFalloff={visualSettings.aoDistanceFalloff}
                color={visualSettings.aoColor}
                screenSpaceRadius={false}
                halfRes={false}
                depthAwareUpsampling={true}
              />
              {visualSettings.enableVignette && <Vignette eskil={false} offset={0.1} darkness={0.2} />}
            </>
          </EffectComposer>
        </Canvas>
      </div>

      {/* Space Group Panel */}
      <SpaceGroupPanel
        material={spaceGroupInfo.material}
        unitCell={spaceGroupInfo.unitCell}
        isMobile={isMobile}
        isOpen={isMobile ? spaceGroupOpen : true}
      />

      {/* Desktop Footer */}
      {
        !isMobile && (
          <div style={{ position: 'absolute', bottom: 30, right: 30, pointerEvents: 'none', color: '#666', zIndex: 10, textAlign: 'right' }}>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>Universal 3D Asset Generator</p>
          </div>
        )
      }

      {/* Mobile: Bottom Action Bar (Fixed Footer) */}
      {
        isMobile && (
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70px',
            padding: '12px 16px',
            background: '#0a0a0a',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            zIndex: 999
          }}>
            {/* Snapshot Button Removed */}

            <button
              onClick={handleResetCamera}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                minHeight: '44px'
              }}
            >
              Reset View
            </button>
          </div>
        )
      }

      {/* Desktop: Reset & Export */}
      {
        !isMobile && (
          <div style={{
            position: 'fixed',
            bottom: '30px',
            left: '30px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            zIndex: 1000,
            pointerEvents: 'none'
          }}>
            {/* Axis Views + High Res */}
            <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto', marginBottom: '4px' }}>
              {['x', 'y', 'z', 'iso'].map((axis) => (
                <button
                  key={axis}
                  onClick={() => handleAlignView(axis as any)}
                  style={{
                    width: axis === 'iso' ? '40px' : '32px',
                    height: '32px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.borderColor = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  {axis.toUpperCase()}
                </button>
              ))}
              <button
                key="4k"
                onClick={() => handleHighResSnapshot('4K')}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(255, 215, 0, 0.15)', // Gold
                  border: '1px solid rgba(255, 215, 0, 0.4)',
                  borderRadius: '6px',
                  color: '#ffd700',
                  fontSize: '10px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  marginLeft: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.3)';
                  e.currentTarget.style.borderColor = '#ffd700';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.4)';
                }}
                title="4K Snapshot"
              >
                4K
              </button>
              <button
                key="8k"
                onClick={() => handleHighResSnapshot('8K')}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'rgba(0, 255, 255, 0.15)', // Cyan for 8K
                  border: '1px solid rgba(0, 255, 255, 0.4)',
                  borderRadius: '6px',
                  color: '#00ffff',
                  fontSize: '10px',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  marginLeft: '4px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 255, 0.3)';
                  e.currentTarget.style.borderColor = '#00ffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 255, 255, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.4)';
                }}
                title="8K Ultra-Res Snapshot"
              >
                8K
              </button>
            </div>
            {/* Buttons Row */}
            <div style={{ display: 'flex', gap: '12px', pointerEvents: 'auto' }}>
              <button
                onClick={handleResetCamera}
                style={{
                  padding: '12px 20px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                  transition: 'all 0.3s ease',
                  zIndex: 1000,
                  pointerEvents: 'auto',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246, 0.4)';
                }}
              >
                Reset
              </button>

              <button
                onClick={() => setIsOrthographic(!isOrthographic)}
                style={{
                  padding: '12px 16px',
                  background: isOrthographic
                    ? 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)'
                    : 'rgba(255, 255, 255, 0.08)',
                  border: isOrthographic ? '2px solid #9333ea' : '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  boxShadow: isOrthographic ? '0 4px 15px rgba(147, 51, 234, 0.4)' : 'none',
                  transition: 'all 0.3s ease',
                  zIndex: 1000,
                  pointerEvents: 'auto',
                  cursor: 'pointer',
                  minWidth: '70px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  if (isOrthographic) e.currentTarget.style.boxShadow = '0 6px 20px rgba(147, 51, 234, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  if (isOrthographic) e.currentTarget.style.boxShadow = '0 4px 15px rgba(147, 51, 234, 0.4)';
                }}
              >
                {isOrthographic ? 'Orth' : 'Persp'}
              </button>

              {showExport && (
                <div style={{ pointerEvents: 'auto' }}>
                  <ExportButton onClick={() => {
                    const event = new CustomEvent('export-model');
                    window.dispatchEvent(event);
                  }} />
                </div>
              )}
            </div>
          </div>
        )
      }

      <Legend material={currentStructure} isMobile={isMobile} customColors={elementColors} />
    </ErrorBoundary>
  );
}

export default App;
