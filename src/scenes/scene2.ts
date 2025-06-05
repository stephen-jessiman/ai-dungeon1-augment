import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

/**
 * Scene 2: Bouncing Sphere Scene
 *
 * A physics-like demonstration scene featuring a pink sphere that bounces
 * above a ground plane. Shows animation using mathematical functions and
 * demonstrates more complex scene composition with multiple objects.
 *
 * Features:
 * - Pink sphere with bouncing animation using sine wave
 * - Gray ground plane for visual reference
 * - Arc rotate camera positioned for optimal viewing
 * - Hemispheric lighting
 * - Continuous rotation and vertical movement
 */
export class Scene2 implements GameScene {
  /** Unique identifier for this scene */
  public id = 'scene2';

  /** Human-readable name for this scene */
  public name = 'Bouncing Sphere Scene';

  /** The sphere mesh that will be animated */
  private sphere?: BABYLON.Mesh;

  /**
   * Creates and initializes the bouncing sphere scene.
   * Sets up camera, lighting, the animated sphere, and ground plane.
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
      Math.PI / 2, Math.PI / 3, 8,
      BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    // Add a light
    new BABYLON.HemisphericLight("light",
      new BABYLON.Vector3(0, 1, 0), scene);

    // Create a bouncing sphere
    this.sphere = BABYLON.MeshBuilder.CreateSphere("sphere",
      { diameter: 2 }, scene);

    // Add material to the sphere
    const material = new BABYLON.StandardMaterial("sphereMaterial", scene);
    material.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.6);
    this.sphere.material = material;

    // Add ground plane for visual reference
    const ground = BABYLON.MeshBuilder.CreateGround("ground",
      { width: 10, height: 10 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    ground.material = groundMaterial;

    return scene;
  }

  /**
   * Updates the scene animation each frame.
   * Creates a bouncing effect using sine wave mathematics and rotates the sphere.
   * The sphere bounces between 1 and 4 units high, staying above the ground.
   *
   * @param _scene - The current Babylon.js scene (unused)
   * @public
   */
  public update(_scene: BABYLON.Scene): void {
    // Animate the sphere with proper bouncing
    if (this.sphere) {
      const time = performance.now() * 0.001;
      // Sphere radius is 1 (diameter 2 / 2), so minimum Y should be 1 to stay above ground
      // Use abs(sin) to create a proper bounce effect that doesn't go below ground
      this.sphere.position.y = Math.abs(Math.sin(time * 3)) * 3 + 1;
      this.sphere.rotation.y += 0.02;
    }
  }

  /**
   * Cleans up scene resources when the scene is disposed.
   * Resets the sphere reference to prevent memory leaks.
   *
   * @param _scene - The Babylon.js scene being disposed (unused)
   * @public
   */
  public dispose(_scene: BABYLON.Scene): void {
    // Clean up any scene-specific resources
    this.sphere = undefined;
  }
}
