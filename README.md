# 🎨 Virtual Whiteboard

I'm very interested in the rendering technologies of graphic editors, design tools, geo maps, and virtual whiteboards. This is my humble attempt to understand and recreate the core ideas behind tldraw, excalidraw, kittl, and other tools that use technologies like Canvas2D/SVG for rendering 2D graphics in browser.

### ✨ **Features**

- 🎨&nbsp;Infinite, canvas-based whiteboard.
- 🔍&nbsp;Zoom and panning support.
- ⚒️&nbsp;Movable and resizable stickers with in-place text editing and formatting.
- ➡️&nbsp;Arrow-binding
- ⚒️&nbsp;Multiple selection.
- ⚒️&nbsp;Copy-paste support.

### 🛠️ **Engineering**

- **Layer System**: Declarative layer management with hit detection
- **Hit Detection**: Uses `getImageData()` to read pixel data from an offscreen canvas and convert it to unique layer ID.

### 🚀 **Next steps**
- Text-on-curve rendering with interactive Bézier curve manipulation.
- Support for custom fonts with OpenType.js integration.
