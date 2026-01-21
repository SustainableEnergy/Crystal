import { Html } from '@react-three/drei';

interface LabeledAxesProps {
    size?: number;
}

export const LabeledAxes = ({ size = 5 }: LabeledAxesProps) => {
    const labelStyle = {
        fontSize: '14px',
        fontWeight: 'bold' as const,
        fontFamily: 'monospace',
        userSelect: 'none' as const,
        pointerEvents: 'none' as const
    };

    return (
        <group>
            {/* Axes lines */}
            <axesHelper args={[size]} />

            {/* X axis label - Red */}
            <Html position={[size + 0.3, 0, 0]} center>
                <span style={{ ...labelStyle, color: '#ff4444' }}>X</span>
            </Html>

            {/* Y axis label - Green */}
            <Html position={[0, size + 0.3, 0]} center>
                <span style={{ ...labelStyle, color: '#44ff44' }}>Y</span>
            </Html>

            {/* Z axis label - Blue */}
            <Html position={[0, 0, size + 0.3]} center>
                <span style={{ ...labelStyle, color: '#4444ff' }}>Z</span>
            </Html>
        </group>
    );
};
