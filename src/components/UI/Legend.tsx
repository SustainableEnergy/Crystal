import { useMemo } from 'react';
import { ELEMENT_COLORS } from '../scene/Materials';

interface LegendProps {
    material: string;
}

export const Legend = ({ material }: LegendProps) => {

    // Determine which elements to show based on material
    const elementsToShow = useMemo(() => {
        const mat = material.toUpperCase();
        if (mat.includes('NCM')) return ['Li', 'Ni', 'Co', 'Mn', 'O'];
        if (mat.includes('LFP') || mat.includes('LIFOPO4')) return ['Li', 'Fe', 'P', 'O'];
        if (mat.includes('LCO')) return ['Li', 'Co', 'O'];
        return Object.keys(ELEMENT_COLORS); // Fallback: show all
    }, [material]);

    return (
        <div style={{
            position: 'absolute',
            top: '70px', // Below header
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'transparent',
            backdropFilter: 'none',
            padding: '8px 16px',
            borderRadius: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: 'none',
            zIndex: 10,
            pointerEvents: 'none', // Allow clicking through
            border: '1px solid rgba(0,0,0,0.15)', // Slightly stronger border for visibility
            maxWidth: '90vw'
        }}>
            {elementsToShow.map(el => (
                <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: ELEMENT_COLORS[el],
                        border: '1px solid rgba(0,0,0,0.2)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }} />
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 700,
                        color: '#fff', // White base for difference mode
                        mixBlendMode: 'difference', // Autodetect contrast (White on Black / Black on White)
                        fontFamily: "'Pretendard GOV', sans-serif",
                        letterSpacing: '0.02em'
                    }}>
                        {el}
                    </span>
                </div>
            ))}
        </div>
    );
};
