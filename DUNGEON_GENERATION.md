# Procedural Dungeon Generation System

## Overview

The Babylon.js game includes a comprehensive procedural dungeon generation system that creates realistic, explorable dungeons with configurable parameters. The system implements advanced algorithms for room placement, spatial separation, controlled overlapping, and pathfinding-based corridor generation.

## Features

### 🏗️ **Core Generation Algorithm**
- **Room-based generation**: Creates rectangular rooms as foundation elements
- **Spatial separation**: Prevents unwanted room overlaps using force-based algorithms
- **Controlled overlapping**: Allows intentional room intersections for complex geometries (L-shapes, T-shapes)
- **A* pathfinding**: Generates optimal corridors connecting all rooms
- **Connectivity guarantee**: Ensures no room is isolated from the dungeon network

### 🎛️ **Configurable Parameters**
- `dungeonWidth/Height`: Overall dungeon dimensions (tiles)
- `minRooms/maxRooms`: Room count range (5-15 recommended)
- `minRoomSize/maxRoomSize`: Room dimension constraints (4-12 recommended)
- `complexityLevel`: Controls corridor branching and overlaps (0.0-1.0)
- `corridorWidth`: Passage width in tiles (1-3)
- `overlapChance`: Room intersection probability (0.0-1.0)
- `seed`: Optional deterministic generation seed

### 🎮 **3D Visualization**
- **Full 3D rendering**: Walls, floors, ceilings, and doors
- **Multiple view modes**: Full, wireframe, and room-only visualization
- **First-person exploration**: WASD movement with collision detection
- **Atmospheric lighting**: Ambient and directional lighting with shadows
- **Performance optimized**: Mesh merging for large dungeons

## Usage

### Basic Generation

```typescript
import { DungeonGenerator, DungeonConfig } from './dungeonGenerator';

// Create generator with configuration
const config: DungeonConfig = {
  dungeonWidth: 50,
  dungeonHeight: 50,
  minRooms: 6,
  maxRooms: 12,
  minRoomSize: 4,
  maxRoomSize: 10,
  complexityLevel: 0.7,
  corridorWidth: 1,
  overlapChance: 0.3,
  seed: 12345 // Optional for reproducible dungeons
};

const generator = new DungeonGenerator(config);
const dungeon = generator.generate();

console.log(`Generated ${dungeon.metadata.roomCount} rooms`);
console.log(`Dungeon size: ${dungeon.metadata.width}x${dungeon.metadata.height}`);
```

### Accessing Generated Data

```typescript
// Room information
for (const room of dungeon.rooms) {
  console.log(`Room ${room.id}: ${room.width}x${room.height} at (${room.x}, ${room.y})`);
  console.log(`Type: ${room.type}, Connected to: ${room.connectedTo.join(', ')}`);
}

// Tilemap data (0=wall, 1=floor, 2=door)
const tilemap = dungeon.tilemap;
for (let y = 0; y < tilemap.length; y++) {
  for (let x = 0; x < tilemap[y].length; x++) {
    const tile = tilemap[y][x];
    // Process tile data for rendering or game logic
  }
}

// Door locations
for (const door of dungeon.doors) {
  console.log(`Door at (${door.x}, ${door.y}) connects ${door.connectsRooms.join(' and ')}`);
}
```

### Dynamic Configuration

```typescript
// Update parameters and regenerate
generator.updateConfig({
  complexityLevel: 0.9,
  overlapChance: 0.5,
  seed: Date.now()
});

const newDungeon = generator.generate();
```

## Scene 3: Interactive Dungeon Explorer (Top-Down View)

### Controls
- **G**: Generate new dungeon (new layout, preserves camera position)
- **1-5**: Set complexity level (0.2 - 1.0, preserves base rooms & camera position)
- **R**: Toggle visualization mode (full/wireframe/rooms, preserves camera position)
- **V**: Toggle walls visibility
- **6-0**: Set corridor width (6=1, 7=2, 8=3, 9=4, 0=5, preserves base rooms & camera position)
- **C**: Center camera on dungeon
- **WASD**: Move camera (top-down navigation)
- **Mouse wheel**: Zoom in/out

### Visualization Modes

