interface MobileHeaderProps {
    onToggleSpaceGroup: () => void;
    onToggleControls: () => void;
    spaceGroupOpen: boolean;
    controlsOpen: boolean;
    onToggleStructureSelector: () => void;
}

export const MobileHeader = ({
    onToggleSpaceGroup,
    onToggleControls,
    spaceGroupOpen,
    controlsOpen,
    onToggleStructureSelector
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
            padding: '0 12px',
            zIndex: 1000,
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
        }}>
            {/* Left: Structure Selector */}
            <button
                onClick={onToggleStructureSelector}
                style={{
                    background: 'rgba(102, 126, 234, 0.2)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFF8F0',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '44px',
                    transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: '16px' }}>🔋</span>
                Structure
            </button>

            {/* Center: Space Group Toggle */}
            <button
                onClick={onToggleSpaceGroup}
                style={{
                    background: spaceGroupOpen ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    color: '#FFF8F0',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    minHeight: '44px',
                    transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: '14px' }}>{spaceGroupOpen ? '▼' : '▶'}</span> Info
            </button>

            {/* Right: Controls Toggle */}
            <button
                onClick={onToggleControls}
                style={{
                    background: controlsOpen ? 'rgba(102, 126, 234, 0.2)' : 'transparent',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: '#FFF8F0',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    minHeight: '44px',
                    transition: 'all 0.2s ease'
                }}
            >
                <span style={{ fontSize: '18px' }}>⚙</span>
                {controlsOpen ? '▼' : '▶'}
            </button>
        </div>
    );
};
