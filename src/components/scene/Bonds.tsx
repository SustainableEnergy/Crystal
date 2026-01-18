import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Atom } from '../../core/types';
import { computeBonds } from '../../core/utils/Connectivity';

export const Bonds = ({ atoms, visible }: { atoms: Atom[], visible: boolean }) => {
    const bonds = useMemo(() => {
        if (!visible) return [];
        return computeBonds(atoms, 2.5); // 2.5 Angstrom cutoff
    }, [atoms, visible]);

    if (!visible) return null;

    return (
        <group>
            {/* We use Drei's Line for high quality fat lines */}
            {/* Since creating thousands of Line components is heavy, we should use LineSegments if possible 
            But Drei Line is easy for style. Let's try to optimize: 
            Drei Line accepts points prop as Array<Vector3>. 
            But we want independent segments. 
            Actually, Drei Line renders a single polyline.
            We need <Segments> from @react-three/drei (if available) or <Line segments>
        */}
            <Line
                points={bonds.flat()} // [p1, p2, p3, p4...]
                segments // This tells Line that points are pairs ([p1,p2], [p3,p4])
                color="#a0a0a0"
                lineWidth={1}
                transparent
                opacity={0.3}
            />
        </group>
    );
};
