import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

export class Scene1 implements GameScene {
  public id = 'scene1';
  public name = 'Spinning Cube Scene';
  private cube?: BABYLON.Mesh;

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

  public update(_scene: BABYLON.Scene): void {
    // Rotate the cube
    if (this.cube) {
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
  }

  public dispose(_scene: BABYLON.Scene): void {
    // Clean up any scene-specific resources
    this.cube = undefined;
  }
}
