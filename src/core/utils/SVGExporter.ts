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

    try {
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
        container.appendChild(svgRenderer.domElement);

        try {
            // Render scene to SVG
            console.log('[SVGExporter] Rendering scene...');
            svgRenderer.render(scene, camera);

            // Get SVG element
            const svgElement = svgRenderer.domElement;

            if (svgElement && svgElement.tagName === 'svg') {
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
                alert('SVG exported! Note: Complex materials are simplified to basic shapes.');
            } else {
                throw new Error('SVG element not found or invalid');
            }
        } finally {
            // Always cleanup container
            document.body.removeChild(container);
        }
    } catch (error) {
        console.error('[SVGExporter] SVG export failed:', error);
        alert('SVG export failed.\n\nSVG format has limitations:\n- Only basic geometry is exported\n- Materials, textures, and effects are not supported\n- Try using PNG snapshot for complex scenes');
        throw error;
    }
};

export default {
    exportSVG
};
