import { GLTFExporter } from 'three-stdlib';
import * as THREE from 'three';

export const exportScene = (scene: THREE.Object3D) => {
    const exporter = new GLTFExporter();

    // Parse options
    const options = {
        binary: true,
        onlyVisible: true,
    };

    exporter.parse(
        scene,
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
    document.body.appendChild(link); // Firefox workaround, though mostly fine without append
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    document.body.removeChild(link);
};
