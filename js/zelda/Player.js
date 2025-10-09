/**
 * Zelda-style Player Character Class
 * 
 * This class handles all player functionality including:
 * - Movement and collision detection
 * - Health and stamina systems
 * - Visual effects (damage flashing, animations)
 * - Combat mechanics (dash attacks, magic staff)
 * - Input handling (keyboard controls)
 * - Sprite rendering and animation
 */
class ZeldaPlayer {
    constructor(x, y, spriteLoader) {
        // =====================================================
        // POSITION AND CORE REFERENCES
        // =====================================================
        this.x = x;                         // Player's X position in pixels
        this.y = y;                         // Player's Y position in pixels
        this.spriteLoader = spriteLoader;   // Reference to sprite loading system
        this.inventory = null;              // Will be set by game - holds items like magic staff
        
        // =====================================================
        // MOVEMENT SYSTEM
        // =====================================================
        // Movement properties - scaled for 24px tiles (2x smaller than original 48px)
        this.speed = 1;                     // Pixels per frame movement speed (reduced 2x for smaller tiles)
        this.direction = 'down';            // Current facing direction: 'down', 'up', 'left', 'right'
        this.facingDirection = 'right';     // Horizontal facing memory: 'left' or 'right' (for sprite consistency)
        this.isMoving = false;              // Boolean: true when player is actively moving
        this.moveX = 0;                     // Movement vector X component (-1 to 1 for smooth diagonal movement)
        this.moveY = 0;                     // Movement vector Y component (-1 to 1 for smooth diagonal movement)
        
        // =====================================================
        // STAMINA SYSTEM (for dash attacks and special abilities)
        // =====================================================
        this.maxStamina = 100;              // Maximum stamina points
        this.currentStamina = 100;          // Current stamina (decreases with dash/abilities)
        this.staminaRegenRate = 50;         // Stamina points recovered per second (increased from 20)
        this.staminaRegenDelay = 500;       // Milliseconds to wait before stamina starts regenerating (reduced from 1000)
        this.lastStaminaUse = 0;            // Timestamp of when stamina was last used (for regen delay)
        this.isStaminaExhausted = false;    // True when stamina hits 0, false when fully regenerated
        
        // =====================================================
        // HEALTH AND DAMAGE SYSTEM
        // =====================================================
        this.maxHealth = 100;               // Maximum health points
        this.currentHealth = 100;           // Current health (decreases when taking damage)
        this.isInvulnerable = false;        // Temporary invulnerability after taking damage
        this.invulnerabilityDuration = 1000;// How long invulnerability lasts (1 second in milliseconds)
        this.invulnerabilityTimer = 0;      // Countdown timer for invulnerability
        this.hurtTimer = 0;                 // Timer for hurt animation effects
        
        // =====================================================
        // VISUAL DAMAGE EFFECTS (red flashing when hurt/low health)
        // =====================================================
        this.lowHealthFlashTimer = 0;       // Timer for low health warning flash
        this.lowHealthFlashDuration = 500;  // How often to flash when health is low (every 500ms)
        this.damageFlashTimer = 0;          // Timer for brief flash when taking damage
        this.damageFlashDuration = 200;     // How long damage flash lasts (200ms)
        this.lowHealthThreshold = 30;       // Health level below which player flashes red
        
        // =====================================================
        // ANIMATION SYSTEM
        // =====================================================
        this.animationFrame = 0;            // Current frame in walking animation (0 or 1)
        this.animationTimer = 0;            // Timer to control animation speed
        this.animationSpeed = 150;          // Milliseconds per animation frame (controls walk speed)
        
        // Bouncing animation (subtle up/down movement when moving)
        this.bobOffset = 0;                 // Vertical offset for bouncing effect
        this.bobSpeed = 0.01;               // Speed of bouncing animation
        
        // =====================================================
        // SPRITE RENDERING PROPERTIES
        // =====================================================
        // Sprite sheet layout: 2x3 grid (2 columns, 3 rows)
        // Row 0: Walking down (2 frames)
        // Row 1: Walking up (2 frames) 
        // Row 2: Walking side (2 frames, flipped for left/right)
        this.spriteWidth = 48;              // Each frame is 48px wide (96px total ÷ 2 columns)
        this.spriteHeight = 48;             // Each frame is 48px tall (144px total ÷ 3 rows)
        this.renderWidth = 48;              // Display size matches sprite frame
        this.renderHeight = 48;             // Display size matches sprite frame
        
        // Sprite sheet grid layout (2 columns x 3 rows = 6 total frames)
        this.spriteCols = 2;                // Number of columns in sprite sheet
        this.spriteRows = 3;                // Number of rows in sprite sheet
        
        // =====================================================
        // EQUIPMENT AND INVENTORY SYSTEM
        // =====================================================
        this.hasArmor = false;              // Boolean: true when player has knight armor equipped
        this.hasMagicStaff = false;         // Boolean: true when player has magic staff (found in world)
        this.hasSword = false;              // Boolean: true when player has sword equipped
        this.inventory = [];                // Array: future inventory system for items
        
        // =====================================================
        // COLLISION DETECTION (hitbox smaller than sprite for better gameplay)
        // =====================================================
        // Hitbox scaled for 24px tiles (2x smaller than original 48px tiles)
        this.hitboxWidth = 18;              // Slightly wider collision - was 16, now 18 for better tree collision
        this.hitboxHeight = 16;             // Taller collision - was 12, now 16 to prevent walking over tree tops
        
        // =====================================================
        // DASH ATTACK SYSTEM (special movement ability)
        // =====================================================
        // Dash system scaled for 24px tiles
        this.dashDistance = 48;             // Distance of dash: 2 tiles (24px each) - scaled down 2x from original 96px
        this.dashSpeed = 8;                 // Speed of dash movement (unused in current implementation)
        this.dashDuration = 150; // milliseconds - slightly faster for snappier feel
        this.dashCooldown = 800; // milliseconds between dashes - reduced for more responsive gameplay
        this.isDashing = false;
        this.dashStartTime = 0;
        this.lastDashTime = 0;
        this.dashStartX = 0;
        this.dashStartY = 0;
        this.dashTargetX = 0;
        this.dashTargetY = 0;
        this.dashStaminaCost = 15; // Stamina cost for dashing - reduced slightly
        
        // =====================================================
        // DASH VISUAL EFFECTS (trail that follows player during dash)
        // =====================================================
        this.dashTrails = [];               // Array to store trail positions for visual effect
        this.maxTrailLength = 8;            // Maximum number of trail segments to display
        this.trailUpdateInterval = 10;      // Update trail every 10ms during dash
        this.lastTrailUpdate = 0;           // Timer for trail updates
        
        // =====================================================
        // INPUT SYSTEM (keyboard state tracking)
        // =====================================================
        this.keys = {};                     // Object to track which keys are currently pressed
        
        // =====================================================
        // CHARGING SYSTEM (for future charged attacks)
        // =====================================================
        this.isCharging = false;            // Boolean: true when player is charging an attack
        this.chargeTime = 0;                // How long current charge has been held (milliseconds)
        this.maxChargeTime = 2000;          // Maximum charge time: 2 seconds
        this.chargeStartTime = 0;           // Timestamp when charging started
        
        // Note: Input setup is handled by Game class to avoid conflicts
        // this.setupInput();
    }

