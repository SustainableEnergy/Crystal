import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import type { Atom } from '../../core/types';
import { ELEMENT_COLORS, ELEMENT_RADII } from '../../core/constants/materials';
import * as THREE from 'three';
import { EtherealAtomsGroup } from './EtherealAtomsGroup';
import { useControls } from 'leva';

interface AtomProps {
  atoms: Atom[];
  clippingPlanes?: THREE.Plane[];
  radiusScale?: number;
  // Per-element controls: { Li: { scale: 1, visible: true, color: '#...' }, ... }
  elementSettings?: { [key: string]: { scale: number; visible: boolean; color: string } };
  materialProps?: any;
  liAnimating?: boolean; // When true, Li atoms are hidden (handled by LiAnimation)
}

const defaultMaterialProps = {
  roughness: 0.15,
  metalness: 0.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  opacity: 1,
  transparent: false
};

const ETHEREAL_TARGETS = ['Li', 'Na'];

export const Atoms = ({
  atoms,
  clippingPlanes,
  radiusScale = 1.0,
  elementSettings = {},
  materialProps = defaultMaterialProps,
  liAnimating = false
}: AtomProps) => {

  const { enableEthereal } = useControls('⚛️ Ethereal Effects', {
    enableEthereal: { value: false, label: 'Enable Cloud (Li/Na)' }
  });

  const { groups, etherealGroups } = useMemo(() => {
    const standard: { [element: string]: Atom[] } = {};
    const ethereal: { [element: string]: Atom[] } = {};

    atoms.forEach(atom => {
      // Check if this element should be ethereal
      if (ETHEREAL_TARGETS.includes(atom.element)) {
        if (!ethereal[atom.element]) ethereal[atom.element] = [];
        ethereal[atom.element].push(atom);
      } else {
        if (!standard[atom.element]) standard[atom.element] = [];
        standard[atom.element].push(atom);
      }
    });
    return { groups: standard, etherealGroups: ethereal };
  }, [atoms]);

  return (
    <group>
      {/* Standard Atoms (Instanced Mesh) */}
      {Object.entries(groups).map(([element, elementAtoms]) => {
        const settings = elementSettings[element] || { scale: 1.0, visible: true, color: ELEMENT_COLORS[element] };
        if (settings.visible === false) return null;

        const finalRadius = (ELEMENT_RADII[element] || 0.5) * radiusScale * settings.scale;
        const color = settings.color || ELEMENT_COLORS[element] || '#ccc';

        return (
          <Instances
            key={`${element}-${elementAtoms.length}`}
            range={elementAtoms.length}
            limit={20000}
            frustumCulled={false}
          >
            <sphereGeometry args={[finalRadius, 32, 32]} />
            <meshPhysicalMaterial
              color={color}
              clippingPlanes={clippingPlanes}
              clipShadows
              {...defaultMaterialProps}
              {...materialProps}
            />
            {elementAtoms.map((atom) => (
              <Instance key={atom.id} position={atom.position} />
            ))}
          </Instances>
        );
      })}

      {/* Ethereal Atoms (Particle System) or Standard Fallback */}
      {Object.entries(etherealGroups).map(([element, elementAtoms]) => {
        const settings = elementSettings[element] || { scale: 1.0, visible: true, color: ELEMENT_COLORS[element] };
        if (settings.visible === false) return null;

        // Skip Li atoms when animation is active (they are rendered by LiAnimation)
        if (element === 'Li' && liAnimating) return null;

        const color = settings.color || ELEMENT_COLORS[element] || '#ccc';

        // If enabled, render optimized cloud
        if (enableEthereal) {
          const finalRadius = (ELEMENT_RADII[element] || 0.5) * radiusScale * settings.scale;
          // Generate core color (Brighter version of main color)
          const c = new THREE.Color(color);
          const coreC = c.clone().lerp(new THREE.Color('#ffffff'), 0.7).getStyle(); // 70% white, 30% color

          return (
            <EtherealAtomsGroup
              key={`ethereal-${element}`}
              atoms={elementAtoms}
              color={color}
              coreColor={coreC}          // Pass tinted white core
              size={0.15 * finalRadius}
              radius={finalRadius}
              particlesPerAtom={150}      // Reduced for cleaner look (from 600)
            />
          );
        }

        // Fallback to standard sphere if disabled
        const finalRadius = (ELEMENT_RADII[element] || 0.5) * radiusScale * settings.scale;

        return (
          <Instances
            key={`${element}-fallback-${elementAtoms.length}`}
            range={elementAtoms.length}
            limit={20000}
            frustumCulled={false}
          >
            <sphereGeometry args={[finalRadius, 32, 32]} />
            <meshPhysicalMaterial
              color={color}
              clippingPlanes={clippingPlanes}
              clipShadows
              {...defaultMaterialProps}
              {...materialProps}
            />
            {elementAtoms.map((atom) => (
              <Instance key={atom.id} position={atom.position} />
            ))}
          </Instances>
        );
      })}
    </group>
  );
};
