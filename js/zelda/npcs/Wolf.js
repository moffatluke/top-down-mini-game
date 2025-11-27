/**
 * Wolf Enemy Class
 * 
 * Full-featured enemy with combat system:
 * - Health and damage system
 * - Player detection and chasing (3 tile range)
 * - Melee attacks (25 damage to player)
 * - Takes damage from sword, fireballs (scaled by player level)
 * - XP drop on death
 * - Proper attack/idle/chase animations
 */
class Wolf {
    constructor(x, y, spriteLoader, options = {}) {
        // Position (world coordinates)
        this.x = x;
        this.y = y;
        this.lastX = x;
        this.lastY = y;
        
        // === COMBAT STATS ===
        this.maxHealth = options.health || 100;
        this.health = this.maxHealth;
        this.attackDamage = options.attackDamage || 25;              // Damage dealt to player
        this.attackRange = 48;               // Pixels (about 3 tiles at 16px/tile)
        this.attackCooldown = 1200;          // Milliseconds between attacks
        this.lastAttackTime = 0;
        this.xpReward = options.xpReward || 50;                  // XP given to player on death
        this.scale = options.scale || 1.0;   // Size multiplier for rendering
        
        // === CHASE BEHAVIOR ===
        this.detectionRange = 48;            // 3 tiles (16px * 3)
        this.chaseSpeed = 1.2;               // Faster when chasing
        this.wanderSpeed = 0.8;              // Normal wander speed
        this.speed = this.wanderSpeed;
        
        // === MOVEMENT & DIRECTION ===
        this.direction = 'down';
        this.lastDirection = 'down';
        this.isMoving = false;
        
        // === SPRITE SYSTEM ===
        this.spriteLoader = spriteLoader;
        this.normalSprite = null;
        this.attackSprite = null;
        this.frameWidth = 0;
        this.frameHeight = 0;
        this.spritesLoaded = false;
        
        // === ANIMATION ===
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 150;
        
        // === ATTACK ANIMATION ===
        this.attackAnimationFrames = 4;     // How many frames in attack animation
        this.attackAnimationSpeed = 100;    // Faster than walking (100ms per frame)
        this.hasDealtDamage = false;        // Track if damage was dealt this attack
        this.damageFrame = 2;               // Which frame deals damage (0-3)
        
        // === AI STATE ===
        // States: 'idle', 'wandering', 'chasing', 'attacking', 'dead'
        this.state = 'idle';
        this.stateTimer = 0;
        this.isDead = false;
        
        // Load sprites
        this.loadWolfSprites();
        
        console.log(`🐺 Wolf Enemy created at (${x}, ${y}) - HP: ${this.health}`);
    }
    
