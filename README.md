# 🎨 Virtual Whiteboard

I'm very interested in the rendering technologies of graphic editors, design tools, geo maps, and virtual whiteboards. This is my humble attempt to understand and recreate the core ideas behind these tools, which use technologies like Canvas2D/SVG to render 2D graphics in browsers.

<img width="1637" height="928" alt="image" src="https://github.com/user-attachments/assets/5dbf9127-62e6-455f-806b-8dca497e88e2" />

### ✨ **Features**

- 🎨&nbsp;Infinite, canvas-based whiteboard.
- 🔍&nbsp;Zoom and panning support.
- ⚒️&nbsp;Movable and resizable stickers with in-place text editing and formatting.
- ➡️&nbsp;Arrow-binding.
- ☑️&nbsp;Multiple selection.
- 📋&nbsp;Copy-paste support.

### 🛠️ **Engineering**

- **Layer System**: Declarative layer management with hit detection.
- **Hit Detection**: Uses `getImageData()` to read pixel data from an offscreen canvas and convert it to unique layer ID.

### 🚀 **Next steps**
- Text-on-curve rendering with interactive Bézier curve manipulation.
- Support for custom fonts with OpenType.js integration.
