import { useState } from 'react';

export interface CameraPreset {
    name: string;
    position: [number, number, number];
    target: [number, number, number];
    icon: string;
}

export const CAMERA_PRESETS: CameraPreset[] = [
    { name: 'Isometric', position: [20, 15, 50], target: [0, 0, 0], icon: '🎯' },
    { name: 'Top', position: [0, 60, 0], target: [0, 0, 0], icon: '⬆️' },
    { name: 'Front', position: [0, 0, 70], target: [0, 0, 0], icon: '👁️' },
    { name: 'Side', position: [70, 0, 0], target: [0, 0, 0], icon: '↔️' },
];

interface CameraPresetsProps {
    currentPreset: string;
    onPresetChange: (preset: CameraPreset) => void;
    isMobile?: boolean;
}

export const CameraPresets = ({
    currentPreset,
    onPresetChange,
    isMobile = false
}: CameraPresetsProps) => {
    const [isOpen, setIsOpen] = useState(false);

    if (isMobile) {
        // Mobile: Compact icon buttons
        return (
            <div style={{
                display: 'flex',
                gap: '4px',
                background: 'rgba(26, 26, 26, 0.95)',
                padding: '4px',
                borderRadius: '8px',
                border: '1px solid rgba(102, 126, 234, 0.2)'
            }}>
                {CAMERA_PRESETS.map((preset) => (
                    <button
                        key={preset.name}
                        onClick={() => onPresetChange(preset)}
                        style={{
                            padding: '8px',
                            background: currentPreset === preset.name
                                ? 'rgba(102, 126, 234, 0.3)'
                                : 'transparent',
                            border: currentPreset === preset.name
                                ? '1px solid #667eea'
                                : '1px solid transparent',
                            borderRadius: '6px',
                            fontSize: '20px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            minWidth: '44px',
                            minHeight: '44px'
                        }}
                        title={preset.name}
                    >
                        {preset.icon}
                    </button>
                ))}
            </div>
        );
    }

    // Desktop: Dropdown
    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    color: '#FFF8F0',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    minWidth: '140px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(124, 58, 237, 0.25) 100%)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.15) 100%)';
                }}
            >
                <span>📐 {currentPreset}</span>
                <span style={{ marginLeft: 'auto' }}>{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: '4px',
                    background: 'linear-gradient(180deg, #1a1a1a 0%, #242424 100%)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 1001,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}>
                    {CAMERA_PRESETS.map((preset) => (
                        <button
                            key={preset.name}
                            onClick={() => {
                                onPresetChange(preset);
                                setIsOpen(false);
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '4px',
                                background: currentPreset === preset.name
                                    ? 'rgba(139, 92, 246, 0.2)'
                                    : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#FFF8F0',
                                fontSize: '14px',
                                textAlign: 'left',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (currentPreset !== preset.name) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentPreset !== preset.name) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>{preset.icon}</span>
                            <span>{preset.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