    loadWolfSprites() {
        try {
            // Load normal wolf sprite (Wolf.png) - 4x14 layout
            this.normalSprite = this.spriteLoader.getAnimal('wolf', false);
            
            // Load attack wolf sprite (Wolf_Attack.png) - 4x4 layout
            this.attackSprite = this.spriteLoader.getAnimal('wolf', true);
            
            let normalLoaded = false;
            let attackLoaded = false;
            
            const checkBothLoaded = () => {
                if (normalLoaded && attackLoaded) {
                    this.calculateFrameDimensions();
                }
            };
            
            if (this.normalSprite) {
                if (this.normalSprite.complete) {
                    normalLoaded = true;
                    checkBothLoaded();
                } else {
                    this.normalSprite.onload = () => {
                        normalLoaded = true;
                        checkBothLoaded();
                    };
                }
            }
            
            if (this.attackSprite) {
                if (this.attackSprite.complete) {
                    attackLoaded = true;
                    checkBothLoaded();
                } else {
                    this.attackSprite.onload = () => {
                        attackLoaded = true;
                        checkBothLoaded();
                    };
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to load wolf sprites:', error);
        }
    }
    
    calculateFrameDimensions() {
        if (this.normalSprite && this.normalSprite.complete) {
            // Normal sprite: 4x14 layout
            this.frameWidth = Math.floor(this.normalSprite.width / 4);
            this.frameHeight = Math.floor(this.normalSprite.height / 14);
            this.spriteRows = 14;
            this.spriteCols = 4;
            
            console.log(`✅ Wolf sprites loaded: ${this.frameWidth}x${this.frameHeight} per frame`);
        }
        
        // Attack sprite: 4x4 layout (different from normal sprite!)
        if (this.attackSprite && this.attackSprite.complete) {
            this.attackFrameWidth = Math.floor(this.attackSprite.width / 4);
            this.attackFrameHeight = Math.floor(this.attackSprite.height / 4);
            this.attackSpriteRows = 4;
            this.attackSpriteCols = 4;
            
            console.log(`✅ Wolf attack sprites loaded: ${this.attackFrameWidth}x${this.attackFrameHeight} per frame (4x4 grid)`);
        }
        
        this.spritesLoaded = true;
    }
    
    /**
     * Main update method called each frame
     * @param {number} deltaTime - Time since last frame (ms)
     * @param {object} player - Player object with x, y, health, level, takeDamage(), gainXP()
     * @param {object} gameMap - Game map for collision detection
     */
    update(deltaTime, player, gameMap) {
        // Don't update if dead
        if (this.isDead) {
            return;
        }
        
        // Store previous position for collision handling
        this.lastX = this.x;
        this.lastY = this.y;
        
        this.stateTimer += deltaTime;
        
        // Run AI behavior based on current state
        this.updateAI(deltaTime, player, gameMap);
        
        // Update animation frames
        this.updateAnimation(deltaTime);
        
        // Apply movement and collision
        this.applyMovement(gameMap);
        
        // Validate position
        if (!isFinite(this.x) || !isFinite(this.y)) {
            console.warn('Wolf position became invalid, resetting');
            this.x = this.lastX;
            this.y = this.lastY;
        }
    }
    
    /**
     * AI state machine - controls wolf behavior
     */
    updateAI(deltaTime, player, gameMap) {
        if (!player) return;
        
        // Calculate distance to player (in tiles for detection)
        const distanceToPlayer = this.getDistanceToPlayer(player);
        const tileDistance = distanceToPlayer / 16; // Convert pixels to tiles
        
        switch (this.state) {
            case 'idle':
                this.updateIdleState(deltaTime, player, tileDistance);
                break;
            case 'wandering':
                this.updateWanderingState(deltaTime, player, tileDistance);
                break;
            case 'chasing':
                this.updateChasingState(deltaTime, player, tileDistance);
                break;
            case 'attacking':
                this.updateAttackingState(deltaTime, player, distanceToPlayer);
                break;
        }
    }
    
    /**
     * IDLE STATE: Wolf is stationary, waiting
     * Checks for player proximity to start chasing
     */
    updateIdleState(deltaTime, player, tileDistance) {
        this.isMoving = false;
        this.speed = this.wanderSpeed;
        
        // Check if player is within 3 tiles - start chasing
        if (tileDistance <= 3) {
            this.setState('chasing');
            console.log('🐺 Wolf detected player! Starting chase...');
            return;
        }
        
        // Random wandering after idle period
        if (this.stateTimer > 1500 + Math.random() * 1500) {
            if (Math.random() < 0.7) {
                this.setState('wandering');
            } else {
                this.stateTimer = 0;
            }
        }
    }
    
    /**
     * WANDERING STATE: Wolf moves randomly when player is far
     */
    updateWanderingState(deltaTime, player, tileDistance) {
        this.isMoving = true;
        this.speed = this.wanderSpeed;
        
        // Check if player entered detection range
        if (tileDistance <= 3) {
            this.setState('chasing');
            console.log('🐺 Wolf detected player while wandering!');
            return;
        }
        
        // Wander for a period, then return to idle
        if (this.stateTimer > 2000 + Math.random() * 2000) {
            this.setState('idle');
            return;
        }
        
        // Move in current direction
        const moveDistance = this.speed;
        switch (this.direction) {
            case 'up':    this.y -= moveDistance; break;
            case 'down':  this.y += moveDistance; break;
            case 'left':  this.x -= moveDistance; break;
            case 'right': this.x += moveDistance; break;
        }
    }
    
    /**
     * CHASING STATE: Wolf pursues the player
     * Moves toward player position at chase speed
     */
    updateChasingState(deltaTime, player, tileDistance) {
        this.isMoving = true;
        this.speed = this.chaseSpeed;
        
        // If player moved out of 3 tile range, stop chasing
        if (tileDistance > 3) {
            console.log('🐺 Player escaped! Wolf returning to idle...');
            this.setState('idle');
            return;
        }
        
        // If within attack range, switch to attacking
        const pixelDistance = this.getDistanceToPlayer(player);
        if (pixelDistance <= this.attackRange) {
            this.setState('attacking');
            return;
        }
        
        // Move toward player
        this.moveTowardPlayer(player);
    }
    
    /**
     * ATTACKING STATE: Wolf performs melee attack on player
     * Deals damage if cooldown is ready
     */
    updateAttackingState(deltaTime, player, pixelDistance) {
        this.isMoving = false;
        
        // If player moved out of attack range, resume chasing
        if (pixelDistance > this.attackRange) {
            this.setState('chasing');
            return;
        }
        
        // Face the player
        this.facePlayer(player);
        
        // === DAMAGE ON SPECIFIC ANIMATION FRAME ===
        // Only deal damage when animation reaches the damage frame
        if (this.animationFrame === this.damageFrame && !this.hasDealtDamage) {
            const currentTime = Date.now();
            // Check cooldown to prevent spam
            if (currentTime - this.lastAttackTime >= this.attackCooldown) {
                this.performAttack(player);
                this.hasDealtDamage = true;  // Mark damage as dealt
                this.lastAttackTime = currentTime;
                console.log('⚔️ Wolf deals damage on animation frame ' + this.damageFrame);
            }
        }
        
        // === END ATTACK WHEN ANIMATION COMPLETES ===
        // Attack animation is 4 frames × 100ms = 400ms total
        const attackAnimationDuration = this.attackAnimationFrames * this.attackAnimationSpeed;
        if (this.stateTimer > attackAnimationDuration) {
            this.setState('chasing');
        }
    }
    
    /**
     * Start random wandering movement
     */
    startWandering() {
        const directions = ['up', 'down', 'left', 'right'];
        this.direction = directions[Math.floor(Math.random() * directions.length)];
        this.setState('wandering');
    }
    
    /**
     * Change wolf's current state
     */
    setState(newState) {
        // Remember facing direction when stopping
        if ((newState === 'idle' || newState === 'attacking') && this.isMoving) {
            this.lastDirection = this.direction;
        }
        
        // When starting to wander, pick a random direction
        if (newState === 'wandering') {
            const directions = ['up', 'down', 'left', 'right'];
            this.direction = directions[Math.floor(Math.random() * directions.length)];
        }
        
        // === ATTACK STATE SETUP ===
        if (newState === 'attacking') {
            this.hasDealtDamage = false;  // Reset damage flag for new attack
            this.animationFrame = 0;       // Start attack animation from beginning
            this.animationTimer = 0;       // Reset animation timer
            console.log('🐺 Wolf begins attack sequence');
        }
        
        this.state = newState;
        this.stateTimer = 0;
        
        // Only reset animation frame if NOT entering attack state (already reset above)
        if (newState !== 'attacking') {
            this.animationFrame = 0;
        }
    }
    
    // ==========================================
    // COMBAT METHODS
    // ==========================================
    
    /**
     * Calculate distance to player in pixels
     */
    getDistanceToPlayer(player) {
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * Move wolf toward player's position
     */
    moveTowardPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) return;
        
        // Normalize and apply speed
        const moveX = (dx / distance) * this.speed;
        const moveY = (dy / distance) * this.speed;
        
        this.x += moveX;
        this.y += moveY;
        
        // Update direction based on movement
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Face toward the player without moving
     */
    facePlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        
        if (Math.abs(dx) > Math.abs(dy)) {
            this.direction = dx > 0 ? 'right' : 'left';
        } else {
            this.direction = dy > 0 ? 'down' : 'up';
        }
    }
    
    /**
     * Perform melee attack on player
     */
    performAttack(player) {
        if (!player || !player.takeDamage) {
            console.warn('⚠️ Player object missing takeDamage method');
            return;
        }
        
        console.log(`🐺 Wolf attacks player for ${this.attackDamage} damage!`);
        player.takeDamage(this.attackDamage);
    }
    
    /**
     * Calculate scaled damage based on player level
     * @param {number} baseDamage - Base damage value
     * @param {number} playerLevel - Player's current level
     * @returns {number} Scaled damage amount
     */
    getScaledDamage(baseDamage, playerLevel) {
        // Scale damage by player level (1.0x at level 1, increases with level)
        const scaleFactor = 0.8 + (playerLevel * 0.2); // Starts at 0.8x, +0.2 per level
        return Math.floor(baseDamage * scaleFactor);
    }
    
    /**
     * Take damage from sword attack
     * Base damage: 30, scaled by player level
     */
    takeSwordHit(player) {
        if (this.isDead) return;
        
        const baseDamage = 30;
        const damage = this.getScaledDamage(baseDamage, player.level || 1);
        
        this.health -= damage;
        console.log(`⚔️ Wolf hit by sword! -${damage} HP (${this.health}/${this.maxHealth})`);
        
        if (this.health <= 0) {
            this.die(player);
        }
    }
    
    /**
     * Take damage from fireball
     * Normal: 21 base damage, Charged: 48 base damage, scaled by player level
     */
    takeFireballHit(player, isCharged = false) {
        if (this.isDead) return;
        
        const baseDamage = isCharged ? 48 : 21;
        const damage = this.getScaledDamage(baseDamage, player.level || 1);
        
        this.health -= damage;
        const fireballType = isCharged ? 'charged' : 'normal';
        console.log(`🔥 Wolf hit by ${fireballType} fireball! -${damage} HP (${this.health}/${this.maxHealth})`);
        
        if (this.health <= 0) {
            this.die(player);
        }
    }
    
    /**
     * Generic damage method (for projectiles, etc)
     */
    takeDamage(damage, sourceX, sourceY) {
        if (this.isDead) return false;
        
        this.health -= damage;
        console.log(`💥 Wolf takes ${damage} damage! (${this.health}/${this.maxHealth})`);
        
        // Brief knockback/flee reaction
        if (sourceX !== undefined && sourceY !== undefined) {
            const dx = this.x - sourceX;
            const dy = this.y - sourceY;
            
            if (Math.abs(dx) > Math.abs(dy)) {
                this.direction = dx > 0 ? 'right' : 'left';
            } else {
                this.direction = dy > 0 ? 'down' : 'up';
            }
        }
        
        if (this.health <= 0) {
            return true; // Wolf died
        }
        
        return false; // Wolf still alive
    }
    
    /**
     * Handle wolf death
     */
    die(player) {
        if (this.isDead) return;
        
        this.isDead = true;
        this.health = 0;
        this.state = 'dead';
        this.isMoving = false;
        
        console.log(`💀 Wolf defeated! Player gains ${this.xpReward} XP`);
        
        // Award XP to player
        if (player && player.gainXP) {
            player.gainXP(this.xpReward);
        }
        
        // Could trigger death animation or spawn loot here
        // For now, the game loop should remove dead enemies
    }
    
    updateAnimation(deltaTime) {
        if (!this.spritesLoaded) return;
        
        this.animationTimer += deltaTime;
        
        // === ATTACK ANIMATION (highest priority) ===
        if (this.state === 'attacking') {
            if (this.animationTimer >= this.attackAnimationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % this.attackAnimationFrames;
                this.animationTimer = 0;
                
                // Check if we hit the damage frame
                if (this.animationFrame === this.damageFrame && !this.hasDealtDamage) {
                    // This frame should deal damage - will be checked in update loop
                    console.log('💥 Wolf attack animation hit frame!');
                }
            }
            return; // Don't process other animations
        }
        
        // === NORMAL ANIMATIONS ===
        const animSpeed = this.isMoving ? this.animationSpeed : this.animationSpeed * 3;
        
        if (this.animationTimer >= animSpeed) {
            if (this.isMoving) {
                // Cycle through walking frames while moving
                this.animationFrame = (this.animationFrame + 1) % 4;
            } else {
                // Gentle idle animation - subtle breathing/standing animation
                this.animationFrame = this.animationFrame === 0 ? 1 : 0;
            }
            this.animationTimer = 0;
        }
    }
    
    /**
     * Apply movement and handle collisions
     */
    applyMovement(gameMap) {
        // Keep within map boundaries
        if (gameMap && gameMap.width && gameMap.height) {
            const margin = 32;
            const mapWidth = gameMap.width * gameMap.tileSize;
            const mapHeight = gameMap.height * gameMap.tileSize;
            this.x = Math.max(margin, Math.min(mapWidth - margin, this.x));
            this.y = Math.max(margin, Math.min(mapHeight - margin, this.y));
        }
        
        // Check collision with map tiles
        if (gameMap && gameMap.canMoveTo) {
            if (!gameMap.canMoveTo(this.x, this.y, 32, 32)) {
                // Hit an obstacle, revert to last position
                this.x = this.lastX;
                this.y = this.lastY;
                
                // If wandering, pick a new direction
                if (this.state === 'wandering') {
                    this.startWandering();
                }
            }
        }
    }
    
    render(ctx, camera = { x: 0, y: 0 }) {
        if (!this.spritesLoaded || !this.normalSprite) return;
        
        // Don't render if dead (could add death animation here later)
        if (this.isDead) return;
        
        const screenX = this.x - camera.x;
        const screenY = this.y - camera.y;
        
        // Culling - don't render if off screen
        const margin = 200;
        if (screenX < -margin || screenX > 1200 + margin || 
            screenY < -margin || screenY > 900 + margin) {
            return;
        }
        
        // Select sprite based on state (use attack sprite when attacking)
        let sprite = this.normalSprite;
        let frameWidth = this.frameWidth;
        let frameHeight = this.frameHeight;
        
        if (this.state === 'attacking' && this.attackSprite) {
            sprite = this.attackSprite;
            frameWidth = this.attackFrameWidth;
            frameHeight = this.attackFrameHeight;
        }
        
        const frameX = this.animationFrame;
        const frameY = this.getFrameRow();
        
        // Render wolf at 1.5x base size with scale multiplier
        const renderWidth = frameWidth * 1.5 * this.scale;
        const renderHeight = frameHeight * 1.5 * this.scale;
        
        ctx.drawImage(
            sprite,
            frameX * frameWidth, frameY * frameHeight, 
            frameWidth, frameHeight,
            screenX - renderWidth/2, screenY - renderHeight/2, 
            renderWidth, renderHeight
        );
        
        // === RENDER HEALTH BAR ===
        if (this.health < this.maxHealth) {
            const barWidth = 40;
            const barHeight = 4;
            const barX = screenX - barWidth / 2;
            const barY = screenY - renderHeight / 2 - 10;
            
            // Background (red)
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(barX, barY, barWidth, barHeight);
            
            // Health (green)
            const healthPercent = this.health / this.maxHealth;
            ctx.fillStyle = '#00FF00';
            ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
            
            // Border
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barWidth, barHeight);
        }
        
        if (window.game && window.game.debugMode) {
            ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
            ctx.fillRect(screenX - 16, screenY - 16, 32, 32);
            
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(`${this.state} ${this.direction}`, screenX - 20, screenY - 30);
        }
    }
    
