import { useMemo } from 'react';
import { ELEMENT_COLORS } from '../../core/constants/materials';

interface LegendProps {
    material: string;
    isMobile?: boolean;
}

export const Legend = ({ material, isMobile = false }: LegendProps) => {

    // Determine which elements to show based on material
    const elementsToShow = useMemo(() => {
        const mat = material.toUpperCase();

        if (mat.includes('NCM')) return ['Li', 'Ni', 'Co', 'Mn', 'O'];

        // Check for LMFP specifically before LFP
        if (mat.includes('LMFP')) return ['Li', 'Mn', 'Fe', 'P', 'O'];

        if (mat.includes('LFP')) return ['Li', 'Fe', 'P', 'O'];
        if (mat.includes('LCO')) return ['Li', 'Co', 'O'];

        return Object.keys(ELEMENT_COLORS); // Fallback: show all
    }, [material]);

    return (
        <div style={{
            position: 'absolute',
            bottom: isMobile ? '130px' : '30px', // Increased mobile offset to clear taller controls
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            padding: '10px 20px',
            borderRadius: '24px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
            zIndex: 10,
            pointerEvents: 'none', // Allow clicking through
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '90vw'
        }}>
            {elementsToShow.map(el => (
                <div key={el} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        backgroundColor: ELEMENT_COLORS[el],
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} />
                    <span style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#fff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.5)',
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
