import { Text } from '@react-three/drei';

interface LabeledAxesProps {
    size?: number;
}

export const LabeledAxes = ({ size = 5 }: LabeledAxesProps) => {
    return (
        <group>
            {/* Axes lines */}
            <axesHelper args={[size]} />

            {/* X axis label - Red */}
            <Text
                position={[size + 0.5, 0, 0]}
                fontSize={0.5}
                color="#ff0000"
                anchorX="left"
                anchorY="middle"
            >
                X
            </Text>

            {/* Y axis label - Green */}
            <Text
                position={[0, size + 0.5, 0]}
                fontSize={0.5}
                color="#00ff00"
                anchorX="center"
                anchorY="bottom"
            >
                Y
            </Text>

            {/* Z axis label - Blue */}
            <Text
                position={[0, 0, size + 0.5]}
                fontSize={0.5}
                color="#0000ff"
                anchorX="center"
                anchorY="middle"
            >
                Z
            </Text>
        </group>
    );
};
