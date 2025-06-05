import * as BABYLON from 'babylonjs';
import { DebugSystem } from './debug';

/**
 * Interface defining the structure and lifecycle methods for game scenes.
 * All scenes must implement this interface to work with the SceneManager.
 *
 * @example
 * ```typescript
 * export class MyScene implements GameScene {
 *   public id = 'myScene';
 *   public name = 'My Custom Scene';
 *
 *   public create(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
 *     // Create and return your Babylon.js scene
 *   }
 *
 *   public update(scene: BABYLON.Scene): void {
 *     // Optional: Update scene objects each frame
 *   }
 *
 *   public dispose(scene: BABYLON.Scene): void {
 *     // Optional: Clean up scene resources
 *   }
 * }
 * ```
 */
export interface GameScene {
  /** Unique identifier for the scene */
  id: string;

  /** Human-readable name for the scene */
  name: string;

  /**
   * Creates and initializes the Babylon.js scene.
   *
   * @param engine - The Babylon.js engine instance
   * @param canvas - The HTML canvas element for rendering
   * @returns The created Babylon.js scene
   */
  create(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;

  /**
   * Optional method called every frame to update scene objects.
   * Use this for animations, physics updates, or other per-frame logic.
   *
   * @param scene - The current Babylon.js scene
   */
  update?(scene: BABYLON.Scene): void;

  /**
   * Optional method called when the scene is being disposed.
   * Use this to clean up resources, remove event listeners, etc.
   *
   * @param scene - The Babylon.js scene being disposed
   */
  dispose?(scene: BABYLON.Scene): void;
}

/**
 * Manages game scenes, handling scene lifecycle, transitions, and rendering.
 * Provides a centralized system for registering, switching between, and updating scenes.
 * Integrates with the debug system for performance monitoring.
 *
 * @example
 * ```typescript
 * const sceneManager = new SceneManager(engine, canvas);
 * sceneManager.registerScene(new MyScene());
 * sceneManager.switchToScene('myScene');
 * sceneManager.startRenderLoop();
 * ```
 */
export class SceneManager {
  /** The Babylon.js engine instance */
  private engine: BABYLON.Engine;

  /** The HTML canvas element for rendering */
  private canvas: HTMLCanvasElement;

  /** The currently active Babylon.js scene */
  private currentScene?: BABYLON.Scene;

  /** The ID of the currently active scene */
  private currentSceneId?: string;

  /** Map of registered scenes by their ID */
  private scenes: Map<string, GameScene> = new Map();

  /** Whether the render loop is currently running */
  private isRunning: boolean = false;

  /** Debug system for performance monitoring */
  private debugSystem: DebugSystem;

  /**
   * Creates a new SceneManager instance.
   *
   * @param engine - The Babylon.js engine instance
   * @param canvas - The HTML canvas element for rendering
   */
  constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
    this.debugSystem = new DebugSystem();
  }

  /**
   * Registers a new scene with the scene manager.
   * The scene can then be activated using its ID.
   *
   * @param scene - The scene to register
   * @public
   */
  public registerScene(scene: GameScene): void {
    this.scenes.set(scene.id, scene);
  }

  /**
   * Switches to a different scene by ID.
   * Properly disposes the current scene before creating the new one.
   *
   * @param sceneId - The ID of the scene to switch to
   * @public
   */
  public switchToScene(sceneId: string): void {
    const sceneDefinition = this.scenes.get(sceneId);
    if (!sceneDefinition) {
      console.error(`Scene with id "${sceneId}" not found`);
      return;
    }

    // Dispose current scene if it exists
    if (this.currentScene) {
      const currentSceneDef = this.scenes.get(this.currentSceneId!);
      if (currentSceneDef?.dispose) {
        currentSceneDef.dispose(this.currentScene);
      }
      this.currentScene.dispose();
    }

    // Create new scene
    this.currentScene = sceneDefinition.create(this.engine, this.canvas);
    this.currentSceneId = sceneId;

    console.log(`Switched to scene: ${sceneDefinition.name}`);
  }

  /**
   * Starts the main render loop for the game.
   * Handles scene updates, rendering, and debug system updates.
   * Also sets up window resize handling for responsive rendering.
   *
   * @public
   */
  public startRenderLoop(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.engine.runRenderLoop(() => {
      if (this.currentScene) {
        // Call scene update if available
        const sceneDef = this.scenes.get(this.currentSceneId!);
        if (sceneDef?.update) {
          sceneDef.update(this.currentScene);
        }

        // Render the scene
        this.currentScene.render();

        // Update FPS counter
        this.debugSystem.updateFPS();
      }
    });

    // Handle browser resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  /**
   * Gets the ID of the currently active scene.
   *
   * @returns The current scene ID, or undefined if no scene is active
   * @public
   */
  public getCurrentSceneId(): string | undefined {
    return this.currentSceneId;
  }

  /**
   * Gets a list of all registered scene IDs.
   *
   * @returns Array of scene IDs
   * @public
   */
  public getAvailableScenes(): string[] {
    return Array.from(this.scenes.keys());
  }

  /**
   * Gets the debug system instance for external access.
   *
   * @returns The debug system instance
   * @public
   */
  public getDebugSystem(): DebugSystem {
    return this.debugSystem;
  }

  /**
   * Disposes the scene manager and cleans up all resources.
   * Properly disposes the current scene and debug system.
   *
   * @public
   */
  public dispose(): void {
    if (this.currentScene) {
      const currentSceneDef = this.scenes.get(this.currentSceneId!);
      if (currentSceneDef?.dispose) {
        currentSceneDef.dispose(this.currentScene);
      }
      this.currentScene.dispose();
    }
    this.debugSystem.dispose();
  }
}
