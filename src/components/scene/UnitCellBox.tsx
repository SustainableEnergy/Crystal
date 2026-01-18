import * as THREE from 'three';

interface UnitCellBoxProps {
    unitCell: {
        a: number;
        b: number;
        c: number;
        alpha: number;
        beta: number;
        gamma: number;
    };
    visible: boolean;
}

export const UnitCellBox = ({ unitCell, visible }: UnitCellBoxProps) => {
    if (!visible) return null;

    const { a, b, c, alpha, beta, gamma } = unitCell;

    // Convert angles to radians
    const alphaRad = (alpha * Math.PI) / 180;
    const betaRad = (beta * Math.PI) / 180;
    const gammaRad = (gamma * Math.PI) / 180;

    // Calculate the unit cell vectors
    // Vector a along x-axis
    const va = new THREE.Vector3(a, 0, 0);

    // Vector b in xy-plane
    const bx = b * Math.cos(gammaRad);
    const by = b * Math.sin(gammaRad);
    const vb = new THREE.Vector3(bx, by, 0);

    // Vector c
    const cx = c * Math.cos(betaRad);
    const cy = c * (Math.cos(alphaRad) - Math.cos(betaRad) * Math.cos(gammaRad)) / Math.sin(gammaRad);
    const cz = Math.sqrt(c * c - cx * cx - cy * cy);
    const vc = new THREE.Vector3(cx, cy, cz);

    // Create 8 vertices of the unit cell
    const vertices = [
        new THREE.Vector3(0, 0, 0),                           // 0
        va.clone(),                                            // 1
        vb.clone(),                                            // 2
        va.clone().add(vb),                                    // 3
        vc.clone(),                                            // 4
        va.clone().add(vc),                                    // 5
        vb.clone().add(vc),                                    // 6
        va.clone().add(vb).add(vc),                           // 7
    ];

    // Define the 12 edges of the unit cell
    const edges = [
        [0, 1], [1, 3], [3, 2], [2, 0], // Bottom face
        [4, 5], [5, 7], [7, 6], [6, 4], // Top face
        [0, 4], [1, 5], [2, 6], [3, 7], // Vertical edges
    ];

    return (
        <group>
            {edges.map(([i, j], idx) => {
                const start = vertices[i];
                const end = vertices[j];
                const direction = end.clone().sub(start);
                const length = direction.length();
                const midpoint = start.clone().add(direction.clone().multiplyScalar(0.5));

                return (
                    <group key={idx}>
                        <mesh position={midpoint}>
                            <cylinderGeometry args={[0.05, 0.05, length, 8]} />
                            <meshBasicMaterial color="#667eea" transparent opacity={0.5} />
                            <group
                                rotation={[
                                    Math.PI / 2,
                                    0,
                                    Math.atan2(direction.y, direction.x)
                                ]}
                            />
                        </mesh>
                    </group>
                );
            })}

            {/* Corner spheres for clarity */}
            {vertices.map((v, idx) => (
                <mesh key={`vertex-${idx}`} position={v}>
                    <sphereGeometry args={[0.1, 16, 16]} />
                    <meshBasicMaterial color="#667eea" transparent opacity={0.7} />
                </mesh>
            ))}
        </group>
    );
};
