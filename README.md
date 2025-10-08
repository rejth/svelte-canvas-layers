# 🎨 Virtual Whiteboard

I'm passionate about the low-level rendering technologies used by graphic editors, design tools, geo-maps, and virtual whiteboards. This is my implementation of a virtual whiteboard built with a homegrown 2D rendering engine.

<img width="1639" height="920" alt="image" src="https://github.com/user-attachments/assets/a8facfe3-6212-4c15-a92f-6f7adf8e3d7d" />

## ✨ **Features**

- 🎨&nbsp;Infinite, canvas-based whiteboard.
- 🔍&nbsp;Zoom and panning support.
- ⚒️&nbsp;Movable and resizable stickers with in-place text editing and formatting.
- ➡️&nbsp;Arrow-binding.
- ☑️&nbsp;Multiple selection.
- 📋&nbsp;Copy-paste support.

## 🛠️ **Engineering**

- **Layer System**: Declarative layer management with hit detection.
- **Hit Detection**: Uses `getImageData()` to read pixel data from an offscreen canvas and convert it to unique layer ID.

## Performance Optimizations
- 💾 **Text snapshot caching** to avoid re-rendering of unchanged content.

## Graphics Primitives

- ✨ **Shapes**: Rectangles, rounded rectangles, circles, curves.
- ➡️ **Highly interactive arrows** to create aesthetically pleasing connections between canvas objects.
- 🔤 **Text rendering** with alignment, decorations, font styles, and snapshot caching.
- 🎯 **Selection handles** with interactive corner markers.

## Interaction & Navigation

- 🎮 **Camera system** with pan, zoom, and smooth navigation.
- 🖱️ **Mouse/touch input** with proper coordinate transformation.
- 🎯 **Layer picking** and selection based on pixel data picked from offscreen canvas.
- ⌨️ **Keyboard shortcuts** for enhanced productivity.

## 🚀 **Next steps**
- Text-on-curve rendering with interactive Bézier curve manipulation.
- Support for custom fonts with OpenType.js integration.
