/**
 * Comprehensive dungeon generation system for procedural dungeon creation.
 * Implements room-based generation with spatial separation, controlled overlapping,
 * and pathfinding-based corridor generation.
 * 
 * Features:
 * - Room-based generation with configurable parameters
 * - Spatial separation to prevent unwanted overlaps
 * - Controlled room overlapping for complex geometries
 * - A* pathfinding for corridor generation
 * - Deterministic random generation with optional seeding
 * - Comprehensive output format for 3D visualization
 * 
 * @example
 * ```typescript
 * const generator = new DungeonGenerator({
 *   dungeonWidth: 50,
 *   dungeonHeight: 50,
 *   minRooms: 5,
 *   maxRooms: 10,
 *   complexityLevel: 0.7
 * });
 * 
 * const dungeon = generator.generate();
 * console.log(`Generated ${dungeon.metadata.roomCount} rooms`);
 * ```
 */

/**
 * Configuration parameters for dungeon generation.
 */
export interface DungeonConfig {
  /** Overall dungeon width in tiles */
  dungeonWidth: number;
  
  /** Overall dungeon height in tiles */
  dungeonHeight: number;
  
  /** Minimum number of rooms to generate */
  minRooms: number;
  
  /** Maximum number of rooms to generate */
  maxRooms: number;
  
  /** Minimum room size (width/height) */
  minRoomSize: number;
  
  /** Maximum room size (width/height) */
  maxRoomSize: number;
  
  /** Complexity level controlling corridor branching and overlaps (0-1) */
  complexityLevel: number;
  
  /** Width of connecting corridors in tiles */
  corridorWidth: number;
  
  /** Probability of allowing room intersections (0-1) */
  overlapChance: number;
  
  /** Optional seed for deterministic generation */
  seed?: number;
}

/**
 * Represents a room or corridor in the dungeon.
 */
export interface Room {
  /** Unique identifier for the room */
  id: string;
  
  /** X coordinate of the room's top-left corner */
  x: number;
  
  /** Y coordinate of the room's top-left corner */
  y: number;
  
  /** Width of the room in tiles */
  width: number;
  
  /** Height of the room in tiles */
  height: number;
  
  /** Type of the room */
  type: 'room' | 'corridor' | 'intersection';
  
  /** IDs of rooms connected to this room */
  connectedTo: string[];
}

/**
 * Represents a door connecting two rooms.
 */
export interface Door {
  /** X coordinate of the door */
  x: number;
  
  /** Y coordinate of the door */
  y: number;
  
  /** IDs of the two rooms this door connects */
  connectsRooms: [string, string];
}

/**
 * Complete dungeon data structure.
 */
export interface DungeonData {
  /** Metadata about the generated dungeon */
  metadata: {
    /** Dungeon width in tiles */
    width: number;
    
    /** Dungeon height in tiles */
    height: number;
    
    /** Total number of rooms generated */
    roomCount: number;
    
    /** Seed used for generation (if any) */
    generationSeed?: number;
  };
  
  /** Array of all rooms and corridors */
  rooms: Room[];
  
  /** 2D tilemap where 0=wall, 1=floor, 2=door */
  tilemap: number[][];
  
  /** Array of all doors in the dungeon */
  doors: Door[];
}

/**
 * Point structure for pathfinding and spatial calculations.
 */
interface Point {
  x: number;
  y: number;
}

/**
 * Node structure for A* pathfinding algorithm.
 */
interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start
  h: number; // Heuristic cost to goal
  f: number; // Total cost (g + h)
  parent?: PathNode;
}

/**
 * Seeded random number generator for deterministic generation.
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
  }

  /**
   * Generates a random number between 0 and 1.
   */
  public random(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  /**
   * Generates a random integer between min and max (inclusive).
   */
  public randomInt(min: number, max: number): number {
    return Math.floor(this.random() * (max - min + 1)) + min;
  }

  /**
   * Generates a random boolean with the given probability.
   */
  public randomBool(probability: number = 0.5): boolean {
    return this.random() < probability;
  }
}

/**
 * Main dungeon generator class implementing room-based procedural generation.
 */