    /**
     * Sets up keyboard event listeners for player input
     * This method handles both keydown and keyup events to track key states
     */
    setupInput() {
        // Listen for key press events
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;       // Mark key as pressed in our state object
            
            // Prevent default browser behavior for space key (stops page scrolling)
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });

        // Listen for key release events
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;      // Mark key as released in our state object
            
            // Prevent default browser behavior for space key
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }

    /**
     * Main update method called every frame
     * This coordinates all player systems and applies movement
     * 
     * @param {number} deltaTime - Time elapsed since last frame (milliseconds)
     * @param {ZeldaGameMap} gameMap - Reference to game map for collision detection
     */
    update(deltaTime, gameMap) {
        // Update all player systems in order
        this.handleInput();                 // Process keyboard input and set movement vectors
        this.updateAnimation(deltaTime);    // Update walking animation and sprite frames
        this.updateCharging(deltaTime);     // Update charging system for special attacks
        this.updateStamina(deltaTime);      // Handle stamina regeneration over time
        this.updateHealth(deltaTime);       // Update health timers and damage effects
        this.updateDash(deltaTime, gameMap);// Handle dash movement and collision
        
        // =====================================================
        // MOVEMENT AND COLLISION DETECTION
        // =====================================================
        // Store old position for collision checking (in case we need to revert)
        const oldX = this.x;
        const oldY = this.y;
        
        // Apply movement (only if not dashing - dash has its own movement system)
        if (this.isMoving && !this.isDashing) {
            // Calculate new position using movement vector for smooth diagonal movement
            const newX = this.x + (this.moveX * this.speed);
            const newY = this.y + (this.moveY * this.speed);
            
            // Check if new position would cause collision with map boundaries or obstacles
            if (this.canMoveTo(newX, newY, gameMap)) {
                // No collision - move to new position
                this.x = newX;
                this.y = newY;
            } else {
                // Collision detected - try moving in just one direction
                // This allows player to "slide" along walls when moving diagonally
                const onlyX = this.x + (this.moveX * this.speed);  // Try X movement only
                const onlyY = this.y + (this.moveY * this.speed);  // Try Y movement only
                
                if (this.canMoveTo(onlyX, this.y, gameMap)) {
                    // Can move horizontally - slide along vertical wall
                    this.x = onlyX;
                } else if (this.canMoveTo(this.x, onlyY, gameMap)) {
                    // Can move vertically - slide along horizontal wall
                    this.y = onlyY;
                    // Can move vertically - slide along horizontal wall
                    this.y = onlyY;
                } else {
                    // Can't move in any direction - stop moving
                    this.isMoving = false;
                }
            }
        }
    }
    
    /**
     * Updates the charging system for special attacks
     * @param {number} deltaTime - Time elapsed since last frame
     */
    updateCharging(deltaTime) {
        if (this.isCharging) {
            this.chargeTime += deltaTime;
            
            // Cap charge time at maximum to prevent overcharging
            if (this.chargeTime >= this.maxChargeTime) {
                this.chargeTime = this.maxChargeTime;
            }
        }
    }

    /**
     * Handles keyboard input and calculates movement vectors
     * This method processes WASD/Arrow keys for 8-directional movement
     * and handles special inputs like dash and equipment
     */
    handleInput() {
        // =====================================================
        // MOVEMENT INPUT PROCESSING
        // =====================================================
        // Calculate movement vector based on currently pressed keys
        let moveX = 0;                      // Horizontal movement component (-1, 0, or 1)
        let moveY = 0;                      // Vertical movement component (-1, 0, or 1)
        let moving = false;                 // Track if any movement keys are pressed
        
        // Check horizontal movement keys (A/Left Arrow = left, D/Right Arrow = right)
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) {
            moveX -= 1;                     // Move left (negative X direction)
            moving = true;
        }
        if (this.keys['KeyD'] || this.keys['ArrowRight']) {
            moveX += 1;                     // Move right (positive X direction)
            moving = true;
        }
        
        // Check vertical movement keys (W/Up Arrow = up, S/Down Arrow = down)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) {
            moveY -= 1;                     // Move up (negative Y direction)
            moving = true;
        }
        if (this.keys['KeyS'] || this.keys['ArrowDown']) {
            moveY += 1;                     // Move down (positive Y direction)
            moving = true;
        }
        
        // Normalize diagonal movement to prevent faster diagonal speed
        if (moveX !== 0 && moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // Store movement vector and determine primary direction for sprite facing
        this.moveX = moveX;
        this.moveY = moveY;
        
        // Update facing direction based on movement (prioritize the stronger component)
        if (Math.abs(moveX) > Math.abs(moveY)) {
            this.direction = moveX > 0 ? 'right' : 'left';
        } else if (moveY !== 0) {
            this.direction = moveY > 0 ? 'down' : 'up';
        }
        
        // Equipment test controls removed - armor must be found in the world
        // Magic staff is found in the world, not equipped by key
        
        // Dash input (spacebar)
        if (this.keys['Space'] && this.canDash()) {
            console.log('🌪️ Attempting to start dash...');
            this.startDash();
        } else if (this.keys['Space']) {
            // Debug why dash can't start
            const now = Date.now();
            const cooldownPassed = (now - this.lastDashTime) >= this.dashCooldown;
            const hasStamina = this.canUseStamina(this.dashStaminaCost);
            
            if (this.isDashing) {
                console.log('❌ Can\'t dash: already dashing');
            } else if (!cooldownPassed) {
                const remainingCooldown = this.dashCooldown - (now - this.lastDashTime);
                console.log(`❌ Can't dash: cooldown (${remainingCooldown}ms remaining)`);
            } else if (!hasStamina) {
                console.log(`❌ Can't dash: insufficient stamina (${this.currentStamina}/${this.dashStaminaCost}) exhausted:${this.isStaminaExhausted}`);
            }
        }
        
        // Update movement state
        this.isMoving = moving;
        
        // Remember horizontal facing direction for sprite consistency
        if (this.direction === 'left' || this.direction === 'right') {
            this.facingDirection = this.direction;
        }
        
        // Reset animation if we stopped moving or changed direction significantly
        if (!this.isMoving) {
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
        
        // Adjust collision box to be more bottom-heavy for better tree collision
        // The visual character's feet should align with collision detection
        const collisionOffsetY = 6; // Move collision box down to represent feet position
        
        // Check collision with solid tiles using adjusted position
        return gameMap.canMoveTo(
            x - this.hitboxWidth / 2, 
            y - this.hitboxHeight / 2 + collisionOffsetY,  // Offset collision down
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
            } else if (currentWeapon.id === 'sword') {
                this.renderSword(ctx, shouldFlip);
            }
        } else if (this.hasMagicStaff) {
            // Fallback to old system
            this.renderMagicStaff(ctx, shouldFlip);
        } else if (this.hasSword) {
            // Fallback to old system
            this.renderSword(ctx, shouldFlip);
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
            
            // Debug: Show dash info
            if (this.isDashing) {
                // Draw dash path
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(this.dashStartX, this.dashStartY);
                ctx.lineTo(this.dashTargetX, this.dashTargetY);
                ctx.stroke();
                
                // Draw dash target
                ctx.fillStyle = '#ffff00';
                ctx.fillRect(this.dashTargetX - 5, this.dashTargetY - 5, 10, 10);
                
                // Show dash progress
                const elapsed = Date.now() - this.dashStartTime;
                const progress = Math.min(elapsed / this.dashDuration, 1.0);
                ctx.fillStyle = '#ffffff';
                ctx.font = '12px Arial';
                ctx.fillText(`Dash: ${Math.floor(progress * 100)}%`, this.x + 20, this.y - 20);
            }
            
            // Show dash cooldown
            const now = Date.now();
            const cooldownRemaining = Math.max(0, this.dashCooldown - (now - this.lastDashTime));
            if (cooldownRemaining > 0) {
                ctx.fillStyle = '#ff8888';
                ctx.font = '10px Arial';
                ctx.fillText(`Cooldown: ${cooldownRemaining}ms`, this.x + 20, this.y + 30);
            }
        }
        
        // Red damage overlay effects
        let shouldShowRedOverlay = false;
        let redIntensity = 0;
        
        // Check for damage flash (brief red flash when taking damage)
        if (this.damageFlashTimer > 0) {
            shouldShowRedOverlay = true;
            redIntensity = 0.6; // Strong red flash for damage
            console.log('🔴 Damage flash active, intensity:', redIntensity);
        }
        // Check for low health flash (persistent red flash when health < 30)
        else if (this.currentHealth <= this.lowHealthThreshold && this.currentHealth > 0) {
            const flashPhase = (this.lowHealthFlashTimer / this.lowHealthFlashDuration) * Math.PI * 2;
            const flashAlpha = (Math.sin(flashPhase) + 1) / 2; // Oscillates between 0 and 1
            if (flashAlpha > 0.3) { // Only show red when flash is bright enough
                shouldShowRedOverlay = true;
                redIntensity = 0.4 * flashAlpha; // Pulsing red for low health
                console.log('💔 Low health flash active, intensity:', redIntensity);
            }
        }
        
        // Apply red overlay if needed
        if (shouldShowRedOverlay) {
            ctx.save();
            ctx.fillStyle = `rgba(255, 0, 0, ${redIntensity * 0.5})`;
            ctx.fillRect(
                this.x - this.width / 2, 
                this.y - this.height / 2, 
                this.width, 
                this.height
            );
            ctx.restore();
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

    equipSword() {
        this.hasSword = true;
        console.log('⚔️ Llama equipped with sword!');
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

    renderSword(ctx, shouldFlip) {
        const swordSprite = this.spriteLoader.getSword();
        if (!swordSprite) {
            console.error('❌ Sword sprite not found!');
            return;
        }
        
        // Calculate sword position relative to player
        let swordOffsetX = shouldFlip ? -18 : 18;  // Position to side of player
        let swordOffsetY = 2; // Slightly below center
        
        // Make equipped sword smaller and proportional
        let renderWidth = 24;   // Smaller sword size
        let renderHeight = 24;
        
        ctx.save();
        
        // Flip sword to face away from the llama
        if (shouldFlip) {
            // Player facing left: flip both horizontally and vertically so sword points away
            ctx.scale(-1, -1);
            ctx.drawImage(
                swordSprite,
                0, 0, swordSprite.width, swordSprite.height,  // Full sprite
                -(this.x + swordOffsetX + renderWidth/2), -(this.y + swordOffsetY + renderHeight/2 + this.bobOffset),
                renderWidth, renderHeight
            );
        } else {
            // Player facing right: flip vertically so sword points away
            ctx.scale(1, -1);
            ctx.drawImage(
                swordSprite,
                0, 0, swordSprite.width, swordSprite.height,  // Full sprite
                this.x + swordOffsetX - renderWidth/2, -(this.y + swordOffsetY + renderHeight/2 + this.bobOffset),
                renderWidth, renderHeight
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
        
        // Update damage flash timer
        if (this.damageFlashTimer > 0) {
            this.damageFlashTimer -= deltaTime;
        }
        
        // Update low health flash timer
        if (this.currentHealth <= this.lowHealthThreshold) {
            this.lowHealthFlashTimer += deltaTime;
            if (this.lowHealthFlashTimer >= this.lowHealthFlashDuration) {
                this.lowHealthFlashTimer = 0;
            }
        } else {
            this.lowHealthFlashTimer = 0;
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
        this.damageFlashTimer = this.damageFlashDuration; // Trigger damage flash
        
        console.log(`💔 Player took ${amount} damage! Health: ${this.currentHealth}/${this.maxHealth}`);
        console.log(`🔴 Damage flash timer set to: ${this.damageFlashTimer}ms`);
        //death logic:
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
    
    addTrailPosition(x, y) {
        // Add current position to trail
        this.dashTrails.push({
            x: x,
            y: y,
            timestamp: Date.now()
        });
        
        // Remove old trail positions
        if (this.dashTrails.length > this.maxTrailLength) {
            this.dashTrails.shift();
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
        if (!this.canDash()) {
            console.log('❌ Dash rejected by canDash()');
            return;
        }
        
        console.log(`🌪️ Starting dash in direction: ${this.direction}`);
        
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
            default:
                // If no direction set, dash forward (down)
                this.direction = 'down';
                this.dashTargetY = this.y + this.dashDistance;
                this.dashTargetX = this.x;
                break;
        }
        
        console.log(`🎯 Dash from (${this.dashStartX}, ${this.dashStartY}) to (${this.dashTargetX}, ${this.dashTargetY})`);
        
        // Create wind particles for visual effect
        if (this.particleSystem) {
            // Create particles from player's center
            const centerX = this.x + this.renderWidth / 2;
            const centerY = this.y + this.renderHeight / 2;
            this.particleSystem.createWindBurst(centerX, centerY, this.direction, 15);
        }
        
        console.log('✅ Dash started successfully!');
    }

    updateDash(deltaTime, gameMap) {
        if (!this.isDashing) {
            // Clear dash trails when not dashing
            this.dashTrails = [];
            return;
        }
        
        const now = Date.now();
        const elapsed = now - this.dashStartTime;
        const progress = Math.min(elapsed / this.dashDuration, 1.0);
        
        // Update dash trail
        if (now - this.lastTrailUpdate >= this.trailUpdateInterval) {
            this.addTrailPosition(this.x, this.y);
            this.lastTrailUpdate = now;
        }
        
        if (progress >= 1.0) {
            // Dash complete
            console.log('🏁 Dash completed');
            this.isDashing = false;
            
            // Check final position for collisions
            if (gameMap && gameMap.isCollision && gameMap.isCollision(this.dashTargetX, this.dashTargetY, this.hitboxWidth, this.hitboxHeight)) {
                // Move back to last safe position
                console.log('⚠️ Final dash position blocked, reverting to start');
                this.x = this.dashStartX;
                this.y = this.dashStartY;
            } else {
                // Move to target position
                this.x = this.dashTargetX;
                this.y = this.dashTargetY;
                console.log(`✅ Dash completed at (${this.x}, ${this.y})`);
            }
        } else {
            // Interpolate position during dash
            const newX = this.dashStartX + (this.dashTargetX - this.dashStartX) * progress;
            const newY = this.dashStartY + (this.dashTargetY - this.dashStartY) * progress;
            
            // Check for collisions during dash
            if (gameMap && gameMap.isCollision && gameMap.isCollision(newX, newY, this.hitboxWidth, this.hitboxHeight)) {
                // Stop dash early if we hit something
                console.log('⚠️ Dash interrupted by collision at progress:', progress);
                this.isDashing = false;
                // Stay at current position (don't move into the wall)
            } else {
                // Update position
                this.x = newX;
                this.y = newY;
                
                // Debug dash progress every 25%
                if (Math.floor(progress * 4) !== Math.floor((progress - 0.01) * 4)) {
                    console.log(`⚡ Dashing... ${Math.floor(progress * 100)}% (${this.x.toFixed(1)}, ${this.y.toFixed(1)})`);
                }
            }
        }
    }
}