import * as BABYLON from 'babylonjs';
import { SceneManager } from './sceneManager';
import { MenuSystem } from './menu';
import { Scene1 } from './scenes/scene1';
import { Scene2 } from './scenes/scene2';
import { Scene3 } from './scenes/scene3';

/**
 * Main game class that orchestrates the entire game system.
 * Initializes the Babylon.js engine, scene manager, menu system, and all game scenes.
 * Serves as the entry point and coordinator for all game subsystems.
 *
 * @example
 * ```typescript
 * // Create and start the game
 * const game = new Game("renderCanvas");
 * // Game automatically starts with Scene 1 and begins the render loop
 * ```
 */
export class Game {
  /** The HTML canvas element used for rendering */
  private canvas: HTMLCanvasElement;

  /** The Babylon.js engine instance */
  private engine: BABYLON.Engine;

  /** The scene manager handling scene lifecycle */
  private sceneManager: SceneManager;

  /** The menu system for scene navigation and debug controls */
  private menuSystem: MenuSystem;

  /**
   * Creates a new Game instance and initializes all game systems.
   * Automatically starts the game with Scene 1 and begins the render loop.
   *
   * @param canvasElement - The ID of the HTML canvas element to use for rendering
   * @throws {Error} If the canvas element is not found or is not a valid canvas
   */
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
    }, this.sceneManager.getDebugSystem());

    // Start with Scene 1
    this.sceneManager.switchToScene('scene1');

    // Start the render loop
    this.sceneManager.startRenderLoop();

    // Log helpful information
    console.log('🎮 Game started successfully!');
    console.log('📊 Press F3 to toggle FPS counter');
    console.log('🎯 Press ESC or click the menu icon to access scene selection');
    console.log('⌨️  Use Arrow Keys (↑↓) to navigate menu, Enter to select');
    console.log('🏰 Try Scene 3 for procedural dungeon generation!');
  }

  /**
   * Registers all available game scenes with the scene manager.
   * Add new scenes here when they are created.
   *
   * @private
   */
  private registerScenes(): void {
    // Register all available scenes
    this.sceneManager.registerScene(new Scene1());
    this.sceneManager.registerScene(new Scene2());
    this.sceneManager.registerScene(new Scene3());
  }

  /**
   * Switches to a different scene and updates the menu system.
   * Coordinates between the scene manager and menu system to ensure consistency.
   *
   * @param sceneId - The ID of the scene to switch to
   * @private
   */
  private switchToScene(sceneId: string): void {
    this.sceneManager.switchToScene(sceneId);
    this.menuSystem.setCurrentScene(sceneId);
  }
}