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
    constructor(x, y, spriteLoader, game = null) {
        // =====================================================
        // POSITION AND CORE REFERENCES
        // =====================================================
        this.x = x;                         // Player's X position in pixels
        this.y = y;                         // Player's Y position in pixels
        this.spriteLoader = spriteLoader;   // Reference to sprite loading system
        this.game = game;                   // Reference to game instance (for enemy access)
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
        // LEVEL AND XP SYSTEM
        // =====================================================
        this.level = 1;                     // Player's current level
        this.xp = 0;                        // Current experience points
        this.xpToNextLevel = 100;           // XP needed to reach next level
        this.xpMultiplier = 1.5;            // XP requirement increases by this factor per level
        
        // =====================================================
        // VISUAL DAMAGE EFFECTS (red flashing when hurt/low health)
        // =====================================================
        this.lowHealthFlashTimer = 0;       // Timer for low health warning flash
        this.lowHealthFlashDuration = 500;  // How often to flash when health is low (every 500ms)
        this.damageFlashTimer = 0;          // Timer for brief flash when taking damage
        this.damageFlashDuration = 200;     // How long damage flash lasts (200ms)
        this.lowHealthThreshold = 30;       // Health level below which player flashes red
        
        // =====================================================
        // STAMINA BAR VISUAL EFFECTS
        // =====================================================
        this.staminaBarVisible = true;      // Whether to show stamina bar above player
        this.staminaFlashTimer = 0;         // Timer for stamina insufficient flash
        this.staminaFlashDuration = 300;    // How long stamina flash lasts (300ms)
        this.isStaminaFlashing = false;     // Whether stamina bar is currently flashing
        
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
        this.renderWidth = 36;              // Display size smaller than sprite frame (was 48)
        this.renderHeight = 36;             // Display size smaller than sprite frame (was 48)
        
        // Sprite sheet grid layout (2 columns x 3 rows = 6 total frames)
        this.spriteCols = 2;                // Number of columns in sprite sheet
        this.spriteRows = 3;                // Number of rows in sprite sheet
        
        // =====================================================
        // EQUIPMENT AND INVENTORY SYSTEM
        // =====================================================
        this.hasArmor = false;              // Boolean: true when player has knight armor equipped
        this.inventory = [];                // Array: future inventory system for items
        
        // =====================================================
        // SWORD COMBAT SYSTEM
        // =====================================================
        this.isSwinging = false;            // Boolean: true when sword swing is active
        this.swingTimer = 0;                // Timer for sword swing animation
        this.swingDuration = 150;           // Duration of sword swing in milliseconds (faster - was 300)
        this.swingAngle = 0;                // Current angle of sword during swing
        this.swingDirection = 1;            // Direction of swing: 1 for right, -1 for left
        
        // ADVANCED SWORD COMBO SYSTEM
        this.swordState = 'upright';        // Sword position: 'upright', 'down', 'horizontal', 'swinging_down', 'swinging_up', 'stabbing'
        this.comboCount = 0;                // Number of consecutive attacks (0-3)
        this.comboResetTimer = 0;           // Timer to reset combo after inactivity
        this.comboResetDelay = 3000;        // 3 seconds before combo resets
        this.swordHoldTimer = 0;            // Timer for holding sword in down position
        this.hasHitThisSwing = false;       // Track if sword hit an enemy this swing
        this.comboCount = 0;                // Number of consecutive attacks (0-3)
        this.comboResetTimer = 0;           // Timer to reset combo after inactivity
        this.comboResetDelay = 3000;        // 3 seconds before combo resets
        this.swordHoldTimer = 0;            // Timer for holding sword in down position
        
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
        this.updateSwordSwing(deltaTime);   // Update sword swing animation and timing
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
        } else if (!this.canDash()) {
            // Debug why dash can't start and trigger flash if stamina issue
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
                this.triggerStaminaFlash(); // Flash stamina bar when insufficient
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

    updateSwordSwing(deltaTime) {
        // Update combo reset timer
        if (this.comboCount > 0) {
            this.comboResetTimer += deltaTime;
            if (this.comboResetTimer >= this.comboResetDelay) {
                // Reset combo after 3 seconds of inactivity
                this.comboCount = 0;
                this.comboResetTimer = 0;
                this.swordState = 'upright';
                this.swordHoldTimer = 0;
                console.log('🔄 Sword combo reset to upright position');
            }
        }
        
        // Handle sword holding in down position
        if (this.swordState === 'down') {
            this.swordHoldTimer += deltaTime;
        }
        
        // Handle active swing animations
        if (!this.isSwinging) return;
        
        this.swingTimer += deltaTime;
        
        if (this.swingTimer >= this.swingDuration) {
            // Swing animation completed
            this.isSwinging = false;
            this.swingTimer = 0;
            
            // Determine end state based on combo
            if (this.swordState === 'swinging_down') {
                this.swordState = 'down';
                this.swordHoldTimer = 0;
                console.log('⚔️ Sword held in down position');
            } else if (this.swordState === 'swinging_up') {
                this.swordState = 'horizontal';
                console.log('⚔️ Sword at horizontal position');
            } else if (this.swordState === 'stabbing') {
                // After stab, return to upright position
                this.swordState = 'upright';
                this.comboCount = 0; // Reset combo after stab
                console.log('⚔️ Stab completed, returned to upright');
            }
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
        
        // Draw equipped items from inventory system
        if (this.inventory) {
            const currentWeapon = this.inventory.getCurrentWeapon();
            if (currentWeapon.id === 'staff') {
                this.renderMagicStaff(ctx, shouldFlip);
            } else if (currentWeapon.id === 'sword') {
                this.renderSword(ctx, shouldFlip);
            }
        }
        
        // Draw stamina bar above player
        this.renderStaminaBar(ctx);
        
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
        // Low health flash disabled
        // else if (this.currentHealth <= this.lowHealthThreshold && this.currentHealth > 0) {
        //     const flashPhase = (this.lowHealthFlashTimer / this.lowHealthFlashDuration) * Math.PI * 2;
        //     const flashAlpha = (Math.sin(flashPhase) + 1) / 2; // Oscillates between 0 and 1
        //     if (flashAlpha > 0.3) { // Only show red when flash is bright enough
        //         shouldShowRedOverlay = true;
        //         redIntensity = 0.4 * flashAlpha; // Pulsing red for low health
        //         console.log('💔 Low health flash active, intensity:', redIntensity);
        //     }
        // }
        
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
        // Legacy method - inventory system handles this now
        console.log('⚠️ Use inventory system to equip staff (key 2)');
    }

    equipSword() {
        // Legacy method - inventory system handles this now
        console.log('⚠️ Use inventory system to equip sword (key 1)');
    }

    // Start a sword swing attack
    startSwordSwing() {
        // Check inventory system for sword
        let hasSwordEquipped = false;
        if (this.inventory) {
            const currentWeapon = this.inventory.getCurrentWeapon();
            hasSwordEquipped = (currentWeapon.id === 'sword');
        }

        if (!hasSwordEquipped || this.isSwinging) {
            console.log('❌ Cannot swing sword - not equipped or already swinging');
            return;
        }
        
        // Reset hit tracking for new swing
        this.hasHitThisSwing = false;
        
        // Reset combo timer since we're attacking
        this.comboResetTimer = 0;
        this.comboCount++;
        
        // Determine attack type based on combo count and current state
        if (this.comboCount === 1) {
            // First attack: swing down 180 degrees
            this.swordState = 'swinging_down';
            console.log('⚔️ Combo 1: Downward swing');
        } else if (this.comboCount === 2 && this.swordState === 'down') {
            // Second attack: swing back up to horizontal
            this.swordState = 'swinging_up';
            console.log('⚔️ Combo 2: Upward swing');
        } else if (this.comboCount === 3 && this.swordState === 'horizontal') {
            // Third attack: stab motion from horizontal position
            this.swordState = 'stabbing';
            console.log('⚔️ Combo 3: Stab attack!');
        } else {
            // Invalid combo state, reset
            this.comboCount = 1;
            this.swordState = 'swinging_down';
            console.log('⚔️ Reset to downward swing');
        }
        
        this.isSwinging = true;
        this.swingTimer = 0;
        
        // Check for enemy damage when starting swing
        this.checkSwordDamage();
    }

    // Check if sword hits any enemies during swing
    checkSwordDamage() {
        if (!this.game || !this.game.enemies) return;
        
        const swordDamage = 10; // Damage dealt by sword (reduced for multi-hit combat)
        const swordRange = 60;  // Range of sword attack in pixels (increased from 40)
        
        // Calculate sword tip position based on player facing direction
        let swordTipX = this.x;
        let swordTipY = this.y;
        
        if (this.facingDirection === 'right') {
            swordTipX += swordRange;
        } else if (this.facingDirection === 'left') {
            swordTipX -= swordRange;
        } else if (this.facingDirection === 'up') {
            swordTipY -= swordRange;
        } else if (this.facingDirection === 'down') {
            swordTipY += swordRange;
        }
        
        // Check collision with each enemy
        for (let enemy of this.game.enemies) {
            const distance = Math.sqrt(
                Math.pow(enemy.x - swordTipX, 2) + 
                Math.pow(enemy.y - swordTipY, 2)
            );
            
            if (distance < 45) { // Hit range (increased from 30)
                // Deal damage to enemy
                const damaged = enemy.takeDamage(swordDamage, this.x, this.y);
                if (damaged) {
                    console.log(`⚔️ Sword hit ${enemy.type} for ${swordDamage} damage!`);
                }
            }
        }
    }

    renderMagicStaff(ctx, shouldFlip) {
        const staffSprite = this.spriteLoader.get('magic_staff');
        if (!staffSprite) {
            console.error('❌ Staff sprite not found!');
            return;
        }
        
        // Calculate staff position relative to player (adjusted for smaller size)
        let staffOffsetX = shouldFlip ? -16 : 16;  // Closer to player since it's smaller
        let staffOffsetY = -4; // Slightly above center
        
        // 2x3 grid: 2 columns, 3 rows
        const staffFrameWidth = staffSprite.width / 2;   // Each frame is half the width
        const staffFrameHeight = staffSprite.height / 3; // Each frame is one-third the height
        
        // Animate between top row frames (red and blue staff)
        const time = Date.now() * 0.002; // Slower animation
        const animationFrame = Math.floor(time) % 2; // Alternate between 0 and 1
        const frameX = animationFrame * staffFrameWidth;  // Column 0 or 1
        const frameY = 0;  // Top row
        
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
        
        // Calculate sword position relative to player - closer to body, at torso level
        let swordOffsetX = shouldFlip ? -12 : 12;  // Closer to the side of player (was -20/20)
        let swordOffsetY = 6; // Slightly closer to center torso level (was 8)
        
        // Make equipped sword smaller and proportional
        let renderWidth = 24;   // Smaller sword size
        let renderHeight = 24;
        
        // Calculate handle/grip position (where player holds the sword at torso)
        const handleX = this.x + swordOffsetX;
        const handleY = this.y + swordOffsetY + this.bobOffset;
        
        ctx.save();
        ctx.translate(handleX, handleY);  // Move to handle position (pivot point)
        
        // Handle facing direction first - simpler logic
        if (shouldFlip) {
            ctx.scale(-1, 1);  // Flip for left-facing
        }
        
        // Rotate sword to make it vertical with proper orientation
        // Sprite is at 45 degrees from vertical (135° total), add 180° to flip it right-side up
        ctx.rotate(45 * Math.PI / 180);  // Rotate 45 degrees to point straight up with handle toward player
        
        // Apply sword animations based on state
        let additionalRotation = 0;
        let stabOffset = 0;
        
        if (this.isSwinging) {
            const swingProgress = this.swingTimer / this.swingDuration;
            
            if (this.swordState === 'swinging_down') {
                // Swing down 180 degrees (full swing)
                additionalRotation = swingProgress * 180; // 0 to 180 degrees
            } else if (this.swordState === 'swinging_up') {
                // Swing up from down position to halfway (180 to 90 degrees)
                additionalRotation = 180 - (swingProgress * 90); // 180 to 90 degrees
            } else if (this.swordState === 'stabbing') {
                // Stab motion - stay horizontal (90°) and thrust forward/back
                additionalRotation = 90; // Keep horizontal orientation
                stabOffset = Math.sin(swingProgress * Math.PI) * 25; // Forward thrust (increased distance)
            }
        } else {
            // Static positions when not swinging
            if (this.swordState === 'down') {
                additionalRotation = 180; // Hold at 180 degrees down
            } else if (this.swordState === 'horizontal') {
                additionalRotation = 90; // Hold at 90 degrees (horizontal)
            }
            // 'upright' state has no additional rotation (base vertical position)
        }
        
        // Apply rotation first
        ctx.rotate(additionalRotation * Math.PI / 180);
        
        // Apply stab offset AFTER rotation (in rotated coordinates)
        if (stabOffset > 0) {
            // When sword is horizontal, thrust straight up in the rotated space = forward
            // This should make it go straight forward (north) instead of southwest
            ctx.translate(0, -stabOffset); // Move up in rotated coordinate system = forward thrust
        }
        
        // Set anchor point - at the very end of the grip (pommel end)
        const anchorX = renderWidth / 2;  // Center horizontally 
        const anchorY = renderHeight;     // At the very bottom end of the sword (pommel)
        
        // Draw sword with the anchor point at the origin (0,0)
        // This makes the end of the grip the pivot point for all rotations
        ctx.drawImage(
            swordSprite,
            0, 0, swordSprite.width, swordSprite.height,
            -anchorX, -anchorY, renderWidth, renderHeight  // Anchor at grip end
        );
        
        ctx.restore();
    }
    
    renderStaminaBar(ctx) {
        if (!this.staminaBarVisible) return;
        
        // Position stamina bar above player
        const barWidth = 40;
        const barHeight = 4;
        const barX = this.x - barWidth / 2;
        const barY = this.y - this.renderHeight / 2 - 15; // 15px above player
        
        ctx.save();
        
        // Background (dark gray)
        ctx.fillStyle = '#333333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Stamina fill
        const staminaPercent = this.currentStamina / this.maxStamina;
        const fillWidth = barWidth * staminaPercent;
        
        // Determine stamina bar color
        let staminaColor = '#00bfff'; // Default cyan/blue for stamina
        
        if (this.isStaminaFlashing) {
            // Flash red when insufficient stamina
            const flashIntensity = Math.sin(Date.now() * 0.02) * 0.5 + 0.5; // Pulse between 0 and 1
            staminaColor = `rgba(255, ${Math.floor(100 * (1 - flashIntensity))}, 0, 1)`; // Flash between red and orange
        } else if (this.isStaminaExhausted) {
            staminaColor = '#ff4444'; // Red when exhausted
        } else if (staminaPercent < 0.3) {
            staminaColor = '#ffaa00'; // Orange when low
        }
        
        ctx.fillStyle = staminaColor;
        ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        // Border
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Stamina text (only show if low or flashing)
        if (this.isStaminaFlashing || staminaPercent < 0.3 || this.isStaminaExhausted) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '8px Arial';
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 2;
            ctx.fillText(`${Math.floor(this.currentStamina)}`, this.x, barY - 2);
            ctx.shadowBlur = 0;
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
                    this.triggerStaminaFlash();
                    return false;
                }
                
                // Check if player has minimum stamina to start charging
                if (this.currentStamina < 10) {
                    console.log('💨 Not enough stamina to charge spell!');
                    this.triggerStaminaFlash();
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
            
            // Calculate stamina cost based on spell power
            let staminaCost = wasFullyCharged ? 40 : 15; // More stamina for charged spells
            
            // Check if player has enough stamina to actually fire the spell
            if (this.isStaminaExhausted || this.currentStamina < staminaCost) {
                console.log(`💨 Not enough stamina to fire ${wasFullyCharged ? 'CHARGED' : 'normal'} spell! Need: ${staminaCost}, Have: ${this.currentStamina}`);
                this.triggerStaminaFlash();
                this.isCharging = false; // Stop charging but don't fire
                this.chargeTime = 0;     // Reset charge time
                return { charged: false, chargeTime: 0, failed: true }; // Indicate failure
            }
            
            this.isCharging = false;
            const chargeResult = { charged: wasFullyCharged, chargeTime: this.chargeTime };
            
            // Consume stamina for the spell
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
    
    // Trigger stamina flash when action fails due to insufficient stamina
    triggerStaminaFlash() {
        this.isStaminaFlashing = true;
        this.staminaFlashTimer = this.staminaFlashDuration;
        console.log('⚡ Stamina flash triggered - insufficient stamina!');
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

        // Update stamina flash timer
        if (this.staminaFlashTimer > 0) {
            this.staminaFlashTimer -= deltaTime;
            if (this.staminaFlashTimer <= 0) {
                this.isStaminaFlashing = false;
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
    
    /**
     * Gain experience points and check for level up
     * @param {number} amount - XP amount to add
     */
    gainXP(amount) {
        this.xp += amount;
        console.log(`⭐ Gained ${amount} XP! (${this.xp}/${this.xpToNextLevel})`);
        
        // Check if leveled up
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }
    
    /**
     * Level up the player - increase stats and update XP requirements
     */
    levelUp() {
        this.level++;
        this.xp -= this.xpToNextLevel; // Carry over excess XP
        
        // Increase XP requirement for next level
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * this.xpMultiplier);
        
        // Heal player on level up
        this.currentHealth = this.maxHealth;
        
        console.log(`🎉 LEVEL UP! Now level ${this.level}!`);
        console.log(`💪 Health restored! Next level: ${this.xpToNextLevel} XP`);
    }

    // Get staff world position for fireball spawning (from the red tip)
    getStaffWorldPosition() {
        // Safety check for valid player position
        if (!isFinite(this.x) || !isFinite(this.y)) {
            console.warn('Invalid player position in getStaffWorldPosition, using default');
            return { x: 120, y: 120 };
        }
        
        // Calculate which side the staff is on based on facing direction
        const shouldFlip = (this.facingDirection === 'left');
        
        // Staff offset matches the rendering position, but adjusted for tip
        let staffOffsetX = shouldFlip ? -16 : 16;  // Same as render offset
        let staffOffsetY = -4; // Base staff position
        
        // Adjust to the top/tip of the staff (the red magical part)
        // Staff is rendered vertically, so we move up to get the tip
        const staffTipOffsetY = -18; // Move up to the red tip of the staff
        
        const staffX = this.x + staffOffsetX;
        const staffY = this.y + staffOffsetY + staffTipOffsetY;
        
        // Safety check for final coordinates
        if (!isFinite(staffX) || !isFinite(staffY)) {
            console.warn('Invalid staff position calculated, using player position');
            return { x: this.x, y: this.y };
        }
        
        return { x: staffX, y: staffY };
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
            
            // Check final position for collisions using proper collision method
            if (gameMap && !this.canMoveToPosition(this.dashTargetX, this.dashTargetY, gameMap)) {
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
            
            // Check for collisions during dash using proper collision method
            if (gameMap && !this.canMoveToPosition(newX, newY, gameMap)) {
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
    
    // Helper method to check if player can move to a position (works with both room systems)
    canMoveToPosition(x, y, gameMap) {
        if (!gameMap) return false;
        
        // Use the correct collision method based on what's available
        if (gameMap.canMoveTo) {
            // New room system (BaseRoom)
            return gameMap.canMoveTo(x, y, this.hitboxWidth, this.hitboxHeight);
        } else if (gameMap.isCollision) {
            // Old GameMap system
            return !gameMap.isCollision(x, y, this.hitboxWidth, this.hitboxHeight);
        } else {
            // Fallback - assume movement is allowed
            console.warn('⚠️ No collision method available on gameMap');
            return true;
        }
    }
}