import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

/**
 * Scene 3: Coming Soon Scene
 *
 * A placeholder scene that demonstrates basic scene setup while indicating
 * that more content is planned for the future. Shows a simple environment
 * with ground plane and a placeholder indicator box.
 *
 * Features:
 * - Large gray ground plane (20x20 units)
 * - Yellow placeholder box positioned above ground
 * - Arc rotate camera positioned for overview
 * - Hemispheric lighting
 * - No animations (static scene)
 *
 * This scene serves as a template for future development and shows
 * how to create basic environmental elements.
 */
export class Scene3 implements GameScene {
  /** Unique identifier for this scene */
  public id = 'scene3';

  /** Human-readable name for this scene */
  public name = 'Coming Soon Scene';

  /**
   * Creates and initializes the placeholder scene.
   * Sets up a basic environment with ground plane and placeholder indicator.
   *
   * @param engine - The Babylon.js engine instance
   * @param canvas - The HTML canvas element for rendering
   * @returns The created Babylon.js scene
   * @public
   */
  public create(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
    // Create a basic scene
    const scene = new BABYLON.Scene(engine);

    // Create a camera
    const camera = new BABYLON.ArcRotateCamera("camera",
      Math.PI / 2, Math.PI / 3, 10,
      BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add a light
    new BABYLON.HemisphericLight("light",
      new BABYLON.Vector3(0, 1, 0), scene);

    // Create a simple ground
    const ground = BABYLON.MeshBuilder.CreateGround("ground",
      { width: 20, height: 20 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.3);
    ground.material = groundMaterial;

    // Add placeholder indicator (using a simple box as placeholder)
    const textBox = BABYLON.MeshBuilder.CreateBox("textBox",
      { width: 8, height: 2, depth: 0.1 }, scene);
    textBox.position.y = 3;
    const textMaterial = new BABYLON.StandardMaterial("textMaterial", scene);
    textMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.2);
    textBox.material = textMaterial;

    return scene;
  }

  /**
   * Updates the scene each frame.
   * This placeholder scene has no animations, so this method does nothing.
   *
   * @param _scene - The current Babylon.js scene (unused)
   * @public
   */
  public update(_scene: BABYLON.Scene): void {
    // No animation for this placeholder scene
  }

  /**
   * Cleans up scene resources when the scene is disposed.
   * This placeholder scene has no special cleanup requirements.
   *
   * @param _scene - The Babylon.js scene being disposed (unused)
   * @public
   */
  public dispose(_scene: BABYLON.Scene): void {
    // Clean up any scene-specific resources
  }
}
