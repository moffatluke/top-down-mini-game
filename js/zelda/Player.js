// Zelda-style Player Character
class ZeldaPlayer {
    constructor(x, y, spriteLoader) {
        this.x = x;
        this.y = y;
        this.spriteLoader = spriteLoader;
        this.inventory = null; // Will be set by game
        
        // Movement properties
        this.speed = 2; // Slower, more controlled movement
        this.direction = 'down'; // down, up, left, right
        this.facingDirection = 'right'; // left or right - remembers which way we're facing horizontally
        this.isMoving = false;
        
        // Stamina system
        this.maxStamina = 100;
        this.currentStamina = 100;
        this.staminaRegenRate = 50; // stamina per second when regenerating (increased from 20)
        this.staminaRegenDelay = 500; // milliseconds before stamina starts regenerating (reduced from 1000)
        this.lastStaminaUse = 0; // timestamp of last stamina use
        this.isStaminaExhausted = false; // True when stamina hits 0, false when fully regenerated
        
        // Health system
        this.maxHealth = 100;
        this.currentHealth = 100;
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 1000; // 1 second of invulnerability after taking damage
        this.invulnerabilityTimer = 0;
        this.hurtTimer = 0;
        
        // Animation properties
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 150; // milliseconds per frame
        
        // Bouncing animation
        this.bobOffset = 0;
        this.bobSpeed = 0.01;
        
        // Sprite properties (2x3 grid: 2 columns, 3 rows)
        this.spriteWidth = 48;   // Each frame is 48px wide (96px ÷ 2 columns)
        this.spriteHeight = 48;  // Each frame is 48px tall (144px ÷ 3 rows)
        this.renderWidth = 48;   // Display size matches sprite frame
        this.renderHeight = 48;  // Display size matches sprite frame
        
        // Sprite sheet layout (2x3 grid)
        this.spriteCols = 2;
        this.spriteRows = 3;
        
        // Equipment and items
        this.hasArmor = false;      // Can upgrade to knight armor
        this.hasMagicStaff = false; // Can pick up magic staff
        this.inventory = [];        // Future inventory system
        
        // Collision box (smaller than sprite for better gameplay)
        this.hitboxWidth = 32;
        this.hitboxHeight = 24;
        
        // Dash system
        this.dashDistance = 64; // 2 blocks (32px each)
        this.dashSpeed = 8; // Fast dash movement
        this.dashDuration = 200; // milliseconds
        this.dashCooldown = 1000; // milliseconds between dashes
        this.isDashing = false;
        this.dashStartTime = 0;
        this.lastDashTime = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
        this.dashStaminaCost = 20; // Stamina cost for dashing
        
        // Input state
        this.keys = {};
        
        // Charging system
        this.isCharging = false;
        this.chargeTime = 0;
        this.maxChargeTime = 2000; // 2 seconds
        this.chargeStartTime = 0;
        
        // Don't setup input here - let Game class handle all input to avoid conflicts
        // this.setupInput();
    }

