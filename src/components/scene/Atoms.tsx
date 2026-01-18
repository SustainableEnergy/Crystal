import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import type { Atom } from '../../core/types';
import { ELEMENT_COLORS, ELEMENT_RADII } from './Materials';
import * as THREE from 'three';

interface AtomProps {
  atoms: Atom[];
  clippingPlanes?: THREE.Plane[];
  radiusScale?: number;
  // Per-element controls: { Li: { scale: 1, visible: true, color: '#...' }, ... }
  elementSettings?: { [key: string]: { scale: number; visible: boolean; color: string } };
  materialProps?: any;
}

const defaultMaterialProps = {
  roughness: 0.15,
  metalness: 0.5,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  opacity: 1,
  transparent: false
};

export const Atoms = ({
  atoms,
  clippingPlanes,
  radiusScale = 1.0,
  elementSettings = {},
  materialProps = defaultMaterialProps
}: AtomProps) => {

  const groupedAtoms = useMemo(() => {
    const groups: { [element: string]: Atom[] } = {};
    atoms.forEach(atom => {
      if (!groups[atom.element]) groups[atom.element] = [];
      groups[atom.element].push(atom);
    });
    return groups;
  }, [atoms]);

  return (
    <group>
      {Object.entries(groupedAtoms).map(([element, elementAtoms]) => {
        // Element specific overrides
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
              <Instance
                key={atom.id}
                position={atom.position}
              />
            ))}
          </Instances>
        );
      })}
    </group>
  );
};
