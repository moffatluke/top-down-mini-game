class ForestRoom extends BaseRoom {
    constructor(spriteLoader) {
        super(spriteLoader, 'forest');
        
        // Initialize animals array
        this.animals = [];
        
        this.generateContent();
        this.spawnAnimals();
    }
    
    generateContent() {
        // Simple forest with logs instead of trees
        this.place3TileLog(8, 12);
        this.place3TileLog(28, 20);
        this.place3TileLog(15, 6);
        
        // Add staff item in center
        this.items.push({
            type: 'staff',
            name: 'Magic Staff',
            x: 20 * this.tileSize + this.tileSize / 2,
            y: 15 * this.tileSize + this.tileSize / 2,
            collected: false
        });
        
        // Exit back to main room
        this.exits = [
            { x: 39, y: 15, width: 1, height: 1, targetRoom: 'main', targetX: 1, targetY: 15 }
        ];
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
    
    renderOverlay(ctx, overlayType, x, y) {
        if (overlayType === this.TILE_TYPES.WOOD_LOG) {
            const sprite = this.spriteLoader.getTileFromTileset(8, 1); // Log tile
            if (sprite) {
                ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
                return;
            }
        }
        super.renderOverlay(ctx, overlayType, x, y);
    }
    
    // Spawn forest animals
    spawnAnimals() {
        if (!this.spriteLoader) {
            console.warn('⚠️ Cannot spawn animals - no sprite loader');
            return;
        }
        
        // Forest animals (more bears and wolves)
        const animalSpawns = [
            { type: 'bear', x: 300, y: 200 },     // Near first log
            { type: 'wolf', x: 150, y: 400 },     // Bottom area
            { type: 'snake', x: 600, y: 150 },    // Right side
            { type: 'bear', x: 750, y: 450 },     // Bottom-right
            { type: 'beetle', x: 400, y: 500 },   // Bottom-center
            { type: 'wolf', x: 200, y: 250 }      // Left-center
        ];
        
        // Spawn each animal
        for (const spawn of animalSpawns) {
            try {
                const animal = new Animal(spawn.x, spawn.y, spawn.type, this.spriteLoader);
                this.animals.push(animal);
                console.log(`🌲 Spawned forest ${spawn.type} at (${spawn.x}, ${spawn.y})`);
            } catch (error) {
                console.warn(`⚠️ Failed to spawn ${spawn.type}:`, error);
            }
        }
        
        console.log(`🐻 Spawned ${this.animals.length} animals in forest room`);
    }
    
    // Update all animals
    updateAnimals(deltaTime, player) {
        for (const animal of this.animals) {
            animal.update(deltaTime, player, this);
        }
    }
    
    // Render all animals
    renderAnimals(ctx, camera) {
        for (const animal of this.animals) {
            animal.render(ctx, camera);
        }
    }
}