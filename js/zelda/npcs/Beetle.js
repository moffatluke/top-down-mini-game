/**
 * Beetle NPC Class
 * 
 * Handles beetle sprites with proper animation system:
 * - Basic movement (4 directions)
 * - Idle animations
 * - Attack animation system (foundation)
 */
class Beetle {
    constructor(x, y, spriteLoader) {
        // Position
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        
        // Movement (beetles are small and quick)
        this.speed = 1.0;
        this.direction = 'down';
        this.isMoving = false;
        
        // Sprite system
        this.spriteLoader = spriteLoader;
        this.normalSprite = null;
        this.attackSprite = null;
        
        // Animation state (beetles animate quickly)
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 100; // Very fast animation
        
        // Sprite sheet layout
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.spriteRows = 8; // Will be determined when sprite loads
        this.spriteCols = 4;
        this.spritesLoaded = false;
        
        // AI state (beetles are erratic)
        this.state = 'idle';
        this.stateTimer = 0;
        
        // Load sprites
        this.loadBeetleSprites();
        
        console.log(`🪲 Beetle created at (${x}, ${y})`);
    }
    
    loadBeetleSprites() {
        try {
            // Load normal beetle sprite (Beatle.png - note the spelling)
            this.normalSprite = this.spriteLoader.getAnimal('beetle', false);
            
            // Load attack beetle sprite (Beatle_Attack.png) 
            this.attackSprite = this.spriteLoader.getAnimal('beetle', true);
            
            if (this.normalSprite) {
                if (this.normalSprite.complete) {
                    this.calculateFrameDimensions();
                } else {
                    this.normalSprite.onload = () => {
                        this.calculateFrameDimensions();
                    };
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to load beetle sprites:', error);
        }
    }
    
    calculateFrameDimensions() {
        if (this.normalSprite && this.normalSprite.complete) {
            // Sprite sheets are 4x14 layout
            this.frameWidth = Math.floor(this.normalSprite.width / 4);
            this.frameHeight = Math.floor(this.normalSprite.height / 14);
            this.spriteRows = 14;
            this.spriteCols = 4;
            this.spritesLoaded = true;
            
            console.log(`✅ Beetle using 4x14 layout: ${this.frameWidth}x${this.frameHeight} per frame`);
            console.log(`📐 Beetle sprite: ${this.normalSprite.width}x${this.normalSprite.height} total`);
        }
    }
    
    update(deltaTime, player, gameMap) {
        this.lastX = this.x;
        this.lastY = this.y;
        
        this.stateTimer += deltaTime;
        this.updateAI(deltaTime, player);
        this.updateAnimation(deltaTime);
        this.applyMovement(gameMap);
    }
    
    updateAI(deltaTime, player) {
        switch (this.state) {
            case 'idle':
                this.updateIdle(deltaTime, player);
                break;
            case 'moving':
                this.updateMoving(deltaTime, player);
                break;
            case 'attacking':
                this.updateAttacking(deltaTime, player);
                break;
        }
    }
    
    updateIdle(deltaTime, player) {
        this.isMoving = false;
        
        // Beetles are restless - short idle times
        if (this.stateTimer > 500 + Math.random() * 1000) {
            if (Math.random() < 0.9) { // 90% chance to move (very active)
                this.startMoving();
            } else {
                this.stateTimer = 0;
            }
        }
    }
    
    updateMoving(deltaTime, player) {
        this.isMoving = true;
        
        // Beetles move in short, quick bursts
        if (this.stateTimer > 600 + Math.random() * 800) {
            this.setState('idle');
            return;
        }
        
        const moveDistance = this.speed;
        switch (this.direction) {
            case 'up':    this.y -= moveDistance; break;
            case 'down':  this.y += moveDistance; break;
            case 'left':  this.x -= moveDistance; break;
            case 'right': this.x += moveDistance; break;
        }
    }
    
    updateAttacking(deltaTime, player) {
        this.isMoving = false;
        
        if (this.stateTimer > 400) { // Very quick attack
            this.setState('idle');
        }
    }
    
    startMoving() {
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.setState('moving');
        
        console.log(`🪲 Beetle starts moving ${this.direction}`);
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
        this.animationFrame = 0;
    }
    
    updateAnimation(deltaTime) {
        if (!this.spritesLoaded) return;
        
        // Only animate when actually moving
        if (!this.isMoving) {
            // When idle, stay on frame 0 - no animation
            this.animationFrame = 0;
            this.animationTimer = 0;
            return;
        }
        
        // Only animate when moving
        this.animationTimer += deltaTime;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4; // 4-frame walking cycle
            this.animationTimer = 0;
        }
    }
    
    applyMovement(gameMap) {
        const margin = 64;
        this.x = Math.max(margin, Math.min(1024 - margin, this.x));
        this.y = Math.max(margin, Math.min(768 - margin, this.y));
        
        if (gameMap && gameMap.canMoveTo) {
            if (!gameMap.canMoveTo(this.x, this.y, 24, 24)) {
                this.x = this.lastX;
                this.y = this.lastY;
                this.startMoving();
            }
        }
    }
    
    render(ctx, camera = { x: 0, y: 0 }) {
        if (!this.spritesLoaded || !this.normalSprite) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        if (screenX < -32 || screenX > 1024 + 32 || screenY < -32 || screenY > 768 + 32) {
            return;
        }
        
        let sprite = this.normalSprite;
        if (this.state === 'attacking' && this.attackSprite) {
            sprite = this.attackSprite;
        }
        
        const frameX = this.animationFrame;
        const frameY = this.getFrameRow();
        
        // Render smaller than other animals
        const renderSize = Math.min(this.frameWidth, this.frameHeight) * 0.8;
        
        ctx.drawImage(
            sprite,
            frameX * this.frameWidth, frameY * this.frameHeight, 
            this.frameWidth, this.frameHeight,
            screenX - renderSize/2, screenY - renderSize/2, 
            renderSize, renderSize
        );
        
        if (window.game && window.game.debugMode) {
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.fillRect(screenX - 8, screenY - 8, 16, 16);
            
            ctx.fillStyle = 'white';
            ctx.font = '10px Arial';
            ctx.fillText(`${this.state} ${this.direction}`, screenX - 15, screenY - 25);
        }
    }
    
    getFrameRow() {
        // For 4x14 sprite sheets, basic movement uses first 4 rows
        switch (this.direction) {
            case 'down': return 0;
            case 'left': return 1;
            case 'right': return 2;
            case 'up': return 3;
            default: return 0;
        }
    }
    
    startAttack() {
        this.setState('attacking');
        console.log('🪲 Beetle starts attacking!');
    }
    
    takeDamage(damage, sourceX, sourceY) {
        console.log(`🪲 Beetle takes ${damage} damage - fleeing!`);
        
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        
        this.setState('moving');
        return false;
    }
    
    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const combinedRadius = 12; // Small hitbox for beetles
        
        return distance < combinedRadius;
    }
}