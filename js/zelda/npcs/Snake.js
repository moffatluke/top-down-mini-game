/**
 * Snake NPC Class
 * 
 * Handles snake sprites with proper animation system:
 * - Basic movement (4 directions)
 * - Idle animations
 * - Attack animation system (foundation)
 */
class Snake {
    constructor(x, y, spriteLoader) {
        // Position
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        
        // Movement (snakes are slower but more deliberate)
        this.speed = 0.3;
        this.direction = 'down';
        this.isMoving = false;
        
        // Sprite system
        this.spriteLoader = spriteLoader;
        this.normalSprite = null;
        this.attackSprite = null;
        
        // Animation state (snakes animate slower)
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 250; // Slower, more deliberate
        
        // Sprite sheet layout
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.spritesLoaded = false;
        
        // AI state (snakes stay still longer)
        this.state = 'idle';
        this.stateTimer = 0;
        
        // Load sprites
        this.loadSnakeSprites();
        
        console.log(`🐍 Snake created at (${x}, ${y})`);
    }
    
    loadSnakeSprites() {
        try {
            // Load normal snake sprite (Snake.png)
            this.normalSprite = this.spriteLoader.getAnimal('snake', false);
            
            // Load attack snake sprite (Snake_Attack.png) 
            this.attackSprite = this.spriteLoader.getAnimal('snake', true);
            
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
            console.error('❌ Failed to load snake sprites:', error);
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
            
            console.log(`✅ Snake using 4x14 layout: ${this.frameWidth}x${this.frameHeight} per frame`);
            console.log(`📐 Snake sprite: ${this.normalSprite.width}x${this.normalSprite.height} total`);
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
        
        // Snakes are very patient - long idle times
        if (this.stateTimer > 4000 + Math.random() * 4000) {
            if (Math.random() < 0.5) { // 50% chance to move (lower than other animals)
                this.startMoving();
            } else {
                this.stateTimer = 0;
            }
        }
    }
    
    updateMoving(deltaTime, player) {
        this.isMoving = true;
        
        // Snakes move for short bursts
        if (this.stateTimer > 800 + Math.random() * 1200) {
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
        
        if (this.stateTimer > 600) { // Quick strike
            this.setState('idle');
        }
    }
    
    startMoving() {
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.setState('moving');
        
        console.log(`🐍 Snake starts moving ${this.direction}`);
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
        this.animationFrame = 0;
    }
    
    updateAnimation(deltaTime) {
        if (!this.spritesLoaded) return;
        
        this.animationTimer += deltaTime;
        const animSpeed = this.isMoving ? this.animationSpeed : this.animationSpeed * 4; // Very slow idle
        
        if (this.animationTimer >= animSpeed) {
            if (this.isMoving) {
                this.animationFrame = (this.animationFrame + 1) % 4;
            } else {
                // Very subtle idle animation
                this.animationFrame = this.animationFrame === 0 ? 1 : 0;
            }
            this.animationTimer = 0;
        }
    }
    
    applyMovement(gameMap) {
        const margin = 64;
        this.x = Math.max(margin, Math.min(1024 - margin, this.x));
        this.y = Math.max(margin, Math.min(768 - margin, this.y));
        
        if (gameMap && gameMap.canMoveTo) {
            if (!gameMap.canMoveTo(this.x, this.y, 32, 32)) {
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
        
        if (screenX < -64 || screenX > 1024 + 64 || screenY < -64 || screenY > 768 + 64) {
            return;
        }
        
        let sprite = this.normalSprite;
        if (this.state === 'attacking' && this.attackSprite) {
            sprite = this.attackSprite;
        }
        
        const frameX = this.animationFrame;
        const frameY = this.getFrameRow();
        
        ctx.drawImage(
            sprite,
            frameX * this.frameWidth, frameY * this.frameHeight, 
            this.frameWidth, this.frameHeight,
            screenX - this.frameWidth/2, screenY - this.frameHeight/2, 
            this.frameWidth, this.frameHeight
        );
        
        if (window.game && window.game.debugMode) {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
            ctx.fillRect(screenX - 12, screenY - 12, 24, 24);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`${this.state} ${this.direction}`, screenX - 20, screenY - 30);
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
        console.log('🐍 Snake starts attacking!');
    }
    
    takeDamage(damage, sourceX, sourceY) {
        console.log(`🐍 Snake takes ${damage} damage - fleeing!`);
        
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
        const combinedRadius = 16; // Smaller hitbox for snakes
        
        return distance < combinedRadius;
    }
}