/**
 * Zelda-style Sprite Loader
 * 
 * This class handles:
 * - Loading all game sprites and images
 * - Managing tileset integration with coordinate mapping
 * - Providing easy access to loaded sprites
 * - Progress tracking for loading screen
 * - Fallback handling for missing sprites
 * - Tileset extraction for detailed terrain tiles
 */
class SpriteLoader {
    constructor() {
        // =====================================================
        // SPRITE STORAGE AND TRACKING
        // =====================================================
        this.sprites = {};                  // Object storing all loaded sprite images
        this.loadedCount = 0;               // Number of sprites successfully loaded
        this.totalCount = 0;                // Total number of sprites to load
        this.onComplete = null;             // Callback function to run when all sprites loaded
        
        // =====================================================
        // TILESET INTEGRATION SYSTEM
        // =====================================================
        this.tilesetExtractor = new TilesetExtractor();  // Handles extracting individual tiles from sprite sheet
        this.tilesetLoaded = false;         // Track whether tileset has been processed
        
        // =====================================================
        // SPRITE DEFINITIONS
        // =====================================================
        // Define all sprites that need to be loaded with their file paths
        this.spriteList = {
            // CHARACTER SPRITES (6 frames total: 2x3 grid layout)
            'llama_base': 'assets/sprites/llamaNoArmor.png',      // Base llama character (unarmored)
            'llama_knight': 'assets/sprites/llamaKnight.png',     // Armored llama knight version
            
            // ITEMS AND EQUIPMENT
            'magic_staff': 'assets/sprites/staffRed.png',         // Magic staff item sprite
            'weapons_sheet': 'assets/sprites/steel-weapons.png',  // Weapons sprite sheet
            
            // TILESET INTEGRATION (main terrain source)
            'overworld_tileset': 'assets/sprites/overworld_tileset.png',  // Large sprite sheet with terrain tiles
            
            // FALLBACK TERRAIN TILES (used if tileset fails to load or extract)
            'grass': 'assets/sprites/grass.png',                 // Simple grass tile fallback
            'gravel': 'assets/sprites/gravel.png',               // Gravel path tile fallback
            'cobblestone': 'assets/sprites/mossycoblestone.png', // Stone tile fallback
            'water': 'assets/sprites/waterWithLillies.png',      // Water tile fallback
            
            // TREE SPRITES (normal and special states)
            'tree': 'assets/sprites/tree.png',                   // Normal tree sprite
            'tree_burning': 'assets/sprites/tree_burning.png'    // Tree on fire (for magic effects)
        };
        
        // Set total count for progress tracking
        this.totalCount = Object.keys(this.spriteList).length;
    }

    /**
     * Starts loading all sprites and calls callback when complete
     * @param {Function} callback - Function to call when all sprites are loaded
     */
    load(callback) {
        this.onComplete = callback;
        console.log(`🎮 Loading ${this.totalCount} sprites...`);

        // Handle edge case: no sprites to load
        if (this.totalCount === 0) {
            this.complete();
            return;
        }

        // Load each sprite defined in spriteList
        Object.entries(this.spriteList).forEach(([name, path]) => {
            this.loadSprite(name, path);
        });
    }

    loadSprite(name, path) {
        const img = new Image();
        
        img.onload = () => {
            this.sprites[name] = img;
            this.loadedCount++;
            console.log(`✅ Loaded: ${name} (${img.width}x${img.height}) [${this.loadedCount}/${this.totalCount}]`);
            
            // Special handling for the overworld tileset
            if (name === 'overworld_tileset') {
                this.setupTileset(img);
            }
            
            if (this.loadedCount === this.totalCount) {
                this.complete();
            }
        };

        img.onerror = () => {
            console.error(`❌ Failed to load: ${name} from ${path}`);
            console.warn(`💡 This often happens with file:// URLs. Try using a local server!`);
            // Create a placeholder
            this.sprites[name] = this.createPlaceholder(name);
            this.loadedCount++;
            
            if (this.loadedCount === this.totalCount) {
                this.complete();
            }
        };

        img.src = path;
    }

