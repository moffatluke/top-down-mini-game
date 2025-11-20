class MainRoom extends BaseRoom {
    constructor(spriteLoader) {
        super(spriteLoader, 'main');
        
        // Initialize animals array
        this.animals = [];
        
        try {
            console.log('🏠 Generating main room content...');
            this.generateContent();
            
            // Add animals after content is generated
            this.spawnAnimals();
            
            console.log('✅ Main room content generated successfully');
        } catch (error) {
            console.error('❌ MainRoom generation failed:', error);
            // Fallback to basic grass room
        }
    }
    
    generateContent() {
        // Create simple road system
        this.createRoads();
        
        // Add decorative elements
        this.addDecorations();
        
        // Add items
        this.addItems();
        
        // Set up exits
        this.setupExits();
    }
    
    createRoads() {
        // Horizontal road across the middle (5 tiles wide)
        for (let x = 5; x <= 37; x++) {
            this.setTile(x, 13, this.TILE_TYPES.GRAVEL);
            this.setTile(x, 14, this.TILE_TYPES.GRAVEL);
            this.setTile(x, 15, this.TILE_TYPES.GRAVEL);
            this.setTile(x, 16, this.TILE_TYPES.GRAVEL);
            this.setTile(x, 17, this.TILE_TYPES.GRAVEL);
        }
        
        // Vertical road down the middle (5 tiles wide)
        for (let y = 5; y <= 27; y++) {
            this.setTile(18, y, this.TILE_TYPES.GRAVEL);
            this.setTile(19, y, this.TILE_TYPES.GRAVEL);
            this.setTile(20, y, this.TILE_TYPES.GRAVEL);
            this.setTile(21, y, this.TILE_TYPES.GRAVEL);
            this.setTile(22, y, this.TILE_TYPES.GRAVEL);
        }
    }
    
    addDecorations() {
        // Add fountain at the center intersection
        this.place3x3Fountain(19, 14);
        
        // Add one working tree
        this.place2x2Tree(8, 8);
        
        // Add some bushes
        this.place2TileBush(10, 25);
        this.place2TileBush(28, 26);
        this.place2TileBush(6, 12);
        this.place2TileBush(12, 10);
        
        // Add water pond (moved up to avoid road overlap)
        for (let py = 6; py < 11; py++) {
            for (let px = 30; px < 35; px++) {
                this.setTile(px, py, this.TILE_TYPES.WATER);
            }
        }
    }
    
    addItems() {
        // Add sword in bottom area
        this.items.push({
            type: 'sword',
            x: 4 * this.tileSize + this.tileSize/2,
            y: 29 * this.tileSize + this.tileSize/2,
            collected: false
        });
    }
    
    setupExits() {
        this.exits = [
            { x: 20, y: 0, width: 1, height: 1, targetRoom: 'staff_room', targetX: 20, targetY: 30 },
            { x: 0, y: 15, width: 1, height: 1, targetRoom: 'forest', targetX: 38, targetY: 15 }
        ];
    }
    
    // Simple 2x2 tree placement
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
    
    // Simple 2-tile bush placement
    place2TileBush(startX, startY) {
        for (let dx = 0; dx < 2; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.BUSH);
            }
        }
    }
    
    // Simple 2x2 stump placement
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
    
    // Spawn animals around the room
    spawnAnimals() {
        if (!this.spriteLoader) {
            console.warn('⚠️ Cannot spawn animals - no sprite loader');
            return;
        }
        
        // Create animal spawn points (avoiding roads and obstacles)
        const animalSpawns = [
            { type: 'wolf', x: 200, y: 200 },     // Top-left grass area
            { type: 'wolf', x: 400, y: 100 }      // Top-center grass area
        ];
        
        // Spawn each animal using individual NPC classes
        for (const spawn of animalSpawns) {
            try {
                let animal;
                switch (spawn.type) {
                    case 'wolf':
                        if (typeof Wolf !== 'undefined') {
                            animal = new Wolf(spawn.x, spawn.y, this.spriteLoader);
                        }
                        break;
                    case 'bear':
                        if (typeof Bear !== 'undefined') {
                            animal = new Bear(spawn.x, spawn.y, this.spriteLoader);
                        }
                        break;
                    case 'snake':
                        if (typeof Snake !== 'undefined') {
                            animal = new Snake(spawn.x, spawn.y, this.spriteLoader);
                        }
                        break;
                    case 'beetle':
                        if (typeof Beetle !== 'undefined') {
                            animal = new Beetle(spawn.x, spawn.y, this.spriteLoader);
                        }
                        break;
                }
                if (animal) {
                    this.animals.push(animal);
                    console.log(`🐾 Spawned ${spawn.type} at (${spawn.x}, ${spawn.y})`);
                }
            } catch (error) {
                console.warn(`⚠️ Failed to spawn ${spawn.type}:`, error);
            }
        }
        
        console.log(`🌟 Spawned ${this.animals.length} animals in main room`);
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