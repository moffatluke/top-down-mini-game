/**
 * Simplified Zelda-style Game Map Class
 * 
 * MODERNIZATION NOTE:
 * This file has been simplified! Room-specific generation code has been moved to:
 * - js/zelda/rooms/BaseRoom.js - Core room functionality
 * - js/zelda/rooms/MainRoom.js - Main overworld room
 * - js/zelda/rooms/StaffRoom.js - Second area room
 * - js/zelda/rooms/ForestRoom.js - Forest area room
 * - js/zelda/rooms/RoomManager.js - Room switching logic
 * 
 * This reduces file complexity from 1200+ lines to a more manageable size.
 * Use RoomManager for new room-based development!
 */
class ZeldaGameMap {
    constructor(spriteLoader, roomName = 'main') {
        this.spriteLoader = spriteLoader;
        this.roomName = roomName;
        this.tileSize = 24;
        this.width = 42;
        this.height = 32;
        
        // Tile type definitions
        this.TILE_TYPES = {
            GRASS: 0,
            GRAVEL: 1,      // This will be our auto-tiling road system
            STONE: 2,
            WALL: 3,
            WATER: 4,
            EXIT: 5,
            TREE: 6,
            HOUSE: 7,
            BRIDGE: 8,
            DIRT: 9,
            SAND: 10,
            FLOWER: 11,
            ROCK: 12,
            BUSH: 13,
            MUSHROOM: 14,
            CRYSTAL: 15,
            OLD_LOG: 16,
            WOOD_LOG: 17,
            STUMP: 18,
            FOUNTAIN: 19,
            HOUSE: 20
        };
        
        // Standard grass tile coordinate
        this.GRASS_TILE = { x: 0, y: 0 };
        
        // Simple tile definitions - no massive arrays needed
        this.BUSH_TILES = {
            LEFT: { x: 0, y: 16 },
            RIGHT: { x: 1, y: 16 }
        };
        
        this.TREE_TILES = {
            TOP_LEFT: { x: 5, y: 16 },
            TOP_RIGHT: { x: 6, y: 16 },
            BOTTOM_LEFT: { x: 5, y: 17 },
            BOTTOM_RIGHT: { x: 6, y: 17 }
        };
        
        // Tree stump tiles (2x2 pattern) - simplified
        this.STUMP_TILES = {
            TOP_LEFT: { x: 31, y: 3 },
            TOP_RIGHT: { x: 32, y: 3 },
            BOTTOM_LEFT: { x: 31, y: 4 },
            BOTTOM_RIGHT: { x: 32, y: 4 }
        };

        // Simplified fountain - just one frame
        // Fountain tiles (3x3 animated pattern with 3 frames)
        this.FOUNTAIN_TILES = {
            FRAME1: {
                TOP_LEFT: { x: 22, y: 9 }, TOP_CENTER: { x: 23, y: 9 }, TOP_RIGHT: { x: 24, y: 9 },
                MID_LEFT: { x: 22, y: 10 }, MID_CENTER: { x: 23, y: 10 }, MID_RIGHT: { x: 24, y: 10 },
                BOTTOM_LEFT: { x: 22, y: 11 }, BOTTOM_CENTER: { x: 23, y: 11 }, BOTTOM_RIGHT: { x: 24, y: 11 }
            },
            FRAME2: {
                TOP_LEFT: { x: 25, y: 9 }, TOP_CENTER: { x: 26, y: 9 }, TOP_RIGHT: { x: 27, y: 9 },
                MID_LEFT: { x: 25, y: 10 }, MID_CENTER: { x: 26, y: 10 }, MID_RIGHT: { x: 27, y: 10 },
                BOTTOM_LEFT: { x: 25, y: 11 }, BOTTOM_CENTER: { x: 26, y: 11 }, BOTTOM_RIGHT: { x: 27, y: 11 }
            },
            FRAME3: {
                TOP_LEFT: { x: 28, y: 9 }, TOP_CENTER: { x: 29, y: 9 }, TOP_RIGHT: { x: 30, y: 9 },
                MID_LEFT: { x: 28, y: 10 }, MID_CENTER: { x: 29, y: 10 }, MID_RIGHT: { x: 30, y: 10 },
                BOTTOM_LEFT: { x: 28, y: 11 }, BOTTOM_CENTER: { x: 29, y: 11 }, BOTTOM_RIGHT: { x: 30, y: 11 }
            }
        };
        
        // Animation timing
        this.fountainAnimationSpeed = 500; // 500ms per frame
        this.fountainStartTime = Date.now();
        
        // Road auto-tiling coordinates (3x3 pattern)
        this.ROAD_TILES = {
            // Top row (y=29)
            TOP_LEFT: { x: 0, y: 29 },
            TOP_CENTER: { x: 1, y: 29 },
            TOP_RIGHT: { x: 2, y: 29 },
            // Middle row (y=30) 
            MID_LEFT: { x: 0, y: 30 },
            MID_CENTER: { x: 1, y: 30 },  // This is the dirt road center
            MID_RIGHT: { x: 2, y: 30 },
            // Bottom row (y=31)
            BOTTOM_LEFT: { x: 0, y: 31 },
            BOTTOM_CENTER: { x: 1, y: 31 },
            BOTTOM_RIGHT: { x: 2, y: 31 }
        };
        
        // Log tiles (3-tile horizontal log pattern)
        this.LOG_TILES = {
            LEFT: { x: 3, y: 5 },    // Left end of log
            MIDDLE: { x: 4, y: 5 },  // Middle section of log
            RIGHT: { x: 5, y: 5 }    // Right end of log
        };
        
        // Pond auto-tiling coordinates (3x3 pattern)
        this.POND_TILES = {
            // Top row (y=6)
            TOP_LEFT: { x: 2, y: 6 },
            TOP_CENTER: { x: 3, y: 6 },
            TOP_RIGHT: { x: 4, y: 6 },
            // Middle row (y=7) 
            MID_LEFT: { x: 2, y: 7 },
            MID_CENTER: { x: 3, y: 7 },  // This is the pure water center
            MID_RIGHT: { x: 4, y: 7 },
            // Bottom row (y=8)
            BOTTOM_LEFT: { x: 2, y: 8 },
            BOTTOM_CENTER: { x: 3, y: 8 },
            BOTTOM_RIGHT: { x: 4, y: 8 }
        };
        
        // Inverted corner tiles for smooth road intersections (interior corners)
        this.INVERTED_CORNERS = {
            TOP_LEFT: { x: 0, y: 32 },     // Interior top-left corner
            TOP_RIGHT: { x: 1, y: 32 },    // Interior top-right corner
            BOTTOM_LEFT: { x: 0, y: 33 },  // Interior bottom-left corner
            BOTTOM_RIGHT: { x: 1, y: 33 }  // Interior bottom-right corner
        };
        
        this.tiles = [];
        this.overlays = [];
        this.exits = [];
        this.items = [];
        this.fireTiles = new Map();
        this.fireDuration = 5000;
        this.maxFireTiles = 25;
        
        this.generateMap();
    }

