/**
 * Bear NPC Class - Built from ground up
 * 
 * Handles bear sprites with proper animation system:
 * - Basic movement (4 directions)
 * - Idle animations
 * - Attack animation system (foundation)
 */
class Bear {
    constructor(x, y, spriteLoader) {
        // Position
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        
        // Movement
        this.speed = 0.5;
        this.direction = 'down'; // down, up, left, right
        this.isMoving = false;
        
        // Sprite system
        this.spriteLoader = spriteLoader;
        this.normalSprite = null;
        this.attackSprite = null;
        
        // Animation state
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 200; // milliseconds per frame
        
        // Sprite sheet layout for bear (4x14)
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.spriteRows = 14;
        this.spriteCols = 4;
        this.spritesLoaded = false;
        
        // AI state
        this.state = 'idle'; // idle, moving, attacking
        this.stateTimer = 0;
        
        // Load sprites
        this.loadBearSprites();
        
        console.log(`🐻 Bear created at (${x}, ${y})`);
    }
    
    loadBearSprites() {
        try {
            // Load normal bear sprite (Bear.png)
            this.normalSprite = this.spriteLoader.getAnimal('bear', false);
            
            // Load attack bear sprite (Bear_Attack.png) 
            this.attackSprite = this.spriteLoader.getAnimal('bear', true);
            
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
            console.error('❌ Failed to load bear sprites:', error);
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
            
            console.log(`✅ Bear using 4x14 layout: ${this.frameWidth}x${this.frameHeight} per frame`);
            console.log(`📐 Bear sprite: ${this.normalSprite.width}x${this.normalSprite.height} total`);
        }
    }
    
    update(deltaTime, player, gameMap) {
        this.lastX = this.x;
        this.lastY = this.y;
        
        // Update state timer
        this.stateTimer += deltaTime;
        
        // Update AI behavior
        this.updateAI(deltaTime, player);
        
        // Apply movement with collision
        this.applyMovement(gameMap);
        
        // Check if bear actually moved (after collision detection)
        const movementThreshold = 0.1;
        this.isMoving = (Math.abs(this.x - this.lastX) > movementThreshold || Math.abs(this.y - this.lastY) > movementThreshold);
        
        // Update animation
        this.updateAnimation(deltaTime);
        
        // Debug logging for problematic bear
        if (this.animationFrame > 1 && !this.isMoving && this.state === 'idle') {
            console.log(`🐻 DEBUG: Bear stuck animating - Frame: ${this.animationFrame}, State: ${this.state}, Moving: ${this.isMoving}`);
            this.animationFrame = 0; // Force reset
        }
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
        
        // Stay idle for 2-4 seconds, then maybe move
        if (this.stateTimer > 2000 + Math.random() * 2000) {
            if (Math.random() < 0.7) {
                this.startMoving();
            } else {
                this.stateTimer = 0; // Reset idle timer
            }
        }
    }
    
    updateMoving(deltaTime, player) {
        this.isMoving = true;
        
        // Move for 1-3 seconds, then go back to idle
        if (this.stateTimer > 1000 + Math.random() * 2000) {
            this.setState('idle');
            return;
        }
        
        // Simple movement in current direction
        const moveDistance = this.speed;
        switch (this.direction) {
            case 'up':    this.y -= moveDistance; break;
            case 'down':  this.y += moveDistance; break;
            case 'left':  this.x -= moveDistance; break;
            case 'right': this.x += moveDistance; break;
        }
    }
    
    updateAttacking(deltaTime, player) {
        // Placeholder for attack behavior
        this.isMoving = false;
        
        // Attack animation lasts 1 second
        if (this.stateTimer > 1000) {
            this.setState('idle');
        }
    }
    
    startMoving() {
        // Choose random direction
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.setState('moving');
        
        console.log(`🐻 Bear starts moving ${this.direction}`);
    }
    
    setState(newState) {
        this.state = newState;
        this.stateTimer = 0;
        this.animationFrame = 0; // Reset animation when changing state
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
        // Basic boundary checking
        const margin = 64;
        this.x = Math.max(margin, Math.min(1024 - margin, this.x));
        this.y = Math.max(margin, Math.min(768 - margin, this.y));
        
        // Check collision with game map if available
        if (gameMap && gameMap.canMoveTo) {
            if (!gameMap.canMoveTo(this.x, this.y, 32, 32)) {
                // Collision - revert movement
                this.x = this.lastX;
                this.y = this.lastY;
                
                // Change direction on collision
                this.startMoving();
            }
        }
    }
    
    render(ctx, camera = { x: 0, y: 0 }) {
        if (!this.spritesLoaded || !this.normalSprite) return;
        
        // Calculate screen position
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Skip rendering if off-screen
        if (screenX < -64 || screenX > 1024 + 64 || screenY < -64 || screenY > 768 + 64) {
            return;
        }
        
        // Choose sprite based on state
        let sprite = this.normalSprite;
        if (this.state === 'attacking' && this.attackSprite) {
            sprite = this.attackSprite;
        }
        
        // Calculate frame position with bounds checking
        const frameX = Math.max(0, Math.min(3, this.animationFrame)); // Ensure 0-3 range
        const frameY = this.getFrameRow();
        
        // Calculate source coordinates with proper bounds
        const sourceX = frameX * this.frameWidth;
        const sourceY = frameY * this.frameHeight;
        
        // Scale down the rendered size (bears were too big)
        const renderWidth = Math.floor(this.frameWidth * 0.8);  // 80% of original size
        const renderHeight = Math.floor(this.frameHeight * 0.8);
        
        // Debug frame extraction
        if (window.game && window.game.debugMode) {
            console.log(`🐻 Bear frame: (${frameX}, ${frameY}) = (${sourceX}, ${sourceY}) size: ${renderWidth}x${renderHeight}`);
        }
        
        // Draw the bear with scaled size
        ctx.drawImage(
            sprite,
            sourceX, sourceY, this.frameWidth, this.frameHeight,
            Math.floor(screenX - renderWidth/2), Math.floor(screenY - renderHeight/2), 
            renderWidth, renderHeight
        );
        
        // Debug info
        if (window.game && window.game.debugMode) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(screenX - 16, screenY - 16, 32, 32);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`${this.state} ${this.direction}`, screenX - 20, screenY - 30);
        }
    }
    
    getFrameRow() {
        // 4x14 layout - for now, use the first 4 rows for basic movement
        // Row 0: Down
        // Row 1: Left  
        // Row 2: Right
        // Row 3: Up
        switch (this.direction) {
            case 'down':  return 0;
            case 'left':  return 1;
            case 'right': return 2;
            case 'up':    return 3;
            default:      return 0;
        }
    }
    
    // Combat methods (for future expansion)
    startAttack() {
        this.setState('attacking');
        console.log('🐻 Bear starts attacking!');
    }
    
    takeDamage(damage, sourceX, sourceY) {
        console.log(`🐻 Bear takes ${damage} damage - fleeing!`);
        
        // Bear flees away from damage source
        const dx = this.x - sourceX;
        const dy = this.y - sourceY;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
        
        this.setState('moving');
        return false; // Bears don't die from damage
    }
    
    // Collision detection for projectiles
    checkCollision(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const combinedRadius = 24; // Bear hitbox
        
        return distance < combinedRadius;
    }
}