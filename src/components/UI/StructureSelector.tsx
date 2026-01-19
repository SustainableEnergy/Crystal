import { useState, useRef } from 'react';
import { SUPPORTED_MATERIALS } from '../../core/constants/materials';

interface StructureSelectorProps {
    currentStructure: string;
    onStructureChange: (structure: string, ncmRatio?: string) => void;
    isMobile?: boolean;
    onClose?: () => void;
}

export const StructureSelector = ({
    currentStructure,
    onStructureChange,
    isMobile = false,
    onClose
}: StructureSelectorProps) => {
    const [isOpen, setIsOpen] = useState(isMobile);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const structures = [
        ...SUPPORTED_MATERIALS.map(mat => ({
            id: mat.id,
            name: mat.displayName
        })),
        { id: 'CIF', name: 'CIF 파일 불러오기' }
    ];

    const handleStructureSelect = (structureId: string) => {
        if (structureId === 'CIF') {
            fileInputRef.current?.click();
            setIsOpen(false);
        } else if (structureId.startsWith('NCM-')) {
            // Extract ratio from ID (e.g., 'NCM-811' -> '811')
            const ratio = structureId.split('-')[1];
            onStructureChange('NCM', ratio);
            setIsOpen(false);
        } else {
            onStructureChange(structureId);
            setIsOpen(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const text = await file.text();
            onStructureChange('CIF Option', text); // Pass 'CIF Option' and content
            setIsOpen(false);
        }
    };


    const getCurrentName = () => {
        if (currentStructure.startsWith('NCM')) {
            const ratio = currentStructure.split('-')[1] || '811';
            return `NCM${ratio}`;
        }
        return structures.find(s => s.id === currentStructure)?.name || currentStructure;
    };

    if (isMobile) {
        return (
            <>
                {isOpen && (
                    <div
                        onClick={() => {
                            if (onClose) onClose();
                            setIsOpen(false);
                        }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            zIndex: 2000,
                            display: 'flex',
                            alignItems: 'flex-end'
                        }}
                    >
                        <div
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                width: '100%',
                                background: 'linear-gradient(180deg, #1a1a1a 0%, #242424 100%)',
                                borderRadius: '16px 16px 0 0',
                                padding: '20px',
                                animation: 'slideUp 0.3s ease-out'
                            }}
                        >
                            <style>{`
                                @keyframes slideUp {
                                    from { transform: translateY(100%); }
                                    to { transform: translateY(0); }
                                }
                            `}</style>

                            <div style={{
                                fontSize: '18px',
                                fontWeight: '700',
                                color: '#FFF8F0',
                                marginBottom: '16px'
                            }}>
                                구조 선택
                            </div>

                            {structures.map((structure) => (
                                <button
                                    key={structure.id}
                                    onClick={() => handleStructureSelect(structure.id)}
                                    style={{
                                        width: '100%',
                                        padding: '16px',
                                        marginBottom: '8px',
                                        background: currentStructure === structure.id
                                            ? 'rgba(102, 126, 234, 0.2)'
                                            : 'rgba(255, 255, 255, 0.05)',
                                        border: currentStructure === structure.id
                                            ? '2px solid #667eea'
                                            : '1px solid rgba(255, 255, 255, 0.1)',
                                        borderRadius: '12px',
                                        color: '#FFF8F0',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        textAlign: 'left'
                                    }}
                                >
                                    {structure.name}
                                </button>
                            ))}

                            <button
                                onClick={() => {
                                    if (onClose) onClose();
                                    setIsOpen(false);
                                }}
                                style={{
                                    width: '100%',
                                    padding: '16px',
                                    marginTop: '8px',
                                    background: 'transparent',
                                    border: '1px solid rgba(255, 255, 255, 0.2)',
                                    borderRadius: '12px',
                                    color: '#999',
                                    fontSize: '16px',
                                    cursor: 'pointer'
                                }}
                            >
                                취소
                            </button>
                        </div>
                    </div>
                )}

            </>
        );
    }

    // Desktop: Dropdown
    return (
        <div style={{ position: 'relative' }}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    padding: '10px 16px',
                    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)',
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    color: '#FFF8F0',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    minWidth: '200px'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.25) 0%, rgba(118, 75, 162, 0.25) 100%)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%)';
                }}
            >
                <span>구조: {getCurrentName()}</span>
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
                    border: '1px solid rgba(102, 126, 234, 0.3)',
                    borderRadius: '8px',
                    padding: '8px',
                    zIndex: 1001,
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
                }}>
                    {structures.map((structure) => (
                        <button
                            key={structure.id}
                            onClick={() => handleStructureSelect(structure.id)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '4px',
                                background: currentStructure === structure.id
                                    ? 'rgba(102, 126, 234, 0.2)'
                                    : 'transparent',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#FFF8F0',
                                fontSize: '14px',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'background 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                if (currentStructure !== structure.id) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (currentStructure !== structure.id) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            {structure.name}
                        </button>
                    ))}
                </div>
            )}

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept=".cif"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
            />
        </div>
    );
};