    generateMap() {
        this.tiles = [];
        this.overlays = [];
        
        // ========================================
        // SIMPLIFIED ROOM GENERATION
        // ========================================
        // Room-specific generation methods moved to separate files:
        // - js/zelda/rooms/MainRoom.js
        // - js/zelda/rooms/StaffRoom.js  
        // - js/zelda/rooms/ForestRoom.js
        // - js/zelda/rooms/RoomManager.js
        // 
        // This GameMap.js now only handles core rendering functionality
        // Use RoomManager to switch between rooms for cleaner code
        // ========================================
        
        this.generateDefaultRoom();
        
        console.log(`🗺️ Generated ${this.roomName} room:`, this.width, 'x', this.height);
    }

    generateMainRoom() {
        // Initialize tile arrays
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS; // Start with all grass
            }
        }
        
        // Create wider road system with fountain at center intersection
        // Horizontal road across the middle (5 tiles wide)
        for (let x = 5; x <= 37; x++) {
            this.tiles[13][x] = this.TILE_TYPES.GRAVEL; // Top edge
            this.tiles[14][x] = this.TILE_TYPES.GRAVEL; // Top-middle
            this.tiles[15][x] = this.TILE_TYPES.GRAVEL; // Center
            this.tiles[16][x] = this.TILE_TYPES.GRAVEL; // Bottom-middle
            this.tiles[17][x] = this.TILE_TYPES.GRAVEL; // Bottom edge
        }
        
        // Vertical road down the middle (5 tiles wide)
        for (let y = 5; y <= 27; y++) {
            this.tiles[y][18] = this.TILE_TYPES.GRAVEL; // Left edge
            this.tiles[y][19] = this.TILE_TYPES.GRAVEL; // Left-middle
            this.tiles[y][20] = this.TILE_TYPES.GRAVEL; // Center
            this.tiles[y][21] = this.TILE_TYPES.GRAVEL; // Right-middle
            this.tiles[y][22] = this.TILE_TYPES.GRAVEL; // Right edge
        }
        
        // Place fountain at the center intersection (overlapping the roads)
        this.place3x3Fountain(19, 14); // 3x3 fountain at intersection center

        // Trees removed - they were not working properly
        
        // Keep the one working tree
        this.place2x2Tree(8, 8);    // This tree works correctly
        
        // Hide a sword at a decorative location (where tree used to be)
        this.items.push({
            type: 'sword',
            x: 4 * this.tileSize + this.tileSize/2,  // Center of former tree tile
            y: 29 * this.tileSize + this.tileSize/2,
            collected: false
        });
        
        // Add decorative bushes (moved away from pond)
        this.place2TileBush(10, 25);  // Bottom area bush
        this.place2TileBush(28, 26);  // Bottom-right area bush
        this.place2TileBush(6, 12);   // Left side bush
        this.place2TileBush(12, 10);  // Moved from near pond to left area
        
        // Add tree stumps for variety
        // Left stump removed - it was not working properly
        this.place2x2Stump(26, 23);  // Bottom-right area stump
        
        // Create a larger 5x5 water pond - moved up to avoid road overlap
        for (let py = 6; py < 11; py++) {  // Moved from y=9-14 to y=6-11
            for (let px = 30; px < 35; px++) {
                this.tiles[py][px] = this.TILE_TYPES.WATER;
            }
        }
        
        // Add exits
        this.exits = [
            // Exit to house room at the north end of vertical road
            { x: 20, y: 5, width: 1, height: 1, targetRoom: 'house_room', targetX: 20, targetY: 28 }
        ];
    }

    generateHouseRoom() {
        // Initialize tile arrays with grass
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        // Create a simple path from south to the house
        for (let y = 25; y < this.height; y++) {
            this.tiles[y][18] = this.TILE_TYPES.GRAVEL;
            this.tiles[y][19] = this.TILE_TYPES.GRAVEL;
            this.tiles[y][20] = this.TILE_TYPES.GRAVEL;
            this.tiles[y][21] = this.TILE_TYPES.GRAVEL;
            this.tiles[y][22] = this.TILE_TYPES.GRAVEL;
        }
        
        // Place the 5x5 house in the center-north area
        this.place5x5House(18, 8);
        
        // Add some decorative elements (trees removed - they were not working properly)
        
        // Add some bushes
        this.place2TileBush(10, 15);
        this.place2TileBush(28, 15);
        
        // Add exit back to main room
        this.exits = [
            { x: 20, y: 31, width: 1, height: 1, targetRoom: 'main', targetX: 20, targetY: 6 }
        ];
        this.exits.push({
            x: 0, y: 12,
            targetRoom: 'forest',
            targetX: (this.width - 3) * this.tileSize + this.tileSize / 2,
            targetY: 12 * this.tileSize + this.tileSize / 2
        });
        
        this.exits.push({
            x: this.width - 1, y: 12,
            targetRoom: 'tileset_demo',
            targetX: 1 * this.tileSize + this.tileSize / 2,
            targetY: 12 * this.tileSize + this.tileSize / 2
        });
        
        // Add sword near the crossroads for easy pickup
        this.items = [];
        this.items.push({
            type: 'sword',
            name: 'Iron Sword',
            x: 18 * this.tileSize + this.tileSize / 2,
            y: 15 * this.tileSize + this.tileSize / 2,
            collected: false
        });
    }

    generateStaffRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        this.exits = [];
        this.exits.push({
            x: this.width - 1, y: 16,
            targetRoom: 'main',
            targetX: 1 * this.tileSize + this.tileSize / 2,
            targetY: 16 * this.tileSize + this.tileSize / 2
        });
        
        this.items = [];
    }

    generateForestRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }

        // Trees removed - they were not working properly
        // Forest now has just logs for decoration
        
        // Add some fallen logs scattered around the forest
        this.place3TileLog(8, 12);   // Left side log
        this.place3TileLog(28, 20);  // Right side log
        this.place3TileLog(15, 6);   // Top area log
        this.place3TileLog(32, 8);   // Another right side log
        
        // Clear center area for staff
        for (let py = 14; py < 18; py++) {
            for (let px = 19; px < 23; px++) {
                this.overlays[py][px] = null;
            }
        }
        
        this.exits = [];
        this.exits.push({
            x: this.width - 1, y: 8,
            targetRoom: 'main',
            targetX: 1 * this.tileSize + this.tileSize / 2,
            targetY: 8 * this.tileSize + this.tileSize / 2
        });
        
        // Add magic staff in forest center
        this.items = [];
        this.items.push({
            type: 'staff',
            name: 'Magic Staff',
            x: 21 * this.tileSize + this.tileSize / 2,
            y: 16 * this.tileSize + this.tileSize / 2,
            collected: false
        });
    }

    generateGroveRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        this.exits = [];
        this.items = [];
    }

    generateOrchardRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        this.exits = [];
        this.items = [];
    }

    generateTilesetDemoRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        this.exits = [];
        this.exits.push({
            x: 0, y: 12,
            targetRoom: 'main',
            targetX: (this.width - 2) * this.tileSize + this.tileSize / 2,
            targetY: 12 * this.tileSize + this.tileSize / 2
        });
        
        this.items = [];
    }

    generateDefaultRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
            }
        }
        
        this.exits = [];
        this.items = [];
    }

    /**
     * Simple auto-tiling system for roads - completely rebuilt from scratch
     * Uses your 3x3 road tileset coordinates: (0,29) to (2,31)
     * @param {number} tileX - X coordinate of current tile
     * @param {number} tileY - Y coordinate of current tile
     * @returns {Object} Coordinate of the appropriate road tile
     */
    getAutoTileForRoad(tileX, tileY) {
        // Check what road tiles are around this position
        const north = this.isRoadTile(tileX, tileY - 1);
        const south = this.isRoadTile(tileX, tileY + 1);
        const west = this.isRoadTile(tileX - 1, tileY);
        const east = this.isRoadTile(tileX + 1, tileY);
        
        // Special case: detect intersection corners and use inverted corner tiles
        // These are the spots where all four directions have roads (4-way intersection)
        // but we want smooth grass-to-dirt blending in the corners
        if (north && south && west && east) {
            // Check diagonal neighbors to see if we need inverted corners
            const northWest = this.isRoadTile(tileX - 1, tileY - 1);
            const northEast = this.isRoadTile(tileX + 1, tileY - 1);
            const southWest = this.isRoadTile(tileX - 1, tileY + 1);
            const southEast = this.isRoadTile(tileX + 1, tileY + 1);
            
            // Swapped the corner mappings to opposite positions
            if (!northWest && north && west) {
                return this.INVERTED_CORNERS.BOTTOM_RIGHT; // Use bottom-right tile for top-left corner
            }
            if (!northEast && north && east) {
                return this.INVERTED_CORNERS.BOTTOM_LEFT; // Use bottom-left tile for top-right corner
            }
            if (!southWest && south && west) {
                return this.INVERTED_CORNERS.TOP_RIGHT; // Use top-right tile for bottom-left corner
            }
            if (!southEast && south && east) {
                return this.INVERTED_CORNERS.TOP_LEFT; // Use top-left tile for bottom-right corner
            }
        }
        
        // Simple 3x3 tileset logic using your coordinates
        // Top row (y=29): corners and top edges
        if (!north && south && !west && !east) {
            return this.ROAD_TILES.TOP_CENTER; // Road starts going south
        }
        if (!north && south && west && !east) {
            return this.ROAD_TILES.TOP_RIGHT; // Top-right corner piece
        }
        if (!north && south && !west && east) {
            return this.ROAD_TILES.TOP_LEFT; // Top-left corner piece
        }
        if (!north && south && west && east) {
            return this.ROAD_TILES.TOP_CENTER; // T-junction from top
        }
        
        // Bottom row (y=31): bottom corners and edges
        if (north && !south && !west && !east) {
            return this.ROAD_TILES.BOTTOM_CENTER; // Road ends going north
        }
        if (north && !south && west && !east) {
            return this.ROAD_TILES.BOTTOM_RIGHT; // Bottom-right corner piece
        }
        if (north && !south && !west && east) {
            return this.ROAD_TILES.BOTTOM_LEFT; // Bottom-left corner piece
        }
        if (north && !south && west && east) {
            return this.ROAD_TILES.BOTTOM_CENTER; // T-junction from bottom
        }
        
        // Middle row (y=30): horizontal roads and intersections
        if (!north && !south && west && !east) {
            return this.ROAD_TILES.MID_RIGHT; // Road ends going west
        }
        if (!north && !south && !west && east) {
            return this.ROAD_TILES.MID_LEFT; // Road starts going east
        }
        if (!north && !south && west && east) {
            return this.ROAD_TILES.MID_CENTER; // Horizontal road
        }
        if (north && south && !west && !east) {
            return this.ROAD_TILES.MID_CENTER; // Vertical road
        }
        if (north && south && west && !east) {
            return this.ROAD_TILES.MID_RIGHT; // T-junction from right
        }
        if (north && south && !west && east) {
            return this.ROAD_TILES.MID_LEFT; // T-junction from left
        }
        if (north && south && west && east) {
            return this.ROAD_TILES.MID_CENTER; // Full 4-way intersection center
        }
        
        // Default case: use center tile
        return this.ROAD_TILES.MID_CENTER;
    }

    /**
     * Simple auto-tiling system for ponds - uses your 3x3 pond tileset
     * Uses your 3x3 pond tileset coordinates: (2,6) to (4,8)
     * @param {number} tileX - X coordinate of current tile
     * @param {number} tileY - Y coordinate of current tile
     * @returns {Object} Coordinate of the appropriate pond tile
     */
    getAutoTileForPond(tileX, tileY) {
        // Check what water tiles are around this position
        const north = this.isWaterTile(tileX, tileY - 1);
        const south = this.isWaterTile(tileX, tileY + 1);
        const west = this.isWaterTile(tileX - 1, tileY);
        const east = this.isWaterTile(tileX + 1, tileY);
        
        // Simple 3x3 tileset logic using your pond coordinates
        // Top row (y=6): water edges and corners
        if (!north && south && !west && !east) {
            return this.POND_TILES.TOP_CENTER; // Water starts going south
        }
        if (!north && south && west && !east) {
            return this.POND_TILES.TOP_RIGHT; // Top-right corner piece
        }
        if (!north && south && !west && east) {
            return this.POND_TILES.TOP_LEFT; // Top-left corner piece
        }
        if (!north && south && west && east) {
            return this.POND_TILES.TOP_CENTER; // T-junction from top
        }
        
        // Bottom row (y=8): bottom water edges and corners
        if (north && !south && !west && !east) {
            return this.POND_TILES.BOTTOM_CENTER; // Water ends going north
        }
        if (north && !south && west && !east) {
            return this.POND_TILES.BOTTOM_RIGHT; // Bottom-right corner piece
        }
        if (north && !south && !west && east) {
            return this.POND_TILES.BOTTOM_LEFT; // Bottom-left corner piece
        }
        if (north && !south && west && east) {
            return this.POND_TILES.BOTTOM_CENTER; // T-junction from bottom
        }
        
        // Middle row (y=7): horizontal water and intersections
        if (!north && !south && west && !east) {
            return this.POND_TILES.MID_RIGHT; // Water ends going west
        }
        if (!north && !south && !west && east) {
            return this.POND_TILES.MID_LEFT; // Water starts going east
        }
        if (!north && !south && west && east) {
            return this.POND_TILES.MID_CENTER; // Horizontal water
        }
        if (north && south && !west && !east) {
            return this.POND_TILES.MID_CENTER; // Vertical water
        }
        if (north && south && west && !east) {
            return this.POND_TILES.MID_RIGHT; // T-junction from right
        }
        if (north && south && !west && east) {
            return this.POND_TILES.MID_LEFT; // T-junction from left
        }
        if (north && south && west && east) {
            return this.POND_TILES.MID_CENTER; // Full water center
        }
        
        // Default case: use center water tile
        return this.POND_TILES.MID_CENTER;
    }
    
    /**
     * Get the appropriate log tile for a 3-tile horizontal log
     * @param {number} x - Pixel X position
     * @param {number} y - Pixel Y position
     * @returns {Object} Log tile coordinates
     */
    getLogTileForPosition(x, y) {
        // Convert pixel position to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Determine position within the 3-tile log
        // Group logs into sets of 3 horizontally
        const logGroupStartX = Math.floor(tileX / 3) * 3;
        const relativeX = tileX - logGroupStartX; // 0, 1, or 2
        
        // Return appropriate log tile based on position
        switch (relativeX) {
            case 0:
                return this.LOG_TILES.LEFT;   // Left end of log
            case 1:
                return this.LOG_TILES.MIDDLE; // Middle section
            case 2:
                return this.LOG_TILES.RIGHT;  // Right end of log
            default:
                return this.LOG_TILES.MIDDLE; // Fallback to middle
        }
    }
    
    /**
     * Get the appropriate bush tile for a 2-tile horizontal bush
     * @param {number} x - Pixel X position
     * @param {number} y - Pixel Y position
     * @returns {Object} Bush tile coordinates
     */
    getBushTileForPosition(x, y) {
        // Convert pixel position to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Determine position within the 2-tile bush
        // Group bushes into sets of 2 horizontally
        const bushGroupStartX = Math.floor(tileX / 2) * 2;
        const relativeX = tileX - bushGroupStartX; // 0 or 1
        
        // Return appropriate bush tile based on position
        switch (relativeX) {
            case 0:
                return this.BUSH_TILES.LEFT;  // Left side of bush
            case 1:
                return this.BUSH_TILES.RIGHT; // Right side of bush
            default:
                return this.BUSH_TILES.LEFT;  // Fallback to left
        }
    }
    
    /**
     * Get the appropriate tree tile for a 2x2 tree
     * @param {number} x - Pixel X position
     * @param {number} y - Pixel Y position
     * @returns {Object} Tree tile coordinates
     */
    getTreeTileForPosition(x, y) {
        // Convert pixel position to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Determine position within the 2x2 tree
        // Group trees into sets of 2x2
        const treeGroupStartX = Math.floor(tileX / 2) * 2;
        const treeGroupStartY = Math.floor(tileY / 2) * 2;
        const relativeX = tileX - treeGroupStartX; // 0 or 1
        const relativeY = tileY - treeGroupStartY; // 0 or 1
        
        // Clean mapping - no debug spam
        if (relativeX === 0 && relativeY === 0) {
            return { x: 5, y: 16 };  // TOP-LEFT
        } else if (relativeX === 1 && relativeY === 0) {
            return { x: 6, y: 16 };  // TOP-RIGHT
        } else if (relativeX === 0 && relativeY === 1) {
            return { x: 5, y: 17 };  // BOTTOM-LEFT
        } else if (relativeX === 1 && relativeY === 1) {
            return { x: 6, y: 17 };  // BOTTOM-RIGHT
        } else {
            return { x: 5, y: 16 };  // Fallback
        }
    }
    
    /**
     * Get the appropriate stump tile for a 2x2 stump
     * @param {number} x - Pixel X position
     * @param {number} y - Pixel Y position
     * @returns {Object} Stump tile coordinates
     */
    getStumpTileForPosition(x, y) {
        // Convert pixel position to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Determine position within the 2x2 stump
        // Group stumps into sets of 2x2
        const stumpGroupStartX = Math.floor(tileX / 2) * 2;
        const stumpGroupStartY = Math.floor(tileY / 2) * 2;
        const relativeX = tileX - stumpGroupStartX; // 0 or 1
        const relativeY = tileY - stumpGroupStartY; // 0 or 1
        
        // Fixed mapping based on debug output - the Y coordinates need to be corrected
        // From debug: (26,23)=>(0,1) should be TOP_LEFT, but was getting BOTTOM_LEFT
        // This means relative Y is offset by 1 in the calculation somewhere
        if (relativeX === 0 && relativeY === 1) {
            return this.STUMP_TILES.TOP_LEFT;     // (31,3)
        } else if (relativeX === 1 && relativeY === 1) {
            return this.STUMP_TILES.TOP_RIGHT;    // (32,3)
        } else if (relativeX === 0 && relativeY === 0) {
            return this.STUMP_TILES.BOTTOM_LEFT;  // (31,4)
        } else if (relativeX === 1 && relativeY === 0) {
            return this.STUMP_TILES.BOTTOM_RIGHT; // (32,4)
        } else {
            return this.STUMP_TILES.TOP_LEFT;     // Fallback
        }
    }
    
    /**
     * Get the current fountain animation frame (0, 1, or 2)
     * @returns {number} Current frame index
     */
    getCurrentFountainFrame() {
        const elapsed = Date.now() - this.fountainStartTime;
        const frameIndex = Math.floor(elapsed / this.fountainAnimationSpeed) % 3;
        return frameIndex;
    }
    
    /**
     * Get the appropriate fountain tile for a 3x3 fountain at the current animation frame
     * @param {number} x - Pixel X position
     * @param {number} y - Pixel Y position
     * @returns {Object} Fountain tile coordinates
     */
    getFountainTileForPosition(x, y) {
        // Convert pixel position to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // The fountain is placed at (19, 14) and is 3x3, so it occupies (19-21, 14-16)
        const fountainStartX = 19;
        const fountainStartY = 14;
        const relativeX = tileX - fountainStartX; // 0, 1, or 2
        const relativeY = tileY - fountainStartY; // 0, 1, or 2
        
        // Get current animation frame
        const frame = this.getCurrentFountainFrame();
        const frameData = frame === 0 ? this.FOUNTAIN_TILES.FRAME1 :
                         frame === 1 ? this.FOUNTAIN_TILES.FRAME2 :
                                      this.FOUNTAIN_TILES.FRAME3;
        
        // Return appropriate fountain tile based on position within 3x3
        if (relativeX === 0 && relativeY === 0) {
            return frameData.TOP_LEFT;
        } else if (relativeX === 1 && relativeY === 0) {
            return frameData.TOP_CENTER;
        } else if (relativeX === 2 && relativeY === 0) {
            return frameData.TOP_RIGHT;
        } else if (relativeX === 0 && relativeY === 1) {
            return frameData.MID_LEFT;
        } else if (relativeX === 1 && relativeY === 1) {
            return frameData.MID_CENTER;
        } else if (relativeX === 2 && relativeY === 1) {
            return frameData.MID_RIGHT;
        } else if (relativeX === 0 && relativeY === 2) {
            return frameData.BOTTOM_LEFT;
        } else if (relativeX === 1 && relativeY === 2) {
            return frameData.BOTTOM_CENTER;
        } else if (relativeX === 2 && relativeY === 2) {
            return frameData.BOTTOM_RIGHT;
        } else {
            return frameData.MID_CENTER; // Fallback to center
        }
    }
    
    /**
     * Get the appropriate house tile for a 5x5 house
     * @param {number} x - Pixel X position
     * @param {number} y - Pixel Y position
     * @returns {Object} House tile coordinates
     */
    getHouseTileForPosition(x, y) {
        // Convert pixel position to tile coordinates
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        // Determine position within the 5x5 house
        const houseGroupStartX = Math.floor(tileX / 5) * 5;
        const houseGroupStartY = Math.floor(tileY / 5) * 5;
        const relativeX = tileX - houseGroupStartX; // 0-4
        const relativeY = tileY - houseGroupStartY; // 0-4
        
        // Return the correct house tile using the array structure
        if (relativeY >= 0 && relativeY < 5 && relativeX >= 0 && relativeX < 5) {
            return this.HOUSE_TILES[relativeY][relativeX];
        }
        
        return this.HOUSE_TILES[2][2]; // Fallback to center tile
    }
    
    /**
     * Check if a tile position contains a road
     * @param {number} tileX - X coordinate to check
     * @param {number} tileY - Y coordinate to check
     * @returns {boolean} True if the tile is a road tile
     */
    isRoadTile(tileX, tileY) {
        if (!this.isValidTile(tileX, tileY)) {
            return false; // Outside map bounds = no road
        }
        
        return this.tiles[tileY][tileX] === this.TILE_TYPES.GRAVEL;
    }

    /**
     * Check if a tile is a water tile for pond auto-tiling
     * @param {number} tileX - X coordinate of tile
     * @param {number} tileY - Y coordinate of tile
     * @returns {boolean} True if tile is water
     */
    isWaterTile(tileX, tileY) {
        if (!this.isValidTile(tileX, tileY)) {
            return false; // Outside map bounds = no water
        }
        
        return this.tiles[tileY][tileX] === this.TILE_TYPES.WATER;
    }

    getTile(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileY >= 0 && tileY < this.height && tileX >= 0 && tileX < this.width) {
            return this.tiles[tileY][tileX];
        }
        return this.TILE_TYPES.WALL;
    }

    isSolid(tileType) {
        return tileType === this.TILE_TYPES.WALL || 
               tileType === this.TILE_TYPES.TREE || 
               tileType === this.TILE_TYPES.FOUNTAIN;
    }

    /**
     * Check if a specific position is solid, considering water tile auto-tiling
     * Only the center water tile blocks movement
     */
    isSolidAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (!this.isValidTile(tileX, tileY)) {
            return true; // Outside bounds is solid
        }
        
        const tile = this.tiles[tileY][tileX];
        const overlay = this.overlays[tileY][tileX];
        
        // Check overlay first (trees, etc.)
        if (overlay && this.isSolid(overlay)) {
            return true;
        }
        
        // Special handling for water tiles
        if (tile === this.TILE_TYPES.WATER) {
            // Get which water tile this position uses
            const pondTile = this.getAutoTileForPond(tileX, tileY);
            // Only the center water tile blocks movement
            return (pondTile.x === this.POND_TILES.MID_CENTER.x && 
                    pondTile.y === this.POND_TILES.MID_CENTER.y);
        }
        
        // Check regular solid tiles
        return this.isSolid(tile);
    }

    isValidTile(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    checkRoomTransition(playerX, playerY) {
        const tileX = Math.floor(playerX / this.tileSize);
        const tileY = Math.floor(playerY / this.tileSize);
        
        for (const exit of this.exits) {
            if (tileX === exit.x && tileY === exit.y) {
                return exit;
            }
        }
        return null;
    }

    checkItemCollection(playerX, playerY) {
        const collectRadius = this.tileSize * 0.8;
        
        for (const item of this.items) {
            if (!item.collected) {
                const dx = playerX - item.x;
                const dy = playerY - item.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < collectRadius) {
                    item.collected = true;
                    return item;
                }
            }
        }
        return null;
    }

    canMoveTo(x, y, width, height) {
        const left = Math.floor(x / this.tileSize);
        const right = Math.floor((x + width - 1) / this.tileSize);
        const top = Math.floor(y / this.tileSize);
        const bottom = Math.floor((y + height - 1) / this.tileSize);
        
        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (!this.isValidTile(tx, ty)) return false;
                
                // Use the new position-based collision check
                // Convert tile coordinates back to pixel coordinates for isSolidAt
                const pixelX = tx * this.tileSize;
                const pixelY = ty * this.tileSize;
                
                if (this.isSolidAt(pixelX, pixelY)) {
                    return false;
                }
            }
        }
        return true;
    }

    render(ctx) {
        // Render base terrain
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileType = this.tiles[y][x];
                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;
                
                this.renderTile(ctx, tileType, screenX, screenY);
            }
        }
        
        // Render overlays
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                if (this.overlays && this.overlays[y] && this.overlays[y][x]) {
                    const overlayType = this.overlays[y][x];
                    const screenX = x * this.tileSize;
                    const screenY = y * this.tileSize;
                    
                    this.renderOverlay(ctx, overlayType, screenX, screenY);
                }
            }
        }
        
        this.renderItems(ctx);
    }

    renderTile(ctx, tileType, x, y) {
        let color;
        let sprite = null;
        
        // Get tile position for auto-tiling
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        switch (tileType) {
            case this.TILE_TYPES.GRASS:
                // Use standard grass tile from tileset
                sprite = this.spriteLoader.getTileFromTileset(this.GRASS_TILE.x, this.GRASS_TILE.y);
                color = '#4a7c59'; // Fallback green grass
                break;
            case this.TILE_TYPES.GRAVEL:
                // Auto-tiling road system
                const roadTile = this.getAutoTileForRoad(tileX, tileY);
                sprite = this.spriteLoader.getTileFromTileset(roadTile.x, roadTile.y);
                color = '#8d8d8d'; // Fallback gray
                break;
            case this.TILE_TYPES.STONE:
                color = '#6c7b7f'; // Darker stone
                break;
            case this.TILE_TYPES.WALL:
                color = '#2c3e50'; // Dark wall
                break;
            case this.TILE_TYPES.WATER:
                // Auto-tiling pond system
                const pondTile = this.getAutoTileForPond(tileX, tileY);
                sprite = this.spriteLoader.getTileFromTileset(pondTile.x, pondTile.y);
                color = '#3498db'; // Fallback blue water
                break;
            case this.TILE_TYPES.TREE:
                color = '#2d5016'; // Dark green tree
                break;
            case this.TILE_TYPES.DIRT:
                color = '#8b7355'; // Brown dirt
                break;
            case this.TILE_TYPES.SAND:
                color = '#f4e4bc'; // Light tan sand
                break;
            default:
                color = '#ff00ff'; // Magenta for missing tiles
        }
        
        if (sprite) {
            ctx.drawImage(sprite, Math.floor(x), Math.floor(y), this.tileSize, this.tileSize);
        } else {
            // Use solid colors for clean appearance
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(x), Math.floor(y), this.tileSize, this.tileSize);
            
            // Add subtle border for definition
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(Math.floor(x), Math.floor(y), this.tileSize, this.tileSize);
        }
    }

    renderOverlay(ctx, overlayType, x, y) {
        let color;
        let sprite = null;
        
        switch (overlayType) {
            case this.TILE_TYPES.TREE:
                color = '#2d5016'; // Dark green tree fallback
                // Get the appropriate tree tile based on position in the 2x2 tree
                const treeTile = this.getTreeTileForPosition(x, y);
                sprite = this.spriteLoader.getTileFromTileset(treeTile.x, treeTile.y);
                break;
            case this.TILE_TYPES.ROCK:
                color = '#696969'; // Gray rock
                break;
            case this.TILE_TYPES.FLOWER:
                color = '#ff69b4'; // Pink flower
                break;
            case this.TILE_TYPES.WOOD_LOG:
                color = '#8b4513'; // Brown wood log fallback
                // Get the appropriate log tile based on position in the 3-tile log
                const logTile = this.getLogTileForPosition(x, y);
                sprite = this.spriteLoader.getTileFromTileset(logTile.x, logTile.y);
                break;
            case this.TILE_TYPES.BUSH:
                color = '#228b22'; // Forest green bush fallback
                // Get the appropriate bush tile based on position in the 2-tile bush
                const bushTile = this.getBushTileForPosition(x, y);
                sprite = this.spriteLoader.getTileFromTileset(bushTile.x, bushTile.y);
                break;
            case this.TILE_TYPES.STUMP:
                color = '#8b4513'; // Brown stump fallback
                // Get the appropriate stump tile based on position in the 2x2 stump
                const stumpTile = this.getStumpTileForPosition(x, y);
                sprite = this.spriteLoader.getTileFromTileset(stumpTile.x, stumpTile.y);
                break;
            case this.TILE_TYPES.FOUNTAIN:
                color = '#4da6ff'; // Light blue fountain fallback
                // Get the appropriate fountain tile based on position and current animation frame
                const fountainTile = this.getFountainTileForPosition(x, y);
                sprite = this.spriteLoader.getTileFromTileset(fountainTile.x, fountainTile.y);
                break;
            case this.TILE_TYPES.HOUSE:
                color = '#8b4513'; // Brown house fallback
                // Get the appropriate house tile based on position in the 5x5 house
                const houseTile = this.getHouseTileForPosition(x, y);
                sprite = this.spriteLoader.getTileFromTileset(houseTile.x, houseTile.y);
                break;
            default:
                color = '#ff00ff'; // Magenta for debug
        }
        
        if (sprite) {
            ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        } else {
            // Fallback to solid color
            ctx.fillStyle = color;
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
            
            // Add border for definition
            ctx.strokeStyle = 'rgba(0,0,0,0.2)';
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, this.tileSize, this.tileSize);
        }
    }

    renderItems(ctx) {
        // Simple item rendering
        for (const item of this.items) {
            if (!item.collected) {
                const itemSize = this.tileSize * 0.8;
                const itemX = item.x - itemSize / 2;
                const itemY = item.y - itemSize / 2;
                
                // Render actual sprites for items
                if (item.type === 'sword') {
                    const swordSprite = this.spriteLoader.getSword();
                    if (swordSprite) {
                        ctx.drawImage(swordSprite, itemX, itemY, itemSize, itemSize);
                    } else {
                        // Fallback to colored rectangle if sprite not available
                        ctx.fillStyle = '#c0c0c0';
                        ctx.fillRect(itemX, itemY, itemSize, itemSize);
                        ctx.strokeStyle = '#000';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(itemX, itemY, itemSize, itemSize);
                    }
                } else {
                    // Simple colored rectangles for other items
                    ctx.fillStyle = item.type === 'staff' ? '#4169e1' : '#ffd700';
                    ctx.fillRect(itemX, itemY, itemSize, itemSize);
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(itemX, itemY, itemSize, itemSize);
                }
            }
        }
    }

    getSpawnPosition() {
        if (this.roomName === 'main') {
            return this.getMainRoomSpawn();
        } else if (this.roomName === 'staff_room') {
            return this.getStaffRoomSpawn();
        } else {
            return this.findSafeGrassSpawn();
        }
    }

    getMainRoomSpawn() {
        return {
            x: 10 * this.tileSize + this.tileSize / 2,
            y: 10 * this.tileSize + this.tileSize / 2
        };
    }

    getStaffRoomSpawn() {
        return {
            x: (this.width - 5) * this.tileSize + this.tileSize / 2,
            y: 16 * this.tileSize + this.tileSize / 2
        };
    }

    findSafeGrassSpawn() {
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = 2 + Math.floor(Math.random() * (this.width - 4));
            const y = 2 + Math.floor(Math.random() * (this.height - 4));
            
            if (this.isPositionSafe(x, y)) {
                return {
                    x: x * this.tileSize + this.tileSize / 2,
                    y: y * this.tileSize + this.tileSize / 2
                };
            }
        }
        
        return {
            x: 5 * this.tileSize + this.tileSize / 2,
            y: 5 * this.tileSize + this.tileSize / 2
        };
    }

    isPositionSafe(tileX, tileY) {
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const checkX = tileX + dx;
                const checkY = tileY + dy;
                
                if (!this.isValidTile(checkX, checkY)) return false;
                
                const tile = this.tiles[checkY][checkX];
                const overlay = this.overlays[checkY] && this.overlays[checkY][checkX];
                
                if (this.isSolid(tile) || this.isSolid(overlay)) {
                    return false;
                }
            }
        }
        return true;
    }

    setTile(x, y, tileType) {
        if (this.isValidTile(x, y)) {
            this.tiles[y][x] = tileType;
        }
    }

    getGrassVariantForPosition(tileX, tileY) {
        const seed = (tileX * 17 + tileY * 31) % 4;
        return seed;
    }

    setOverlay(x, y, overlayType) {
        if (this.isValidTile(x, y)) {
            if (!this.overlays[y]) this.overlays[y] = [];
            this.overlays[y][x] = overlayType;
        }
    }

    // Place a 2x2 tree at the specified top-left position
    place2x2Tree(startX, startY) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (this.isValidTile(x, y)) {
                    this.setOverlay(x, y, this.TILE_TYPES.TREE);
                }
            }
        }
    }

    // Place a 2x2 stump at the specified top-left position
    place2x2Stump(startX, startY) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (this.isValidTile(x, y)) {
                    this.setOverlay(x, y, this.TILE_TYPES.STUMP);
                }
            }
        }
    }

    // Place a 3x3 animated fountain at the specified top-left position
    place3x3Fountain(startX, startY) {
        for (let dy = 0; dy < 3; dy++) {
            for (let dx = 0; dx < 3; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (this.isValidTile(x, y)) {
                    this.setOverlay(x, y, this.TILE_TYPES.FOUNTAIN);
                }
            }
        }
    }

    // Place a 5x5 house at the specified top-left position
    place5x5House(startX, startY) {
        for (let dy = 0; dy < 5; dy++) {
            for (let dx = 0; dx < 5; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (this.isValidTile(x, y)) {
                    this.setOverlay(x, y, this.TILE_TYPES.HOUSE);
                }
            }
        }
    }

    // Place a single log tile (simplified from 3-tile log)
    place3TileLog(startX, startY) {
        for (let dx = 0; dx < 3; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.WOOD_LOG);
            }
        }
    }

    // Place a 2-tile horizontal bush
    place2TileBush(startX, startY) {
        for (let dx = 0; dx < 2; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.BUSH);
            }
        }
    }

    // Placeholder methods for compatibility
    createFireTiles() {}
    updateFireTiles() {}
    renderFireTiles() {}
    addDecorations() {}
    addDecorativeBorder() {}
}