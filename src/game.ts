import * as BABYLON from 'babylonjs';
import { SceneManager } from './sceneManager';
import { MenuSystem } from './menu';
import { Scene1 } from './scenes/scene1';
import { Scene2 } from './scenes/scene2';
import { Scene3 } from './scenes/scene3';

export class Game {
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private sceneManager: SceneManager;
  private menuSystem: MenuSystem;

  constructor(canvasElement: string) {
    // Get the canvas element
    const canvasEl = document.getElementById(canvasElement);
    if (!canvasEl || !(canvasEl instanceof HTMLCanvasElement)) {
      throw new Error(`Canvas element with id "${canvasElement}" not found`);
    }
    this.canvas = canvasEl;

    // Initialize the Babylon engine
    this.engine = new BABYLON.Engine(this.canvas, true);

    // Initialize scene manager
    this.sceneManager = new SceneManager(this.engine, this.canvas);

    // Register scenes
    this.registerScenes();

    // Initialize menu system
    this.menuSystem = new MenuSystem((sceneId: string) => {
      this.switchToScene(sceneId);
    });

    // Start with Scene 1
    this.sceneManager.switchToScene('scene1');

    // Start the render loop
    this.sceneManager.startRenderLoop();
  }

  private registerScenes(): void {
    // Register all available scenes
    this.sceneManager.registerScene(new Scene1());
    this.sceneManager.registerScene(new Scene2());
    this.sceneManager.registerScene(new Scene3());
  }

  private switchToScene(sceneId: string): void {
    this.sceneManager.switchToScene(sceneId);
    this.menuSystem.setCurrentScene(sceneId);
  }
}