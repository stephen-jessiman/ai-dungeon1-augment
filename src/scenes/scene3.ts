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
 * - WASD: Move camera (top-down view)
 * - Mouse wheel: Zoom in/out
 * - G: Generate new dungeon (new layout, preserves camera position)
 * - 1-5: Change complexity level (preserves base rooms & camera position)
 * - R: Toggle room visualization mode (preserves camera position)
 * - V: Toggle walls visibility
 * - 6-0: Set corridor width (6=1, 7=2, 8=3, 9=4, 0=5, preserves base rooms & camera)
 * - C: Center camera on dungeon
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
  } | null = null;
  
  /** Camera for first-person exploration */
  private camera?: BABYLON.UniversalCamera;
  
  /** Current visualization mode */
  private visualizationMode: 'full' | 'wireframe' | 'rooms' = 'full';

  /** Whether walls are currently visible */
  private showWalls: boolean = true;

  /** Current corridor width (1-5) */
  private corridorWidth: number = 3; // Match default config

  /** Current complexity level (0.2-1.0) */
  private currentComplexity: number = 0.6; // Match default config

  /** Tile size in 3D units */
  private readonly tileSize = 2;

  /** Wall height in 3D units (reduced for top-down view) */
  private readonly wallHeight = 1.5;

  /** WASD movement state tracking */
  private movementKeys = {
    w: false,
    a: false,
    s: false,
    d: false
  };

  /** Camera movement speed */
  private readonly cameraSpeed = 1.0;

  constructor() {
    // Initialize with default configuration (larger size to accommodate wide corridors)
    const defaultConfig: DungeonConfig = {
      dungeonWidth: 60,
      dungeonHeight: 60,
      minRooms: 3,
      maxRooms: 15,
      minRoomSize: 4,
      maxRoomSize: 10,
      complexityLevel: 0.6,
      corridorWidth: 3,
      overlapChance: 0.4,
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
    
    // Create top-down camera
    this.camera = new BABYLON.UniversalCamera("camera",
      new BABYLON.Vector3(0, 50, 0), scene);

    // Disable default controls since we'll implement custom WASD
    this.camera.attachControl(canvas, false);

    // Disable collision and gravity for top-down view
    this.camera.checkCollisions = false;
    this.camera.applyGravity = false;

    // Disable default camera inputs
    this.camera.inputs.clear();

    // Lock camera to top-down view (set rotation directly)
    this.camera.rotation.x = Math.PI / 2; // Look straight down
    this.camera.rotation.y = 0;
    this.camera.rotation.z = 0;
    
    // Create lighting
    this.setupLighting(scene);
    
    // Create materials
    this.createMaterials(scene);
    
    // Generate initial dungeon
    this.generateNewDungeon();
    this.visualizeDungeon(scene, true); // Force initial camera positioning

    // Setup keyboard controls
    this.setupControls(scene);
    
    // Add UI instructions
    this.createUI(scene);
    
    return scene;
  }

  /**
   * Sets up lighting optimized for top-down view.
   * @private
   */
  private setupLighting(scene: BABYLON.Scene): void {
    // Bright ambient light for clear top-down visibility
    const ambientLight = new BABYLON.HemisphericLight("ambientLight",
      new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.8;
    ambientLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);

    // Directional light from above for top-down shadows
    const directionalLight = new BABYLON.DirectionalLight("directionalLight",
      new BABYLON.Vector3(0, -1, 0), scene);
    directionalLight.intensity = 0.5;
    directionalLight.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);

    // Enable shadows for depth perception
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, directionalLight);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 16;
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

    this.materials = {
      wall: wallMaterial,
      floor: floorMaterial,
      door: doorMaterial
    };
  }

  /**
   * Sets up keyboard controls for dungeon interaction.
   * @private
   */
  private setupControls(scene: BABYLON.Scene): void {
    scene.actionManager = new BABYLON.ActionManager(scene);
    
    // G key - Generate new dungeon (preserve camera position)
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'g' || evt.sourceEvent.key === 'G') {
          this.generateNewDungeon();
          this.visualizeDungeon(scene, false); // Don't reposition camera
          console.log('🏰 New dungeon generated! (Camera position preserved)');
        }
      }));

    // Number keys 1-5 - Change complexity level (preserve camera position and base rooms)
    for (let i = 1; i <= 5; i++) {
      scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
        BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
          if (evt.sourceEvent.key === i.toString()) {
            const complexity = i * 0.2;
            this.updateComplexity(complexity);
            this.generateDungeonWithComplexity(); // Preserve base rooms
            this.visualizeDungeon(scene, false); // Don't reposition camera
            console.log(`🎛️ Complexity set to ${complexity.toFixed(1)} (Base rooms preserved)`);
          }
        }));
    }

    // R key - Toggle visualization mode (preserve camera position)
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'r' || evt.sourceEvent.key === 'R') {
          this.toggleVisualizationMode();
          this.visualizeDungeon(scene, false); // Don't reposition camera
          console.log(`👁️ Visualization mode: ${this.visualizationMode} (Camera position preserved)`);
        }
      }));

    // C key - Center camera on dungeon
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'c' || evt.sourceEvent.key === 'C') {
          this.positionCamera(true); // Force reposition to center
          console.log('📍 Camera centered on dungeon');
        }
      }));

    // V key - Toggle walls visibility
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'v' || evt.sourceEvent.key === 'V') {
          this.toggleWalls();
          this.visualizeDungeon(scene, false); // Don't reposition camera
          console.log(`🧱 Walls ${this.showWalls ? 'shown' : 'hidden'}`);
        }
      }));

    // Number keys 6-0 - Change corridor width (6=1, 7=2, 8=3, 9=4, 0=5)
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        const keyToWidth: { [key: string]: number } = {
          '6': 1, '7': 2, '8': 3, '9': 4, '0': 5
        };

        if (evt.sourceEvent.key in keyToWidth) {
          const width = keyToWidth[evt.sourceEvent.key];
          this.setCorridorWidth(width);
          this.generateDungeonWithComplexity(); // Regenerate with new corridor width
          this.visualizeDungeon(scene, false); // Don't reposition camera
          console.log(`🛤️ Corridor width set to ${width} (Complexity ${this.currentComplexity.toFixed(1)} preserved, Base rooms preserved)`);
        }
      }));

    // H key - Toggle legend visibility
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        if (evt.sourceEvent.key === 'h' || evt.sourceEvent.key === 'H') {
          this.toggleLegend();
        }
      }));

    // WASD movement controls
    this.setupWASDControls(scene);

    // Mouse wheel zoom for top-down view
    scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
        const event = pointerInfo.event as WheelEvent;
        this.handleZoom(event.deltaY);
      }
    });
  }

  /**
   * Sets up WASD movement controls for the top-down camera.
   * @private
   */
  private setupWASDControls(scene: BABYLON.Scene): void {
    // Key down events
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
        const key = evt.sourceEvent.key.toLowerCase();
        if (key in this.movementKeys) {
          this.movementKeys[key as keyof typeof this.movementKeys] = true;
        }
      }));

    // Key up events
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(
      BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
        const key = evt.sourceEvent.key.toLowerCase();
        if (key in this.movementKeys) {
          this.movementKeys[key as keyof typeof this.movementKeys] = false;
        }
      }));
  }

  /**
   * Handles zoom functionality for the top-down camera.
   * @private
   */
  private handleZoom(deltaY: number): void {
    if (!this.camera) return;

    const zoomSpeed = 2;
    const minHeight = 10;
    const maxHeight = 200;

    // Zoom in/out by adjusting camera height
    this.camera.position.y += deltaY > 0 ? zoomSpeed : -zoomSpeed;

    // Clamp camera height
    this.camera.position.y = Math.max(minHeight, Math.min(maxHeight, this.camera.position.y));
  }

  /**
   * Creates UI instructions for the scene.
   * Creates a visual legend showing all keyboard commands.
   * @private
   */
  private createUI(_scene: BABYLON.Scene): void {
    // Create legend container
    const legend = document.createElement('div');
    legend.id = 'dungeon-legend';
    legend.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      line-height: 1.4;
      z-index: 1000;
      max-width: 300px;
      border: 1px solid #444;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
    `;

    // Create legend content
    legend.innerHTML = `
      <div style="font-size: 14px; font-weight: bold; margin-bottom: 10px; color: #4CAF50;">
        🏰 Dungeon Generator Controls
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #FFD700;">Generation:</span><br>
        <kbd>G</kbd> - Generate new dungeon<br>
        <kbd>1-5</kbd> - Complexity (0.2 - 1.0)
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #FFD700;">Corridor Width:</span><br>
        <kbd>6</kbd>=1 <kbd>7</kbd>=2 <kbd>8</kbd>=3 <kbd>9</kbd>=4 <kbd>0</kbd>=5
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #FFD700;">Visualization:</span><br>
        <kbd>R</kbd> - Toggle mode (full/wireframe/rooms)<br>
        <kbd>V</kbd> - Toggle walls visibility
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #FFD700;">Camera:</span><br>
        <kbd>WASD</kbd> - Move camera<br>
        <kbd>Mouse Wheel</kbd> - Zoom in/out<br>
        <kbd>C</kbd> - Center on dungeon
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: #FFD700;">Interface:</span><br>
        <kbd>H</kbd> - Toggle this legend<br>
        <kbd>ESC</kbd> - Open main menu
      </div>
      <div style="font-size: 10px; color: #888; margin-top: 8px;">
        💡 Base rooms preserved when changing complexity/width
      </div>
    `;

    // Add CSS for kbd styling
    const style = document.createElement('style');
    style.textContent = `
      #dungeon-legend kbd {
        background: #333;
        border: 1px solid #555;
        border-radius: 3px;
        padding: 2px 4px;
        font-size: 10px;
        color: #fff;
        margin: 0 1px;
      }
    `;
    document.head.appendChild(style);

    // Add legend to page
    document.body.appendChild(legend);

    // Also log to console for developers
    console.log('🎮 Dungeon Scene Controls (Top-Down View):');
    console.log('  G - Generate new dungeon (new layout, preserves camera)');
    console.log('  1-5 - Set complexity level (preserves rooms & camera)');
    console.log('  R - Toggle visualization mode (preserves camera)');
    console.log('  V - Toggle walls visibility');
    console.log('  6-0 - Set corridor width (6=1, 7=2, 8=3, 9=4, 0=5)');
    console.log('  C - Center camera on dungeon');
    console.log('  WASD - Move camera around (smooth movement)');
    console.log('  Mouse wheel - Zoom in/out');
  }

  /**
   * Generates a new dungeon with current settings.
   * @private
   */
  private generateNewDungeon(): void {
    // Update seed for variety and clear base rooms for completely new layout
    const config = this.dungeonGenerator.getConfig();
    config.seed = Date.now();
    this.dungeonGenerator.updateConfig(config);

    // Sync currentComplexity and corridorWidth with the actual config
    this.currentComplexity = config.complexityLevel;
    this.corridorWidth = config.corridorWidth;

    // Debug: Log initial state
    console.log(`🏰 New dungeon - currentComplexity: ${this.currentComplexity}, corridorWidth: ${this.corridorWidth}, config: `, config);

    // Generate the dungeon (this will create new base rooms)
    this.currentDungeon = this.dungeonGenerator.generate(false);

    console.log(`Generated dungeon: ${this.currentDungeon.metadata.roomCount} rooms, ` +
                `${this.currentDungeon.doors.length} doors`);
  }

  /**
   * Generates a dungeon with new complexity but preserving base room layout.
   * @private
   */
  private generateDungeonWithComplexity(): void {
    // Generate dungeon preserving base rooms if they exist
    const preserveRooms = this.dungeonGenerator.hasBaseRooms();
    this.currentDungeon = this.dungeonGenerator.generate(preserveRooms);

    console.log(`Generated dungeon with preserved rooms: ${this.currentDungeon.metadata.roomCount} rooms, ` +
                `${this.currentDungeon.doors.length} doors`);
  }

  /**
   * Updates the complexity level of dungeon generation.
   * @private
   */
  private updateComplexity(complexity: number): void {
    this.currentComplexity = complexity;

    // Debug: Log current state before complexity update
    console.log(`🎛️ Before complexity update - currentComplexity: ${this.currentComplexity}, corridorWidth: ${this.corridorWidth}, config: `, this.dungeonGenerator.getConfig());

    // Preserve corridor width when updating complexity
    const config = this.dungeonGenerator.getConfig();
    config.complexityLevel = complexity;
    config.corridorWidth = this.corridorWidth; // Ensure corridor width is preserved
    this.dungeonGenerator.updateConfig(config);

    // Debug: Log state after complexity update
    console.log(`🎛️ After complexity update - currentComplexity: ${this.currentComplexity}, corridorWidth: ${this.corridorWidth}, config: `, this.dungeonGenerator.getConfig());
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
   * Toggles wall visibility.
   * @private
   */
  private toggleWalls(): void {
    this.showWalls = !this.showWalls;
  }

  /**
   * Toggles the legend visibility.
   * @private
   */
  private toggleLegend(): void {
    const legend = document.getElementById('dungeon-legend');
    if (legend) {
      legend.style.display = legend.style.display === 'none' ? 'block' : 'none';
      console.log(`📋 Legend ${legend.style.display === 'none' ? 'hidden' : 'shown'}`);
    }
  }

  /**
   * Sets the corridor width and updates the dungeon generator.
   * Preserves the current complexity level.
   * @private
   */
  private setCorridorWidth(width: number): void {
    const oldWidth = this.corridorWidth;
    this.corridorWidth = width;

    // Debug: Log current state before update
    console.log(`🛤️ Setting corridor width from ${oldWidth} to ${width}`);
    console.log(`🛤️ Before update - currentComplexity: ${this.currentComplexity}, corridorWidth: ${this.corridorWidth}, config: `, this.dungeonGenerator.getConfig());

    // Update the dungeon generator configuration while preserving complexity
    const config = this.dungeonGenerator.getConfig();
    config.corridorWidth = width;
    config.complexityLevel = this.currentComplexity; // Preserve current complexity
    this.dungeonGenerator.updateConfig(config);

    // Debug: Log state after update
    console.log(`🛤️ After update - currentComplexity: ${this.currentComplexity}, corridorWidth: ${this.corridorWidth}, config: `, this.dungeonGenerator.getConfig());
  }

  /**
   * Visualizes the current dungeon in 3D.
   * @param scene - The Babylon.js scene
   * @param forceRepositionCamera - Whether to force camera repositioning (default: false)
   * @private
   */
  private visualizeDungeon(scene: BABYLON.Scene, forceRepositionCamera: boolean = false): void {
    if (!this.currentDungeon || !this.materials) return;

    // Clear existing meshes
    this.clearDungeonMeshes();

    // Position camera (preserve position unless forced)
    this.positionCamera(forceRepositionCamera);

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
   * Centers the top-down view over the entire dungeon with a zoomed-out perspective.
   * Only repositions if this is the initial setup, preserves position otherwise.
   * @private
   */
  private positionCamera(forceReposition: boolean = false): void {
    if (!this.currentDungeon || !this.camera) return;

    // Only reposition camera on initial setup or when forced
    if (!forceReposition && this.camera.position.y > 0) {
      // Just ensure we're still looking straight down
      this.camera.rotation.x = Math.PI / 2;
      this.camera.rotation.y = 0;
      this.camera.rotation.z = 0;
      return;
    }

    // Calculate dungeon center
    const dungeonCenterX = (this.currentDungeon.metadata.width / 2) * this.tileSize;
    const dungeonCenterZ = (this.currentDungeon.metadata.height / 2) * this.tileSize;

    // Position camera high above the center for top-down view (more zoomed out)
    const cameraHeight = Math.max(this.currentDungeon.metadata.width, this.currentDungeon.metadata.height) * this.tileSize * 1.2;

    this.camera.position = new BABYLON.Vector3(dungeonCenterX, cameraHeight, dungeonCenterZ);

    // Set top-down orientation directly without using setTarget
    this.camera.rotation.x = Math.PI / 2; // Look straight down
    this.camera.rotation.y = 0;
    this.camera.rotation.z = 0;
  }

  /**
   * Creates full 3D visualization with walls and floors (no ceiling for top-down view).
   * @private
   */
  private createFullVisualization(scene: BABYLON.Scene): void {
    if (!this.currentDungeon || !this.materials) return;

    const tilemap = this.currentDungeon.tilemap;
    const width = this.currentDungeon.metadata.width;
    const height = this.currentDungeon.metadata.height;

    // Create floors for all walkable areas (no ceiling needed for top-down)
    this.createFloors(scene, tilemap, width, height);

    // Create walls (only if walls are enabled)
    if (this.showWalls) {
      this.createWalls(scene, tilemap, width, height);
    }

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
   * Creates floor meshes for walkable areas (optimized for top-down view).
   * @private
   */
  private createFloors(scene: BABYLON.Scene, tilemap: number[][], width: number, height: number): void {
    if (!this.materials) return;

    // Create merged floor mesh for performance
    const floorMeshes: BABYLON.Mesh[] = [];

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
   * Handles WASD camera movement and could be used for dynamic elements.
   *
   * @param scene - The current Babylon.js scene
   * @public
   */
  public update(scene: BABYLON.Scene): void {
    // Update camera movement based on WASD keys
    this.updateCameraMovement(scene);

    // Could add other animations:
    // - Torch flickering
    // - Door animations
    // - Particle effects
  }

  /**
   * Updates camera position based on WASD input.
   * @private
   */
  private updateCameraMovement(scene: BABYLON.Scene): void {
    if (!this.camera) return;

    const deltaTime = scene.getEngine().getDeltaTime() / 1000; // Convert to seconds
    const moveDistance = this.cameraSpeed * deltaTime * 10; // Scale for good movement speed

    // Calculate movement vector based on pressed keys
    let moveX = 0;
    let moveZ = 0;

    if (this.movementKeys.w) moveZ -= moveDistance; // Forward (negative Z)
    if (this.movementKeys.s) moveZ += moveDistance; // Backward (positive Z)
    if (this.movementKeys.a) moveX -= moveDistance; // Left (negative X)
    if (this.movementKeys.d) moveX += moveDistance; // Right (positive X)

    // Apply movement to camera position
    if (moveX !== 0 || moveZ !== 0) {
      this.camera.position.x += moveX;
      this.camera.position.z += moveZ;

      // Maintain top-down orientation without changing target
      this.camera.rotation.x = Math.PI / 2; // Always look straight down
      this.camera.rotation.y = 0;
      this.camera.rotation.z = 0;
    }
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
      this.materials = null;
    }

    // Remove legend from DOM
    const legend = document.getElementById('dungeon-legend');
    if (legend) {
      legend.remove();
    }

    // Reset movement keys
    this.movementKeys = { w: false, a: false, s: false, d: false };

    // Reset references
    this.currentDungeon = undefined;
    this.camera = undefined;
  }
}
