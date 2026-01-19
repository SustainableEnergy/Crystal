import { useState } from 'react';

interface SnapshotButtonProps {
    isMobile?: boolean;
}

export const SnapshotButton = ({ isMobile = false }: SnapshotButtonProps) => {
    const [transparentBg, setTransparentBg] = useState(false);
    const [resolution, setResolution] = useState(1);

    const handleClick = () => {
        console.log('[SnapshotButton] Dispatching snapshot-request:', { transparent: transparentBg, resolution: resolution });

        // Dispatch snapshot event with options
        window.dispatchEvent(new CustomEvent('snapshot-request', {
            detail: {
                transparent: transparentBg,
                resolution: resolution
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
                <span>📸 Snapshot</span>
            </button>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
                alignItems: 'center',
                fontSize: isMobile ? '11px' : '12px'
            }}>
                {/* Resolution Selector */}
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#e0e0e0',
                    fontWeight: '500'
                }}>
                    <span>해상도:</span>
                    <select
                        value={resolution}
                        onChange={(e) => setResolution(Number(e.target.value))}
                        style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid #444',
                            background: '#222',
                            color: 'white',
                            fontSize: isMobile ? '11px' : '12px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value={1}>1x (기본)</option>
                        <option value={2}>2x (고화질)</option>
                        <option value={4}>4x (초고화질)</option>
                    </select>
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
