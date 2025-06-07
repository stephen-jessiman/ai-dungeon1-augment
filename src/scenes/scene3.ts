import * as BABYLON from 'babylonjs';
import { GameScene } from '../sceneManager';
import { DungeonGenerator, DungeonData, DungeonConfig } from '../dungeonGenerator';

/**
 * Scene 3: Procedural Dungeon Visualization
 * 
 * A comprehensive 3D visualization scene for procedurally generated dungeons.
 * Features real-time dungeon generation with configurable parameters and
 * immersive 3D exploration with proper lighting and materials.
 * 
 * Features:
 * - Real-time procedural dungeon generation
 * - 3D visualization with walls, floors, and doors
 * - Configurable generation parameters
 * - First-person camera for exploration
 * - Atmospheric lighting and materials
 * - Performance-optimized mesh generation
 * 
 * Controls:
 * - WASD: Move camera
 * - Mouse: Look around
 * - G: Generate new dungeon
 * - 1-5: Change complexity level
 * - R: Toggle room visualization mode
 */
export class Scene3 implements GameScene {
  /** Unique identifier for this scene */
  public id = 'scene3';
  
  /** Human-readable name for this scene */
  public name = 'Procedural Dungeon Scene';
  
  /** The dungeon generator instance */
  private dungeonGenerator: DungeonGenerator;
  
  /** Current dungeon data */
  private currentDungeon?: DungeonData;
  
  /** 3D meshes for the dungeon */
  private dungeonMeshes: BABYLON.Mesh[] = [];
  
  /** Materials for different tile types */
  private materials: {
    wall: BABYLON.StandardMaterial;
    floor: BABYLON.StandardMaterial;
    door: BABYLON.StandardMaterial;
    ceiling: BABYLON.StandardMaterial;
  } | null = null;
  
  /** Camera for first-person exploration */
  private camera?: BABYLON.UniversalCamera;
  
  /** Current visualization mode */
  private visualizationMode: 'full' | 'wireframe' | 'rooms' = 'full';
  
  /** Tile size in 3D units */
  private readonly tileSize = 2;
  
  /** Wall height in 3D units */
  private readonly wallHeight = 3;

  constructor() {
    // Initialize with default configuration
    const defaultConfig: DungeonConfig = {
      dungeonWidth: 40,
      dungeonHeight: 40,
      minRooms: 6,
      maxRooms: 12,
      minRoomSize: 4,
      maxRoomSize: 10,
      complexityLevel: 0.6,
      corridorWidth: 1,
      overlapChance: 0.3,
      seed: Date.now()
    };
    
    this.dungeonGenerator = new DungeonGenerator(defaultConfig);
  }

  /**
   * Creates and initializes the procedural dungeon scene.
   * Sets up camera, lighting, materials, and generates the initial dungeon.
   * 
   * @param engine - The Babylon.js engine instance
   * @param canvas - The HTML canvas element for rendering
   * @returns The created Babylon.js scene
   * @public
   */
  public create(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {
    // Create scene
    const scene = new BABYLON.Scene(engine);
    scene.gravity = new BABYLON.Vector3(0, -9.81, 0);
    scene.collisionsEnabled = true;
    
    // Create camera
    this.camera = new BABYLON.UniversalCamera("camera", 
      new BABYLON.Vector3(5, 2, 5), scene);
    this.camera.setTarget(BABYLON.Vector3.Zero());
    this.camera.attachControl(canvas, true);
    this.camera.checkCollisions = true;
    this.camera.applyGravity = true;
    this.camera.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
    
    // Set camera movement speed
    this.camera.speed = 0.5;
    this.camera.angularSensibility = 2000;
    
    // Create lighting
    this.setupLighting(scene);
    
    // Create materials
    this.createMaterials(scene);
    
    // Generate initial dungeon
    this.generateNewDungeon();
    this.visualizeDungeon(scene);
    
    // Setup keyboard controls
    this.setupControls(scene);
    
    // Add UI instructions
    this.createUI(scene);
    
    return scene;
  }

  /**
   * Sets up atmospheric lighting for the dungeon.
   * @private
   */
  private setupLighting(scene: BABYLON.Scene): void {
    // Ambient light for general illumination
    const ambientLight = new BABYLON.HemisphericLight("ambientLight", 
      new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.3;
    ambientLight.diffuse = new BABYLON.Color3(0.8, 0.8, 1.0);
    
    // Directional light for shadows and depth
    const directionalLight = new BABYLON.DirectionalLight("directionalLight", 
      new BABYLON.Vector3(-1, -1, -1), scene);
    directionalLight.intensity = 0.7;
    directionalLight.diffuse = new BABYLON.Color3(1.0, 0.9, 0.7);
    
    // Enable shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
  }

  /**
   * Creates materials for different dungeon elements.
   * @private
   */
  private createMaterials(scene: BABYLON.Scene): void {
    // Wall material - stone-like appearance
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial", scene);
    wallMaterial.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.5);
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    wallMaterial.roughness = 0.8;
    
    // Floor material - worn stone
    const floorMaterial = new BABYLON.StandardMaterial("floorMaterial", scene);
    floorMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.3, 0.4);
    floorMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    floorMaterial.roughness = 0.9;
    
    // Door material - wood-like
    const doorMaterial = new BABYLON.StandardMaterial("doorMaterial", scene);
    doorMaterial.diffuseColor = new BABYLON.Color3(0.6, 0.3, 0.1);
    doorMaterial.specularColor = new BABYLON.Color3(0.2, 0.1, 0.05);
    doorMaterial.roughness = 0.7;
    
    // Ceiling material - darker stone
    const ceilingMaterial = new BABYLON.StandardMaterial("ceilingMaterial", scene);
    ceilingMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.2, 0.3);
    ceilingMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
    ceilingMaterial.roughness = 0.9;
    
