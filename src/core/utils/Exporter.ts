import { GLTFExporter } from 'three-stdlib';
import * as THREE from 'three';

// Expand InstancedMesh to individual meshes for proper GLTF export
const prepareSceneForExport = (scene: THREE.Object3D): THREE.Object3D => {
    const clone = scene.clone(true);

    const instancedMeshes: THREE.InstancedMesh[] = [];
    clone.traverse((obj) => {
        if (obj instanceof THREE.InstancedMesh) {
            instancedMeshes.push(obj);
        }
    });

    // Replace each InstancedMesh with individual meshes
    instancedMeshes.forEach((instancedMesh) => {
        const parent = instancedMesh.parent;
        if (!parent) return;

        const geometry = instancedMesh.geometry;
        const material = instancedMesh.material;
        const count = instancedMesh.count;

        const group = new THREE.Group();
        group.name = `${instancedMesh.name || 'instances'}_expanded`;

        const matrix = new THREE.Matrix4();

        for (let i = 0; i < count; i++) {
            instancedMesh.getMatrixAt(i, matrix);

            const mesh = new THREE.Mesh(geometry, material);
            mesh.applyMatrix4(matrix);
            mesh.name = `${instancedMesh.name || 'instance'}_${i}`;
            group.add(mesh);
        }

        // Replace instanced mesh with group
        const index = parent.children.indexOf(instancedMesh);
        if (index !== -1) {
            parent.children.splice(index, 1, group);
            group.parent = parent;
        }
    });

    return clone;
};

export const exportScene = (scene: THREE.Object3D) => {
    const exporter = new GLTFExporter();

    // Prepare scene: expand InstancedMesh to individual meshes
    const preparedScene = prepareSceneForExport(scene);

    const options = {
        binary: true,
        onlyVisible: true,
    };

    exporter.parse(
        preparedScene,
        (gltf) => {
            if (gltf instanceof ArrayBuffer) {
                saveArrayBuffer(gltf, 'crystal-structure.glb');
            } else {
                const output = JSON.stringify(gltf, null, 2);
                saveString(output, 'crystal-structure.gltf');
            }
        },
        (error) => {
            console.error('An error happened during parsing', error);
        },
        options
    );
};

const saveString = (text: string, filename: string) => {
    save(new Blob([text], { type: 'text/plain' }), filename);
};

const saveArrayBuffer = (buffer: ArrayBuffer, filename: string) => {
    save(new Blob([buffer], { type: 'application/octet-stream' }), filename);
};

const save = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    document.body.removeChild(link);
};
