import * as THREE from 'three';
import { SVGRenderer } from 'three-stdlib';

export interface SVGExportOptions {
    width?: number;
    height?: number;
    filename?: string;
}

/**
 * Export the current 3D scene as an SVG file
 * Note: SVG export is limited to basic geometry - no textures, complex materials, or post-processing
 */
export const exportSVG = (
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    options: SVGExportOptions = {}
): void => {
    const {
        width = 1920,
        height = 1080,
        filename = `cathode-vector-${Date.now()}.svg`
    } = options;

    console.log('[SVGExporter] Starting SVG export:', { width, height, filename });

    // Create SVG renderer
    const svgRenderer = new SVGRenderer();
    svgRenderer.setSize(width, height);
    svgRenderer.setQuality('high');

    // Create a temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    try {
        // Render scene to SVG
        svgRenderer.render(scene, camera);

        // Get SVG element
        const svgElement = container.querySelector('svg');

        if (svgElement) {
            // Serialize SVG to string
            const serializer = new XMLSerializer();
            const svgString = serializer.serializeToString(svgElement);

            // Create blob and download
            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();

            // Cleanup
            URL.revokeObjectURL(url);

            console.log('[SVGExporter] SVG export successful:', filename);
        } else {
            throw new Error('SVG element not found');
        }
    } catch (error) {
        console.error('[SVGExporter] SVG export failed:', error);
        alert('SVG export failed. This format has limitations with complex materials.');
        throw error;
    } finally {
        // Cleanup
        document.body.removeChild(container);
    }
};

export default {
    exportSVG
};