    this.materials = {
      wall: wallMaterial,
      floor: floorMaterial,
      door: doorMaterial,
      ceiling: ceilingMaterial
    };
  }

  /**
   * Sets up keyboard controls for dungeon interaction.
   * @private
   */
  private setupControls(scene: BABYLON.Scene): void {
    scene.actionManager = new BABYLON.ActionManager(scene);
    
    // G key - Generate new dungeon
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'g' || evt.sourceEvent.key === 'G') {
          this.generateNewDungeon();
          this.visualizeDungeon(scene);
          console.log('🏰 New dungeon generated!');
        }
      }));
    
    // Number keys 1-5 - Change complexity level
    for (let i = 1; i <= 5; i++) {
      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
          if (evt.sourceEvent.key === i.toString()) {
            const complexity = i * 0.2;
            this.updateComplexity(complexity);
            this.generateNewDungeon();
            this.visualizeDungeon(scene);
            console.log(`🎛️ Complexity set to ${complexity.toFixed(1)}`);
          }
        }));
    }
    
    // R key - Toggle visualization mode
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'r' || evt.sourceEvent.key === 'R') {
          this.toggleVisualizationMode();
          this.visualizeDungeon(scene);
          console.log(`👁️ Visualization mode: ${this.visualizationMode}`);
        }
      }));
  }

  /**
   * Creates UI instructions for the scene.
   * @private
   */
  private createUI(scene: BABYLON.Scene): void {
    // This would typically create GUI elements
    // For now, we'll log the controls to console
    console.log('🎮 Dungeon Scene Controls:');
    console.log('  G - Generate new dungeon');
    console.log('  1-5 - Set complexity level (0.2 - 1.0)');
    console.log('  R - Toggle visualization mode');
    console.log('  WASD - Move camera');
    console.log('  Mouse - Look around');
  }

  /**
   * Generates a new dungeon with current settings.
   * @private
   */
  private generateNewDungeon(): void {
    // Update seed for variety
    const config = this.dungeonGenerator.getConfig();
    config.seed = Date.now();
    this.dungeonGenerator.updateConfig(config);
    
    // Generate the dungeon
    this.currentDungeon = this.dungeonGenerator.generate();
    
    console.log(`Generated dungeon: ${this.currentDungeon.metadata.roomCount} rooms, ` +
                `${this.currentDungeon.doors.length} doors`);
  }

  /**
   * Updates the complexity level of dungeon generation.
   * @private
   */
  private updateComplexity(complexity: number): void {
    this.dungeonGenerator.updateConfig({ complexityLevel: complexity });
  }

  /**
   * Toggles between different visualization modes.
   * @private
   */
  private toggleVisualizationMode(): void {
    const modes: Array<'full' | 'wireframe' | 'rooms'> = ['full', 'wireframe', 'rooms'];
    const currentIndex = modes.indexOf(this.visualizationMode);
    this.visualizationMode = modes[(currentIndex + 1) % modes.length];
  }

  /**
   * Visualizes the current dungeon in 3D.
   * @private
   */
  private visualizeDungeon(scene: BABYLON.Scene): void {
    if (!this.currentDungeon || !this.materials) return;

    // Clear existing meshes
    this.clearDungeonMeshes();

    // Position camera at a good starting location
    this.positionCamera();

    switch (this.visualizationMode) {
      case 'full':
        this.createFullVisualization(scene);
        break;
      case 'wireframe':
        this.createWireframeVisualization(scene);
        break;
      case 'rooms':
        this.createRoomVisualization(scene);
        break;
    }
  }

  /**
   * Clears all existing dungeon meshes.
   * @private
   */
  private clearDungeonMeshes(): void {
    for (const mesh of this.dungeonMeshes) {
      mesh.dispose();
    }
    this.dungeonMeshes = [];
  }

  /**
   * Positions the camera at a good starting location in the dungeon.
   * @private
   */
  private positionCamera(): void {
    if (!this.currentDungeon || !this.camera) return;

    // Find the first room and position camera there
    const firstRoom = this.currentDungeon.rooms.find(r => r.type === 'room');
    if (firstRoom) {
      const centerX = (firstRoom.x + firstRoom.width / 2) * this.tileSize;
      const centerZ = (firstRoom.y + firstRoom.height / 2) * this.tileSize;

      this.camera.position = new BABYLON.Vector3(centerX, 2, centerZ);
      this.camera.setTarget(new BABYLON.Vector3(centerX, 2, centerZ - 5));
    }
  }

  /**
   * Creates full 3D visualization with walls, floors, and ceilings.
   * @private
   */
  private createFullVisualization(scene: BABYLON.Scene): void {
    if (!this.currentDungeon || !this.materials) return;

    const tilemap = this.currentDungeon.tilemap;
    const width = this.currentDungeon.metadata.width;
    const height = this.currentDungeon.metadata.height;

    // Create floor and ceiling for all walkable areas
    this.createFloorAndCeiling(scene, tilemap, width, height);

    // Create walls
    this.createWalls(scene, tilemap, width, height);

    // Create doors
    this.createDoors(scene);
  }

  /**
   * Creates wireframe visualization showing room boundaries.
   * @private
   */
  private createWireframeVisualization(scene: BABYLON.Scene): void {
    if (!this.currentDungeon) return;

    for (const room of this.currentDungeon.rooms) {
      if (room.type === 'room') {
        this.createRoomWireframe(scene, room);
      }
    }
  }

  /**
   * Creates room-only visualization with colored blocks.
   * @private
   */
  private createRoomVisualization(scene: BABYLON.Scene): void {
    if (!this.currentDungeon) return;

    for (const room of this.currentDungeon.rooms) {
      this.createRoomBlock(scene, room);
    }
  }

  /**
   * Creates floor and ceiling meshes for walkable areas.
   * @private
   */
  private createFloorAndCeiling(scene: BABYLON.Scene, tilemap: number[][], width: number, height: number): void {
    if (!this.materials) return;

    // Create merged floor mesh for performance
    const floorMeshes: BABYLON.Mesh[] = [];
    const ceilingMeshes: BABYLON.Mesh[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tilemap[y][x] === 1 || tilemap[y][x] === 2) { // Floor or door
          // Create floor tile
          const floor = BABYLON.MeshBuilder.CreateGround(`floor_${x}_${y}`,
            { width: this.tileSize, height: this.tileSize }, scene);
          floor.position = new BABYLON.Vector3(x * this.tileSize, 0, y * this.tileSize);
          floor.material = this.materials.floor;
          floor.receiveShadows = true;
          floorMeshes.push(floor);

          // Create ceiling tile
          const ceiling = BABYLON.MeshBuilder.CreateGround(`ceiling_${x}_${y}`,
            { width: this.tileSize, height: this.tileSize }, scene);
          ceiling.position = new BABYLON.Vector3(x * this.tileSize, this.wallHeight, y * this.tileSize);
          ceiling.rotation.x = Math.PI; // Flip to face down
          ceiling.material = this.materials.ceiling;
          ceilingMeshes.push(ceiling);
        }
      }
    }

    // Merge meshes for better performance
    if (floorMeshes.length > 0) {
      const mergedFloor = BABYLON.Mesh.MergeMeshes(floorMeshes);
      if (mergedFloor) {
        mergedFloor.name = "mergedFloor";
        this.dungeonMeshes.push(mergedFloor);
      }
    }

    if (ceilingMeshes.length > 0) {
      const mergedCeiling = BABYLON.Mesh.MergeMeshes(ceilingMeshes);
      if (mergedCeiling) {
        mergedCeiling.name = "mergedCeiling";
        this.dungeonMeshes.push(mergedCeiling);
      }
    }
  }

  /**
   * Creates wall meshes for the dungeon.
   * @private
   */
  private createWalls(scene: BABYLON.Scene, tilemap: number[][], width: number, height: number): void {
    if (!this.materials) return;

    const wallMeshes: BABYLON.Mesh[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (tilemap[y][x] === 0) { // Wall
          // Check if this wall is adjacent to a floor (visible wall)
          if (this.isVisibleWall(tilemap, x, y, width, height)) {
            const wall = BABYLON.MeshBuilder.CreateBox(`wall_${x}_${y}`,
              { width: this.tileSize, height: this.wallHeight, depth: this.tileSize }, scene);
            wall.position = new BABYLON.Vector3(x * this.tileSize, this.wallHeight / 2, y * this.tileSize);
            wall.material = this.materials.wall;
            wall.checkCollisions = true;
            wallMeshes.push(wall);
          }
        }
      }
    }

    // Merge wall meshes for better performance
    if (wallMeshes.length > 0) {
      const mergedWalls = BABYLON.Mesh.MergeMeshes(wallMeshes);
      if (mergedWalls) {
        mergedWalls.name = "mergedWalls";
        mergedWalls.checkCollisions = true;
        this.dungeonMeshes.push(mergedWalls);
      }
    }
  }

  /**
   * Checks if a wall tile is visible (adjacent to a floor).
   * @private
   */
  private isVisibleWall(tilemap: number[][], x: number, y: number, width: number, height: number): boolean {
    const directions = [
      { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }
    ];

    for (const dir of directions) {
      const nx = x + dir.dx;
      const ny = y + dir.dy;

      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        if (tilemap[ny][nx] === 1 || tilemap[ny][nx] === 2) { // Floor or door
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Creates door meshes for the dungeon.
   * @private
   */
  private createDoors(scene: BABYLON.Scene): void {
    if (!this.currentDungeon || !this.materials) return;

    for (const door of this.currentDungeon.doors) {
      const doorMesh = BABYLON.MeshBuilder.CreateBox(`door_${door.x}_${door.y}`,
        { width: this.tileSize * 0.8, height: this.wallHeight * 0.8, depth: this.tileSize * 0.1 }, scene);
      doorMesh.position = new BABYLON.Vector3(
        door.x * this.tileSize,
        this.wallHeight * 0.4,
        door.y * this.tileSize
      );
      doorMesh.material = this.materials.door;
      this.dungeonMeshes.push(doorMesh);
    }
  }

  /**
   * Creates wireframe visualization for a room.
   * @private
   */
  private createRoomWireframe(scene: BABYLON.Scene, room: any): void {
    const wireframeMaterial = new BABYLON.StandardMaterial("wireframe", scene);
    wireframeMaterial.wireframe = true;
    wireframeMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0);

    const roomMesh = BABYLON.MeshBuilder.CreateBox(`wireframe_${room.id}`, {
      width: room.width * this.tileSize,
      height: this.wallHeight,
      depth: room.height * this.tileSize
    }, scene);

    roomMesh.position = new BABYLON.Vector3(
      (room.x + room.width / 2) * this.tileSize,
      this.wallHeight / 2,
      (room.y + room.height / 2) * this.tileSize
    );
    roomMesh.material = wireframeMaterial;
    this.dungeonMeshes.push(roomMesh);
  }

  /**
   * Creates colored block visualization for a room.
   * @private
   */
  private createRoomBlock(scene: BABYLON.Scene, room: any): void {
    const blockMaterial = new BABYLON.StandardMaterial(`block_${room.id}`, scene);

    // Color based on room type
    switch (room.type) {
      case 'room':
        blockMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
        break;
      case 'corridor':
        blockMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.2);
        break;
      case 'intersection':
        blockMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
        break;
    }

    blockMaterial.alpha = 0.7;

    const roomMesh = BABYLON.MeshBuilder.CreateBox(`block_${room.id}`, {
      width: room.width * this.tileSize,
      height: this.wallHeight * 0.5,
      depth: room.height * this.tileSize
    }, scene);

    roomMesh.position = new BABYLON.Vector3(
      (room.x + room.width / 2) * this.tileSize,
      this.wallHeight * 0.25,
      (room.y + room.height / 2) * this.tileSize
    );
    roomMesh.material = blockMaterial;
    this.dungeonMeshes.push(roomMesh);
  }

  /**
   * Updates the scene each frame.
   * Currently no animations, but could be used for dynamic elements.
   *
   * @param _scene - The current Babylon.js scene (unused)
   * @public
   */
  public update(_scene: BABYLON.Scene): void {
    // No animations currently, but could add:
    // - Torch flickering
    // - Door animations
    // - Particle effects
  }

  /**
   * Cleans up scene resources when the scene is disposed.
   * Properly disposes all meshes and materials.
   *
   * @param _scene - The Babylon.js scene being disposed (unused)
   * @public
   */
  public dispose(_scene: BABYLON.Scene): void {
    // Clear dungeon meshes
    this.clearDungeonMeshes();

    // Dispose materials
    if (this.materials) {
      this.materials.wall.dispose();
      this.materials.floor.dispose();
      this.materials.door.dispose();
      this.materials.ceiling.dispose();
      this.materials = null;
    }

    // Reset references
    this.currentDungeon = undefined;
    this.camera = undefined;
  }
}
