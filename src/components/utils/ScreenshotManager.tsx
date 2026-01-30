import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

interface ScreenshotManagerProps {
    onCaptureComplete?: () => void;
}

export function ScreenshotManager({ onCaptureComplete }: ScreenshotManagerProps) {
    // We don't need 'size' for pixel ratio scaling, so removed from destructuring to fix lint
    const { gl, scene, camera } = useThree();

    useEffect(() => {
        const handleHighResRequest = async (e: any) => {
            const { scale = 4, name = 'cathode-highres' } = e.detail || {};

            // 1. Check GPU Capabilities & Total Memory Safety
            const maxTextureSize = gl.capabilities.maxTextureSize;
            const { width, height } = gl.domElement;

            let finalScale = scale;
            const targetWidth = width * scale;
            const targetHeight = height * scale;

            // Safe Limit: ~25 Megapixels (Aggressive clamp to prevent blank output)
            // 8K is ~33MP (16:9) to ~60MP (1:1). 25MP is roughly 5K-6K.
            const SAFE_PIXEL_LIMIT = 25_000_000;

            let clampReason = '';

            // Check 1: Max Texture Size (Dimension Limit)
            if (targetWidth > maxTextureSize || targetHeight > maxTextureSize) {
                const maxDim = Math.max(width, height);
                // Calculate max safe scale (floor to 2 decimal places)
                finalScale = Math.min(finalScale, Math.floor(maxTextureSize / maxDim * 100) / 100);
                clampReason = 'Max Texture Size';
            }

            // Check 2: Total Pixel Count (Memory Limit)
            const currentTotalPixels = (width * finalScale) * (height * finalScale);
            if (currentTotalPixels > SAFE_PIXEL_LIMIT) {
                // Sqrt(Safe / Current) * Scale
                const reductionFactor = Math.sqrt(SAFE_PIXEL_LIMIT / currentTotalPixels);
                finalScale = Math.floor(finalScale * reductionFactor * 100) / 100;
                clampReason = clampReason ? `${clampReason} & Total Pixel Limit` : 'Total Pixel Limit';
            }

            if (finalScale < scale) {
                console.warn(`[ScreenshotManager] 8K Capture clamped! Reason: ${clampReason}`, {
                    requested: `${Math.round(targetWidth)}x${Math.round(targetHeight)}`,
                    clamped: `${Math.round(width * finalScale)}x${Math.round(height * finalScale)}`,
                    originalScale: scale,
                    finalScale
                });
            }

            // 2. Save original settings
            const originalPixelRatio = gl.getPixelRatio();
            const originalZoom = camera.zoom;
            const originalBackground = scene.background;

            // 3. Setup High-Res & Fit Frame
            gl.setPixelRatio(finalScale);
            camera.zoom = originalZoom * 1.25;
            camera.updateProjectionMatrix();

            // 4. Transparent Background Setup
            scene.background = null;
            gl.setClearColor(0x000000, 0);

            // 5. Capture Sequence - Add slight delay for layout update
            setTimeout(() => {
                requestAnimationFrame(() => {
                    try {
                        gl.clear();
                        gl.render(scene, camera);

                        gl.domElement.toBlob((blob) => {
                            if (blob) {
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.download = `${name}-${Date.now()}.png`;
                                link.href = url;
                                link.click();
                                URL.revokeObjectURL(url);
                                console.log(`[ScreenshotManager] Capture successful: ${finalScale.toFixed(2)}x`);
                            } else {
                                throw new Error('Blob creation failed');
                            }
                        }, 'image/png');

                    } catch (err) {
                        console.error('[ScreenshotManager] Capture failed', err);
                        alert('High-res capture failed. Your browser or GPU may not support this resolution. Try 4K instead.');
                    } finally {
                        // Restore settings
                        gl.setPixelRatio(originalPixelRatio);
                        camera.zoom = originalZoom;
                        camera.updateProjectionMatrix();
                        scene.background = originalBackground;

                        if (onCaptureComplete) onCaptureComplete();
                    }
                });
            }, 100); // 100ms delay for safety
        };

        window.addEventListener('high-res-snapshot', handleHighResRequest);
        return () => window.removeEventListener('high-res-snapshot', handleHighResRequest);
    }, [gl, scene, camera, onCaptureComplete]);

    return null;
}
