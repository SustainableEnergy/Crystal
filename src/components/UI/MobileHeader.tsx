interface MobileHeaderProps {
    onToggleSpaceGroup: () => void;
    onToggleControls: () => void;
    spaceGroupOpen: boolean;
    controlsOpen: boolean;
    onToggleStructureSelector: () => void;
    onToggleLiAnimation?: () => void;
    liAnimating?: boolean;
}

export const MobileHeader = ({
    onToggleSpaceGroup,
    onToggleControls,
    spaceGroupOpen,
    controlsOpen,
    onToggleStructureSelector,
    onToggleLiAnimation,
    liAnimating = false
}: MobileHeaderProps) => {
    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '56px',
            background: 'linear-gradient(180deg, rgba(10, 10, 10, 0.98) 0%, rgba(10, 10, 10, 0.95) 100%)',
            backdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(102, 126, 234, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 8px',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
            gap: '6px'
        }}>
            {/* Left: Structure Selector */}
            <button
                onClick={onToggleStructureSelector}
                style={{
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)',
                    border: '2px solid rgba(102, 126, 234, 0.4)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFF8F0',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '40px',
                    boxShadow: '0 2px 8px rgba(102, 126, 234, 0.2)',
                    transition: 'all 0.2s ease'
                }}
            >
                📊
            </button>

            {/* Li Animation Toggle */}
            {onToggleLiAnimation && (
                <button
                    onClick={onToggleLiAnimation}
                    style={{
                        background: liAnimating
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(5, 150, 105, 0.4) 100%)'
                            : 'rgba(255, 255, 255, 0.05)',
                        border: liAnimating ? '2px solid rgba(16, 185, 129, 0.6)' : '2px solid rgba(102, 126, 234, 0.3)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        color: '#FFF8F0',
                        fontSize: '12px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        minHeight: '40px',
                        boxShadow: liAnimating ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none',
                        transition: 'all 0.2s ease'
                    }}
                >
                    🔋
                </button>
            )}

            {/* Center: Space Group Toggle */}
            <button
                onClick={onToggleSpaceGroup}
                style={{
                    background: spaceGroupOpen
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.35) 0%, rgba(118, 75, 162, 0.35) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: spaceGroupOpen ? '2px solid rgba(102, 126, 234, 0.5)' : '2px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFF8F0',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    minHeight: '40px',
                    boxShadow: spaceGroupOpen ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                }}
            >
                Info
            </button>

            {/* Right: Controls Toggle */}
            <button
                onClick={onToggleControls}
                style={{
                    background: controlsOpen
                        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.35) 0%, rgba(118, 75, 162, 0.35) 100%)'
                        : 'rgba(255, 255, 255, 0.05)',
                    border: controlsOpen ? '2px solid rgba(102, 126, 234, 0.5)' : '2px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFF8F0',
                    fontSize: '12px',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    minHeight: '40px',
                    boxShadow: controlsOpen ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none',
                    transition: 'all 0.2s ease'
                }}
            >
                ⚙️
            </button>
        </div>
    );
};
