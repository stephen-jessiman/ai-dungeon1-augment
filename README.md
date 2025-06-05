# Babylon.js Game Starter

A modern single-player game built with Babylon.js and TypeScript, featuring a scene management system and interactive menu interface.

## 🎮 Features

- **Multiple Scenes**: Easily switch between different game scenes
- **Interactive Menu**: Press `ESC` or click the menu icon to access scene selection
- **Modern Build System**: Powered by Vite for fast development and hot reload
- **TypeScript**: Full type safety and modern JavaScript features
- **Scene Management**: Clean architecture for adding new game scenes

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/stephen-jessiman/ai-dungeon1-augment.git
cd ai-dungeon1-augment
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## 🎯 Available Scenes

### Scene 1 - Spinning Cube
- Blue spinning cube with camera controls
- Demonstrates basic 3D object manipulation
- Default starting scene

### Scene 2 - Bouncing Sphere
- Pink sphere with bouncing animation
- Shows physics-like movement
- Includes ground plane

### Scene 3 - Coming Soon
- Placeholder scene for future development
- Simple environment setup

## 🎮 Controls

- **ESC Key**: Toggle game menu
- **Menu Icon**: Click the hamburger menu (☰) in the top-left corner
- **Mouse**: Camera controls (rotate, zoom, pan)
- **Scene Selection**: Click any scene button in the menu to switch

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Project Structure

```
src/
├── scenes/           # Game scenes
│   ├── scene1.ts    # Spinning cube scene
│   ├── scene2.ts    # Bouncing sphere scene
│   └── scene3.ts    # Coming soon placeholder
├── game.ts          # Main game class
├── sceneManager.ts  # Scene management system
├── menu.ts          # Menu system
├── main.ts          # Application entry point
├── index.html       # HTML template
└── styles.css       # Styling
```

## 🔧 Adding New Scenes

1. Create a new scene class in `src/scenes/` implementing the `GameScene` interface:

```typescript
import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

export class MyNewScene implements GameScene {
  public id = 'myScene';
  public name = 'My New Scene';

  public create(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
    // Create your scene here
  }

  public update(_scene: BABYLON.Scene): void {
    // Animation logic here
  }

  public dispose(_scene: BABYLON.Scene): void {
    // Cleanup here
  }
}
```

2. Register the scene in `src/game.ts`:
```typescript
this.sceneManager.registerScene(new MyNewScene());
```

3. Add a menu button in `src/index.html`:
```html
<button class="menu-button" data-scene="myScene">My New Scene</button>
```

## 🏗️ Architecture

### Scene Management
The game uses a scene management system that handles:
- Scene lifecycle (create, update, dispose)
- Smooth transitions between scenes
- Resource cleanup

### Menu System
- ESC key and click-to-open functionality
- Visual feedback for active scenes
- Responsive design with smooth animations

## 🎨 Customization

### Styling
Edit `src/styles.css` to customize the menu appearance and UI elements.

### Game Logic
Each scene is self-contained and can have its own:
- 3D objects and materials
- Animations and physics
- Camera setups
- Lighting configurations

## 📦 Technologies Used

- **Babylon.js 6.15.0** - 3D engine
- **TypeScript 5.6.0** - Type-safe JavaScript
- **Vite 5.0.0** - Build tool and dev server
- **Modern ES2020** - Latest JavaScript features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin feature/my-new-feature`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🎯 Future Plans

- [ ] Add physics engine integration
- [ ] Implement player character controls
- [ ] Add sound effects and music
- [ ] Create more complex game scenes
- [ ] Add save/load functionality
- [ ] Implement game state management
