import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';

export class Scene3 implements GameScene {
  public id = 'scene3';
  public name = 'Coming Soon Scene';

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

    // Add some placeholder text indication (using a simple box as placeholder)
    const textBox = BABYLON.MeshBuilder.CreateBox("textBox", 
      { width: 8, height: 2, depth: 0.1 }, scene);
    textBox.position.y = 3;
    const textMaterial = new BABYLON.StandardMaterial("textMaterial", scene);
    textMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.2);
    textBox.material = textMaterial;

    return scene;
  }

  public update(_scene: BABYLON.Scene): void {
    // No animation for this placeholder scene
  }

  public dispose(_scene: BABYLON.Scene): void {
    // Clean up any scene-specific resources
  }
}
