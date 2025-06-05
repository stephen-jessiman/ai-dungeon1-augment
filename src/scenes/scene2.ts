import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

export class Scene2 implements GameScene {
  public id = 'scene2';
  public name = 'Bouncing Sphere Scene';
  private sphere?: BABYLON.Mesh;

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

    // Add some text (placeholder for coming soon)
    const ground = BABYLON.MeshBuilder.CreateGround("ground", 
      { width: 10, height: 10 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    ground.material = groundMaterial;

    return scene;
  }

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

  public dispose(_scene: BABYLON.Scene): void {
    // Clean up any scene-specific resources
    this.sphere = undefined;
  }
}
