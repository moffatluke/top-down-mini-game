class GameMap {
    constructor(spriteLoader) {
        this.spriteLoader = spriteLoader;
        this.width = 40;
        this.height = 32;
        this.tileSize = 16;
        
        // Simple tile type constants
        this.TILE_TYPES = {
            GRASS: 1,
            ROAD: 2,
            WATER: 3,
            TREE: 4,
            BUSH: 5,
            STUMP: 6
        };
        
        // Simple tile coordinates - just the basics
        this.TILES = {
            GRASS: { x: 3, y: 0 },
            ROAD: { x: 1, y: 0 },
            WATER: { x: 4, y: 3 },
            BUSH_LEFT: { x: 0, y: 16 },
            BUSH_RIGHT: { x: 1, y: 16 },
            TREE_TL: { x: 5, y: 16 },
            TREE_TR: { x: 6, y: 16 },
            TREE_BL: { x: 5, y: 17 },
            TREE_BR: { x: 6, y: 17 }
        };
        
        // Create basic map
        this.tiles = [];
        this.overlays = [];
        
        this.initializeMap();
        this.generateContent();
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
    
    generateContent() {
        // Simple cross-shaped road
        const centerX = Math.floor(this.width / 2);
        const centerY = Math.floor(this.height / 2);
        
        // Horizontal road
        for (let x = 5; x < this.width - 5; x++) {
            this.tiles[centerY][x] = this.TILE_TYPES.ROAD;
        }
        
        // Vertical road
        for (let y = 5; y < this.height - 5; y++) {
            this.tiles[y][centerX] = this.TILE_TYPES.ROAD;
        }
        
        // Add some trees
        this.place2x2Tree(3, 3);
        this.place2x2Tree(35, 3);
        this.place2x2Tree(3, 28);
        this.place2x2Tree(35, 28);
        
        // Add some bushes
        this.place2TileBush(8, 8);
        this.place2TileBush(30, 8);
    }
    
    place2x2Tree(startX, startY) {
        for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
                const x = startX + dx;
                const y = startY + dy;
                if (x < this.width && y < this.height) {
                    this.overlays[y][x] = this.TILE_TYPES.TREE;
                }
            }
        }
    }
    
    place2TileBush(startX, startY) {
        for (let dx = 0; dx < 2; dx++) {
            const x = startX + dx;
            if (x < this.width && startY < this.height) {
                this.overlays[startY][x] = this.TILE_TYPES.BUSH;
            }
        }
    }
    
    getTreeTileForPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        const relativeX = tileX % 2;
        const relativeY = tileY % 2;
        
        // Simple 2x2 mapping - we can adjust these easily
        if (relativeX === 0 && relativeY === 0) return this.TILES.TREE_TL;
        if (relativeX === 1 && relativeY === 0) return this.TILES.TREE_TR;
        if (relativeX === 0 && relativeY === 1) return this.TILES.TREE_BL;
        if (relativeX === 1 && relativeY === 1) return this.TILES.TREE_BR;
        
        return this.TILES.TREE_TL;
    }
    
    getBushTileForPosition(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const relativeX = tileX % 2;
        
        return relativeX === 0 ? this.TILES.BUSH_LEFT : this.TILES.BUSH_RIGHT;
    }
    
    render(ctx) {
        // Render base tiles
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;
                
                this.renderTile(ctx, this.tiles[y][x], screenX, screenY);
                
                // Render overlays
                if (this.overlays[y][x]) {
                    this.renderOverlay(ctx, this.overlays[y][x], screenX, screenY);
                }
            }
        }
    }
    
    renderTile(ctx, tileType, x, y) {
        let tileCoords;
        
        switch (tileType) {
            case this.TILE_TYPES.GRASS:
                tileCoords = this.TILES.GRASS;
                break;
            case this.TILE_TYPES.ROAD:
                tileCoords = this.TILES.ROAD;
                break;
            case this.TILE_TYPES.WATER:
                tileCoords = this.TILES.WATER;
                break;
            default:
                tileCoords = this.TILES.GRASS;
        }
        
        const sprite = this.spriteLoader.getTileFromTileset(tileCoords.x, tileCoords.y);
        if (sprite) {
            ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        }
    }
    
    renderOverlay(ctx, overlayType, x, y) {
        let tileCoords;
        
        switch (overlayType) {
            case this.TILE_TYPES.TREE:
                tileCoords = this.getTreeTileForPosition(x, y);
                break;
            case this.TILE_TYPES.BUSH:
                tileCoords = this.getBushTileForPosition(x, y);
                break;
            default:
                return;
        }
        
        const sprite = this.spriteLoader.getTileFromTileset(tileCoords.x, tileCoords.y);
        if (sprite) {
            ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        }
    }
    
    // Simple collision - just check if tile is solid
    isSolid(tileType) {
        return tileType === this.TILE_TYPES.WATER;
    }
    
    canMoveTo(x, y, width, height) {
        const tileLeft = Math.floor(x / this.tileSize);
        const tileTop = Math.floor(y / this.tileSize);
        const tileRight = Math.floor((x + width - 1) / this.tileSize);
        const tileBottom = Math.floor((y + height - 1) / this.tileSize);
        
        // Check bounds
        if (tileLeft < 0 || tileTop < 0 || tileRight >= this.width || tileBottom >= this.height) {
            return false;
        }
        
        // Check for solid tiles
        for (let ty = tileTop; ty <= tileBottom; ty++) {
            for (let tx = tileLeft; tx <= tileRight; tx++) {
                if (this.isSolid(this.tiles[ty][tx])) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    getSpawnPosition() {
        return { x: 5 * this.tileSize, y: 5 * this.tileSize };
    }
}

export default GameMap;