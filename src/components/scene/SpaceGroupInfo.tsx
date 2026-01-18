import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface SpaceGroupInfoProps {
    material: string;
    unitCell: {
        a: number;
        b: number;
        c: number;
        alpha: number;
        beta: number;
        gamma: number;
    };
    showAxes?: boolean;
}

const SPACE_GROUP_DATA: {
    [key: string]: {
        spaceGroup: string,
        number: number,
        system: string,
        description: string
    }
} = {
    'LCO': {
        spaceGroup: 'R-3m',
        number: 166,
        system: 'Trigonal/Rhombohedral',
        description: 'Layered structure with Li in 3a, Co in 3b, O in 6c'
    },
    'NCM': {
        spaceGroup: 'R-3m',
        number: 166,
        system: 'Trigonal/Rhombohedral',
        description: 'Mixed transition metal layered oxide'
    },
    'LFP': {
        spaceGroup: 'Pnma',
        number: 62,
        system: 'Orthorhombic',
        description: 'Olivine structure with 1D Li channels'
    },
    'LEGO': {
        spaceGroup: 'P1',
        number: 1,
        system: 'Triclinic',
        description: 'Custom structure - no symmetry'
    },
    'CIF Option': {
        spaceGroup: 'Unknown',
        number: 0,
        system: 'From CIF data',
        description: 'Imported from CIF file'
    }
};

export const SpaceGroupInfo = ({ material, unitCell, showAxes = false }: SpaceGroupInfoProps) => {
    const info = SPACE_GROUP_DATA[material] || SPACE_GROUP_DATA['LEGO'];

    return (
        <group>
            {/* Space Group Info Label */}
            <Html
                position={[0, 8, 0]}
                center
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                    transition: 'opacity 0.3s'
                }}
            >
                <div style={{
                    background: 'rgba(20, 20, 20, 0.92)',
                    padding: '12px 16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                    minWidth: '280px'
                }}>
                    <div style={{
                        fontSize: '11px',
                        color: '#667eea',
                        fontWeight: '600',
                        marginBottom: '6px',
                        letterSpacing: '0.5px',
                        textTransform: 'uppercase'
                    }}>
                        Space Group
                    </div>
                    <div style={{
                        fontSize: '20px',
                        color: '#ffffff',
                        fontWeight: '700',
                        marginBottom: '8px',
                        fontFamily: 'serif'
                    }}>
                        {info.spaceGroup}
                        <span style={{
                            fontSize: '14px',
                            color: '#888',
                            fontWeight: '400',
                            marginLeft: '8px'
                        }}>
                            #{info.number}
                        </span>
                    </div>
                    <div style={{
                        fontSize: '11px',
                        color: '#aaa',
                        marginBottom: '4px'
                    }}>
                        {info.system}
                    </div>
                    <div style={{
                        fontSize: '10px',
                        color: '#999',
                        fontStyle: 'italic',
                        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                        paddingTop: '8px',
                        marginTop: '8px'
                    }}>
                        {info.description}
                    </div>
                    <div style={{
                        fontSize: '9px',
                        color: '#666',
                        marginTop: '8px',
                        fontFamily: 'monospace'
                    }}>
                        a={unitCell.a.toFixed(2)}Å b={unitCell.b.toFixed(2)}Å c={unitCell.c.toFixed(2)}Å
                        <br />
                        α={unitCell.alpha}° β={unitCell.beta}° γ={unitCell.gamma}°
                    </div>
                </div>
            </Html>

            {/* Unit Cell Box Outline */}
            {showAxes && (
                <lineSegments>
                    <edgesGeometry args={[new THREE.BoxGeometry(
                        unitCell.a,
                        unitCell.b * Math.sin(unitCell.gamma * Math.PI / 180),
                        unitCell.c
                    )]} />
                    <lineBasicMaterial color="#667eea" opacity={0.3} transparent linewidth={2} />
                </lineSegments>
            )}
        </group>
    );
};
