import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

/**
 * Scene 1: Spinning Cube Scene
 *
 * A simple demonstration scene featuring a blue spinning cube with basic lighting.
 * Shows fundamental 3D object creation, materials, and animation in Babylon.js.
 * This scene serves as the default starting scene and a basic example.
 *
 * Features:
 * - Blue spinning cube with standard material
 * - Arc rotate camera with mouse controls
 * - Hemispheric lighting
 * - Continuous rotation animation
 */
export class Scene1 implements GameScene {
  /** Unique identifier for this scene */
  public id = 'scene1';

  /** Human-readable name for this scene */
  public name = 'Spinning Cube Scene';

  /** The cube mesh that will be animated */
  private cube?: BABYLON.Mesh;

  /**
   * Creates and initializes the spinning cube scene.
   * Sets up camera, lighting, and the animated cube with blue material.
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
      Math.PI / 2, Math.PI / 3, 5,
      BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add a light
    new BABYLON.HemisphericLight("light",
      new BABYLON.Vector3(0, 1, 0), scene);

    // Create a spinning cube
    this.cube = BABYLON.MeshBuilder.CreateBox("cube",
      { size: 1 }, scene);

    // Add material to the cube
    const material = new BABYLON.StandardMaterial("cubeMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
    this.cube.material = material;

    return scene;
  }

  /**
   * Updates the scene animation each frame.
   * Rotates the cube continuously on both X and Y axes.
   *
   * @param _scene - The current Babylon.js scene (unused)
   * @public
   */
  public update(_scene: BABYLON.Scene): void {
    // Rotate the cube
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
  }

  /**
   * Cleans up scene resources when the scene is disposed.
   * Resets the cube reference to prevent memory leaks.
   *
   * @param _scene - The Babylon.js scene being disposed (unused)
   * @public
   */
  public dispose(_scene: BABYLON.Scene): void {
    // Clean up any scene-specific resources
    this.cube = undefined;
  }
}
