import { useState } from 'react';

interface SnapshotButtonProps {
    isMobile?: boolean;
}

export const SnapshotButton = ({ isMobile = false }: SnapshotButtonProps) => {
    const [transparentBg, setTransparentBg] = useState(false);
    const [exportSVG, setExportSVG] = useState(false);

    const handleClick = () => {
        const resolution = 2;
        console.log('[SnapshotButton] Dispatching snapshot-request:', { transparent: transparentBg, resolution, svg: exportSVG });

        // Dispatch snapshot event
        window.dispatchEvent(new CustomEvent('snapshot-request', {
            detail: {
                transparent: transparentBg,
                resolution: resolution,
                svg: exportSVG
            }
        }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
                onClick={handleClick}
                style={{
                    padding: isMobile ? '10px 14px' : '10px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: isMobile ? '13px' : '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    transition: 'all 0.2s ease',
                    minHeight: '44px'
                }}
                onMouseEnter={(e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.6)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isMobile) {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.4)';
                    }
                }}
            >
                <span>{exportSVG ? 'Export SVG' : 'Snapshot'}</span>
            </button>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center',
                fontSize: isMobile ? '11px' : '12px',
                justifyContent: 'center'
            }}>
                {/* SVG Export */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#e0e0e0',
                    fontWeight: '500',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}>
                    <input
                        type="checkbox"
                        checked={exportSVG}
                        onChange={(e) => setExportSVG(e.target.checked)}
                        style={{
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer'
                        }}
                    />
                    <span>SVG (Vector)</span>
                </label>

                {/* Transparent Background */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#e0e0e0',
                    fontWeight: '500',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}>
                    <input
                        type="checkbox"
                        checked={transparentBg}
                        onChange={(e) => setTransparentBg(e.target.checked)}
                        style={{
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer'
                        }}
                    />
                    <span>투명 배경</span>
                </label>
            </div>
        </div>
    );
};
