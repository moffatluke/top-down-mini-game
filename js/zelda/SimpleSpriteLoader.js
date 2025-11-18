/**
 * Simplified Sprite Loader
 * 
 * Combines SpriteLoader and TilesetExtractor into a single, clean system.
 * Handles all sprite loading and tileset extraction in one place.
 */
class SimpleSpriteLoader {
    constructor() {
        // Sprite storage
        this.sprites = new Map();
        this.loadingComplete = false;
        
        // Tileset properties
        this.tilesetImage = null;
        this.tileSize = 16;                 // Original tile size in sprite sheet
        this.scaledTileSize = 24;          // Game tile size (larger for better detail)
        this.tileCache = new Map();        // Cache extracted tiles for performance
        
        // Weapon selection (simplified)
        this.selectedSwordIndex = 0;       // Always use first sword option
        
        // Sprite paths
        this.spriteDefinitions = {
            'llama_base': 'assets/sprites/llamaNoArmor.png',
            'llama_knight': 'assets/sprites/llamaKnight.png',
            'magic_staff': 'assets/sprites/staffRed.png',
            'steel_weapons': 'assets/sprites/steel-weapons.png',
            'overworld_tileset': 'assets/sprites/overworld_tileset.png',
            // Animal sprites
            'bear': 'assets/sprites/Retro RPG Series - Animal Wildlife/Bear.png',
            'bear_attack': 'assets/sprites/Retro RPG Series - Animal Wildlife/Bear_Attack.png',
            'wolf': 'assets/sprites/Retro RPG Series - Animal Wildlife/Wolf.png',
            'wolf_attack': 'assets/sprites/Retro RPG Series - Animal Wildlife/Wolf_Attack.png',
            'snake': 'assets/sprites/Retro RPG Series - Animal Wildlife/Snake.png',
            'snake_attack': 'assets/sprites/Retro RPG Series - Animal Wildlife/Snake_Attack.png',
            'beetle': 'assets/sprites/Retro RPG Series - Animal Wildlife/Beatle.png',
            'beetle_attack': 'assets/sprites/Retro RPG Series - Animal Wildlife/Beatle_Attack.png'
        };
    }

    /**
     * Load all sprites
     */
    load(callback) {
        console.log('🎨 Loading all game sprites...');
        
        const totalSprites = Object.keys(this.spriteDefinitions).length;
        let loadedSprites = 0;
        
        // Load each sprite
        for (const [key, path] of Object.entries(this.spriteDefinitions)) {
            const img = new Image();
            
            img.onload = () => {
                this.sprites.set(key, img);
                loadedSprites++;
                console.log(`✅ Loaded ${key} (${loadedSprites}/${totalSprites})`);
                
                // Special handling for tileset
                if (key === 'overworld_tileset') {
                    this.tilesetImage = img;
                    console.log(`✅ Tileset ready: ${img.width}x${img.height}`);
                }
                
                // Check if all sprites are loaded
                if (loadedSprites >= totalSprites) {
                    this.loadingComplete = true;
                    console.log('🎉 All sprites loaded successfully!');
                    if (callback) callback();
                }
            };
            
            img.onerror = () => {
                console.error(`❌ Failed to load ${key} from ${path}`);
                loadedSprites++;
                
                // Continue even if some sprites fail
                if (loadedSprites >= totalSprites) {
                    this.loadingComplete = true;
                    console.log('⚠️ Sprite loading completed with some errors');
                    if (callback) callback();
                }
            };
            
            img.src = path;
        }
    }

    /**
     * Get a loaded sprite by name
     */
    get(spriteName) {
        return this.sprites.get(spriteName) || null;
    }

    /**
     * Extract a tile from the tileset (combines SpriteLoader + TilesetExtractor functionality)
     */
    getTileFromTileset(tileX, tileY) {
        if (!this.tilesetImage) {
            console.warn('⚠️ Tileset not loaded yet');
            return null;
        }
        
        // Check cache first
        const cacheKey = `${tileX},${tileY}`;
        if (this.tileCache.has(cacheKey)) {
            return this.tileCache.get(cacheKey);
        }
        
        // Calculate pixel coordinates
        const sourceX = tileX * this.tileSize;
        const sourceY = tileY * this.tileSize;
        
        // Create canvas for extracted tile
        const canvas = document.createElement('canvas');
        canvas.width = this.scaledTileSize;
        canvas.height = this.scaledTileSize;
        const ctx = canvas.getContext('2d');
        
        // Disable smoothing for pixel-perfect scaling
        ctx.imageSmoothingEnabled = false;
        
        try {
            // Extract and scale the tile
            ctx.drawImage(
                this.tilesetImage,
                sourceX, sourceY, this.tileSize, this.tileSize,
                0, 0, this.scaledTileSize, this.scaledTileSize
            );
            
            // Cache the result
            this.tileCache.set(cacheKey, canvas);
            return canvas;
            
        } catch (error) {
            console.error(`❌ Failed to extract tile (${tileX}, ${tileY}):`, error);
            return null;
        }
    }

    /**
     * Get sword sprite (extracts sword from steel weapons sheet)
     */
    getSword() {
        const weaponsSprite = this.get('steel_weapons');
        if (!weaponsSprite) {
            console.warn('⚠️ Steel weapons sprite not loaded');
            return null;
        }

        // Extract sword from weapons sprite sheet
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set sword size
        canvas.width = 32;
        canvas.height = 32;
        
        // Disable smoothing for pixel art
        ctx.imageSmoothingEnabled = false;
        
        // Extract first sword from the weapons sheet
        // Assuming swords are 16x16 pixels and the first sword is at (0, 0)
        const sourceWidth = 16;
        const sourceHeight = 16;
        const sourceX = 0;  // First sword
        const sourceY = 0;  // First row
        
        // Draw the sword scaled up to the canvas
        ctx.drawImage(
            weaponsSprite,
            sourceX, sourceY, sourceWidth, sourceHeight,    // Source from sheet
            0, 0, canvas.width, canvas.height               // Destination on canvas
        );
        
        return canvas;
    }

    /**
     * Get staff frame (simplified)
     */
    getStaffFrame(frameIndex = 0) {
        return this.get('magic_staff');
    }

    /**
     * Reset sword selection (no-op since we only have one sword option now)
     */
    resetSwordSelection() {
        // Simplified - do nothing since we only use one sword type
        console.log('🗡️ Sword selection reset (simplified)');
    }

    /**
     * Check if all sprites are loaded
     */
    isLoaded() {
        return this.loadingComplete;
    }
    
    /**
     * Get animal sprite by type
     */
    getAnimal(animalType, isAttack = false) {
        const spriteKey = isAttack ? `${animalType}_attack` : animalType;
        const sprite = this.get(spriteKey);
        
        if (!sprite) {
            console.warn(`⚠️ Animal sprite not found: ${spriteKey}`);
            return null;
        }
        
        return sprite;
    }
}