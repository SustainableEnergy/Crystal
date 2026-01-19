import { useMemo } from 'react';
import { MATERIALS } from '../../core/constants/materials';

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
    isMobile?: boolean;
    isOpen?: boolean;
}



export const SpaceGroupPanel = ({ material, unitCell, isMobile = false, isOpen = true }: SpaceGroupPanelProps) => {
    const info = useMemo(() => {
        // Get  material data from constants
        const materialData = MATERIALS[material];
        if (materialData) {
            return {
                spaceGroup: materialData.spaceGroup,
                number: materialData.spaceGroupNumber,
                system: materialData.crystalSystem,
                description: materialData.description
            };
        }
        // Fallback to default
        return {
            spaceGroup: 'R-3m',
            number: 166,
            system: 'Trigonal (Rhombohedral)',
            description: 'Layered structure'
        };
    }, [material]);

    // Don't render if mobile and closed
    if (isMobile && !isOpen) return null;

    return (
        <div style={{
            position: isMobile ? 'fixed' : 'absolute',
            top: isMobile ? '56px' : '120px',
            left: isMobile ? 0 : '30px',
            right: isMobile ? 0 : 'auto',
            width: isMobile ? '100%' : 'auto',
            maxWidth: isMobile ? '100%' : '320px',
            background: 'linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(38, 38, 38, 0.95) 100%)',
            backdropFilter: 'blur(12px)',
            borderRadius: isMobile ? '0 0 16px 16px' : '16px',
            padding: '20px',
            color: 'white',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(102, 126, 234, 0.2)',
            zIndex: isMobile ? 999 : 10,
            pointerEvents: 'auto',
            animation: isMobile && isOpen ? 'slideDown 0.3s ease-out' : 'none',
            transition: 'all 0.3s ease'
        }}>
            <style>{`
                @keyframes slideDown {
                    from {
                        opacity: 0;
                        transform: translateY(-20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

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
                fontSize: isMobile ? '28px' : '32px',
                color: '#FFF8F0',
                fontWeight: '700',
                marginBottom: '12px',
                fontFamily: 'serif',
                lineHeight: '1.2'
            }}>
                {info.spaceGroup}
                <span style={{
                    fontSize: isMobile ? '18px' : '20px',
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
