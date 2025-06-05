import * as BABYLON from 'babylonjs';
import { DebugSystem } from './debug';

export interface GameScene {
  id: string;
  name: string;
  create(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene;
  update?(scene: BABYLON.Scene): void;
  dispose?(scene: BABYLON.Scene): void;
}

export class SceneManager {
  private engine: BABYLON.Engine;
  private canvas: HTMLCanvasElement;
  private currentScene?: BABYLON.Scene;
  private currentSceneId?: string;
  private scenes: Map<string, GameScene> = new Map();
  private isRunning: boolean = false;
  private debugSystem: DebugSystem;

  constructor(engine: BABYLON.Engine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
    this.debugSystem = new DebugSystem();
  }

  public registerScene(scene: GameScene): void {
    this.scenes.set(scene.id, scene);
  }

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

  public getCurrentSceneId(): string | undefined {
    return this.currentSceneId;
  }

  public getAvailableScenes(): string[] {
    return Array.from(this.scenes.keys());
  }

  public getDebugSystem(): DebugSystem {
    return this.debugSystem;
  }

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
