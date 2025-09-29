// Zelda-style Game Map
class ZeldaGameMap {
    constructor(spriteLoader, roomName = 'main') {
        this.spriteLoader = spriteLoader;
        this.roomName = roomName;
        this.tileSize = 48;  // Bigger tiles for bigger window
        this.width = 21;     // 21 tiles wide (1008px)
        this.height = 16;    // 16 tiles tall (768px)
        
        // Tile types
        this.TILE_TYPES = {
            GRASS: 0,
            GRAVEL: 1,
            STONE: 2,
            WALL: 3,
            WATER: 4,
            EXIT: 5,  // Exit tiles for room transitions
            TREE: 6   // Tree tiles for forest areas
        };
        
        // Room transitions and items
        this.exits = [];
        this.items = [];
        
        // Fire tile system
        this.fireTiles = new Map(); // Maps "x,y" to fire data
        this.fireDuration = 5000; // 5 seconds
        this.maxFireTiles = 25; // Limit to prevent performance issues
        
        // Generate room-specific map
        this.generateMap();
    }

    generateMap() {
        this.tiles = [];
        
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
        }
        
        console.log(`🗺️ Generated ${this.roomName} room:`, this.width, 'x', this.height);
    }

    generateMainRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Create borders with walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    // North exit for gravel path
                    if (y === 0 && x >= 10 && x <= 12) {
                        this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                    }
                    // West exit to forest
                    else if (x === 0 && y >= 7 && y <= 9) {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    } else {
                        this.tiles[y][x] = this.TILE_TYPES.WALL;
                    }
                }
                // Create gravel paths leading north
                else if (x >= 10 && x <= 12) {
                    this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                }
                // Horizontal gravel path
                else if (y >= 6 && y <= 8 && x >= 5 && x <= 15) {
                    this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                }
                // Create some stone obstacles and structures
                else if ((x + y) % 9 === 0 || (x % 6 === 0 && y % 4 === 0)) {
                    this.tiles[y][x] = this.TILE_TYPES.STONE;
                }
                // Some water patches
                else if ((x >= 16 && x <= 18) && (y >= 10 && y <= 12)) {
                    this.tiles[y][x] = this.TILE_TYPES.WATER;
                }
                // Rest is grass
                else {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
            }
        }
        
        // Add exit to north room (staff room)
        this.exits.push({
            x: 11, y: 0, 
            targetRoom: 'staff_room', 
            targetX: 11 * this.tileSize + this.tileSize / 2, 
            targetY: 14 * this.tileSize + this.tileSize / 2
        });
        
        // Add exit to west (forest room)
        this.exits.push({
            x: 0, y: 8,
            targetRoom: 'forest',
            targetX: (this.width - 3) * this.tileSize + this.tileSize / 2,
            targetY: 8 * this.tileSize + this.tileSize / 2
        });
    }

    generateStaffRoom() {
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Create borders with walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    // South exit back to main room
                    if (y === this.height - 1 && x >= 10 && x <= 12) {
                        this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                    } else {
                        this.tiles[y][x] = this.TILE_TYPES.WALL;
                    }
                }
                // Gravel entrance path
                else if (x >= 10 && x <= 12 && y >= 12) {
                    this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                }
                // Stone altar/platform in center where staff will be
                else if (x >= 9 && x <= 13 && y >= 6 && y <= 8) {
                    this.tiles[y][x] = this.TILE_TYPES.STONE;
                }
                // Some decorative stone columns
                else if ((x === 5 || x === 17) && (y >= 4 && y <= 10)) {
                    this.tiles[y][x] = this.TILE_TYPES.STONE;
                }
                // Rest is grass
                else {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
            }
        }
        
        // Add exit back to main room
        this.exits.push({
            x: 11, y: this.height - 1,
            targetRoom: 'main',
            targetX: 11 * this.tileSize + this.tileSize / 2,
            targetY: 1 * this.tileSize + this.tileSize / 2
        });
        
        // Add magic staff item on grass near the stone altar (reachable)
        this.items.push({
            x: 8 * this.tileSize + this.tileSize / 2,  // Left of altar, on grass
            y: 7 * this.tileSize + this.tileSize / 2,  // Same height as altar
            type: 'magic_staff',
            collected: false
        });
    }
    
    generateForestRoom() {
        // Create a forest room with scattered trees and clearings
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Create borders with walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    // South exit back to main
                    if (y === this.height - 1 && x >= 9 && x <= 11) {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    }
                    // East exit to grove
                    else if (x === this.width - 1 && y >= 7 && y <= 9) {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    } else {
                        this.tiles[y][x] = this.TILE_TYPES.WALL;
                    }
                }
                // Scattered trees (random but deterministic pattern)
                else if ((x * 7 + y * 3) % 11 === 0 && x > 2 && x < this.width - 3 && y > 2 && y < this.height - 3) {
                    this.tiles[y][x] = this.TILE_TYPES.TREE;
                }
                // Small clearings around center
                else if (Math.abs(x - 10) <= 2 && Math.abs(y - 8) <= 2) {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
                // More trees in dense areas
                else if ((x + y * 2) % 8 === 0 && x > 1 && x < this.width - 2) {
                    this.tiles[y][x] = this.TILE_TYPES.TREE;
                }
                // Rest is grass
                else {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
            }
        }
        
        // Add exits
        this.exits.push({
            x: 10, y: this.height - 1,
            targetRoom: 'main',
            targetX: 10 * this.tileSize + this.tileSize / 2,
            targetY: 1 * this.tileSize + this.tileSize / 2
        });
        
        this.exits.push({
            x: this.width - 1, y: 8,
            targetRoom: 'grove',
            targetX: 1 * this.tileSize + this.tileSize / 2,
            targetY: 8 * this.tileSize + this.tileSize / 2
        });
    }
    
    generateGroveRoom() {
        // Create a grove room with dense tree clusters
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Create borders with walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    // West exit back to forest
                    if (x === 0 && y >= 7 && y <= 9) {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    }
                    // North exit to orchard
                    else if (y === 0 && x >= 9 && x <= 11) {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    } else {
                        this.tiles[y][x] = this.TILE_TYPES.WALL;
                    }
                }
                // Dense tree clusters
                else if (x < 7 || x > 14 || y < 5 || y > 11) {
                    if ((x + y) % 3 === 0) {
                        this.tiles[y][x] = this.TILE_TYPES.TREE;
                    } else {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    }
                }
                // Central clearing
                else if (x >= 8 && x <= 12 && y >= 6 && y <= 10) {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
                // Scattered trees in middle areas
                else if ((x * 5 + y * 7) % 13 === 0) {
                    this.tiles[y][x] = this.TILE_TYPES.TREE;
                }
                // Rest is grass
                else {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
            }
        }
        
        // Add exits
        this.exits.push({
            x: 0, y: 8,
            targetRoom: 'forest',
            targetX: (this.width - 2) * this.tileSize + this.tileSize / 2,
            targetY: 8 * this.tileSize + this.tileSize / 2
        });
        
        this.exits.push({
            x: 10, y: 0,
            targetRoom: 'orchard',
            targetX: 10 * this.tileSize + this.tileSize / 2,
            targetY: (this.height - 2) * this.tileSize + this.tileSize / 2
        });
    }
    
    generateOrchardRoom() {
        // Create an orchard room with organized tree rows
        for (let y = 0; y < this.height; y++) {
            this.tiles[y] = [];
            for (let x = 0; x < this.width; x++) {
                // Create borders with walls
                if (x === 0 || x === this.width - 1 || y === 0 || y === this.height - 1) {
                    // South exit back to grove
                    if (y === this.height - 1 && x >= 9 && x <= 11) {
                        this.tiles[y][x] = this.TILE_TYPES.GRASS;
                    } else {
                        this.tiles[y][x] = this.TILE_TYPES.WALL;
                    }
                }
                // Organized tree rows (every 3rd column and row)
                else if (x % 3 === 1 && y % 3 === 1 && x > 2 && x < this.width - 3 && y > 2 && y < this.height - 3) {
                    this.tiles[y][x] = this.TILE_TYPES.TREE;
                }
                // Pathways between tree rows
                else if (x % 3 === 0 || y % 3 === 0) {
                    this.tiles[y][x] = this.TILE_TYPES.GRAVEL;
                }
                // Rest is grass
                else {
                    this.tiles[y][x] = this.TILE_TYPES.GRASS;
                }
            }
        }
        
        // Add exit back to grove
        this.exits.push({
            x: 10, y: this.height - 1,
            targetRoom: 'grove',
            targetX: 10 * this.tileSize + this.tileSize / 2,
            targetY: 1 * this.tileSize + this.tileSize / 2
        });
    }

    getTile(x, y) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
            return this.TILE_TYPES.WALL; // Out of bounds = wall
        }
        return this.tiles[y][x];
    }

    isSolid(tileType) {
        return tileType === this.TILE_TYPES.WALL || 
               tileType === this.TILE_TYPES.WATER || 
               tileType === this.TILE_TYPES.STONE || 
               tileType === this.TILE_TYPES.TREE;
    }
    
    isValidTile(x, y) {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    checkRoomTransition(playerX, playerY) {
        for (let exit of this.exits) {
            const exitPixelX = exit.x * this.tileSize;
            const exitPixelY = exit.y * this.tileSize;
            
            // Check if player is near the exit
            if (Math.abs(playerX - exitPixelX) < this.tileSize/2 && 
                Math.abs(playerY - exitPixelY) < this.tileSize/2) {
                return exit;
            }
        }
        return null;
    }

    checkItemCollection(playerX, playerY) {
        for (let item of this.items) {
            if (!item.collected) {
                const distance = Math.sqrt(
                    Math.pow(playerX - item.x, 2) + 
                    Math.pow(playerY - item.y, 2)
                );
                
                if (distance < this.tileSize) {
                    item.collected = true;
                    return item;
                }
            }
        }
        return null;
    }

    canMoveTo(x, y, width, height) {
        // Check all corners of the collision box
        const corners = [
            { x: x, y: y },                           // Top-left
            { x: x + width, y: y },                   // Top-right
            { x: x, y: y + height },                  // Bottom-left
            { x: x + width, y: y + height }           // Bottom-right
        ];
        
        for (let corner of corners) {
            const tileX = Math.floor(corner.x / this.tileSize);
            const tileY = Math.floor(corner.y / this.tileSize);
            const tileType = this.getTile(tileX, tileY);
            
            if (this.isSolid(tileType)) {
                return false;
            }
        }
        
        return true;
    }
    
    createFireTiles(centerX, centerY, radius) {
        const tileSize = this.tileSize;
        const currentTime = Date.now();
        
        // Limit radius to prevent too many tiles (max 5x5 area)
        const maxRadius = tileSize * 2.5;
        const safeRadius = Math.min(radius, maxRadius);
        
        console.log(`🔥 Creating fire tiles at (${centerX}, ${centerY}) with radius ${safeRadius}`);
        
        // Create fire tiles in a circular pattern around the explosion
        const maxRange = Math.ceil(safeRadius / tileSize);
        for (let y = -maxRange; y <= maxRange; y++) {
            for (let x = -maxRange; x <= maxRange; x++) {
                const worldX = centerX + (x * tileSize);
                const worldY = centerY + (y * tileSize);
                const distance = Math.sqrt((worldX - centerX) ** 2 + (worldY - centerY) ** 2);
                
                if (distance <= safeRadius) {
                    const tileX = Math.floor(worldX / tileSize);
                    const tileY = Math.floor(worldY / tileSize);
                    
                    // Only create fire on walkable tiles and don't exceed max tiles
                    if (this.isValidTile(tileX, tileY) && !this.isSolid(this.getTile(tileX, tileY)) && this.fireTiles.size < this.maxFireTiles) {
                        const key = `${tileX},${tileY}`;
                        // Don't overwrite existing fire tiles
                        if (!this.fireTiles.has(key)) {
                            this.fireTiles.set(key, {
                                x: tileX,
                                y: tileY,
                                startTime: currentTime,
                                intensity: Math.max(0.3, 1 - (distance / safeRadius)) // Closer = more intense
                            });
                        }
                    }
                }
            }
        }
        
        console.log(`🔥 Created ${this.fireTiles.size} fire tiles from explosion! (${maxRange}x${maxRange} search area)`);
    }
    
    updateFireTiles(deltaTime) {
        const currentTime = Date.now();
        const expiredTiles = [];
        
        // Check for expired fire tiles
        this.fireTiles.forEach((fireData, key) => {
            if (currentTime - fireData.startTime > this.fireDuration) {
                expiredTiles.push(key);
            }
        });
        
        // Remove expired tiles
        expiredTiles.forEach(key => {
            this.fireTiles.delete(key);
        });
    }

    render(ctx) {
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const tileType = this.tiles[y][x];
                const screenX = x * this.tileSize;
                const screenY = y * this.tileSize;
                
                this.renderTile(ctx, tileType, screenX, screenY);
            }
        }
        
        // Render items after tiles
        this.renderItems(ctx);
        
        // Render fire tiles on top of everything
        this.renderFireTiles(ctx);
    }
    
    renderFireTiles(ctx) {
        this.fireTiles.forEach((fireData, key) => {
            const tileX = fireData.x;
            const tileY = fireData.y;
            
            // Calculate world position (context is already translated by camera)
            const worldX = tileX * this.tileSize;
            const worldY = tileY * this.tileSize;
            
            // Calculate fire animation based on time
            const currentTime = Date.now();
            const timeAlive = currentTime - fireData.startTime;
            const animationSpeed = 300; // Flicker every 300ms
            const flickerPhase = Math.floor(timeAlive / animationSpeed) % 3;
            
            // Fire colors based on intensity and flicker
            const intensity = fireData.intensity;
            const baseAlpha = 0.6 * intensity;
            const flickerAlpha = baseAlpha + (Math.sin(timeAlive * 0.01) * 0.2);
            
            ctx.save();
            ctx.globalAlpha = Math.max(0.2, flickerAlpha);
            
            // Draw fire effect with multiple layers
            const centerX = worldX + this.tileSize / 2;
            const centerY = worldY + this.tileSize / 2;
            const fireSize = this.tileSize * 0.8;
            
            // Outer fire (red-orange)
            const outerGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, fireSize / 2
            );
            outerGradient.addColorStop(0, `rgba(255, ${100 + flickerPhase * 20}, 0, ${flickerAlpha})`);
            outerGradient.addColorStop(0.6, `rgba(255, ${60 + flickerPhase * 10}, 0, ${flickerAlpha * 0.8})`);
            outerGradient.addColorStop(1, 'rgba(200, 20, 0, 0)');
            
            ctx.fillStyle = outerGradient;
            ctx.fillRect(worldX + 2, worldY + 2, this.tileSize - 4, this.tileSize - 4);
            
            // Inner fire (bright yellow-white)
            const innerGradient = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, fireSize / 3
            );
            innerGradient.addColorStop(0, `rgba(255, 255, ${150 + flickerPhase * 50}, ${flickerAlpha * 0.9})`);
            innerGradient.addColorStop(0.7, `rgba(255, ${180 + flickerPhase * 30}, 0, ${flickerAlpha * 0.6})`);
            innerGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            
            ctx.fillStyle = innerGradient;
            ctx.fillRect(worldX + 6, worldY + 6, this.tileSize - 12, this.tileSize - 12);
            
            ctx.restore();
        });
    }

    renderTile(ctx, tileType, x, y) {
        let color;
        let sprite = null;
        
        switch (tileType) {
            case this.TILE_TYPES.GRASS:
                color = '#4a7c59';
                sprite = this.spriteLoader.get('grass');
                break;
            case this.TILE_TYPES.GRAVEL:
                color = '#8d8d8d';
                sprite = this.spriteLoader.get('gravel');
                break;
            case this.TILE_TYPES.STONE:
                color = '#6c7b7f';
                sprite = this.spriteLoader.get('cobblestone');
                break;
            case this.TILE_TYPES.WALL:
                color = '#2c3e50';
                break;
            case this.TILE_TYPES.WATER:
                color = '#3498db';
                sprite = this.spriteLoader.get('water');
                break;
            case this.TILE_TYPES.TREE:
                color = '#2d5016'; // Dark green for trees
                // Trees will be rendered with a simple green circle/rectangle for now
                break;
            default:
                color = '#ff00ff'; // Magenta for unknown tiles
        }
        
        // Use sprite if available, otherwise solid color
        // Add slight overlap to prevent seam lines
        const tileOverlap = 0.5; // Small overlap to eliminate gaps
        
        if (sprite) {
            ctx.drawImage(sprite, 
                Math.floor(x), Math.floor(y), 
                this.tileSize + tileOverlap, this.tileSize + tileOverlap);
        } else {
            ctx.fillStyle = color;
            ctx.fillRect(Math.floor(x), Math.floor(y), 
                this.tileSize + tileOverlap, this.tileSize + tileOverlap);
        }
        
        // Removed tile borders to eliminate seam lines
        // Clean pixel art looks better without borders
        
        // Special effects for different tile types (optional subtle effects)
        if (tileType === this.TILE_TYPES.WATER && sprite) {
            // Optional: Add a subtle shimmer effect over the water sprite
            const time = Date.now() * 0.001;
            const shimmer = Math.sin(time + x * 0.05 + y * 0.05) * 0.1;
            ctx.fillStyle = `rgba(173, 216, 230, ${0.1 + shimmer})`;
            ctx.fillRect(x, y, this.tileSize, this.tileSize);
        }
        
        // Special tree rendering
        if (tileType === this.TILE_TYPES.TREE) {
            // Draw tree trunk (brown)
            ctx.fillStyle = '#654321';
            const trunkWidth = this.tileSize * 0.3;
            const trunkHeight = this.tileSize * 0.6;
            ctx.fillRect(x + (this.tileSize - trunkWidth) / 2, y + this.tileSize - trunkHeight, trunkWidth, trunkHeight);
            
            // Draw tree crown (green)
            ctx.fillStyle = '#228B22';
            const crownRadius = this.tileSize * 0.4;
            ctx.beginPath();
            ctx.arc(x + this.tileSize / 2, y + this.tileSize * 0.4, crownRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // Add some depth with a darker outline
            ctx.strokeStyle = '#006400';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    // Get player spawn position (safe walkable area)
    getSpawnPosition() {
        // Room-specific safe spawn positions
        if (this.roomName === 'main') {
            return this.getMainRoomSpawn();
        } else if (this.roomName === 'staff_room') {
            return this.getStaffRoomSpawn();
        } else if (this.roomName === 'forest') {
            return { x: 10 * this.tileSize, y: 8 * this.tileSize }; // Center clearing
        } else if (this.roomName === 'grove') {
            return { x: 10 * this.tileSize, y: 8 * this.tileSize }; // Central clearing
        } else if (this.roomName === 'orchard') {
            return { x: 10 * this.tileSize, y: 8 * this.tileSize }; // Between tree rows
        }
        
        // Fallback - find any safe grass tile
        return this.findSafeGrassSpawn();
    }

    getMainRoomSpawn() {
        // Spawn on gravel path in main room (guaranteed safe)
        return {
            x: 11 * this.tileSize + this.tileSize / 2,  // Middle of gravel path
            y: 10 * this.tileSize + this.tileSize / 2   // Safe distance from edges
        };
    }

    getStaffRoomSpawn() {
        // Spawn near entrance in staff room
        return {
            x: 11 * this.tileSize + this.tileSize / 2,  // Middle of entrance
            y: 13 * this.tileSize + this.tileSize / 2   // On gravel entrance path
        };
    }

    findSafeGrassSpawn() {
        // Try to find a safe grass tile that's actually walkable
        for (let attempts = 0; attempts < 100; attempts++) {
            const x = Math.floor(this.width / 4) + Math.floor(Math.random() * (this.width / 2));
            const y = Math.floor(this.height / 4) + Math.floor(Math.random() * (this.height / 2));
            
            // Check if this tile and surrounding area are safe
            if (this.isPositionSafe(x, y)) {
                return {
                    x: x * this.tileSize + this.tileSize / 2,
                    y: y * this.tileSize + this.tileSize / 2
                };
            }
        }
        
        // Emergency fallback - center of map
        return {
            x: (this.width / 2) * this.tileSize,
            y: (this.height / 2) * this.tileSize
        };
    }

    isPositionSafe(tileX, tileY) {
        // Check if the tile and surrounding area are walkable
        for (let checkY = tileY - 1; checkY <= tileY + 1; checkY++) {
            for (let checkX = tileX - 1; checkX <= tileX + 1; checkX++) {
                const tileType = this.getTile(checkX, checkY);
                if (this.isSolid(tileType)) {
                    return false; // Found a solid tile nearby
                }
            }
        }
        
        // Make sure it's on a walkable tile type
        const centerTile = this.getTile(tileX, tileY);
        return centerTile === this.TILE_TYPES.GRASS || centerTile === this.TILE_TYPES.GRAVEL;
    }

    renderItems(ctx) {
        for (let item of this.items) {
            if (!item.collected) {
                const sprite = this.spriteLoader.get(item.type);
                if (sprite) {
                    // Add a floating animation
                    const time = Date.now() * 0.003;
                    const bobOffset = Math.sin(time) * 4;
                    
                    // Handle animated items (like magic staff)
                    let frameX = 0, frameY = 0;
                    let frameWidth = sprite.width;
                    let frameHeight = sprite.height;
                    
                    if (item.type === 'magic_staff') {
                        // Staff sprite is 2x3 grid like character sprites
                        const animationFrame = Math.floor(time * 3) % 2; // Animate between 2 frames
                        
                        // 2x3 grid: 2 columns, 3 rows
                        frameWidth = sprite.width / 2;   // Each frame is half the width
                        frameHeight = sprite.height / 3; // Each frame is one-third the height
                        
                        // Use top row for animation - alternate between red and blue staff
                        frameX = animationFrame * frameWidth;  // Column 0 or 1
                        frameY = 0;  // Top row
                        
                        console.log(`Staff sprite: ${sprite.width}x${sprite.height}, frame: ${frameWidth}x${frameHeight} at ${frameX},${frameY}`);
                    }
                    
                    // Draw item with glow effect
                    ctx.save();
                    ctx.shadowColor = '#ffff00';
                    ctx.shadowBlur = 10;
                    
                    // Use the actual frame size for proper display
                    const renderWidth = frameWidth;
                    const renderHeight = frameHeight;
                    
                    ctx.drawImage(
                        sprite,
                        frameX, frameY, frameWidth, frameHeight,  // Source frame
                        item.x - renderWidth/2, item.y - renderHeight/2 + bobOffset,     // Destination (centered)
                        renderWidth, renderHeight                 // Reasonable size
                    );
                    ctx.restore();
                    
                    // Add sparkle effect
                    const sparkleTime = time * 2;
                    for (let i = 0; i < 3; i++) {
                        const angle = sparkleTime + (i * Math.PI * 2 / 3);
                        const sparkleX = item.x + Math.cos(angle) * 20;
                        const sparkleY = item.y + Math.sin(angle) * 15 + bobOffset;
                        
                        ctx.fillStyle = `rgba(255, 255, 0, ${0.5 + Math.sin(sparkleTime * 3) * 0.3})`;
                        ctx.fillRect(sparkleX - 1, sparkleY - 1, 2, 2);
                    }
                }
            }
        }
    }
}