/**
 * Tileset Extractor for Overworld Sprite Sheet
 * 
 * This class handles:
 * - Loading large sprite sheets containing multiple tiles
 * - Extracting individual tiles from specific coordinates
 * - Scaling tiles to match game requirements
 * - Caching extracted tiles for performance
 * - Converting sprite sheet coordinates to usable game tiles
 * 
 * How it works:
 * 1. Load a large tileset image (like overworld_tileset.png)
 * 2. Extract small 16x16 tiles from specific coordinates
 * 3. Scale them to 24x24 for the game (2x larger)
 * 4. Cache results to avoid re-processing
 */
class TilesetExtractor {
    constructor() {
        // =====================================================
        // TILESET IMAGE AND PROPERTIES
        // =====================================================
        this.tilesetImage = null;           // The loaded tileset sprite sheet image
        this.tileSize = 16;                 // Original size of each tile in the sprite sheet (pixels)
        this.scaledTileSize = 24;           // Target size for the game (2x smaller for more detail)
        this.tilesPerRow = 50;              // Estimated number of tiles per row in sprite sheet
        this.cache = new Map();             // Cache extracted tiles to improve performance
    }

    /**
     * Loads the main tileset sprite sheet from file path
     * @param {string} imagePath - Path to the tileset image file
     * @returns {Promise} - Resolves when image is loaded, rejects on error
     */
    async loadTileset(imagePath) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.tilesetImage = img;
                console.log(`✅ Tileset loaded: ${img.width}x${img.height}`);
                resolve(img);
            };
            img.onerror = reject;
            img.src = imagePath;
        });
    }

    /**
     * Extracts a specific tile from the tileset at given coordinates
     * @param {number} tileX - X coordinate of tile in the sprite sheet (in tile units, not pixels)
     * @param {number} tileY - Y coordinate of tile in the sprite sheet (in tile units, not pixels)
     * @returns {HTMLCanvasElement|null} - Canvas containing the extracted tile, or null if failed
     */
    extractTile(tileX, tileY) {
        if (!this.tilesetImage) {
            console.error('❌ Tileset not loaded!');
            return null;
        }

        // Check cache first to avoid re-processing same tile
        const cacheKey = `${tileX},${tileY}`;
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        // =====================================================
        // CANVAS SETUP FOR TILE EXTRACTION
        // =====================================================
        // Create a canvas for the extracted tile
        const canvas = document.createElement('canvas');
        canvas.width = this.scaledTileSize;     // Set to scaled size (24px)
        canvas.height = this.scaledTileSize;    // Set to scaled size (24px)
        const ctx = canvas.getContext('2d');

        // Disable image smoothing to maintain pixel art style
        ctx.imageSmoothingEnabled = false;

        // =====================================================
        // COORDINATE CALCULATION AND EXTRACTION
        // =====================================================
        // Calculate source coordinates in the tileset (convert tile coords to pixel coords)
        const sourceX = tileX * this.tileSize;  // X position in pixels (tileX * 16)
        const sourceY = tileY * this.tileSize;  // Y position in pixels (tileY * 16)

        // Extract and scale the tile from source tileset to target canvas
        ctx.drawImage(
            this.tilesetImage,
            sourceX, sourceY,           // Source position
            this.tileSize, this.tileSize, // Source size
            0, 0,                       // Destination position
            this.scaledTileSize, this.scaledTileSize // Destination size (scaled up)
        );

        // Cache the result
        this.cache.set(cacheKey, canvas);
        return canvas;
    }

    // Define tile mappings for different terrain types
    getTileMapping() {
        return {
            // Basic terrain tiles (you'll need to adjust these coordinates based on your sprite sheet)
            GRASS: [
                { x: 0, y: 0 },   // Basic grass
                { x: 1, y: 0 },   // Grass variant 1
                { x: 2, y: 0 },   // Grass variant 2
                { x: 3, y: 0 }    // Grass variant 3
            ],
            STONE: [
                { x: 10, y: 5 },  // Stone tile
                { x: 11, y: 5 },  // Stone variant
            ],
            WATER: [
                { x: 0, y: 10 },  // Water tile
                { x: 1, y: 10 },  // Water variant
            ],
            TREE: [
                { x: 5, y: 15 },  // Tree tile
                { x: 6, y: 15 },  // Tree variant
            ],
            HOUSE: [
                { x: 15, y: 10 }, // House tiles
                { x: 16, y: 10 },
                { x: 15, y: 11 },
                { x: 16, y: 11 }
            ],
            BRIDGE: [
                { x: 20, y: 8 },  // Bridge tiles
                { x: 21, y: 8 }
            ]
        };
    }

    // Get a random tile variant for a terrain type
    getRandomTile(terrainType) {
        const mapping = this.getTileMapping();
        const variants = mapping[terrainType];
        
        if (!variants || variants.length === 0) {
            console.warn(`⚠️ No tiles defined for terrain: ${terrainType}`);
            return null;
        }

        const randomVariant = variants[Math.floor(Math.random() * variants.length)];
        return this.extractTile(randomVariant.x, randomVariant.y);
    }

    // Get specific tile by terrain type and variant index
    getTile(terrainType, variantIndex = 0) {
        const mapping = this.getTileMapping();
        const variants = mapping[terrainType];
        
        if (!variants || variants.length === 0) {
            console.warn(`⚠️ No tiles defined for terrain: ${terrainType}`);
            return null;
        }

        const variant = variants[variantIndex % variants.length];
        return this.extractTile(variant.x, variant.y);
    }

    // Analyze the sprite sheet to help identify tile coordinates
    analyzeSpriteSheet() {
        if (!this.tilesetImage) {
            console.error('❌ Tileset not loaded!');
            return;
        }

        console.log('🔍 Sprite Sheet Analysis:');
        console.log(`📐 Image size: ${this.tilesetImage.width}x${this.tilesetImage.height}`);
        console.log(`🔲 Tile size: ${this.tileSize}x${this.tileSize}`);
        console.log(`📊 Estimated tiles: ${Math.floor(this.tilesetImage.width / this.tileSize)} x ${Math.floor(this.tilesetImage.height / this.tileSize)}`);
        console.log(`📋 Total estimated tiles: ${Math.floor(this.tilesetImage.width / this.tileSize) * Math.floor(this.tilesetImage.height / this.tileSize)}`);
    }

    // Helper method to create a visual grid overlay for tile identification
    createGridOverlay() {
        if (!this.tilesetImage) return null;

        const canvas = document.createElement('canvas');
        canvas.width = this.tilesetImage.width;
        canvas.height = this.tilesetImage.height;
        const ctx = canvas.getContext('2d');

        // Draw the original image
        ctx.drawImage(this.tilesetImage, 0, 0);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;

        // Vertical lines
        for (let x = 0; x <= this.tilesetImage.width; x += this.tileSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.tilesetImage.height);
            ctx.stroke();
        }

        // Horizontal lines
        for (let y = 0; y <= this.tilesetImage.height; y += this.tileSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.tilesetImage.width, y);
            ctx.stroke();
        }

        // Add coordinate labels
        ctx.fillStyle = 'white';
        ctx.font = '10px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;

        for (let y = 0; y < Math.floor(this.tilesetImage.height / this.tileSize); y++) {
            for (let x = 0; x < Math.floor(this.tilesetImage.width / this.tileSize); x++) {
                const text = `${x},${y}`;
                const textX = x * this.tileSize + 2;
                const textY = y * this.tileSize + 12;
                
                ctx.strokeText(text, textX, textY);
                ctx.fillText(text, textX, textY);
            }
        }

        return canvas;
    }
}