export class DungeonGenerator {
  private config: DungeonConfig;
  private rng: SeededRandom;
  private rooms: Room[] = [];
  private tilemap: number[][] = [];
  private doors: Door[] = [];
  private baseRooms: Room[] = []; // Store the initial room layout

  /**
   * Creates a new DungeonGenerator instance.
   * 
   * @param config - Configuration parameters for dungeon generation
   */
  constructor(config: DungeonConfig) {
    this.config = {
      dungeonWidth: 50,
      dungeonHeight: 50,
      minRooms: 5,
      maxRooms: 10,
      minRoomSize: 4,
      maxRoomSize: 12,
      complexityLevel: 0.5,
      corridorWidth: 1,
      overlapChance: 0.3,
      ...config
    };
    
    this.rng = new SeededRandom(this.config.seed);
  }

  /**
   * Generates a complete dungeon based on the configuration.
   *
   * @param preserveBaseRooms - Whether to keep the same base room layout
   * @returns Complete dungeon data structure
   */
  public generate(preserveBaseRooms: boolean = false): DungeonData {
    this.reset();
    this.initializeTilemap();

    if (preserveBaseRooms && this.baseRooms.length > 0) {
      // Use existing base rooms and only regenerate connections
      this.restoreBaseRooms();
    } else {
      // Generate new rooms and save them as base rooms
      this.generateRooms();
      this.saveBaseRooms();
    }

    this.connectRooms();
    this.placeDoors();

    return {
      metadata: {
        width: this.config.dungeonWidth,
        height: this.config.dungeonHeight,
        roomCount: this.rooms.filter(r => r.type === 'room').length,
        generationSeed: this.config.seed
      },
      rooms: [...this.rooms],
      tilemap: this.tilemap.map(row => [...row]),
      doors: [...this.doors]
    };
  }

  /**
   * Saves the current room layout as the base rooms.
   * @private
   */
  private saveBaseRooms(): void {
    this.baseRooms = this.rooms
      .filter(room => room.type === 'room')
      .map(room => ({
        ...room,
        connectedTo: [] // Reset connections
      }));
  }

  /**
   * Restores the base room layout.
   * @private
   */
  private restoreBaseRooms(): void {
    this.rooms = this.baseRooms.map(room => ({
      ...room,
      connectedTo: [] // Reset connections for new complexity level
    }));

    // Carve the restored rooms into the tilemap
    this.carveRooms();
  }

  /**
   * Resets the generator state for a new generation.
   * @private
   */
  private reset(): void {
    this.rooms = [];
    this.doors = [];
    this.tilemap = [];
  }

  /**
   * Initializes the tilemap with walls.
   * @private
   */
  private initializeTilemap(): void {
    this.tilemap = Array(this.config.dungeonHeight)
      .fill(null)
      .map(() => Array(this.config.dungeonWidth).fill(0));
  }

  /**
   * Generates the initial set of rooms with spatial separation.
   * @private
   */
  private generateRooms(): void {
    const roomCount = this.rng.randomInt(this.config.minRooms, this.config.maxRooms);
    const candidates: Room[] = [];

    // Generate room candidates
    for (let i = 0; i < roomCount * 3; i++) {
      const width = this.rng.randomInt(this.config.minRoomSize, this.config.maxRoomSize);
      const height = this.rng.randomInt(this.config.minRoomSize, this.config.maxRoomSize);
      const x = this.rng.randomInt(1, this.config.dungeonWidth - width - 1);
      const y = this.rng.randomInt(1, this.config.dungeonHeight - height - 1);

      candidates.push({
        id: `room_${i}`,
        x, y, width, height,
        type: 'room',
        connectedTo: []
      });
    }

    // Apply spatial separation
    this.applySpatialSeparation(candidates);

    // Select best rooms
    this.selectBestRooms(candidates, roomCount);

    // Apply controlled overlapping
    this.applyControlledOverlapping();

    // Carve rooms into tilemap
    this.carveRooms();
  }

