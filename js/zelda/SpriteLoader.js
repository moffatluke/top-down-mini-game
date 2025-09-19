// Zelda-style Sprite Loader
class SpriteLoader {
    constructor() {
        this.sprites = {};
        this.loadedCount = 0;
        this.totalCount = 0;
        this.onComplete = null;
        
        // Define sprite sources
        this.spriteList = {
            // Character sprites (6 frames: 2x3 grid layout)
            'llama_base': 'assets/sprites/llamaNoArmor.png',      // Base character
            'llama_knight': 'assets/sprites/llamaKnight.png',     // Armored version
            
            // Items and equipment
            'magic_staff': 'assets/sprites/staffRed.png',    // Magic staff item
            
            // Terrain tiles
            'grass': 'assets/sprites/grass.png',
            'gravel': 'assets/sprites/gravel.png',
            'cobblestone': 'assets/sprites/mossycoblestone.png',
            'water': 'assets/sprites/waterWithLillies.png'
        };
        
        this.totalCount = Object.keys(this.spriteList).length;
    }

    load(callback) {
        this.onComplete = callback;
        console.log(`🎮 Loading ${this.totalCount} sprites...`);

        // If no sprites to load, complete immediately
        if (this.totalCount === 0) {
            this.complete();
            return;
        }

        // Load each sprite
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
}