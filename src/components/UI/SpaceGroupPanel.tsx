const SPACE_GROUP_DATA: {
    [key: string]: {
        spaceGroup: string,
        number: number,
        system: string,
        description: string
    }
} = {
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

interface SpaceGroupPanelProps {
    material: string;
    unitCell: {
        a: number;
        b: number;
        c: number;
        alpha: number;
        beta: number;
        gamma: number;
    };
}

export const SpaceGroupPanel = ({ material, unitCell }: SpaceGroupPanelProps) => {
    const info = SPACE_GROUP_DATA[material] || SPACE_GROUP_DATA['LEGO'];

    return (
        <div style={{
            position: 'absolute',
            top: '120px',
            left: '30px',
            background: 'rgba(20, 20, 20, 0.92)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid rgba(102, 126, 234, 0.3)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
            minWidth: '280px',
            maxWidth: '320px',
            zIndex: 100,
            pointerEvents: 'none'
        }}>
            <div style={{
                fontSize: '13px',
                color: '#667eea',
                fontWeight: '600',
                marginBottom: '10px',
                letterSpacing: '0.8px',
                textTransform: 'uppercase'
            }}>
                Space Group
            </div>
            <div style={{
                fontSize: '32px',
                color: '#FFF8F0',
                fontWeight: '700',
                marginBottom: '12px',
                fontFamily: 'serif',
                lineHeight: '1.2'
            }}>
                {info.spaceGroup}
                <span style={{
                    fontSize: '20px',
                    color: '#999',
                    fontWeight: '400',
                    marginLeft: '12px'
                }}>
                    #{info.number}
                </span>
            </div>
            <div style={{
                fontSize: '14px',
                color: '#bbb',
                marginBottom: '8px',
                fontWeight: '500'
            }}>
                {info.system}
            </div>
            <div style={{
                fontSize: '12px',
                color: '#999',
                fontStyle: 'italic',
                borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                paddingTop: '12px',
                marginTop: '12px',
                lineHeight: '1.6'
            }}>
                {info.description}
            </div>
            <div style={{
                fontSize: '11px',
                color: '#777',
                marginTop: '12px',
                fontFamily: 'monospace',
                lineHeight: '1.8'
            }}>
                a={unitCell.a.toFixed(2)}Å b={unitCell.b.toFixed(2)}Å c={unitCell.c.toFixed(2)}Å
                <br />
                α={unitCell.alpha}° β={unitCell.beta}° γ={unitCell.gamma}°
            </div>
        </div>
    );
};