  /**
   * Applies spatial separation algorithm to prevent room overlaps.
   * @private
   */
  private applySpatialSeparation(candidates: Room[]): void {
    const iterations = 50;
    const separationForce = 2;

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < candidates.length; i++) {
        const room = candidates[i];
        let forceX = 0;
        let forceY = 0;

        for (let j = 0; j < candidates.length; j++) {
          if (i === j) continue;

          const other = candidates[j];
          const overlap = this.calculateOverlap(room, other);

          if (overlap.x > 0 && overlap.y > 0) {
            const centerX1 = room.x + room.width / 2;
            const centerY1 = room.y + room.height / 2;
            const centerX2 = other.x + other.width / 2;
            const centerY2 = other.y + other.height / 2;

            const dx = centerX1 - centerX2;
            const dy = centerY1 - centerY2;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            forceX += (dx / distance) * separationForce;
            forceY += (dy / distance) * separationForce;
          }
        }

        // Apply force with bounds checking
        room.x = Math.max(1, Math.min(this.config.dungeonWidth - room.width - 1,
                                     Math.round(room.x + forceX)));
        room.y = Math.max(1, Math.min(this.config.dungeonHeight - room.height - 1,
                                     Math.round(room.y + forceY)));
      }
    }
  }

  /**
   * Calculates overlap between two rooms.
   * @private
   */
  private calculateOverlap(room1: Room, room2: Room): { x: number; y: number } {
    const overlapX = Math.max(0, Math.min(room1.x + room1.width, room2.x + room2.width) -
                                 Math.max(room1.x, room2.x));
    const overlapY = Math.max(0, Math.min(room1.y + room1.height, room2.y + room2.height) -
                                 Math.max(room1.y, room2.y));
    return { x: overlapX, y: overlapY };
  }

  /**
   * Selects the best rooms based on distribution and size.
   * @private
   */
  private selectBestRooms(candidates: Room[], targetCount: number): void {
    // Sort by area (larger rooms preferred)
    candidates.sort((a, b) => (b.width * b.height) - (a.width * a.height));

    // Select rooms with good distribution
    const selected: Room[] = [];

    for (const candidate of candidates) {
      if (selected.length >= targetCount) break;

      // Check if this room is well-distributed
      let tooClose = false;
      for (const existing of selected) {
        const distance = this.calculateDistance(
          { x: candidate.x + candidate.width / 2, y: candidate.y + candidate.height / 2 },
          { x: existing.x + existing.width / 2, y: existing.y + existing.height / 2 }
        );

        if (distance < Math.min(this.config.dungeonWidth, this.config.dungeonHeight) * 0.2) {
          tooClose = true;
          break;
        }
      }

      if (!tooClose) {
        selected.push(candidate);
      }
    }

    // Fill remaining slots if needed
    while (selected.length < targetCount && selected.length < candidates.length) {
      for (const candidate of candidates) {
        if (!selected.includes(candidate)) {
          selected.push(candidate);
          break;
        }
      }
    }

    this.rooms = selected;
  }

  /**
   * Calculates Euclidean distance between two points.
   * @private
   */
  private calculateDistance(p1: Point, p2: Point): number {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Applies controlled overlapping to create complex room shapes.
   * @private
   */
  private applyControlledOverlapping(): void {
    if (this.config.overlapChance <= 0) return;

    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        if (this.rng.randomBool(this.config.overlapChance * this.config.complexityLevel)) {
          this.attemptRoomMerge(this.rooms[i], this.rooms[j]);
        }
      }
    }
  }

  /**
   * Attempts to merge two rooms if they can create interesting shapes.
   * @private
   */
  private attemptRoomMerge(room1: Room, room2: Room): void {
    const overlap = this.calculateOverlap(room1, room2);

    // Only merge if there's a small overlap that creates L or T shapes
    if (overlap.x > 0 && overlap.y > 0 &&
        overlap.x < Math.min(room1.width, room2.width) * 0.7 &&
        overlap.y < Math.min(room1.height, room2.height) * 0.7) {

      // Create merged room bounds
      const minX = Math.min(room1.x, room2.x);
      const minY = Math.min(room1.y, room2.y);
      const maxX = Math.max(room1.x + room1.width, room2.x + room2.width);
      const maxY = Math.max(room1.y + room1.height, room2.y + room2.height);

      // Update first room to encompass both
      room1.x = minX;
      room1.y = minY;
      room1.width = maxX - minX;
      room1.height = maxY - minY;

      // Remove second room
      const index = this.rooms.indexOf(room2);
      if (index > -1) {
        this.rooms.splice(index, 1);
      }
    }
  }

  /**
   * Carves room spaces into the tilemap.
   * @private
   */
  private carveRooms(): void {
    for (const room of this.rooms) {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (this.isValidTile(x, y)) {
            this.tilemap[y][x] = 1; // Floor
          }
        }
      }
    }
  }

  /**
   * Connects all rooms using A* pathfinding for corridor generation.
   * @private
   */
  private connectRooms(): void {
    if (this.rooms.length < 2) return;

    // Create minimum spanning tree for room connections
    const connections = this.generateMinimumSpanningTree();

    // Add additional connections based on complexity level
    this.addComplexityConnections(connections);

    // Generate corridors for each connection
    for (const connection of connections) {
      this.generateCorridor(connection.from, connection.to);
    }
  }

  /**
   * Generates a minimum spanning tree for room connections.
   * @private
   */
  private generateMinimumSpanningTree(): Array<{ from: Room; to: Room; distance: number }> {
    const connections: Array<{ from: Room; to: Room; distance: number }> = [];
    const connected = new Set<Room>();

    // Start with first room
    connected.add(this.rooms[0]);

    while (connected.size < this.rooms.length) {
      let shortestConnection: { from: Room; to: Room; distance: number } | null = null;

      // Find shortest connection from connected rooms to unconnected rooms
      for (const connectedRoom of connected) {
        for (const unconnectedRoom of this.rooms) {
          if (connected.has(unconnectedRoom)) continue;

          const distance = this.calculateDistance(
            this.getRoomCenter(connectedRoom),
            this.getRoomCenter(unconnectedRoom)
          );

          if (!shortestConnection || distance < shortestConnection.distance) {
            shortestConnection = { from: connectedRoom, to: unconnectedRoom, distance };
          }
        }
      }

      if (shortestConnection) {
        connections.push(shortestConnection);
        connected.add(shortestConnection.to);

        // Update room connections
        shortestConnection.from.connectedTo.push(shortestConnection.to.id);
        shortestConnection.to.connectedTo.push(shortestConnection.from.id);
      }
    }

    return connections;
  }

  /**
   * Gets the center point of a room.
   * @private
   */
  private getRoomCenter(room: Room): Point {
    return {
      x: room.x + Math.floor(room.width / 2),
      y: room.y + Math.floor(room.height / 2)
    };
  }

  /**
   * Adds additional connections based on complexity level.
   * @private
   */
  private addComplexityConnections(connections: Array<{ from: Room; to: Room; distance: number }>): void {
    const additionalConnections = Math.floor(this.rooms.length * this.config.complexityLevel);

    for (let i = 0; i < additionalConnections; i++) {
      const room1 = this.rooms[this.rng.randomInt(0, this.rooms.length - 1)];
      const room2 = this.rooms[this.rng.randomInt(0, this.rooms.length - 1)];

      if (room1 !== room2 && !room1.connectedTo.includes(room2.id)) {
        const distance = this.calculateDistance(
          this.getRoomCenter(room1),
          this.getRoomCenter(room2)
        );

        connections.push({ from: room1, to: room2, distance });
        room1.connectedTo.push(room2.id);
        room2.connectedTo.push(room1.id);
      }
    }
  }

  /**
   * Generates a corridor between two rooms using A* pathfinding.
   * @private
   */
  private generateCorridor(fromRoom: Room, toRoom: Room): void {
    const start = this.getRoomCenter(fromRoom);
    const end = this.getRoomCenter(toRoom);

    const path = this.findPath(start, end);

    if (path.length > 0) {
      this.carveCorridor(path);

      // Create corridor room entries for complex intersections
      if (path.length > 4) {
        const corridorRoom: Room = {
          id: `corridor_${fromRoom.id}_${toRoom.id}`,
          x: Math.min(start.x, end.x),
          y: Math.min(start.y, end.y),
          width: Math.abs(end.x - start.x) + this.config.corridorWidth,
          height: Math.abs(end.y - start.y) + this.config.corridorWidth,
          type: 'corridor',
          connectedTo: [fromRoom.id, toRoom.id]
        };

        this.rooms.push(corridorRoom);
      }
    }
  }

  /**
   * A* pathfinding algorithm for corridor generation.
   * @private
   */
  private findPath(start: Point, end: Point): Point[] {
    const openSet: PathNode[] = [];
    const closedSet = new Set<string>();

    const startNode: PathNode = {
      x: start.x,
      y: start.y,
      g: 0,
      h: this.heuristic(start, end),
      f: 0
    };
    startNode.f = startNode.g + startNode.h;

    openSet.push(startNode);

    while (openSet.length > 0) {
      // Find node with lowest f score
      let currentIndex = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[currentIndex].f) {
          currentIndex = i;
        }
      }

      const current = openSet.splice(currentIndex, 1)[0];
      const currentKey = `${current.x},${current.y}`;
      closedSet.add(currentKey);

      // Check if we reached the goal
      if (current.x === end.x && current.y === end.y) {
        return this.reconstructPath(current);
      }

      // Check neighbors
      const neighbors = this.getNeighbors(current);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey) || !this.isValidPathTile(neighbor.x, neighbor.y)) {
          continue;
        }

        // Inside the A* loop where you calculate tentativeG
        const moveCost = this.tilemap[neighbor.y][neighbor.x] === 1 ? 0.5 : 1; // Prefer existing floors
        const tentativeG = current.g + moveCost;

        let existingNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

        if (!existingNode) {
          existingNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.heuristic(neighbor, end),
            f: 0,
            parent: current
          };
          existingNode.f = existingNode.g + existingNode.h;
          openSet.push(existingNode);
        } else if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = existingNode.g + existingNode.h;
          existingNode.parent = current;
        }
      }
    }

    return []; // No path found
  }

  /**
   * Heuristic function for A* (Manhattan distance).
   * @private
   */
  private heuristic(a: Point, b: Point): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  /**
   * Gets valid neighbors for pathfinding.
   * @private
   */
  private getNeighbors(node: Point): Point[] {
    const neighbors: Point[] = [];
    const directions = [
      { x: 0, y: -1 }, // Up
      { x: 1, y: 0 },  // Right
      { x: 0, y: 1 },  // Down
      { x: -1, y: 0 }  // Left
    ];

    for (const dir of directions) {
      neighbors.push({
        x: node.x + dir.x,
        y: node.y + dir.y
      });
    }

    return neighbors;
  }

  /**
   * Reconstructs the path from the goal node.
   * @private
   */
  private reconstructPath(node: PathNode): Point[] {
    const path: Point[] = [];
    let current: PathNode | undefined = node;

    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }

    return path;
  }

  /**
   * Carves a corridor path into the tilemap.
   * Creates corridors with the exact specified width.
   * @private
   */
  private carveCorridor(path: Point[]): void {
    const width = this.config.corridorWidth;
    const halfWidth = Math.floor((width - 1) / 2);

    for (const point of path) {
      // Carve corridor with exact width
      for (let dy = -halfWidth; dy < width - halfWidth; dy++) {
        for (let dx = -halfWidth; dx < width - halfWidth; dx++) {
          const x = point.x + dx;
          const y = point.y + dy;

          if (this.isValidTile(x, y)) {
            this.tilemap[y][x] = 1; // Floor
          }
        }
      }
    }
  }

  /**
   * Places doors at room entrances.
   * @private
   */
  private placeDoors(): void {
    for (const room of this.rooms) {
      if (room.type !== 'room') continue;

      // Find potential door locations on room perimeter
      const doorCandidates = this.findDoorCandidates(room);

      // Place doors for connected rooms
      for (const connectedRoomId of room.connectedTo) {
        const connectedRoom = this.rooms.find(r => r.id === connectedRoomId);
        if (!connectedRoom) continue;

        // Find best door location between these rooms
        const doorLocation = this.findBestDoorLocation(room, connectedRoom, doorCandidates);

        if (doorLocation) {
          this.tilemap[doorLocation.y][doorLocation.x] = 2; // Door
          this.doors.push({
            x: doorLocation.x,
            y: doorLocation.y,
            connectsRooms: [room.id, connectedRoom.id]
          });
        }
      }
    }
  }

  /**
   * Finds potential door locations on room perimeter.
   * @private
   */
  private findDoorCandidates(room: Room): Point[] {
    const candidates: Point[] = [];

    // Top and bottom walls
    for (let x = room.x + 1; x < room.x + room.width - 1; x++) {
      candidates.push({ x, y: room.y }); // Top wall
      candidates.push({ x, y: room.y + room.height - 1 }); // Bottom wall
    }

    // Left and right walls
    for (let y = room.y + 1; y < room.y + room.height - 1; y++) {
      candidates.push({ x: room.x, y }); // Left wall
      candidates.push({ x: room.x + room.width - 1, y }); // Right wall
    }

    return candidates.filter(point => this.isValidDoorLocation(point));
  }

  /**
   * Finds the best door location between two rooms.
   * @private
   */
  private findBestDoorLocation(room1: Room, room2: Room, candidates: Point[]): Point | null {
    const room2Center = this.getRoomCenter(room2);
    let bestCandidate: Point | null = null;
    let shortestDistance = Infinity;

    for (const candidate of candidates) {
      const distance = this.calculateDistance(candidate, room2Center);

      if (distance < shortestDistance) {
        shortestDistance = distance;
        bestCandidate = candidate;
      }
    }

    return bestCandidate;
  }

  /**
   * Checks if a tile coordinate is valid within the dungeon bounds.
   * @private
   */
  private isValidTile(x: number, y: number): boolean {
    return x >= 0 && x < this.config.dungeonWidth &&
           y >= 0 && y < this.config.dungeonHeight;
  }

  /**
   * Checks if a tile is valid for pathfinding (not a wall in a room).
   * Accounts for corridor width to ensure corridors don't extend beyond boundaries.
   * @private
   */
  private isValidPathTile(x: number, y: number): boolean {
    const width = this.config.corridorWidth;
    const halfWidth = Math.floor((width - 1) / 2);

    // Check if the corridor with exact width would fit within bounds
    for (let dy = -halfWidth; dy < width - halfWidth; dy++) {
      for (let dx = -halfWidth; dx < width - halfWidth; dx++) {
        if (!this.isValidTile(x + dx, y + dy)) {
          return false;
        }
      }
    }

    // Allow pathfinding through walls but prefer existing floors
    return true;
  }

  /**
   * Checks if a location is valid for door placement.
   * @private
   */
  private isValidDoorLocation(point: Point): boolean {
    if (!this.isValidTile(point.x, point.y)) return false;

    // Check if there's a corridor adjacent to this wall
    const directions = [
      { x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }
    ];

    for (const dir of directions) {
      const adjX = point.x + dir.x;
      const adjY = point.y + dir.y;

      if (this.isValidTile(adjX, adjY) && this.tilemap[adjY][adjX] === 1) {
        return true;
      }
    }

    return false;
  }

  /**
   * Gets the current configuration.
   *
   * @returns The current dungeon generation configuration
   */
  public getConfig(): DungeonConfig {
    return { ...this.config };
  }

  /**
   * Updates the configuration for the next generation.
   *
   * @param newConfig - Partial configuration to update
   */
  public updateConfig(newConfig: Partial<DungeonConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.rng = new SeededRandom(this.config.seed);

    // Clear base rooms if seed changes (new dungeon layout)
    if (newConfig.seed !== undefined) {
      this.clearBaseRooms();
    }
  }

  /**
   * Clears the saved base room layout.
   * @public
   */
  public clearBaseRooms(): void {
    this.baseRooms = [];
  }

  /**
   * Checks if base rooms are available for preservation.
   * @returns True if base rooms exist
   * @public
   */
  public hasBaseRooms(): boolean {
    return this.baseRooms.length > 0;
  }
}
