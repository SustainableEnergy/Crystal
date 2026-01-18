import { useState, useRef } from 'react';

interface StructureSelectorProps {
    currentStructure: string;
    onStructureChange: (structure: string, ncmRatio?: string) => void;
    isMobile?: boolean;
}

export const StructureSelector = ({
    currentStructure,
    onStructureChange,
    isMobile = false
}: StructureSelectorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showNCMOptions, setShowNCMOptions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const structures = [
        { id: 'NCM', name: 'NCM (LiNiCoMnO₂)', hasSubOptions: true },
        { id: 'LFP', name: 'LFP (LiFePO₄)', hasSubOptions: false },
        { id: 'CIF', name: 'CIF 파일 불러오기', hasSubOptions: false }
    ];

    const ncmRatios = [
        { id: '811', name: 'NCM811 (Ni:Co:Mn = 8:1:1)' },
        { id: '622', name: 'NCM622 (Ni:Co:Mn = 6:2:2)' },
        { id: '111', name: 'NCM111 (Ni:Co:Mn = 1:1:1)' }
    ];

    const handleStructureSelect = (structureId: string) => {
        if (structureId === 'NCM') {
            setShowNCMOptions(true);
        } else if (structureId === 'CIF') {
            fileInputRef.current?.click();
            setIsOpen(false);
        } else {
            onStructureChange(structureId);
            setIsOpen(false);
            setShowNCMOptions(false);
        }
    };

    const handleNCMRatioSelect = (ratio: string) => {
        onStructureChange('NCM', ratio);
        setIsOpen(false);
        setShowNCMOptions(false);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const text = await file.text();
            onStructureChange('CIF Option', text);
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
                            setIsOpen(false);
                            setShowNCMOptions(false);
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
                                {showNCMOptions ? 'NCM 비율 선택' : '구조 선택'}
                            </div>

                            {showNCMOptions ? (
                                <>
                                    {ncmRatios.map((ratio) => (
                                        <button
                                            key={ratio.id}
                                            onClick={() => handleNCMRatioSelect(ratio.id)}
                                            style={{
                                                width: '100%',
                                                padding: '16px',
                                                marginBottom: '8px',
                                                background: currentStructure.includes(ratio.id)
                                                    ? 'rgba(102, 126, 234, 0.2)'
                                                    : 'rgba(255, 255, 255, 0.05)',
                                                border: currentStructure.includes(ratio.id)
                                                    ? '2px solid #667eea'
                                                    : '1px solid rgba(255, 255, 255, 0.1)',
                                                borderRadius: '12px',
                                                color: '#FFF8F0',
                                                fontSize: '16px',
                                                cursor: 'pointer',
                                                textAlign: 'left'
                                            }}
                                        >
                                            {ratio.name}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setShowNCMOptions(false)}
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
                                        뒤로
                                    </button>
                                </>
                            ) : (
                                <>
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
                                        onClick={() => setIsOpen(false)}
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
                                </>
                            )}
                        </div>
                    </div>
                )}

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".cif"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                />
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

            {isOpen && !showNCMOptions && (
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

            {isOpen && showNCMOptions && (
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
                    <div style={{
                        padding: '8px 12px',
                        fontSize: '12px',
                        color: '#999',
                        marginBottom: '4px'
                    }}>
                        NCM 비율 선택
                    </div>
                    {ncmRatios.map((ratio) => (
                        <button
                            key={ratio.id}
                            onClick={() => handleNCMRatioSelect(ratio.id)}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginBottom: '4px',
                                background: currentStructure.includes(ratio.id)
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
                                if (!currentStructure.includes(ratio.id)) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (!currentStructure.includes(ratio.id)) {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            {ratio.name}
                        </button>
                    ))}
                    <button
                        onClick={() => setShowNCMOptions(false)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            marginTop: '4px',
                            background: 'transparent',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            borderRadius: '6px',
                            color: '#999',
                            fontSize: '13px',
                            cursor: 'pointer'
                        }}
                    >
                        뒤로
                    </button>
                </div>
            )}

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
