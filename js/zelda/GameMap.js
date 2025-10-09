/**
 * Simplified Zelda-style Game Map Class
 * Fixed version to resolve "ZeldaGameMap is not defined" error
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
            GRAVEL: 1,
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
            LOG: 16
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
        
        if (this.roomName === 'main') {
            this.generateMainRoom();
        } else if (this.roomName === 'staff_room') {
            this.generateStaffRoom();
        } else if (this.roomName === 'forest') {
            this.generateForestRoom();
        } else if (this.roomName === 'grove') {
            this.generateGroveRoom();
        } else if (this.roomName === 'orchard') {
            this.generateOrchardRoom();
        } else if (this.roomName === 'tileset_demo') {
            this.generateTilesetDemoRoom();
        } else {
            this.generateDefaultRoom();
        }
        
        console.log(`🗺️ Generated ${this.roomName} room:`, this.width, 'x', this.height);
    }

    generateMainRoom() {
        // Initialize tile arrays
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            this.overlays[y] = [];
            for (let x = 0; x < this.width; x++) {
                this.overlays[y][x] = null;
                
                // Create gravel paths and grass areas
                if ((x >= 8 && x <= 12) || (y >= 8 && y <= 12)) {
                    this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                } else {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
            }
        }
        
        // Add some 2x2 trees as decorations
        this.place2x2Tree(4, 4);   // Top-left area
        this.place2x2Tree(36, 4);  // Top-right area  
        this.place2x2Tree(4, 26);  // Bottom-left area
        this.place2x2Tree(36, 26); // Bottom-right area
        
        // Add a decorative log near the pond
        this.place3TileLog(20, 15);
        
        // Add water pond
        for (let py = 10; py < 13; py++) {
            for (let px = 16; px < 19; px++) {
                this.tiles[py][px] = this.TILE_TYPES.WATER;
            }
        }
        
        // Add exits
        this.exits = [];
        this.exits.push({
            x: 0, y: 8,
            targetRoom: 'forest',
            targetX: (this.width - 3) * this.tileSize + this.tileSize / 2,
            targetY: 8 * this.tileSize + this.tileSize / 2
        });
        
        this.exits.push({
            x: this.width - 1, y: 12,
            targetRoom: 'tileset_demo',
            targetX: 1 * this.tileSize + this.tileSize / 2,
            targetY: 12 * this.tileSize + this.tileSize / 2
        });
        
        // Add sword in main room for pickup
        this.items = [];
        this.items.push({
            type: 'sword',
            name: 'Iron Sword',
            x: 6 * this.tileSize + this.tileSize / 2,
            y: 6 * this.tileSize + this.tileSize / 2,
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
        
        // Add 2x2 trees in forest
        for (let y = 1; y < this.height - 2; y += 3) { // Space trees every 3 tiles
            for (let x = 1; x < this.width - 2; x += 3) {
                if (Math.random() < 0.4) { // 40% chance for each tree group
                    // Place a 2x2 tree
                    this.place2x2Tree(x, y);
                }
            }
        }
        
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

    getTile(x, y) {
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        if (tileY >= 0 && tileY < this.height && tileX >= 0 && tileX < this.width) {
            return this.tiles[tileY][tileX];
        }
        return this.TILE_TYPES.WALL;
    }

    isSolid(tileType) {
        return tileType === this.TILE_TYPES.WALL || tileType === this.TILE_TYPES.WATER || tileType === this.TILE_TYPES.TREE;
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
                
                const tile = this.tiles[ty][tx];
                const overlay = this.overlays[ty] && this.overlays[ty][tx];
                
                if (this.isSolid(tile) || this.isSolid(overlay)) {
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
        
        // Get tileset coordinates for pond tiles
        const tileX = Math.floor(x / this.tileSize);
        const tileY = Math.floor(y / this.tileSize);
        
        switch (tileType) {
            case this.TILE_TYPES.GRASS:
                color = '#4a7c59';
                const grassVariant = this.getGrassVariantForPosition(tileX, tileY);
                sprite = this.spriteLoader.getGrassVariant(grassVariant) || this.spriteLoader.get('grass');
                break;
            case this.TILE_TYPES.GRAVEL:
                color = '#8d8d8d';
                sprite = this.spriteLoader.get('tileset_stone') || this.spriteLoader.get('gravel');
                break;
            case this.TILE_TYPES.STONE:
                color = '#6c7b7f';
                sprite = this.spriteLoader.get('tileset_stone') || this.spriteLoader.get('cobblestone');
                break;
            case this.TILE_TYPES.WALL:
                color = '#2c3e50';
                break;
            case this.TILE_TYPES.WATER:
                color = '#3498db';
                // Use 3x3 pond pattern from tileset
                const relX = (tileX - 16) % 3;
                const relY = (tileY - 10) % 3;
                const pondTileX = 2 + relX;
                const pondTileY = 6 + relY;
                
                sprite = this.spriteLoader.tilesetExtractor?.extractTile(pondTileX, pondTileY) || 
                         this.spriteLoader.get('tileset_water') || 
                         this.spriteLoader.get('water');
                break;
            case this.TILE_TYPES.TREE:
                color = '#2d5016';
                sprite = this.spriteLoader.get('tileset_tree') || this.spriteLoader.get('tree');
                break;
            default:
                color = '#ff00ff';
        }
        
        if (sprite) {
            ctx.drawImage(sprite, Math.floor(x), Math.floor(y), this.tileSize, this.tileSize);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(x), Math.floor(y), this.tileSize, this.tileSize);
        }
    }

    renderOverlay(ctx, overlayType, x, y) {
        let color;
        let sprite = null;
        
        switch (overlayType) {
            case this.TILE_TYPES.TREE:
                color = '#2d5016';
                // Use 2x2 tree pattern from tileset (5,16), (6,16), (5,17), (6,17)
                // Determine which part of the 2x2 tree this tile represents
                const tileX = Math.floor(x / this.tileSize);
                const tileY = Math.floor(y / this.tileSize);
                
                // Create 2x2 tree groups - each tree occupies 2x2 tiles
                const treeGroupX = Math.floor(tileX / 2) * 2;
                const treeGroupY = Math.floor(tileY / 2) * 2;
                
                // Determine position within the 2x2 tree
                const relX = tileX - treeGroupX; // 0 or 1
                const relY = tileY - treeGroupY; // 0 or 1
                
                // Map to tileset coordinates: (5,16)=TL, (6,16)=TR, (5,17)=BL, (6,17)=BR
                const treeTileX = 5 + relX;
                const treeTileY = 16 + relY;
                
                // Try to get the specific tree tile from tileset
                sprite = this.spriteLoader.tilesetExtractor?.extractTile(treeTileX, treeTileY) || 
                         this.spriteLoader.get('tileset_tree') || 
                         this.spriteLoader.get('tree');
                break;
            case this.TILE_TYPES.ROCK:
                color = '#696969';
                sprite = this.spriteLoader.get('tileset_rock');
                break;
            case this.TILE_TYPES.FLOWER:
                color = '#ff69b4';
                sprite = this.spriteLoader.get('tileset_flower');
                break;
            case this.TILE_TYPES.LOG:
                color = '#8b4513'; // Brown color for logs
                // Use 3-tile horizontal log pattern from tileset - corrected order
                const logTileX = Math.floor(x / this.tileSize);
                const logTileY = Math.floor(y / this.tileSize);
                
                // Determine which part of the 3-tile log this is
                // Group logs into sets of 3 horizontally
                const logGroupStartX = Math.floor(logTileX / 3) * 3;
                const logRelativeX = logTileX - logGroupStartX; // 0, 1, or 2
                
                // Map to tileset coordinates properly:
                // Position 0 (left) = tileset (5,5), Position 1 (middle) = tileset (3,5), Position 2 (right) = tileset (4,5)
                let logSpriteTileX;
                if (logRelativeX === 0) {
                    logSpriteTileX = 3; // Left end
                } else if (logRelativeX === 1) {
                    logSpriteTileX = 4; // Middle (swapped with right)
                } else {
                    logSpriteTileX = 5; // Right end (swapped with middle)
                }
                const logSpriteTileY = 5;
                
                // Try to get the specific log tile from tileset
                sprite = this.spriteLoader.tilesetExtractor?.extractTile(logSpriteTileX, logSpriteTileY) || 
                         this.spriteLoader.get('tileset_log') || 
                         null; // No fallback sprite for logs
                break;
            default:
                color = '#ff00ff';
        }
        
        if (sprite) {
            ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
    }

    renderItems(ctx) {
        for (const item of this.items) {
            if (!item.collected) {
                const itemSize = this.tileSize * 0.8;
                const itemX = item.x - itemSize / 2;
                const itemY = item.y - itemSize / 2;
                
                let sprite = null;
                let color = '#ffd700'; // Default gold color as fallback
                
                // Get the appropriate sprite based on item type
                if (item.type === 'staff') {
                    sprite = this.spriteLoader.get('magic_staff') || 
                             this.spriteLoader.get('staff') || 
                             this.spriteLoader.get('tileset_staff');
                    color = '#8b4513'; // Brown color for staff fallback
                } else if (item.type === 'sword') {
                    sprite = this.spriteLoader.getSword() ||
                             this.spriteLoader.get('sword') || 
                             this.spriteLoader.get('tileset_sword');
                    color = '#c0c0c0'; // Silver color for sword fallback
                } else if (item.type === 'shield') {
                    sprite = this.spriteLoader.get('shield') || 
                             this.spriteLoader.get('tileset_shield');
                    color = '#8b4513'; // Brown color for shield fallback
                }
                
                // Render the item sprite if available, otherwise fallback to colored rectangle
                if (sprite) {
                    ctx.drawImage(sprite, itemX, itemY, itemSize, itemSize);
                } else {
                    // Fallback rendering with item-specific shapes and colors
                    if (item.type === 'staff') {
                        // Draw a staff shape
                        ctx.fillStyle = '#8b4513'; // Brown staff handle
                        ctx.fillRect(itemX + itemSize * 0.4, itemY + itemSize * 0.2, itemSize * 0.2, itemSize * 0.6);
                        
                        // Staff orb/crystal at top
                        ctx.fillStyle = '#4169e1'; // Blue crystal
                        ctx.beginPath();
                        ctx.arc(itemX + itemSize * 0.5, itemY + itemSize * 0.25, itemSize * 0.15, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Add glow effect
                        ctx.shadowColor = '#4169e1';
                        ctx.shadowBlur = 8;
                        ctx.beginPath();
                        ctx.arc(itemX + itemSize * 0.5, itemY + itemSize * 0.25, itemSize * 0.1, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.shadowBlur = 0;
                    } else if (item.type === 'sword') {
                        // Draw a sword shape
                        ctx.fillStyle = '#c0c0c0'; // Silver blade
                        ctx.fillRect(itemX + itemSize * 0.45, itemY + itemSize * 0.1, itemSize * 0.1, itemSize * 0.6);
                        
                        // Sword crossguard
                        ctx.fillStyle = '#8b4513'; // Brown crossguard
                        ctx.fillRect(itemX + itemSize * 0.3, itemY + itemSize * 0.65, itemSize * 0.4, itemSize * 0.08);
                        
                        // Sword handle
                        ctx.fillStyle = '#654321'; // Dark brown handle
                        ctx.fillRect(itemX + itemSize * 0.42, itemY + itemSize * 0.7, itemSize * 0.16, itemSize * 0.2);
                        
                        // Sword tip (triangle)
                        ctx.fillStyle = '#c0c0c0';
                        ctx.beginPath();
                        ctx.moveTo(itemX + itemSize * 0.5, itemY + itemSize * 0.05);
                        ctx.lineTo(itemX + itemSize * 0.45, itemY + itemSize * 0.15);
                        ctx.lineTo(itemX + itemSize * 0.55, itemY + itemSize * 0.15);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        // Default rectangle for other items
                        ctx.fillStyle = color;
                        ctx.fillRect(itemX, itemY, itemSize, itemSize);
                        
                        ctx.strokeStyle = '#b8860b';
                        ctx.lineWidth = 2;
                        ctx.strokeRect(itemX, itemY, itemSize, itemSize);
                    }
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

    // Place a 3-tile horizontal log at the specified left position
    place3TileLog(startX, startY) {
        for (let dx = 0; dx < 3; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.LOG);
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