1. **Full Mode**: Complete 3D dungeon with walls, floors, and doors (optimized for top-down view)
2. **Wireframe Mode**: Room boundaries shown as green wireframes
3. **Rooms Mode**: Colored blocks representing different room types
   - Green: Regular rooms
   - Yellow: Corridors
   - Red: Intersections

## Algorithm Details

### 1. Room Generation
```typescript
// Generate room candidates (3x target count for selection)
const candidates = generateRoomCandidates(roomCount * 3);

// Apply spatial separation to prevent overlaps
applySpatialSeparation(candidates);

// Select best distributed rooms
selectBestRooms(candidates, roomCount);
```

### 2. Spatial Separation
Uses force-based algorithm to push overlapping rooms apart:
```typescript
for (each room pair) {
  if (rooms overlap) {
    calculate separation force based on overlap amount
    apply force to move rooms apart
  }
}
```

### 3. Controlled Overlapping
Selectively allows room intersections for interesting shapes:
```typescript
if (random() < overlapChance * complexityLevel) {
  if (overlap creates L or T shape) {
    merge rooms into complex geometry
  }
}
```

### 4. Corridor Generation
Uses A* pathfinding to connect rooms optimally:
```typescript
// Create minimum spanning tree for basic connectivity
const connections = generateMinimumSpanningTree(rooms);

// Add complexity-based additional connections
addComplexityConnections(connections);

// Generate corridors using A* pathfinding
for (const connection of connections) {
  const path = findPath(connection.from, connection.to);
  carveCorridor(path);
}
```

## Performance Considerations

### Optimization Techniques
- **Mesh merging**: Combines similar meshes for better rendering performance
- **Collision optimization**: Only visible walls have collision detection
- **LOD potential**: System designed for level-of-detail implementation
- **Memory management**: Proper disposal of resources when switching scenes

### Recommended Limits
- **Small dungeons**: 20x20 tiles, 5-8 rooms (instant generation)
- **Medium dungeons**: 50x50 tiles, 8-15 rooms (< 100ms generation)
- **Large dungeons**: 100x100 tiles, 15-25 rooms (< 500ms generation)

## Integration Examples

### Custom Game Logic
```typescript
// Find spawn room (largest room)
const spawnRoom = dungeon.rooms
  .filter(r => r.type === 'room')
  .sort((a, b) => (b.width * b.height) - (a.width * a.height))[0];

// Place player at room center
const playerX = spawnRoom.x + Math.floor(spawnRoom.width / 2);
const playerY = spawnRoom.y + Math.floor(spawnRoom.height / 2);

// Find exit room (furthest from spawn)
const exitRoom = findFurthestRoom(spawnRoom, dungeon.rooms);
```

### Procedural Content
```typescript
// Place enemies in rooms based on size
for (const room of dungeon.rooms) {
  if (room.type === 'room') {
    const enemyCount = Math.floor((room.width * room.height) / 20);
    placeEnemies(room, enemyCount);
  }
}

// Place treasures near dead ends
const deadEnds = findDeadEndRooms(dungeon.rooms);
for (const deadEnd of deadEnds) {
  placeTreasure(deadEnd);
}
```

## Future Enhancements

### Planned Features
- **Themed room generation**: Different room types (treasure, boss, puzzle)
- **Multi-level dungeons**: Stairs and vertical connections
- **Biome support**: Different visual themes and generation rules
- **Advanced pathfinding**: Support for one-way passages and secret doors
- **Procedural decoration**: Furniture, props, and environmental details

### Extension Points
- **Custom room shapes**: Beyond rectangular rooms
- **Special room types**: Circular rooms, irregular shapes
- **Environmental hazards**: Traps, water, lava
- **Dynamic elements**: Moving platforms, rotating rooms

## Technical Architecture

The system is built with modularity and extensibility in mind:

- **`DungeonGenerator`**: Core generation logic
- **`Scene4`**: 3D visualization and interaction
- **Configurable interfaces**: Easy parameter adjustment
- **Deterministic generation**: Reproducible results with seeds
- **Performance optimized**: Suitable for real-time generation

This comprehensive system provides a solid foundation for procedural dungeon-based games while maintaining flexibility for custom requirements and future enhancements.
