interface SnapshotButtonProps {
    onCapture: () => void;
    isMobile?: boolean;
}

export const SnapshotButton = ({ onCapture, isMobile = false }: SnapshotButtonProps) => {
    return (
        <button
            onClick={onCapture}
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
            <span>Snapshot</span>
        </button>
    );
};
