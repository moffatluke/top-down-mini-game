class BaseRoom {
    constructor(spriteLoader, roomName = 'base') {
        this.spriteLoader = spriteLoader;
        this.roomName = roomName;
        this.width = 40;
        this.height = 32;
        this.tileSize = 16;
        
        // Basic tile types
        this.TILE_TYPES = {
            GRASS: 1,
            ROAD: 2,
            GRAVEL: 2,  // Alias for road
            WATER: 3,
            TREE: 6,
            BUSH: 7,
            STUMP: 8,
            FOUNTAIN: 19,
            WOOD_LOG: 20,
            HOUSE: 21
        };
        
        // Fountain tiles for animation (simplified)
        this.FOUNTAIN_TILES = {
            FRAME1: {
                TOP_LEFT: { x: 22, y: 9 }, TOP_CENTER: { x: 23, y: 9 }, TOP_RIGHT: { x: 24, y: 9 },
                MID_LEFT: { x: 22, y: 10 }, MID_CENTER: { x: 23, y: 10 }, MID_RIGHT: { x: 24, y: 10 },
                BOTTOM_LEFT: { x: 22, y: 11 }, BOTTOM_CENTER: { x: 23, y: 11 }, BOTTOM_RIGHT: { x: 24, y: 11 }
            }
        };
        
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
        
        // Inverted corner tiles for smooth road intersections (interior corners)
        this.INVERTED_CORNERS = {
            TOP_LEFT: { x: 0, y: 32 },     // Interior top-left corner
            TOP_RIGHT: { x: 1, y: 32 },    // Interior top-right corner
            BOTTOM_LEFT: { x: 0, y: 33 },  // Interior bottom-left corner
            BOTTOM_RIGHT: { x: 1, y: 33 }  // Interior bottom-right corner
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
        
        // Animation timing
        this.fountainAnimationSpeed = 500;
        this.fountainStartTime = Date.now();
        
        // Initialize empty map
        this.tiles = [];
        this.overlays = [];
        this.items = [];
        this.exits = [];
        
        this.initializeMap();
    }
    
    initializeMap() {
        // Fill with grass
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.tiles[y][x] = this.TILE_TYPES.GRASS;
                this.overlays[y][x] = null;
            }
        }
    }
    
    // Simple tile setting methods
    setTile(x, y, type) {
        if (this.isValidTile(x, y)) {
            this.tiles[y][x] = type;
        }
    }
    
    setOverlay(x, y, type) {
        if (this.isValidTile(x, y)) {
            this.overlays[y][x] = type;
        }
    }
    
    isValidTile(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }
    
    // Basic rendering (simplified)
    render(ctx) {
        // Render base tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileX = x * this.tileSize;
                const tileY = y * this.tileSize;
                
                // Get the tile type for this position
                const tileType = this.tiles[y][x];
                let sprite = null;
                
                // Special handling for roads and water with auto-tiling
                if (tileType === this.TILE_TYPES.ROAD) {
                    const roadTile = this.getAutoTileForRoad(x, y);
                    sprite = this.spriteLoader.getTileFromTileset(roadTile.x, roadTile.y);
                } else if (tileType === this.TILE_TYPES.WATER) {
                    const pondTile = this.getAutoTileForPond(x, y);
                    sprite = this.spriteLoader.getTileFromTileset(pondTile.x, pondTile.y);
                } else {
                    sprite = this.getTileSprite(tileType);
                }
                
                if (sprite) {
                    ctx.drawImage(sprite, tileX, tileY, this.tileSize, this.tileSize);
                } else {
                    // Fallback colors
                    ctx.fillStyle = this.getTileColor(tileType);
                    ctx.fillRect(tileX, tileY, this.tileSize, this.tileSize);
                }
                
                // Render overlays
                const overlayType = this.overlays[y][x];
                if (overlayType) {
                    this.renderOverlay(ctx, overlayType, tileX, tileY, x, y);
                }
            }
        }
        
        // Render items
        this.renderItems(ctx);
    }
    
    getTileSprite(tileType) {
        switch (tileType) {
            case this.TILE_TYPES.GRASS:
                return this.spriteLoader.getTileFromTileset(0, 0);
            case this.TILE_TYPES.ROAD:
                // Roads don't use getTileSprite - they use auto-tiling in render method
                return null;
            case this.TILE_TYPES.WATER:
                // Water doesn't use getTileSprite - it uses auto-tiling in render method
                return null;
            default:
                return null;
        }
    }
    
    getTileColor(tileType) {
        switch (tileType) {
            case this.TILE_TYPES.GRASS: return '#228b22';
            case this.TILE_TYPES.ROAD: return '#8b7355';
            case this.TILE_TYPES.WATER: return '#4169e1';
            default: return '#228b22';
        }
    }
    
    renderOverlay(ctx, overlayType, pixelX, pixelY, tileX, tileY) {
        let sprite = null;
        let color = '#000';
        
        switch (overlayType) {
            case this.TILE_TYPES.TREE:
                const treeTile = this.getTreeTileForTileCoords(tileX, tileY);
                sprite = this.spriteLoader.getTileFromTileset(treeTile.x, treeTile.y);
                color = '#2d5016';
                break;
            case this.TILE_TYPES.BUSH:
                const bushTile = this.getBushTileForTileCoords(tileX, tileY);
                sprite = this.spriteLoader.getTileFromTileset(bushTile.x, bushTile.y);
                color = '#228b22';
                break;
            case this.TILE_TYPES.STUMP:
                const stumpTile = this.getStumpTileForTileCoords(tileX, tileY);
                sprite = this.spriteLoader.getTileFromTileset(stumpTile.x, stumpTile.y);
                color = '#8b4513';
                break;
            case this.TILE_TYPES.FOUNTAIN:
                const fountainTile = this.getFountainTileForPosition(pixelX, pixelY);
                sprite = this.spriteLoader.getTileFromTileset(fountainTile.x, fountainTile.y);
                color = '#4da6ff';
                break;
            case this.TILE_TYPES.WOOD_LOG:
                const logTile = this.getLogTileForTileCoords(tileX, tileY);
                sprite = this.spriteLoader.getTileFromTileset(logTile.x, logTile.y);
                color = '#8b4513';
                break;
        }
        
        if (sprite) {
            ctx.drawImage(sprite, pixelX, pixelY, this.tileSize, this.tileSize);
        } else {
            // Fallback to colored rectangle
            ctx.fillStyle = color;
            ctx.fillRect(pixelX, pixelY, this.tileSize, this.tileSize);
        }
    }
    
    renderItems(ctx) {
        for (const item of this.items) {
            if (!item.collected) {
                const itemSize = this.tileSize * 0.8;
                const itemX = item.x - itemSize / 2;
                const itemY = item.y - itemSize / 2;
                
                if (item.type === 'sword') {
                    const swordSprite = this.spriteLoader.getSword();
                    if (swordSprite) {
                        ctx.drawImage(swordSprite, itemX, itemY, itemSize, itemSize);
                    } else {
                        ctx.fillStyle = '#c0c0c0';
                        ctx.fillRect(itemX, itemY, itemSize, itemSize);
                    }
                } else {
                    ctx.fillStyle = item.type === 'staff' ? '#4169e1' : '#ffd700';
                    ctx.fillRect(itemX, itemY, itemSize, itemSize);
                }
            }
        }
    }
    
    // Override in child classes
    generateContent() {
        // Each room implements its own content generation
    }
    
    // Essential placement methods
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
    
    place2TileBush(startX, startY) {
        for (let dx = 0; dx < 2; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.BUSH);
            }
        }
    }
    
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
    
    place3TileLog(startX, startY) {
        for (let dx = 0; dx < 3; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.WOOD_LOG);
            }
        }
    }
    
    // Simple fountain animation
    getCurrentFountainFrame() {
        const elapsed = Date.now() - this.fountainStartTime;
        return Math.floor(elapsed / this.fountainAnimationSpeed) % 1; // Only 1 frame for now
    }
    
    getFountainTileForPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        const fountainStartX = 19; // Fixed fountain position
        const fountainStartY = 14;
        const relativeX = tileX - fountainStartX;
        const relativeY = tileY - fountainStartY;
        
        const frameData = this.FOUNTAIN_TILES.FRAME1;
        
        if (relativeX === 0 && relativeY === 0) return frameData.TOP_LEFT;
        if (relativeX === 1 && relativeY === 0) return frameData.TOP_CENTER;
        if (relativeX === 2 && relativeY === 0) return frameData.TOP_RIGHT;
        if (relativeX === 0 && relativeY === 1) return frameData.MID_LEFT;
        if (relativeX === 1 && relativeY === 1) return frameData.MID_CENTER;
        if (relativeX === 2 && relativeY === 1) return frameData.MID_RIGHT;
        if (relativeX === 0 && relativeY === 2) return frameData.BOTTOM_LEFT;
        if (relativeX === 1 && relativeY === 2) return frameData.BOTTOM_CENTER;
        if (relativeX === 2 && relativeY === 2) return frameData.BOTTOM_RIGHT;
        
        return frameData.MID_CENTER; // Fallback
    }
    
    getSpawnPosition() {
        return {
            x: 10 * this.tileSize + this.tileSize / 2,
            y: 10 * this.tileSize + this.tileSize / 2
        };
    }
    
    // Item collection method (required by Game.js)
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
    
    // Room transition method (required by Game.js)
    checkRoomTransition(playerX, playerY) {
        return null; // No room transitions in base room
    }
    
    // Fire tiles methods (required by Game.js)
    updateFireTiles(deltaTime) {
        // No fire tiles in base room
    }
    
    createFireTiles(x, y, radius) {
        // No fire tiles in base room
    }
    
    // Collision detection methods (required by Player.js)
    canMoveTo(x, y, width, height) {
        const left = Math.floor(x / this.tileSize);
        const right = Math.floor((x + width - 1) / this.tileSize);
        const top = Math.floor(y / this.tileSize);
        const bottom = Math.floor((y + height - 1) / this.tileSize);
        
        for (let ty = top; ty <= bottom; ty++) {
            for (let tx = left; tx <= right; tx++) {
                if (!this.isValidTile(tx, ty)) return false;
                
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
    
    isSolidAt(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (!this.isValidTile(tileX, tileY)) {
            return true; // Outside bounds is solid
        }
        
        const tile = this.tiles[tileY][tileX];
        const overlay = this.overlays[tileY][tileX];
        
        // Check overlay first (trees, fountains, etc.)
        if (overlay && this.isSolid(overlay)) {
            return true;
        }
        
        // Special handling for water tiles - only pure water center should be solid
        if (tile === this.TILE_TYPES.WATER) {
            return this.isWaterTileActuallyWater(tileX, tileY);
        }
        
        // Check regular solid tiles
        return this.isSolid(tile);
    }
    
    // Check if this water tile is actually pure water (not a grassy edge)
    isWaterTileActuallyWater(tileX, tileY) {
        const pondTile = this.getAutoTileForPond(tileX, tileY);
        // Only the center water tile (pure blue water) is solid
        return (pondTile.x === this.POND_TILES.MID_CENTER.x && 
                pondTile.y === this.POND_TILES.MID_CENTER.y);
    }
    
    isSolid(tileType) {
        return tileType === this.TILE_TYPES.TREE || 
               tileType === this.TILE_TYPES.BUSH || 
               tileType === this.TILE_TYPES.FOUNTAIN;
        // Note: WATER is handled specially in isSolidAt()
    }
    
    // Position-based tile selectors for multi-tile objects
    getTreeTileForPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        const treeGroupStartX = Math.floor(tileX / 2) * 2;
        const treeGroupStartY = Math.floor(tileY / 2) * 2;
        const relativeX = tileX - treeGroupStartX;
        const relativeY = tileY - treeGroupStartY;
        
        // Render tree in correct order: top-left, top-right, bottom-left, bottom-right
        if (relativeX === 0 && relativeY === 0) {
            return { x: 5, y: 16 };  // TOP-LEFT
        } else if (relativeX === 1 && relativeY === 0) {
            return { x: 6, y: 16 };  // TOP-RIGHT
        } else if (relativeX === 0 && relativeY === 1) {
            return { x: 5, y: 17 };  // BOTTOM-LEFT
        } else {
            return { x: 6, y: 17 };  // BOTTOM-RIGHT
        }
    }
    
    getBushTileForPosition(pixelX, pixelY) {
        // Convert the pixel coordinates back to tile coordinates
        const tileX = Math.floor(pixelX / this.tileSize);
        
        // Simple alternating logic: even tiles get left, odd tiles get right
        if (tileX % 2 === 0) {
            return { x: 0, y: 16 };  // LEFT bush tile
        } else {
            return { x: 1, y: 16 };  // RIGHT bush tile
        }
    }
    
    getBushTileForTileCoords(tileX, tileY) {
        // Work directly with tile coordinates - much simpler!
        // Even tile X positions get left sprite, odd get right sprite
        if (tileX % 2 === 0) {
            return { x: 0, y: 16 };  // LEFT bush tile
        } else {
            return { x: 1, y: 16 };  // RIGHT bush tile
        }
    }
    
    getTreeTileForTileCoords(tileX, tileY) {
        // Work directly with tile coordinates for 2x2 trees
        const treeGroupStartX = Math.floor(tileX / 2) * 2;
        const treeGroupStartY = Math.floor(tileY / 2) * 2;
        const relativeX = tileX - treeGroupStartX;
        const relativeY = tileY - treeGroupStartY;
        
        if (relativeX === 0 && relativeY === 0) {
            return { x: 5, y: 16 };  // TOP-LEFT
        } else if (relativeX === 1 && relativeY === 0) {
            return { x: 6, y: 16 };  // TOP-RIGHT
        } else if (relativeX === 0 && relativeY === 1) {
            return { x: 5, y: 17 };  // BOTTOM-LEFT
        } else {
            return { x: 6, y: 17 };  // BOTTOM-RIGHT
        }
    }
    
    getStumpTileForTileCoords(tileX, tileY) {
        // Work directly with tile coordinates for 2x2 stumps
        const stumpGroupStartX = Math.floor(tileX / 2) * 2;
        const stumpGroupStartY = Math.floor(tileY / 2) * 2;
        const relativeX = tileX - stumpGroupStartX;
        const relativeY = tileY - stumpGroupStartY;
        
        if (relativeX === 0 && relativeY === 0) {
            return { x: 31, y: 3 };  // TOP-LEFT
        } else if (relativeX === 1 && relativeY === 0) {
            return { x: 32, y: 3 };  // TOP-RIGHT
        } else if (relativeX === 0 && relativeY === 1) {
            return { x: 31, y: 4 };  // BOTTOM-LEFT
        } else {
            return { x: 32, y: 4 };  // BOTTOM-RIGHT
        }
    }
    
    getLogTileForTileCoords(tileX, tileY) {
        // Work directly with tile coordinates for 3-tile logs
        const logGroupStartX = Math.floor(tileX / 3) * 3;
        const relativeX = tileX - logGroupStartX;
        
        if (relativeX === 0) {
            return { x: 3, y: 5 };   // LEFT
        } else if (relativeX === 1) {
            return { x: 4, y: 5 };   // CENTER
        } else {
            return { x: 5, y: 5 };   // RIGHT
        }
    }
    
    getStumpTileForPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        const stumpGroupStartX = Math.floor(tileX / 2) * 2;
        const stumpGroupStartY = Math.floor(tileY / 2) * 2;
        const relativeX = tileX - stumpGroupStartX;
        const relativeY = tileY - stumpGroupStartY;
        
        // Render stump in correct order: top-left, top-right, bottom-left, bottom-right
        if (relativeX === 0 && relativeY === 0) {
            return { x: 31, y: 3 };  // TOP-LEFT
        } else if (relativeX === 1 && relativeY === 0) {
            return { x: 32, y: 3 };  // TOP-RIGHT
        } else if (relativeX === 0 && relativeY === 1) {
            return { x: 31, y: 4 };  // BOTTOM-LEFT
        } else {
            return { x: 32, y: 4 };  // BOTTOM-RIGHT
        }
    }
    
    getLogTileForPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        
        // Group logs into sets of 3 horizontally
        const logGroupStartX = Math.floor(tileX / 3) * 3;
        const relativeX = tileX - logGroupStartX; // 0, 1, or 2
        
        // Render log in correct order: left, center, right
        if (relativeX === 0) {
            return { x: 3, y: 5 };   // LEFT
        } else if (relativeX === 1) {
            return { x: 4, y: 5 };   // CENTER
        } else {
            return { x: 5, y: 5 };   // RIGHT
        }
    }
    
    // Road auto-tiling methods
    getAutoTileForRoad(tileX, tileY) {
        // Check what road tiles are around this position
        const north = this.isRoadTile(tileX, tileY - 1);
        const south = this.isRoadTile(tileX, tileY + 1);
        const west = this.isRoadTile(tileX - 1, tileY);
        const east = this.isRoadTile(tileX + 1, tileY);
        
        // Special case: detect intersection corners and use inverted corner tiles
        if (north && south && west && east) {
            // Check diagonal neighbors to see if we need inverted corners
            const northWest = this.isRoadTile(tileX - 1, tileY - 1);
            const northEast = this.isRoadTile(tileX + 1, tileY - 1);
            const southWest = this.isRoadTile(tileX - 1, tileY + 1);
            const southEast = this.isRoadTile(tileX + 1, tileY + 1);
            
            // Swapped corner mappings for smooth transitions
            if (!northWest && north && west) {
                return this.INVERTED_CORNERS.BOTTOM_RIGHT;
            }
            if (!northEast && north && east) {
                return this.INVERTED_CORNERS.BOTTOM_LEFT;
            }
            if (!southWest && south && west) {
                return this.INVERTED_CORNERS.TOP_RIGHT;
            }
            if (!southEast && south && east) {
                return this.INVERTED_CORNERS.TOP_LEFT;
            }
        }
        
        // Simple 3x3 tileset logic
        // Top row: corners and top edges
        if (!north && south && !west && !east) {
            return this.ROAD_TILES.TOP_CENTER;
        }
        if (!north && south && west && !east) {
            return this.ROAD_TILES.TOP_RIGHT;
        }
        if (!north && south && !west && east) {
            return this.ROAD_TILES.TOP_LEFT;
        }
        if (!north && south && west && east) {
            return this.ROAD_TILES.TOP_CENTER;
        }
        
        // Bottom row: bottom corners and edges
        if (north && !south && !west && !east) {
            return this.ROAD_TILES.BOTTOM_CENTER;
        }
        if (north && !south && west && !east) {
            return this.ROAD_TILES.BOTTOM_RIGHT;
        }
        if (north && !south && !west && east) {
            return this.ROAD_TILES.BOTTOM_LEFT;
        }
        if (north && !south && west && east) {
            return this.ROAD_TILES.BOTTOM_CENTER;
        }
        
        // Middle row: horizontal roads and intersections
        if (!north && !south && west && !east) {
            return this.ROAD_TILES.MID_RIGHT;
        }
        if (!north && !south && !west && east) {
            return this.ROAD_TILES.MID_LEFT;
        }
        if (!north && !south && west && east) {
            return this.ROAD_TILES.MID_CENTER;
        }
        if (north && south && !west && !east) {
            return this.ROAD_TILES.MID_CENTER;
        }
        if (north && south && west && !east) {
            return this.ROAD_TILES.MID_RIGHT;
        }
        if (north && south && !west && east) {
            return this.ROAD_TILES.MID_LEFT;
        }
        if (north && south && west && east) {
            return this.ROAD_TILES.MID_CENTER;
        }
        
        // Default case: use center tile
        return this.ROAD_TILES.MID_CENTER;
    }
    
    isRoadTile(tileX, tileY) {
        if (!this.isValidTile(tileX, tileY)) {
            return false; // Outside map bounds = no road
        }
        
        return this.tiles[tileY][tileX] === this.TILE_TYPES.ROAD;
    }
    
    // Water/Pond auto-tiling methods
    getAutoTileForPond(tileX, tileY) {
        // Check what water tiles are around this position
        const north = this.isWaterTile(tileX, tileY - 1);
        const south = this.isWaterTile(tileX, tileY + 1);
        const west = this.isWaterTile(tileX - 1, tileY);
        const east = this.isWaterTile(tileX + 1, tileY);
        
        // Simple 3x3 tileset logic for ponds
        // Top row: corners and top edges
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
            return this.POND_TILES.TOP_CENTER; // Top edge with water below and sides
        }
        
        // Bottom row: bottom corners and edges
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
            return this.POND_TILES.BOTTOM_CENTER; // Bottom edge
        }
        
        // Middle row: horizontal water and intersections
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
            return this.POND_TILES.MID_RIGHT; // Water edge from right
        }
        if (north && south && !west && east) {
            return this.POND_TILES.MID_LEFT; // Water edge from left
        }
        if (north && south && west && east) {
            return this.POND_TILES.MID_CENTER; // Full water center - this is the pure water
        }
        
        // Default case: use center tile (pure water)
        return this.POND_TILES.MID_CENTER;
    }
    
    isWaterTile(tileX, tileY) {
        if (!this.isValidTile(tileX, tileY)) {
            return false; // Outside map bounds = no water
        }
        
        return this.tiles[tileY][tileX] === this.TILE_TYPES.WATER;
    }
}