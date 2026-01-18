# ⚡ Cathode Visualizer

**High-Fidelity Crystal Structure Visualization for Battery Materials**

A premium 3D visualization tool for exploring cathode materials used in lithium-ion batteries, featuring real-time rendering, interactive controls, and scientific accuracy.

---

## 🎯 Features

### 🔋 Supported Materials
- **NCM (LiNi₀.₈Co₀.₁Mn₀.₁O₂)** - Layered oxide cathode
- **LFP (LiFePO₄)** - Olivine structure cathode
- **CIF Import** - Load custom crystal structures from CIF files

### 🎨 Visualization
- **Real-time 3D rendering** with WebGL
- **Polyhedra display** - Metal-oxygen coordination environments
- **Unit cell repetition** - View supercells (up to 10×10×10)
- **Auto-rotation** - Enabled by default for dynamic presentation
- **Premium lighting** - Studio-quality illumination with customizable presets

### 📐 Camera Controls
- **4 Preset Views**:
  - 🎯 Isometric (default)
  - ⬆️ Top view
  - 👁️ Front view
  - ↔️ Side view
- **Smooth transitions** between camera positions
- **Reset View** button for quick reset

### 📷 Export & Capture
- **Snapshot** - Capture high-resolution PNG screenshots
- **3D Model Export** - Export structures as GLB/GLTF files
- **Auto-naming** - Files named with structure type and timestamp

### 📱 Mobile Responsive
- **Adaptive UI** - Optimized layouts for desktop and mobile
- **Collapsible panels** - Space group info and controls
- **Touch-friendly** - 44px minimum touch targets
- **Gesture support** - Pan, zoom, rotate with touch

### ⚙️ Advanced Controls
- **Element visibility** - Show/hide specific elements
- **Atom scaling** - Adjust individual atom sizes
- **Custom colors** - Override default element colors
- **Material presets** - Metallic, Glass, Matte finishes
- **Clipping planes** - Slice through the structure (X, Y, Z)
- **Lighting controls** - Adjust key, fill, rim, and ambient lights

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/SustainableEnergy/Crystal.git
cd Crystal

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Build for Production

```bash
npm run build
```

The optimized build will be in the `dist/` directory.

---

## 🎮 Usage

### Desktop
- **Structure Selection**: Top bar dropdown menu
- **Camera Presets**: Top-right controls
- **Snapshot**: Camera button (📷) in top-right
- **Space Group Info**: Left panel (always visible)
- **Controls**: Right panel (Leva interface)

### Mobile
- **Header Buttons**:
  - 🔋 Structure - Select material
  - Info ▶ - Toggle space group panel
  - ⚙️ Settings - Toggle Leva controls
- **Bottom Bar**:
  - 📷 Snapshot
  - Reset View
  - Camera presets (icon buttons)

### Keyboard Shortcuts
- **Mouse drag**: Rotate view
- **Scroll**: Zoom in/out
- **Right-click drag**: Pan camera
- **Double-click**: Reset focus

---

## 📊 Space Groups

### NCM (R-3m, #166)
- **System**: Trigonal/Rhombohedral
- **Structure**: Layered α-NaFeO₂ type
- **Coordination**: Octahedral (MO₆)
- **Best view**: Side view with ny=2-3 for layered structure

### LFP (Pnma, #62)
- **System**: Orthorhombic
- **Structure**: Olivine
- **Coordination**: Octahedral MO₆ + Tetrahedral PO₄
- **Features**: 1D lithium diffusion channels

---

## 🛠️ Technology Stack

- **React** - UI framework
- **Three.js** - 3D rendering engine
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/drei** - Useful helpers
- **@react-three/postprocessing** - Visual effects (Bloom, SSAO, Vignette)
- **Leva** - GUI controls
- **TypeScript** - Type safety
- **Vite** - Build tool

---

## 🏗️ Project Structure

```
src/
├── components/
│   ├── scene/
│   │   ├── StructureScene.tsx    # Main 3D scene
│   │   ├── Atoms.tsx              # Atom rendering
│   │   ├── Bonds.tsx              # Bond visualization
│   │   ├── Polyhedra.tsx          # Coordination polyhedra
│   │   └── Materials.ts           # Material definitions
│   └── UI/
│       ├── SpaceGroupPanel.tsx    # Space group info display
│       ├── StructureSelector.tsx  # Material picker
│       ├── CameraPresets.tsx      # View controls
│       ├── SnapshotButton.tsx     # Screenshot capture
│       └── MobileHeader.tsx       # Mobile navigation
├── core/
│   ├── builders/
│   │   ├── NCMBuilder.ts          # NCM structure generator
│   │   └── LFPBuilder.ts          # LFP structure generator
│   ├── utils/
│   │   ├── CIFParser.ts           # CIF file parser
│   │   └── Exporter.ts            # 3D model export
│   └── types.ts                   # TypeScript definitions
├── hooks/
│   └── useMediaQuery.ts           # Responsive breakpoints
└── App.tsx                        # Main application
```

---

## 📐 Scientific Background

### Polyhedra Visualization
- **Transition metals** (Ni, Co, Mn, Fe): Octahedral coordination with oxygen
- **Phosphorus**: Tetrahedral coordination with oxygen
- **Bond distances**:
  - Metal-O: < 2.4 Å
  - P-O: < 1.9 Å

### Unit Cell Parameters
Units cells are defined using crystallographic conventions:
- **a, b, c**: Lattice parameters (Ångströms)
- **α, β, γ**: Interaxial angles (degrees)

---

## 🎨 Customization

### Adding New Materials

1. Create a builder in `src/core/builders/`:

```typescript
export const generateNewMaterial = (nx: number, ny: number, nz: number): StructureData => {
  return {
    atoms: [...], // Atom positions
    unitCell: { a, b, c, alpha, beta, gamma }
  };
};
```

2. Add to `StructureScene.tsx` material selection

3. Update `SpaceGroupPanel.tsx` with space group info

### Custom Color Schemes

Edit `src/components/scene/Materials.ts`:

```typescript
export const ELEMENT_COLORS: { [key: string]: string } = {
  'Li': '#808080',
  'Ni': '#00ff00',
  // Add your colors...
};
```

---

## � Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Deploy automatically on push

Current deployment: [Coming soon]

### Manual Deployment

```bash
npm run build
# Upload dist/ folder to your hosting
```

---

## 📝 License

MIT License - See LICENSE file for details

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Contact

For questions or suggestions, please open an issue on GitHub.

---

## 🙏 Acknowledgments

- Crystal structure data from materials databases
- Three.js community for excellent 3D tools
- Battery research community for domain knowledge

---

**Built with ❤️ for battery materials research**