    getFrameRow() {
        // Use current direction when moving, last direction when idle
        const facingDirection = this.isMoving ? this.direction : this.lastDirection;
        
        // === ATTACK SPRITE ROW MAPPING (4x4 layout) ===
        if (this.state === 'attacking') {
            switch (facingDirection) {
                case 'right': return 0;  // Row 0: Right-facing attacks
                case 'left':  return 1;  // Row 1: Left-facing attacks
                case 'down':  return 2;  // Row 2: Down-facing attacks
                case 'up':    return 3;  // Row 3: Up-facing attacks
                default:      return 2;  // Default to down
            }
        }
        
        // === NORMAL SPRITE ROW MAPPING (4x14 layout) ===
        switch (facingDirection) {
            case 'down':  return 3;
            case 'left':  return 1;  
            case 'right': return 2;
            case 'up':    return 0;
            default:      return 3; // Default to down-facing
        }
    }
    
    startAttack() {
        this.setState('attacking');
        console.log('🐺 Wolf starts attacking!');
    }
    
    takeDamage(damage, sourceX, sourceY) {
        console.log(`🐺 Wolf takes ${damage} damage - fleeing!`);
        
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
        const combinedRadius = 20; // Slightly smaller than bears
        
        return distance < combinedRadius;
    }
}