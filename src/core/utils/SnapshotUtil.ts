import * as THREE from 'three';

export interface SnapshotOptions {
    resolution: number; // Multiplier: 1, 2, 4
    transparent: boolean;
    autoFrame: boolean;
    filename?: string;
}

export interface SnapshotUtil {
    captureHighRes: (
        gl: THREE.WebGLRenderer,
        scene: THREE.Scene,
        camera: THREE.PerspectiveCamera,
        options: SnapshotOptions
    ) => void;

    calculateBoundingBox: (atoms: Array<{ position: [number, number, number] }>) => THREE.Box3;

    createFramedCamera: (
        camera: THREE.PerspectiveCamera,
        bbox: THREE.Box3,
        padding?: number
    ) => THREE.PerspectiveCamera;
}

/**
 * Calculate bounding box for all atoms in the structure
 */
export const calculateBoundingBox = (atoms: Array<{ position: [number, number, number] }>): THREE.Box3 => {
    const bbox = new THREE.Box3();

    atoms.forEach(atom => {
        bbox.expandByPoint(new THREE.Vector3(...atom.position));
    });

    return bbox;
};

/**
 * Create a camera positioned to frame the structure perfectly
 */
export const createFramedCamera = (
    camera: THREE.PerspectiveCamera,
    bbox: THREE.Box3,
    padding: number = 1.2 // 20% padding
): THREE.PerspectiveCamera => {
    const snapshotCamera = camera.clone();

    // Get bounding box dimensions
    const center = bbox.getCenter(new THREE.Vector3());
    const size = bbox.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);

    // Calculate camera distance to fit structure
    const fov = camera.fov * (Math.PI / 180);
    const cameraDistance = (maxDim * padding) / (2 * Math.tan(fov / 2));

    // Position camera along current view direction
    const viewDirection = new THREE.Vector3();
    camera.getWorldDirection(viewDirection);
    viewDirection.negate(); // Look towards scene

    snapshotCamera.position.copy(center).add(viewDirection.multiplyScalar(cameraDistance));
    snapshotCamera.lookAt(center);
    snapshotCamera.updateProjectionMatrix();

    return snapshotCamera;
};

export const captureHighRes = (
    gl: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    options: SnapshotOptions
): void => {
    const { resolution, transparent, filename } = options;

    console.log('[SnapshotUtil] Starting high-res capture:', { resolution, transparent, filename });

    // Get current canvas size
    const currentSize = new THREE.Vector2();
    gl.getSize(currentSize);

    console.log('[SnapshotUtil] Current canvas size:', currentSize);

    // Calculate target resolution
    const targetWidth = Math.floor(currentSize.x * resolution);
    const targetHeight = Math.floor(currentSize.y * resolution);

    console.log('[SnapshotUtil] Target resolution:', { targetWidth, targetHeight });

    // Create off-screen render target
    const renderTarget = new THREE.WebGLRenderTarget(targetWidth, targetHeight, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat, // Always use RGBA for compatibility with readPixels
        type: THREE.UnsignedByteType,
    });

    // Store original state
    const originalBackground = scene.background;
    const originalRenderTarget = gl.getRenderTarget();
    const originalPixelRatio = gl.getPixelRatio();
    const originalScissorTest = gl.getScissorTest();

    try {
        // Configure for snapshot
        if (transparent) {
            scene.background = null;
        }

        // Disable scissor test to ensure full render target is used
        // Otherwise, rendering might be clipped to the current window size (appearing as bottom-left only)
        gl.setScissorTest(false);

        // Render to off-screen target
        gl.setRenderTarget(renderTarget);
        gl.setPixelRatio(1); // Ensure 1:1 pixel mapping
        gl.render(scene, camera);

        console.log('[SnapshotUtil] Rendered to off-screen target');

        // Read pixels from render target
        const pixels = new Uint8Array(targetWidth * targetHeight * 4);
        gl.readRenderTargetPixels(renderTarget, 0, 0, targetWidth, targetHeight, pixels);

        console.log('[SnapshotUtil] Read pixels, total bytes:', pixels.length);

        // Create canvas for data URL conversion
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            // Create ImageData and flip Y-axis (WebGL coords are bottom-up)
            const imageData = ctx.createImageData(targetWidth, targetHeight);

            for (let y = 0; y < targetHeight; y++) {
                for (let x = 0; x < targetWidth; x++) {
                    const srcIdx = (y * targetWidth + x) * 4;
                    const dstIdx = ((targetHeight - 1 - y) * targetWidth + x) * 4;

                    imageData.data[dstIdx] = pixels[srcIdx];
                    imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
                    imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
                    imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
                }
            }

            ctx.putImageData(imageData, 0, 0);

            console.log('[SnapshotUtil] Created canvas and flipped Y-axis');

            // Download
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            const actualResolution = `${targetWidth}x${targetHeight}`;
            link.download = filename?.replace(/\d+x-/, `${actualResolution}-${resolution}x-`) || `snapshot-${actualResolution}-${resolution}x-${Date.now()}.png`;
            link.href = dataURL;
            link.click();

            console.log('[SnapshotUtil] Download triggered:', link.download);
            console.log(`[SnapshotUtil] SUCCESS: Saved ${actualResolution} image (${resolution}x multiplier)`);
        } else {
            console.error('[SnapshotUtil] Failed to get 2D context from canvas');
        }
    } catch (error) {
        console.error('[SnapshotUtil] Error during capture:', error);
        throw error;
    } finally {
        // Restore original state
        scene.background = originalBackground;
        gl.setRenderTarget(originalRenderTarget);
        gl.setPixelRatio(originalPixelRatio);
        gl.setScissorTest(originalScissorTest);
        renderTarget.dispose();

        console.log('[SnapshotUtil] Restored original state and cleaned up');
    }
};

export default {
    captureHighRes,
    calculateBoundingBox,
    createFramedCamera
};