    createPlaceholder(name) {
        // Make placeholders larger to match expected sprite sizes
        const canvas = document.createElement('canvas');
        
        // Set appropriate sizes based on sprite type
        if (name.includes('llama') || name.includes('knight')) {
            canvas.width = 64;   // Character sprites are larger
            canvas.height = 96;
        } else if (name.includes('staff')) {
            canvas.width = 32;   // Staff sprite
            canvas.height = 48;
        } else {
            canvas.width = 48;   // Tile sprites
            canvas.height = 48;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Color based on sprite type with bright, visible colors
        let color = '#ff00ff'; // Default magenta
        
        if (name.includes('knight') || name.includes('llama')) color = '#ff6b6b'; // Red for character
        if (name.includes('cobble') || name.includes('stone')) color = '#74b9ff'; // Blue for stone
        if (name.includes('grass')) color = '#55dd55'; // Bright green for grass
        if (name.includes('gravel')) color = '#999999'; // Gray for gravel
        if (name.includes('water')) color = '#3498db'; // Blue for water
        if (name.includes('staff')) color = '#ff4444'; // Red for staff
        if (name.includes('tree_burning')) color = '#ff6600'; // Orange for burning tree
        if (name.includes('tree') && !name.includes('burning')) color = '#228B22'; // Green for normal tree
        
        // Fill background
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add a bright border
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
        
        // Add text label
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 2;
        ctx.fillText(name.substring(0, 4).toUpperCase(), canvas.width / 2, canvas.height / 2);
        
        console.log(`🎨 Created ${canvas.width}x${canvas.height} placeholder for ${name}`);
        return canvas;
    }

    complete() {
        console.log('🎉 All sprites loaded successfully!');
        console.log('📋 Loaded sprites:', Object.keys(this.sprites));
        if (this.onComplete) {
            this.onComplete();
        }
    }

    get(name) {
        return this.sprites[name] || null;
    }

    isLoaded() {
        return this.loadedCount === this.totalCount;
    }

    // Setup the tileset extractor when the overworld tileset loads
    setupTileset(tilesetImage) {
        this.tilesetExtractor.tilesetImage = tilesetImage;
        this.tilesetExtractor.analyzeSpriteSheet();
        this.tilesetLoaded = true;
        
        // Extract and cache common tiles
        this.extractCommonTiles();
        
        console.log('🗺️ Overworld tileset ready for extraction!');
    }

    // Extract commonly used tiles from the tileset
    extractCommonTiles() {
        if (!this.tilesetLoaded) return;

        // Extract and store common terrain tiles
        // These coordinates are from your actual tileset
        const tileMap = {
            'tileset_grass': { x: 17, y: 29 },     // Dark grass tile (top-left of 2x2)
            'tileset_grass_tr': { x: 18, y: 29 },  // Dark grass tile (top-right of 2x2)
            'tileset_grass_bl': { x: 17, y: 30 },  // Dark grass tile (bottom-left of 2x2)
            'tileset_grass_br': { x: 18, y: 30 },  // Dark grass tile (bottom-right of 2x2)
            'tileset_stone': { x: 2, y: 32 },      // Road/stone tile from your tileset
            'tileset_dirt': { x: 1, y: 0 },        // Dirt tile (adjust as needed)
            'tileset_water': { x: 0, y: 1 },       // Water tile (adjust as needed)
            'tileset_tree': { x: 3, y: 0 },        // Tree tile (adjust as needed)
            'tileset_house_tl': { x: 4, y: 0 },    // House top-left
            'tileset_house_tr': { x: 5, y: 0 },    // House top-right
            'tileset_house_bl': { x: 4, y: 1 },    // House bottom-left
            'tileset_house_br': { x: 5, y: 1 },    // House bottom-right
        };

        for (const [name, coords] of Object.entries(tileMap)) {
            const tile = this.tilesetExtractor.extractTile(coords.x, coords.y);
            if (tile) {
                this.sprites[name] = tile;
                console.log(`🎨 Extracted tile: ${name} from (${coords.x}, ${coords.y})`);
            }
        }
    }

    // Get a tile from the tileset by coordinates
    getTileFromTileset(x, y) {
        if (!this.tilesetLoaded) {
            console.warn('⚠️ Tileset not loaded yet!');
            return null;
        }
        return this.tilesetExtractor.extractTile(x, y);
    }

    // Get a random variant of a terrain type
    getRandomTerrainTile(terrainType) {
        if (!this.tilesetLoaded) {
            // Fallback to existing sprites
            return this.get(terrainType.toLowerCase());
        }
        return this.tilesetExtractor.getRandomTile(terrainType);
    }

    // Get a specific grass variant (for the 2x2 dark grass block)
    getGrassVariant(variant = 'tl') {
        const grassTiles = {
            'tl': this.get('tileset_grass'),      // top-left
            'tr': this.get('tileset_grass_tr'),   // top-right  
            'bl': this.get('tileset_grass_bl'),   // bottom-left
            'br': this.get('tileset_grass_br')    // bottom-right
        };
        return grassTiles[variant] || this.get('tileset_grass');
    }

    // Get a random grass tile from the 2x2 set
    getRandomGrassTile() {
        const variants = ['tl', 'tr', 'bl', 'br'];
        const randomVariant = variants[Math.floor(Math.random() * variants.length)];
        return this.getGrassVariant(randomVariant);
    }

    // Create a debug grid overlay for the tileset
    createTilesetDebugGrid() {
        if (!this.tilesetLoaded) return null;
        return this.tilesetExtractor.createGridOverlay();
    }

    // Extract weapon sprites from the weapons sprite sheet
    getWeaponSprite(weaponX, weaponY, weaponSize = 32) {
        const weaponsSheet = this.get('weapons_sheet');
        if (!weaponsSheet) {
            console.log('Weapons sheet not loaded');
            return null;
        }

        console.log(`Extracting weapon at (${weaponX}, ${weaponY}) with size ${weaponSize}`);
        console.log(`Weapons sheet dimensions: ${weaponsSheet.width}x${weaponsSheet.height}`);

        // Create a canvas to extract the specific weapon
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = weaponSize;
        canvas.height = weaponSize;

        // Extract the weapon from the specified grid position
        ctx.drawImage(
            weaponsSheet,
            weaponX * weaponSize, weaponY * weaponSize, weaponSize, weaponSize,
            0, 0, weaponSize, weaponSize
        );

        return canvas;
    }

    // Get the specific sword at position 1,4
    getSword() {
        const weaponsSheet = this.get('weapons_sheet');
        if (!weaponsSheet) return null;
        
        // Detect weapon size based on sheet dimensions
        // Common weapon sheet sizes are 16x16 or 32x32 per weapon
        const sheetWidth = weaponsSheet.width;
        const sheetHeight = weaponsSheet.height;
        
        // Try to detect grid size (assume square weapons)
        let weaponSize = 32; // Default
        if (sheetWidth <= 256 && sheetHeight <= 256) {
            weaponSize = 16; // Smaller sprites
        } else if (sheetWidth <= 512 && sheetHeight <= 512) {
            weaponSize = 32; // Medium sprites
        }
        
        console.log(`Using weapon size: ${weaponSize}px for sheet ${sheetWidth}x${sheetHeight}`);
        return this.getWeaponSprite(1, 4, weaponSize);
    }
}