    setupInput() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Prevent default behavior for space key (prevents page scrolling)
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            
            // Prevent default behavior for space key
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }

    update(deltaTime, gameMap) {
        this.handleInput();
        this.updateAnimation(deltaTime);
        this.updateCharging(deltaTime);
        this.updateStamina(deltaTime);
        this.updateHealth(deltaTime);
        this.updateDash(deltaTime, gameMap);
        
        // Store old position for collision checking
        const oldX = this.x;
        const oldY = this.y;
        
        // Apply movement (only if not dashing)
        if (this.isMoving && !this.isDashing) {
            let newX = this.x;
            let newY = this.y;
            
            switch (this.direction) {
                case 'up':
                    newY -= this.speed;
                    break;
                case 'down':
                    newY += this.speed;
                    break;
                case 'left':
                    newX -= this.speed;
                    break;
                case 'right':
                    newX += this.speed;
                    break;
            }
            
            // Check collision with map boundaries and obstacles
            if (this.canMoveTo(newX, newY, gameMap)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Stop moving if we hit something
                this.isMoving = false;
            }
        }
    }
    
    updateCharging(deltaTime) {
        if (this.isCharging) {
            this.chargeTime += deltaTime;
            
            // Cap at max charge time
            if (this.chargeTime >= this.maxChargeTime) {
                this.chargeTime = this.maxChargeTime;
            }
        }
    }

    handleInput() {
        let newDirection = null;
        let moving = false;
        
        // Check directional input (WASD + Arrow keys)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            newDirection = 'up';
            moving = true;
        } else if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            newDirection = 'down';
            moving = true;
        } else if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            newDirection = 'left';
            moving = true;
        } else if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            newDirection = 'right';
            moving = true;
        }
        
        // Equipment test controls
        if (this.keys['Digit1'] && !this.hasArmor) {
            this.equipArmor();
        }
        // Magic staff is now found in the world, not equipped by key
        
        // Dash input (spacebar)
        if (this.keys['Space'] && this.canDash()) {
            this.startDash();
        }
        
        // Update direction and movement state
        if (newDirection) {
            this.direction = newDirection;
            this.isMoving = moving;
            
            // Remember horizontal facing direction
            if (newDirection === 'left' || newDirection === 'right') {
                this.facingDirection = newDirection;
            }
        } else {
            this.isMoving = false;
        }
        
        // Reset animation if we stopped moving or changed direction
        if (!this.isMoving || (newDirection && newDirection !== this.direction)) {
            this.animationFrame = 0;
            this.animationTimer = 0;
        }
    }

    updateAnimation(deltaTime) {
        if (this.isMoving) {
            this.animationTimer += deltaTime;
            
            if (this.animationTimer >= this.animationSpeed) {
                this.animationFrame = (this.animationFrame + 1) % 2; // 2 frames per direction (2 columns)
                this.animationTimer = 0;
            }
            
            // Add bouncing motion when moving
            this.bobOffset = Math.sin(Date.now() * this.bobSpeed) * 3; // 3 pixel bounce
        } else {
            // Standing still - use frame 0 and no bounce
            this.animationFrame = 0;
            this.bobOffset = 0;
        }
    }

    canMoveTo(x, y, gameMap) {
        // Check map boundaries
        const minX = this.hitboxWidth / 2;
        const maxX = gameMap.width * gameMap.tileSize - this.hitboxWidth / 2;
        const minY = this.hitboxHeight / 2;
        const maxY = gameMap.height * gameMap.tileSize - this.hitboxHeight / 2;
        
        if (x < minX || x > maxX || y < minY || y > maxY) {
            return false;
        }
        
        // Check collision with solid tiles
        return gameMap.canMoveTo(
            x - this.hitboxWidth / 2, 
            y - this.hitboxHeight / 2,
            this.hitboxWidth, 
            this.hitboxHeight
        );
    }

    render(ctx) {
        const sprite = this.getCurrentSprite();
        if (!sprite) {
            // Fallback rendering
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(
                this.x - this.renderWidth / 2, 
                this.y - this.renderHeight / 2, 
                this.renderWidth, 
                this.renderHeight
            );
            return;
        }
        
        // Calculate sprite frame position for 2x3 grid
        let frameX = 0;
        let frameY = 0;
        
        // Map directions to rows in the 2x3 grid
        switch (this.direction) {
            case 'down':
                frameY = 0; // Top row
                frameX = this.animationFrame * this.spriteWidth;
                break;
            case 'up':
                frameY = 1 * this.spriteHeight; // Middle row
                frameX = this.animationFrame * this.spriteWidth;
                break;
            case 'left':
                frameY = 2 * this.spriteHeight; // Bottom row
                frameX = this.animationFrame * this.spriteWidth;
                break;
            case 'right':
                frameY = 2 * this.spriteHeight; // Bottom row (same as left, will flip)
                frameX = this.animationFrame * this.spriteWidth;
                break;
        }
        
        // Draw the sprite
        ctx.save();
        
        // Determine if we should flip horizontally
        // For up/down movement, use the remembered facing direction
        // For left/right movement, use current direction
        let shouldFlip = false;
        if (this.direction === 'left') {
            shouldFlip = true;
        } else if (this.direction === 'up' || this.direction === 'down') {
            shouldFlip = (this.facingDirection === 'left');
        }
        
        if (shouldFlip) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                sprite,
                frameX, frameY, this.spriteWidth, this.spriteHeight,
                -(this.x + this.renderWidth / 2), this.y - this.renderHeight / 2 + this.bobOffset,
                this.renderWidth, this.renderHeight
            );
        } else {
            ctx.drawImage(
                sprite,
                frameX, frameY, this.spriteWidth, this.spriteHeight,
                this.x - this.renderWidth / 2, this.y - this.renderHeight / 2 + this.bobOffset,
                this.renderWidth, this.renderHeight
            );
        }
        
        ctx.restore();
        
        // Draw equipped items (magic staff overlay)
        if (this.inventory) {
            const currentWeapon = this.inventory.getCurrentWeapon();
            if (currentWeapon.id === 'staff') {
                this.renderMagicStaff(ctx, shouldFlip);
            }
        } else if (this.hasMagicStaff) {
            // Fallback to old system
            this.renderMagicStaff(ctx, shouldFlip);
        }
        
        // Debug: Draw hitbox (optional)
        if (window.DEBUG_MODE) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 1;
            ctx.strokeRect(
                this.x - this.hitboxWidth / 2, 
                this.y - this.hitboxHeight / 2, 
                this.hitboxWidth, 
                this.hitboxHeight
            );
        }
    }

    // Equipment methods
    equipArmor() {
        this.hasArmor = true;
        console.log('🛡️ Llama equipped with knight armor!');
    }

    equipMagicStaff() {
        this.hasMagicStaff = true;
        console.log('🪄 Llama acquired magic staff!');
    }

    renderMagicStaff(ctx, shouldFlip) {
        const staffSprite = this.spriteLoader.get('magic_staff');
        if (!staffSprite) {
            console.error('❌ Staff sprite not found! Available sprites:', Object.keys(this.spriteLoader.sprites || {}));
            return;
        }
        console.log('✅ Staff sprite loaded:', staffSprite.width, 'x', staffSprite.height);
        
        // Calculate staff position relative to player (adjusted for smaller size)
        let staffOffsetX = shouldFlip ? -16 : 16;  // Closer to player since it's smaller
        let staffOffsetY = -4; // Slightly above center
        
        // Staff sprite is 2x3 grid - animate between frames
        console.log('Staff sprite size:', staffSprite.width, 'x', staffSprite.height);
        
        // 2x3 grid: 2 columns, 3 rows
        const staffFrameWidth = staffSprite.width / 2;   // Each frame is half the width
        const staffFrameHeight = staffSprite.height / 3; // Each frame is one-third the height
        
        // Animate between top row frames (red and blue staff)
        const time = Date.now() * 0.002; // Slower animation
        const animationFrame = Math.floor(time) % 2; // Alternate between 0 and 1
        const frameX = animationFrame * staffFrameWidth;  // Column 0 or 1
        const frameY = 0;  // Top row
        
        console.log(`Animating staff frame: ${staffFrameWidth}x${staffFrameHeight} at ${frameX},${frameY}`);
        
        ctx.save();
        
        // Make equipped staff smaller and more proportional
        let renderWidth = staffFrameWidth * 0.6;   // 60% of original size
        let renderHeight = staffFrameHeight * 0.6; // 60% of original size
        
        // Scale up staff during charging
        if (this.isCharging) {
            const chargeProgress = this.chargeTime / this.maxChargeTime;
            const scaleMultiplier = 1 + (chargeProgress * 0.5); // Scale up to 150% when fully charged
            renderWidth *= scaleMultiplier;
            renderHeight *= scaleMultiplier;
            
            // Add charging glow effect
            const glowIntensity = chargeProgress;
            const pulseEffect = Math.sin(Date.now() * 0.01) * 0.3 + 0.7; // Pulsing between 0.4 and 1.0
            
            ctx.shadowColor = `rgba(255, 100, 0, ${glowIntensity * pulseEffect})`;
            ctx.shadowBlur = 15 * chargeProgress;
        }
        
        if (shouldFlip) {
            ctx.scale(-1, 1);
            ctx.drawImage(
                staffSprite,
                frameX, frameY, staffFrameWidth, staffFrameHeight,  // Source frame
                -(this.x + staffOffsetX + renderWidth/2), this.y + staffOffsetY - renderHeight/2 + this.bobOffset,
                renderWidth, renderHeight  // Reasonable destination size
            );
        } else {
            ctx.drawImage(
                staffSprite,
                frameX, frameY, staffFrameWidth, staffFrameHeight,  // Source frame
                this.x + staffOffsetX - renderWidth/2, this.y + staffOffsetY - renderHeight/2 + this.bobOffset,
                renderWidth, renderHeight  // Reasonable destination size
            );
        }
        
        ctx.restore();
    }
    
    startCharging() {
        if (this.inventory) {
            const currentWeapon = this.inventory.getCurrentWeapon();
            if (currentWeapon.id === 'staff') {
                // Check if stamina is exhausted (Zelda-style system)
                if (this.isStaminaExhausted) {
                    console.log('💨 Stamina exhausted! Must fully regenerate first.');
                    return false;
                }
                
                // Check if player has minimum stamina to start charging
                if (this.currentStamina < 10) {
                    console.log('💨 Not enough stamina to charge spell!');
                    return false;
                }
                
                this.isCharging = true;
                this.chargeTime = 0;
                this.chargeStartTime = Date.now();
                console.log('🔮 Charging staff...');
                return true;
            }
        }
        return false;
    }
    
    stopCharging() {
        if (this.isCharging) {
            const wasFullyCharged = this.chargeTime >= this.maxChargeTime;
            this.isCharging = false;
            const chargeResult = { charged: wasFullyCharged, chargeTime: this.chargeTime };
            
            // Consume stamina based on spell power
            let staminaCost = wasFullyCharged ? 40 : 15; // More stamina for charged spells
            this.consumeStamina(staminaCost);
            
            // Reset charge time for next use
            this.chargeTime = 0;
            
            console.log(`🔥 Released ${wasFullyCharged ? 'CHARGED' : 'normal'} fireball! Stamina: ${this.currentStamina}/${this.maxStamina}`);
            return chargeResult;
        }
        return { charged: false, chargeTime: 0 };
    }
    
    // Stamina system methods
    consumeStamina(amount) {
        this.currentStamina = Math.max(0, this.currentStamina - amount);
        this.lastStaminaUse = Date.now();
        
        // Set exhausted state if stamina hits zero (Zelda-style)
        if (this.currentStamina <= 0) {
            this.isStaminaExhausted = true;
            console.log('💥 Stamina exhausted! Must fully regenerate before using again.');
        }
        
        console.log(`💨 Consumed ${amount} stamina. Current: ${this.currentStamina}/${this.maxStamina} ${this.isStaminaExhausted ? '(EXHAUSTED)' : ''}`);
    }
    
    canUseStamina(amount) {
        // If exhausted, can't use stamina until fully regenerated
        if (this.isStaminaExhausted) {
            return false;
        }
        return this.currentStamina >= amount;
    }
    
    updateStamina(deltaTime) {
        // Only regenerate stamina if enough time has passed since last use
        const timeSinceLastUse = Date.now() - this.lastStaminaUse;
        if (timeSinceLastUse >= this.staminaRegenDelay && this.currentStamina < this.maxStamina) {
            // Regenerate stamina over time
            const staminaRegen = (this.staminaRegenRate * deltaTime) / 1000;
            this.currentStamina = Math.min(this.maxStamina, this.currentStamina + staminaRegen);
            
            // Clear exhausted state only when stamina is FULLY regenerated (Zelda-style)
            if (this.isStaminaExhausted && this.currentStamina >= this.maxStamina) {
                this.isStaminaExhausted = false;
                console.log('✨ Stamina fully restored! Actions available again.');
            }
        }
    }

    // Health system methods
    updateHealth(deltaTime) {
        // Update invulnerability timer
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Update hurt timer
        if (this.hurtTimer > 0) {
            this.hurtTimer -= deltaTime;
        }
    }

    takeDamage(amount) {
        if (this.isInvulnerable || this.currentHealth <= 0) {
            return false; // No damage taken
        }
        
        this.currentHealth = Math.max(0, this.currentHealth - amount);
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        this.hurtTimer = 200; // Brief hurt flash
        
        console.log(`💔 Player took ${amount} damage! Health: ${this.currentHealth}/${this.maxHealth}`);
        
        if (this.currentHealth <= 0) {
            console.log('💀 Player died!');
            // Trigger game over state
            if (window.game) {
                window.game.gameState = 'gameover';
            }
            return true; // Player died
        }
        
        return false; // Player survived
    }

    // Get staff world position for fireball spawning (from the red tip)
    getStaffWorldPosition() {
        // Calculate which side the staff is on based on facing direction
        const shouldFlip = (this.facingDirection === 'left');
        
        // Staff offset matches the rendering position, but adjusted for tip
        let staffOffsetX = shouldFlip ? -16 : 16;  // Same as render offset
        let staffOffsetY = -4; // Base staff position
        
        // Adjust to the top/tip of the staff (the red magical part)
        // Staff is rendered vertically, so we move up to get the tip
        const staffTipOffsetY = -18; // Move up to the red tip of the staff
        
        return {
            x: this.x + staffOffsetX,
            y: this.y + staffOffsetY + staffTipOffsetY
        };
    }

    // Get current sprite based on equipment
    getCurrentSprite() {
        if (this.inventory) {
            const currentArmor = this.inventory.getCurrentArmor();
            if (currentArmor.id === 'knight') {
                return this.spriteLoader.get('llama_knight');
            } else {
                return this.spriteLoader.get('llama_base');
            }
        } else {
            // Fallback to old system
            if (this.hasArmor) {
                return this.spriteLoader.get('llama_knight');
            } else {
                return this.spriteLoader.get('llama_base');
            }
        }
    }

    // Dash system methods
    canDash() {
        const now = Date.now();
        const cooldownPassed = (now - this.lastDashTime) >= this.dashCooldown;
        const hasStamina = this.canUseStamina(this.dashStaminaCost);
        return !this.isDashing && cooldownPassed && hasStamina;
    }

    startDash() {
        if (!this.canDash()) return;
        
        // Consume stamina
        this.consumeStamina(this.dashStaminaCost);
        
        // Set dash state
        this.isDashing = true;
        this.dashStartTime = Date.now();
        this.lastDashTime = this.dashStartTime;
        
        // Calculate dash target position
        this.dashStartX = this.x;
        this.dashStartY = this.y;
        
        switch (this.direction) {
            case 'up':
                this.dashTargetY = this.y - this.dashDistance;
                this.dashTargetX = this.x;
                break;
            case 'down':
                this.dashTargetY = this.y + this.dashDistance;
                this.dashTargetX = this.x;
                break;
            case 'left':
                this.dashTargetX = this.x - this.dashDistance;
                this.dashTargetY = this.y;
                break;
            case 'right':
                this.dashTargetX = this.x + this.dashDistance;
                this.dashTargetY = this.y;
                break;
        }
        
        // Create wind particles for visual effect
        if (this.particleSystem) {
            // Create particles from player's center
            const centerX = this.x + this.renderWidth / 2;
            const centerY = this.y + this.renderHeight / 2;
            this.particleSystem.createWindBurst(centerX, centerY, this.direction, 15);
        }
        
        console.log('🌪️ Dash started!');
    }

    updateDash(deltaTime, gameMap) {
        if (!this.isDashing) return;
        
        const elapsed = Date.now() - this.dashStartTime;
        const progress = Math.min(elapsed / this.dashDuration, 1.0);
        
        if (progress >= 1.0) {
            // Dash complete
            this.isDashing = false;
            this.x = this.dashTargetX;
            this.y = this.dashTargetY;
            
            // Check final position for collisions and adjust
            if (gameMap.isCollision(this.x, this.y, this.hitboxWidth, this.hitboxHeight)) {
                // Move back to last safe position
                this.x = this.dashStartX;
                this.y = this.dashStartY;
                console.log('⚠️ Dash blocked by obstacle!');
            }
        } else {
            // Interpolate position
            const newX = this.dashStartX + (this.dashTargetX - this.dashStartX) * progress;
            const newY = this.dashStartY + (this.dashTargetY - this.dashStartY) * progress;
            
            // Check for collisions during dash
            if (gameMap.isCollision(newX, newY, this.hitboxWidth, this.hitboxHeight)) {
                // Stop dash early if we hit something
                this.isDashing = false;
                console.log('⚠️ Dash interrupted by collision!');
            } else {
                this.x = newX;
                this.y = newY;
            }
        }
    }
}