/**
 * Main Zelda-style Game Controller
 * 
 * This is the central game class that coordinates all game systems:
 * - Game loop and timing
 * - Input handling
 * - Camera and rendering
 * - Game state management (title, playing, paused, etc.)
 * - Room transitions
 * - Object lifecycle management (player, enemies, projectiles)
 * - Debug systems and performance monitoring
 */
class ZeldaGame {
    constructor() {
        // =====================================================
        // CANVAS AND RENDERING
        // =====================================================
        this.canvas = document.getElementById('gameCanvas');    // Main game canvas element
        this.ctx = this.canvas.getContext('2d');               // 2D rendering context
        this.debugElement = document.getElementById('debug');   // Debug info display element
        
        // =====================================================
        // GAME STATE MANAGEMENT
        // =====================================================
        this.gameState = 'title';           // Current state: 'title', 'playing', 'paused', 'gameover', 'win'
        this.isRunning = false;             // Whether game loop is active
        this.lastTime = 0;                  // Timestamp of last frame (for delta time calculation)
        this.fps = 0;                       // Current frames per second
        this.frameCount = 0;                // Total frames rendered (for FPS calculation)
        this.fpsTimer = 0;                  // Timer for FPS updates
        
        // =====================================================
        // AUDIO SYSTEM
        // =====================================================
        this.backgroundMusic = null;        // Background music audio element
        this.isMusicEnabled = true;         // Whether music is enabled
        this.musicVolume = 0.5;            // Music volume (0.0 to 1.0)
        
        // =====================================================
        // INPUT SYSTEM
        // =====================================================
        this.keys = {};                     // Object tracking which keys are currently pressed
        
        // =====================================================
        // CAMERA AND DISPLAY
        // =====================================================
        this.zoom = 1.5;                    // Camera zoom level for better detail visibility
        
        // =====================================================
        // CORE GAME OBJECTS
        // =====================================================
        this.spriteLoader = null;           // Handles loading and managing all game sprites
        this.roomManager = null;            // New modular room management system
        this.gameMap = null;                // Current room's tile map (for backward compatibility)
        this.player = null;                 // Player character object
        this.inventory = null;              // Player's inventory system
        this.projectiles = [];              // Array of active projectiles (magic staff shots, etc.)
        this.enemies = [];                  // Array of enemies in current room
        
        // =====================================================
        // MOUSE INPUT TRACKING
        // =====================================================
        this.mouseX = 0;                    // Mouse X position on canvas
        this.mouseY = 0;                    // Mouse Y position on canvas
        this.worldMouseX = 0;               // Mouse X position in world coordinates (accounting for camera)
        this.worldMouseY = 0;               // Mouse Y position in world coordinates (accounting for camera)
        
        // =====================================================
        // ROOM SYSTEM
        // =====================================================
        this.currentRoom = 'main';          // Name of currently active room
        this.rooms = {};                    // Cache of generated rooms for performance
        
        // =====================================================
        // UI AND VISUAL SYSTEMS
        // =====================================================
        this.titleBackground = null;        // Background image for title screen
        
        // =====================================================
        // DEBUG AND DEVELOPMENT
        // =====================================================
        window.DEBUG_MODE = false;          // Global debug mode toggle
        
        // =====================================================
        // MESSAGE SYSTEM (for player notifications)
        // =====================================================
        this.messageText = '';              // Current message to display
        this.messageTimer = 0;              // How long to show current message
        
        this.init();
    }

    init() {
        console.log('🎮 Initializing Zelda-style Llama Knight Adventure...');
        
        // Check if canvas and context are available
        if (!this.canvas) {
            console.error('❌ Canvas element not found!');
            return;
        }
        if (!this.ctx) {
            console.error('❌ Canvas 2D context not available!');
            return;
        }
        
        console.log('✅ Canvas found:', this.canvas.width, 'x', this.canvas.height);
        
        // Setup canvas
        this.ctx.imageSmoothingEnabled = false; // Pixel-perfect rendering
        
        // Initialize audio system
        this.initAudio();
        
        // Clear canvas with a test color to verify it's working
        this.ctx.fillStyle = '#004400';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        console.log('✅ Canvas cleared with test color');
        
        // Add loading text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Llama Knight Adventure...', this.canvas.width / 2, this.canvas.height / 2);
        
        // Setup input handlers
        this.setupMouseControls();
        
        // Load sprites first, then load background, then start
        this.spriteLoader = new SimpleSpriteLoader();
        this.spriteLoader.load(() => {
            console.log('📦 All sprites loaded, loading title background...');
            try {
                this.loadTitleBackground();
            } catch (error) {
                console.error('❌ Error loading title background:', error);
                // Fallback: start game without background
                this.onSpritesLoaded();
            }
        });
        
        // Setup debug controls
        this.setupDebugControls();
    }
    
    loadTitleBackground() {
        this.titleBackground = new Image();
        
        // Set up a timeout fallback in case image doesn't load
        const fallbackTimer = setTimeout(() => {
            console.warn('⚠️ Title background loading timeout, starting without background...');
            this.onSpritesLoaded();
        }, 3000); // 3 second timeout
        
        this.titleBackground.onload = () => {
            clearTimeout(fallbackTimer);
            console.log('🖼️ Title background loaded, starting game...');
            this.onSpritesLoaded();
        };
        this.titleBackground.onerror = () => {
            clearTimeout(fallbackTimer);
            console.warn('⚠️ Could not load title background, using default...');
            this.onSpritesLoaded();
        };
        
        console.log('🔄 Loading title background from: assets/images/title-background.png');
        this.titleBackground.src = 'assets/images/title-background.png';
    }

    setupMouseControls() {
        // Mouse move tracking
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            // Convert to world coordinates (accounting for zoom and camera)
            this.updateWorldMouseCoordinates();
        });
        
        // Mouse down for charging
        this.canvas.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.handleMouseDown();
        });
        
        // Mouse up for releasing charge
        this.canvas.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.handleMouseUp();
        });
        
        // Prevent context menu on right click
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    calculateCameraPosition() {
        let cameraX = 0;
        let cameraY = 0;
        
        if (this.player && this.gameMap) {
            // Safety check for valid player position
            if (!isFinite(this.player.x) || !isFinite(this.player.y)) {
                console.warn('Invalid player position detected, resetting player to spawn');
                this.player.x = 120;
                this.player.y = 120;
            }
            
            // Safety check for valid zoom
            if (!this.zoom || this.zoom <= 0 || !isFinite(this.zoom)) {
                console.warn('Invalid zoom in camera calculation, resetting to 1.5');
                this.zoom = 1.5;
            }
            
            // Center camera on player
            cameraX = (this.canvas.width / this.zoom / 2) - this.player.x;
            cameraY = (this.canvas.height / this.zoom / 2) - this.player.y;
            
            // Clamp camera to map boundaries (same as render method)
            const mapWidth = this.gameMap.width * this.gameMap.tileSize;
            const mapHeight = this.gameMap.height * this.gameMap.tileSize;
            
            cameraX = Math.min(0, Math.max(cameraX, (this.canvas.width / this.zoom) - mapWidth));
            cameraY = Math.min(0, Math.max(cameraY, (this.canvas.height / this.zoom) - mapHeight));
            
            // Final safety check for camera values
            if (!isFinite(cameraX) || !isFinite(cameraY)) {
                console.warn('Invalid camera position calculated, using defaults');
                cameraX = 0;
                cameraY = 0;
            }
        }
        
        return { x: cameraX, y: cameraY };
    }
    
    updateWorldMouseCoordinates() {
        if (!this.player) return;
        
        // Get the actual camera position used in rendering
        const camera = this.calculateCameraPosition();
        
        // Safety check for valid zoom value
        if (!this.zoom || this.zoom <= 0 || !isFinite(this.zoom)) {
            console.warn('Invalid zoom value detected, resetting to 1.5');
            this.zoom = 1.5;
        }
        
        // Convert screen coordinates to world coordinates with safety checks
        this.worldMouseX = (this.mouseX / this.zoom) - camera.x;
        this.worldMouseY = (this.mouseY / this.zoom) - camera.y;
        
        // Safety check for invalid world coordinates
        if (!isFinite(this.worldMouseX) || !isFinite(this.worldMouseY)) {
            console.warn('Invalid world mouse coordinates detected, resetting');
            this.worldMouseX = this.player.x;
            this.worldMouseY = this.player.y;
        }
    }
    
    handleMouseDown() {
        if (!this.player || !this.inventory) return;
        
        const currentWeapon = this.inventory.getCurrentWeapon();
        console.log('🔍 Mouse down - Current weapon:', currentWeapon.id, currentWeapon.name);
        
        if (currentWeapon.id === 'staff') {
            // Staff charging
            console.log('⚡ Attempting to start staff charge...');
            const chargeStarted = this.player.startCharging();
            if (!chargeStarted) {
                console.log('❌ Failed to start staff charge - insufficient stamina or other issue');
            }
        } else if (currentWeapon.id === 'sword') {
            // Sword swinging
            console.log('⚔️ Starting sword swing...');
            this.player.startSwordSwing();
        } else {
            console.log('❌ No weapon equipped for mouse action!');
        }
    }
    
    handleMouseUp() {
        if (!this.player || !this.inventory) return;
        
        // Only shoot if staff is equipped
        const currentWeapon = this.inventory.getCurrentWeapon();
        console.log('🔍 Mouse up - Current weapon:', currentWeapon.id, currentWeapon.name);
        if (currentWeapon.id !== 'staff') {
            console.log('❌ Cannot shoot - staff not equipped!');
            return;
        }
        
        // Stop charging and get charge info
        const chargeInfo = this.player.stopCharging();
        if (!chargeInfo) {
            console.log('❌ No charge info - cannot shoot!');
            return;
        }
        
        // Check if shooting failed due to insufficient stamina
        if (chargeInfo.failed) {
            console.log('❌ Fireball shot failed - insufficient stamina!');
            return;
        }
        
        console.log('🔥 Shooting fireball with charge info:', chargeInfo);
        
        // Calculate staff position based on player's facing direction
        const staffOffset = this.player.getStaffWorldPosition();
        
        // Safety check for valid coordinates before creating projectile
        if (!isFinite(staffOffset.x) || !isFinite(staffOffset.y) || 
            !isFinite(this.worldMouseX) || !isFinite(this.worldMouseY)) {
            console.warn('Invalid coordinates for projectile creation, skipping');
            return;
        }
        
        // Create fireball projectile from staff position
        const projectileType = chargeInfo.charged ? 'charged_fireball' : 'fireball';
        const fireball = new ZeldaProjectile(
            staffOffset.x, 
            staffOffset.y, 
            this.worldMouseX, 
            this.worldMouseY,
            projectileType
        );
        
        this.projectiles.push(fireball);
        console.log(`🔥 ${projectileType} shot from staff at (${staffOffset.x}, ${staffOffset.y}) towards: (${this.worldMouseX}, ${this.worldMouseY})`);
        console.log(`⚡ Projectile damage: ${fireball.damage}, size: ${fireball.size}, speed: ${fireball.speed}`);
        console.log(`📍 Mouse screen: (${this.mouseX}, ${this.mouseY}), Camera: (${this.calculateCameraPosition().x}, ${this.calculateCameraPosition().y}), Zoom: ${this.zoom}`);
    }

    setupDebugControls() {
        document.addEventListener('keydown', (e) => {
            // Track all key states
            this.keys[e.code] = true;
            
            // Update player keys if in game
            if (this.player && this.gameState === 'playing') {
                this.player.keys[e.code] = true;
            }
            
            // Prevent default behavior for space key to avoid page scrolling
            if (e.code === 'Space') {
                e.preventDefault();
            }
            
            // Escape key - toggle pause menu
            if (e.code === 'Escape') {
                e.preventDefault();
                if (this.gameState === 'playing') {
                    this.gameState = 'paused';
                    console.log('Game paused');
                } else if (this.gameState === 'paused') {
                    this.gameState = 'playing';
                    console.log('Game resumed');
                }
            }
            
            // M key - toggle music on/off
            if (e.code === 'KeyM') {
                e.preventDefault();
                const musicState = this.toggleMusic();
                this.showMessage(`Music ${musicState ? 'ON' : 'OFF'}`, 2000);
            }
            
            // Pause menu controls
            if (this.gameState === 'paused') {
                if (e.code === 'KeyQ') {
                    e.preventDefault();
                    this.quitToTitle();
                }
            }
            
            // Title screen controls
            if (this.gameState === 'title') {
                // Enter/Space - start new game
                if (e.code === 'Enter' || e.code === 'Space') {
                    e.preventDefault();
                    this.startNewGame();
                }
            }
            
            // Game over screen controls - any key returns to title
            if (this.gameState === 'gameover') {
                e.preventDefault();
                this.quitToTitle();
            }
            
            // Win screen controls - any key returns to title
            if (this.gameState === 'win') {
                e.preventDefault();
                this.quitToTitle();
            }
            
            if (e.code === 'F1') {
                e.preventDefault();
                window.DEBUG_MODE = !window.DEBUG_MODE;
                console.log('Debug mode:', window.DEBUG_MODE ? 'ON' : 'OFF');
            }
            
            // Zoom controls
            if (e.code === 'Equal' || e.code === 'NumpadAdd') {  // + key
                e.preventDefault();
                this.zoom = Math.min(3, this.zoom + 0.25);
                console.log('Zoom:', this.zoom + 'x');
            }
            if (e.code === 'Minus' || e.code === 'NumpadSubtract') {  // - key
                e.preventDefault();
                this.zoom = Math.max(0.5, this.zoom - 0.25);
                console.log('Zoom:', this.zoom + 'x');
            }
            
            // Weapon controls 
            if (this.inventory) {
                // Number keys for weapon selection
                if (e.code === 'Digit1') {  // 1 key - Sword
                    e.preventDefault();
                    this.inventory.selectWeapon('sword');
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
                }
                if (e.code === 'Digit2') {  // 2 key - Magic Staff
                    e.preventDefault();
                    this.inventory.selectWeapon('staff');
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
                }
                
                // Debug: F2 key for tileset coordinate testing
                if (e.code === 'F2') {
                    e.preventDefault();
                    this.testTilesetCoordinates();
                }
                // E key armor cycling removed - armor must be found in the world
            }
        });
        
        document.addEventListener('keyup', (e) => {
            // Track all key states
            this.keys[e.code] = false;
            
            // Update player keys if in game
            if (this.player && this.gameState === 'playing') {
                this.player.keys[e.code] = false;
            }
            
            // Prevent default behavior for space key
            if (e.code === 'Space') {
                e.preventDefault();
            }
        });
    }

    onSpritesLoaded() {
        console.log('✅ Sprites loaded, ready to show title screen...');
        this.errorMessage = ''; // Clear any previous error messages
        
        // Start render loop to show title screen
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
        
        console.log('🎮 Title screen ready! Press ENTER or SPACE to start');
    }
    
    gameLoop(currentTime = performance.now()) {
        if (!this.isRunning) return;
        
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        // Update FPS counter
        this.updateFPS(deltaTime);
        
        // Update game objects
        this.update(deltaTime);
        
        // Render everything
        this.render();
        
        // Continue loop
        requestAnimationFrame((time) => this.gameLoop(time));
    }

    updateFPS(deltaTime) {
        this.frameCount++;
        this.fpsTimer += deltaTime;
        
        if (this.fpsTimer >= 1000) { // Every second
            this.fps = Math.round(this.frameCount * 1000 / this.fpsTimer);
            this.frameCount = 0;
            this.fpsTimer = 0;
        }
    }

    update(deltaTime) {
        // Only update game logic when playing
        if (this.gameState === 'playing' && this.player && this.gameMap) {
            this.player.update(deltaTime, this.gameMap);
            
            // Check for room transitions using new room system
            if (this.roomManager) {
                const exit = this.roomManager.checkExits(this.player.x, this.player.y);
                if (exit) {
                    const newSpawn = this.roomManager.handleRoomTransition(exit);
                    if (newSpawn) {
                        this.player.x = newSpawn.x;
                        this.player.y = newSpawn.y;
                        this.gameMap = this.roomManager.getCurrentRoom(); // Update current room reference
                    }
                }
            } else {
                // Fallback to old system
                const roomTransition = this.gameMap.checkRoomTransition(this.player.x, this.player.y);
                if (roomTransition) {
                    this.changeRoom(roomTransition.targetRoom, roomTransition.targetX, roomTransition.targetY);
                }
            }
            
            // Check for item collection
            const collectedItem = this.gameMap.checkItemCollection(this.player.x, this.player.y);
            if (collectedItem) {
                this.collectItem(collectedItem);
            }
        }
        
        // Update projectiles and fire tiles only when playing
        if (this.gameState === 'playing') {
            this.updateProjectiles(deltaTime);
            this.updateEnemies(deltaTime);
            
            // Update animals if room supports them
            this.updateAnimals(deltaTime);
            
            this.checkCombat();
            
            // Check for win condition (all wolves defeated)
            this.checkWinCondition();
            
            // Update fire tiles (remove expired ones)
            if (this.gameMap && this.gameMap.updateFireTiles) {
                this.gameMap.updateFireTiles(deltaTime);
            }
        }
        
        // Update world mouse coordinates for aiming
        this.updateWorldMouseCoordinates();
        
        // Update debug info
        if (window.DEBUG_MODE && this.debugElement) {
            this.debugElement.innerHTML = `
                FPS: ${this.fps}<br>
                Player: (${Math.round(this.player.x)}, ${Math.round(this.player.y)})<br>
                Direction: ${this.player.direction}<br>
                Moving: ${this.player.isMoving}<br>
                Frame: ${this.player.animationFrame}
            `;
        } else if (this.debugElement) {
            this.debugElement.innerHTML = '';
        }
    }
    
    updateProjectiles(deltaTime) {
        // Update all projectiles
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            const explosionData = projectile.update(deltaTime, this.gameMap);
            
            // Handle explosion effects
            if (explosionData && explosionData.createFireTiles) {
                this.gameMap.createFireTiles(explosionData.x, explosionData.y, explosionData.radius);
            }
            
            // Remove inactive projectiles
            if (!projectile.active) {
                this.projectiles.splice(i, 1);
            }
        }
    }

    updateEnemies(deltaTime) {
        // Enemies are now managed by the room via updateAnimals()
        // This method is kept for backward compatibility but does nothing
        // since this.enemies is now always empty
    }
    
    updateAnimals(deltaTime) {
        // Update animals if current room has them
        if (this.gameMap && this.gameMap.updateAnimals && typeof this.gameMap.updateAnimals === 'function') {
            this.gameMap.updateAnimals(deltaTime, this.player);
        }
    }
    
    checkWinCondition() {
        // Check if all wolves are defeated
        if (this.gameMap && this.gameMap.animals) {
            const remainingWolves = this.gameMap.animals.filter(animal => !animal.isDead);
            if (remainingWolves.length === 0) {
                console.log('🎉 All wolves defeated! You win!');
                this.gameState = 'win';
            }
        }
    }
    
    renderAnimals(camera) {
        // Render animals if current room has them
        if (this.gameMap && this.gameMap.renderAnimals && typeof this.gameMap.renderAnimals === 'function') {
            this.gameMap.renderAnimals(this.ctx, camera);
        }
    }

    checkCombat() {
        if (!this.player) return;
        
        // === SWORD COMBAT ===
        if (this.player.isSwinging && !this.player.hasHitThisSwing) {
            const currentWeapon = this.inventory ? this.inventory.getCurrentWeapon() : null;
            
            // Get enemies from room's animals array
            const allEnemies = (this.gameMap && this.gameMap.animals) ? this.gameMap.animals : [];
            
            console.log('⚔️ Checking sword combat - Weapon:', currentWeapon ? currentWeapon.id : 'none', 'Total enemies:', allEnemies.length);
            const swordReach = 4 * 24; // Sword reach: 4 tiles (96 pixels)
            
            for (let i = allEnemies.length - 1; i >= 0; i--) {
                const enemy = allEnemies[i];
                if (enemy.isDead) continue;
                
                // Calculate distance to enemy
                const dx = enemy.x - this.player.x;
                const dy = enemy.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                console.log(`🎯 Checking enemy ${i}: Distance ${distance.toFixed(1)}, dx: ${dx.toFixed(1)}, dy: ${dy.toFixed(1)}`);
                
                // Check if enemy is in sword range
                if (distance <= swordReach) {
                    console.log(`📏 Enemy in range! Distance: ${distance.toFixed(1)}, Direction: ${this.player.direction}, dx: ${dx.toFixed(1)}, dy: ${dy.toFixed(1)}`);
                    // Simplified: if in range, you can hit them regardless of direction
                    let inRange = true; // Hit anything within sword reach
                    
                    // Optional: Still check if generally in front (very lenient)
                    // const threshold = 200; // Very wide angle threshold
                    // switch (this.player.direction) {
                    //     case 'up':
                    //         inRange = dy < threshold;
                    //         break;
                    //     case 'down':
                    //         inRange = dy > -threshold;
                    //         break;
                    //     case 'left':
                    //         inRange = dx < threshold;
                    //         break;
                    //     case 'right':
                    //         inRange = dx > -threshold;
                    //         break;
                    // }
                    
                    if (inRange) {
                        // Deal damage based on enemy type
                        console.log(`⚔️ SWORD HIT! Enemy: ${enemy.constructor.name} at (${enemy.x}, ${enemy.y}), Distance: ${distance.toFixed(1)}`);
                        console.log(`   Health before: ${enemy.health}, isDead: ${enemy.isDead}`);
                        console.log(`   Has takeSwordHit: ${!!enemy.takeSwordHit}, Has takeDamage: ${!!enemy.takeDamage}`);
                        
                        if (enemy.takeSwordHit) {
                            enemy.takeSwordHit(this.player);
                        } else if (enemy.takeDamage) {
                            enemy.takeDamage(30, this.player.x, this.player.y);
                        }
                        
                        console.log(`   Health after: ${enemy.health}, isDead: ${enemy.isDead}`);
                        
                        // Mark that we hit an enemy this swing
                        this.player.hasHitThisSwing = true;
                        break;
                    }
                }
            }
        }
        
        // === PROJECTILE COMBAT ===
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (!projectile.active) continue;
            
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (enemy.isDead) continue;
                
                // Check collision between projectile and enemy
                if (projectile.checkCollision && projectile.checkCollision(enemy)) {
                    console.log(`🔥 ${projectile.isCharged ? 'CHARGED' : 'Normal'} fireball hit enemy!`);
                    
                    // Deal fireball damage to enemy
                    if (enemy.takeFireballHit) {
                        enemy.takeFireballHit(this.player, projectile.isCharged);
                    } else if (enemy.takeDamage) {
                        const damage = projectile.isCharged ? 48 : 21;
                        enemy.takeDamage(damage, projectile.x, projectile.y);
                    }
                    
                    // Remove projectile
                    projectile.active = false;
                    
                    // Create explosion if charged fireball
                    if (projectile.isCharged) {
                        this.createExplosion(projectile.x, projectile.y, projectile.explosionRadius);
                        
                        // Damage other nearby enemies
                        for (let k = 0; k < this.enemies.length; k++) {
                            if (k === j) continue; // Skip the enemy already hit
                            
                            const otherEnemy = this.enemies[k];
                            if (otherEnemy.isDead) continue;
                            
                            const distance = Math.sqrt(
                                Math.pow(otherEnemy.x - projectile.x, 2) + 
                                Math.pow(otherEnemy.y - projectile.y, 2)
                            );
                            
                            if (distance <= projectile.explosionRadius) {
                                if (otherEnemy.takeFireballHit) {
                                    otherEnemy.takeFireballHit(this.player, true);
                                } else if (otherEnemy.takeDamage) {
                                    otherEnemy.takeDamage(48, projectile.x, projectile.y);
                                }
                                console.log(`💥 Explosion damaged nearby enemy!`);
                            }
                        }
                    }
                    
                    break; // Projectile can only hit one enemy directly
                }
            }
        }
    }

    createExplosion(x, y, radius) {
        // Visual feedback
        console.log(`💥 Explosion at (${Math.round(x)}, ${Math.round(y)}) with radius ${radius}`);
    }

    render() {
        try {
            // Clear canvas
            this.ctx.fillStyle = '#1a1a1a';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Pixel-perfect rendering settings
            this.ctx.imageSmoothingEnabled = false;
            this.ctx.webkitImageSmoothingEnabled = false;
            this.ctx.mozImageSmoothingEnabled = false;
            this.ctx.msImageSmoothingEnabled = false;
            
            // Render based on game state
            if (this.gameState === 'title') {
                this.renderTitleScreen();
                return;
            } else if (this.gameState === 'paused') {
                this.renderGameWorld();
                this.renderPauseMenu();
                return;
            } else if (this.gameState === 'gameover') {
                this.renderGameOverScreen();
                return;
            } else if (this.gameState === 'win') {
                this.renderWinScreen();
                return;
            }
            
            // Default: render playing state
            this.renderGameWorld();
        
        } catch (error) {
            console.error('❌ Render error:', error);
            this.errorMessage = `Render Error: ${error.message}`;
        }
        
        // Always render error messages or debug info if needed
        this.renderDebugInfo();
    }
    
    renderGameWorld() {
        // Apply zoom transformation
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        
        // Calculate camera position to center on player
        const camera = this.calculateCameraPosition();
        
        this.ctx.translate(camera.x, camera.y);
        
        // Render game map
        if (this.gameMap) {
            this.gameMap.render(this.ctx);
        }
        
        // Render animals (behind player but above ground)
        this.renderAnimals(camera);
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render enemies
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx, camera);
        });
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        // Render mouse target indicator (debug/aiming aid)
        if (this.player && this.inventory) {
            const currentWeapon = this.inventory.getCurrentWeapon();
            if (currentWeapon.id === 'staff') {
                this.renderMouseTarget(this.ctx);
            }
        }
        
        this.ctx.restore();
        
        // Render UI overlay (not zoomed)
        this.renderUI();
    }
    
    renderTitleScreen() {
        // Background image or gradient fallback
        if (this.titleBackground && this.titleBackground.complete) {
            // Draw the background image, scaled to fit the canvas
            this.ctx.drawImage(this.titleBackground, 0, 0, this.canvas.width, this.canvas.height);
            
            // Add subtle dark overlay for better text readability
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            // Fallback: Dark blue gradient background
            const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
            gradient.addColorStop(0, '#0a0a1a');
            gradient.addColorStop(1, '#1a1a3a');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // Title text (removed llama emoji)
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.strokeStyle = '#cc7700';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText('LLAMA KNIGHT', this.canvas.width / 2, 200);
        this.ctx.fillText('LLAMA KNIGHT', this.canvas.width / 2, 200);
        
        // Subtitle
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = 'italic 32px Arial';
        this.ctx.fillText('Adventure Awaits', this.canvas.width / 2, 260);
        
        // Instructions
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('Press ENTER or SPACE to Start New Game', this.canvas.width / 2, 380);
        
        // Game info
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('• Explore magical worlds with your trusty llama knight', this.canvas.width / 2, 480);
        this.ctx.fillText('• Collect armor and magical staffs', this.canvas.width / 2, 510);
        this.ctx.fillText('• Cast powerful charged fireballs', this.canvas.width / 2, 540);
        this.ctx.fillText('• Use WASD to move, Mouse to aim & shoot', this.canvas.width / 2, 570);
        this.ctx.fillText('• Press M to toggle music, ESC to pause', this.canvas.width / 2, 600);
        
        // Version info
        this.ctx.fillStyle = '#555555';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('v1.0 - Press F1 for debug mode', this.canvas.width / 2, this.canvas.height - 20);
    }
    
    renderPauseMenu() {
        // Semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Menu background
        const menuWidth = 400;
        const menuHeight = 300;
        const menuX = (this.canvas.width - menuWidth) / 2;
        const menuY = (this.canvas.height - menuHeight) / 2;
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(menuX, menuY, menuWidth, menuHeight);
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 4;
        this.ctx.strokeRect(menuX, menuY, menuWidth, menuHeight);
        
        // Menu title
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 32px Arial';
        this.ctx.fillText('GAME PAUSED', this.canvas.width / 2, menuY + 60);
        
        // Menu options
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ecf0f1';
        this.ctx.fillText('ESC - Resume Game', this.canvas.width / 2, menuY + 120);
        this.ctx.fillText('Q - Quit to Title', this.canvas.width / 2, menuY + 160);
        
        // Instructions
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillText('Press the corresponding key to select an option', this.canvas.width / 2, menuY + 200);
    }
    
    renderGameOverScreen() {
        // Dark red overlay
        this.ctx.fillStyle = 'rgba(50, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Game over panel
        const panelWidth = 500;
        const panelHeight = 350;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;
        
        // Panel background
        this.ctx.fillStyle = '#2c1810';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#5d4037';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Inner border
        this.ctx.strokeStyle = '#8d6e63';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX + 10, panelY + 10, panelWidth - 20, panelHeight - 20);
        
        // Game Over title
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#d32f2f';
        this.ctx.font = 'bold 48px Arial';
        this.ctx.strokeStyle = '#b71c1c';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('GAME OVER', this.canvas.width / 2, panelY + 80);
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, panelY + 80);
        
        // Death message
        this.ctx.fillStyle = '#ffcccc';
        this.ctx.font = 'italic 24px Arial';
        this.ctx.fillText('The Llama Knight has fallen...', this.canvas.width / 2, panelY + 130);
        
        // Options
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillText('Press ANY KEY to return to Title Screen', this.canvas.width / 2, panelY + 190);
        
        // Instructions
        this.ctx.fillStyle = '#999999';
        this.ctx.font = '18px Arial';
        this.ctx.fillText('You can start a new adventure from the main menu', this.canvas.width / 2, panelY + 230);
        
        // Auto-return countdown
        if (!this.gameOverStartTime) {
            this.gameOverStartTime = Date.now();
        }
        const timeLeft = Math.max(0, 10 - Math.floor((Date.now() - this.gameOverStartTime) / 1000));
        
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`Automatically returning to title in ${timeLeft} seconds...`, this.canvas.width / 2, panelY + 280);
        
        // Auto-return after 10 seconds
        if (timeLeft <= 0) {
            this.quitToTitle();
        }
    }
    
    renderWinScreen() {
        // Golden overlay
        this.ctx.fillStyle = 'rgba(50, 40, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Victory panel
        const panelWidth = 600;
        const panelHeight = 400;
        const panelX = (this.canvas.width - panelWidth) / 2;
        const panelY = (this.canvas.height - panelHeight) / 2;
        
        // Panel background
        this.ctx.fillStyle = '#1a2a10';
        this.ctx.fillRect(panelX, panelY, panelWidth, panelHeight);
        this.ctx.strokeStyle = '#4d7c0f';
        this.ctx.lineWidth = 6;
        this.ctx.strokeRect(panelX, panelY, panelWidth, panelHeight);
        
        // Inner border
        this.ctx.strokeStyle = '#84cc16';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(panelX + 10, panelY + 10, panelWidth - 20, panelHeight - 20);
        
        // Victory title
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.font = 'bold 56px Arial';
        this.ctx.strokeStyle = '#d97706';
        this.ctx.lineWidth = 3;
        this.ctx.strokeText('VICTORY!', this.canvas.width / 2, panelY + 90);
        this.ctx.fillText('VICTORY!', this.canvas.width / 2, panelY + 90);
        
        // Victory message
        this.ctx.fillStyle = '#d9f99d';
        this.ctx.font = 'italic 26px Arial';
        this.ctx.fillText('All wolves have been defeated!', this.canvas.width / 2, panelY + 150);
        
        // Success message
        this.ctx.fillStyle = '#a3e635';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillText('The Llama Knight stands victorious!', this.canvas.width / 2, panelY + 200);
        
        // Player stats
        if (this.player) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Final Level: ${this.player.level}`, this.canvas.width / 2, panelY + 250);
            this.ctx.fillText(`Total XP: ${this.player.xp}`, this.canvas.width / 2, panelY + 280);
        }
        
        // Return instruction
        this.ctx.fillStyle = '#fde047';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.fillText('Press ANY KEY to return to Title Screen', this.canvas.width / 2, panelY + 340);
    }
    
    renderMouseTarget(ctx) {
        // Show where the mouse is pointing in world coordinates
        if (this.worldMouseX && this.worldMouseY) {
            ctx.save();
            
            // Draw a crosshair at the mouse position
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.7;
            
            // Crosshair lines
            const size = 10;
            ctx.beginPath();
            ctx.moveTo(this.worldMouseX - size, this.worldMouseY);
            ctx.lineTo(this.worldMouseX + size, this.worldMouseY);
            ctx.moveTo(this.worldMouseX, this.worldMouseY - size);
            ctx.lineTo(this.worldMouseX, this.worldMouseY + size);
            ctx.stroke();
            
            // Small circle in center
            ctx.beginPath();
            ctx.arc(this.worldMouseX, this.worldMouseY, 3, 0, Math.PI * 2);
            ctx.stroke();
            
            // Draw line from staff to target (if charging)
            if (this.player && this.player.isCharging) {
                const staffPos = this.player.getStaffWorldPosition();
                ctx.strokeStyle = '#ff4444';
                ctx.lineWidth = 1;
                ctx.globalAlpha = 0.5;
                ctx.beginPath();
                ctx.moveTo(staffPos.x, staffPos.y);
                ctx.lineTo(this.worldMouseX, this.worldMouseY);
                ctx.stroke();
            }
            
            ctx.restore();
        }
    }
    
    renderDebugInfo() {
        if (this.errorMessage) {
            // Show error message prominently
            this.ctx.fillStyle = '#ff4444';
            this.ctx.fillRect(10, 10, this.canvas.width - 20, 120);
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.strokeRect(10, 10, this.canvas.width - 20, 120);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.fillText('🚨 ERROR DETECTED 🚨', 20, 35);
            this.ctx.font = '12px Arial';
            this.ctx.fillText(this.errorMessage, 20, 55);
            this.ctx.fillText('Check browser console (F12) for details', 20, 75);
            this.ctx.fillText('Try using a local server instead of file://', 20, 95);
            this.ctx.fillText('Or refresh the page', 20, 115);
        }
        
        // Show basic game status
        if (!this.errorMessage && this.player) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.7)';
            this.ctx.fillRect(10, 10, 200, 60);
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('✅ Game Running', 15, 25);
            this.ctx.fillText(`Player: ${Math.round(this.player.x)}, ${Math.round(this.player.y)}`, 15, 40);
            this.ctx.fillText(`FPS: ${this.fps}`, 15, 55);
        }
    }

    renderUI() {
        // Game border/frame (classic Zelda style)
        this.ctx.strokeStyle = '#34495e';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(1, 1, this.canvas.width - 2, this.canvas.height - 2);
        
        // Add subtle inner shadow
        this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(2, 2, this.canvas.width - 4, this.canvas.height - 4);
        
        // Render stamina bar
        this.renderStaminaBar();
        
        // Render health bar
        this.renderHealthBar();
        
        // Render message notifications
        if (this.messageText && this.messageTimer > 0) {
            const messageY = 100;
            const messageWidth = 300;
            const messageHeight = 60;
            const messageX = (this.canvas.width - messageWidth) / 2;
            
            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(messageX, messageY, messageWidth, messageHeight);
            
            // Border
            this.ctx.strokeStyle = '#ffaa00';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(messageX, messageY, messageWidth, messageHeight);
            
            // Text
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = 'bold 20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.messageText, this.canvas.width / 2, messageY + 35);
        }
    }
    
    renderStaminaBar() {
        if (!this.player) return;
        
        // Stamina bar properties
        const barWidth = 200;
        const barHeight = 12;
        const barX = 20; // Left side of screen
        const barY = 50; // Below any existing UI
        
        // Background bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Stamina fill (color changes based on stamina level)
        const staminaPercent = this.player.currentStamina / this.player.maxStamina;
        const fillWidth = barWidth * staminaPercent;
        
        // Choose color based on stamina level
        let fillColor;
        if (staminaPercent > 0.6) {
            fillColor = '#00ff88'; // Green - good stamina
        } else if (staminaPercent > 0.3) {
            fillColor = '#ffaa00'; // Orange - medium stamina
        } else {
            fillColor = '#ff4444'; // Red - low stamina
        }
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(barX + 1, barY + 1, fillWidth - 2, barHeight - 2);
        
        // Stamina text label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('STAMINA', barX, barY - 5);
        
        // Stamina value text (optional)
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${Math.ceil(this.player.currentStamina)}/${this.player.maxStamina}`, barX + barWidth, barY - 5);
    }

    renderHealthBar() {
        if (!this.player) return;
        
        // Health bar properties
        const barWidth = 200;
        const barHeight = 12;
        const barX = 20; // Left side of screen, same as stamina
        const barY = 25; // Above stamina bar
        
        // Background bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        // Border
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        // Health fill (color changes based on health level)
        const healthPercent = this.player.currentHealth / this.player.maxHealth;
        const fillWidth = barWidth * healthPercent;
        
        let fillColor;
        if (healthPercent > 0.6) {
            fillColor = '#ff4444'; // Red - health (classic Zelda style)
        } else if (healthPercent > 0.3) {
            fillColor = '#ff6666'; // Light red - medium health
        } else {
            fillColor = '#ff8888'; // Lighter red - low health
        }
        
        // Flash when hurt
        if (this.player.hurtTimer > 0) {
            fillColor = '#ffffff'; // Flash white when taking damage
        }
        
        this.ctx.fillStyle = fillColor;
        this.ctx.fillRect(barX + 1, barY + 1, fillWidth - 2, barHeight - 2);
        
        // Health text label
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('HEALTH', barX, barY - 5);
        
        // Health value text
        this.ctx.font = '10px Arial';
        this.ctx.fillStyle = '#cccccc';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`${Math.ceil(this.player.currentHealth)}/${this.player.maxHealth}`, barX + barWidth, barY - 5);
    }

    // Public methods for game control
    pause() {
        this.isRunning = false;
        console.log('⏸️ Game paused');
    }

    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            console.log('▶️ Game resumed');
        }
    }

    toggleDebug() {
        window.DEBUG_MODE = !window.DEBUG_MODE;
        return window.DEBUG_MODE;
    }

    changeRoom(roomName, targetX, targetY) {
        if (this.rooms[roomName]) {
            console.log(`🚪 Entering ${roomName} room`);
            this.currentRoom = roomName;
            this.gameMap = this.rooms[roomName];
            this.player.x = targetX;
            this.player.y = targetY;
            
            // Respawn enemies for the new room
            this.spawnEnemies();
        }
    }

    collectItem(item) {
        console.log(`? Collected ${item.type}!`);
        
        if (item.type === 'magic_staff' || item.type === 'staff') {
            this.inventory.addItem('staff');
            this.inventory.currentWeaponIndex = this.inventory.weapons.findIndex(w => w.id === 'staff');
            this.player.equipMagicStaff();
            console.log('?? Magic Staff added to inventory!');
        } else if (item.type === 'sword') {
            this.inventory.addItem('sword');
            this.inventory.currentWeaponIndex = this.inventory.weapons.findIndex(w => w.id === 'sword');
            this.player.equipSword();
            console.log('?? Sword added to inventory!');
        }
    }
    
    spawnEnemies() {
        // Don't spawn enemies here - let the room handle it via animals array
        this.enemies = []; // Clear existing enemies
        
        // Enemies are now spawned by the room classes (MainRoom, ForestRoom, etc.)
        // and accessed via this.gameMap.animals
        console.log('📍 Enemies will be managed by room.animals array');
        
        console.log(`✅ Spawned ${this.enemies.length} NPCs in ${this.currentRoom} room`);
    }


    


    
    startNewGame() {
        // Reset to initial game state
        this.gameState = 'playing';
        
        // Reset weapon selection for new playthrough
        if (this.spriteLoader && this.spriteLoader.resetSwordSelection) {
            this.spriteLoader.resetSwordSelection();
        }
        
        try {
            // Initialize a fresh game - start in main room
            this.currentRoom = 'main';
            
            // Always recreate rooms to reset items and state
            console.log('📍 Creating fresh rooms...');
            
                        if (typeof RoomManager === 'undefined') {
                throw new Error('RoomManager not available');
            }

            // Use the room manager as the single source of rooms
            console.log('?? Using room system for new game...');
            this.roomManager = new RoomManager(this.spriteLoader);
            this.gameMap = this.roomManager.getCurrentRoom();
            
            // Create fresh player at spawn position
            const spawnPos = this.roomManager ? this.roomManager.getSpawnPosition() : this.gameMap.getSpawnPosition();
            this.player = new ZeldaPlayer(spawnPos.x, spawnPos.y, this.spriteLoader, this);
            
            // Create fresh inventory
            this.inventory = new ZeldaInventory(this.spriteLoader);
            
            // Connect systems
            this.player.inventory = this.inventory;
            
            // Clear projectiles and spawn enemies
            this.projectiles = [];
            this.spawnEnemies();
            
            console.log('🌟 New game started!');
            this.showMessage('New Adventure Begins!', 3000);
            
        } catch (error) {
            console.error('❌ Error starting new game:', error);
            this.gameState = 'title';
            this.showMessage('Failed to start game!', 3000);
        }
    }
    
    quitToTitle() {
        this.gameState = 'title';
        
        // Reset game objects but preserve sprite assets and rooms
        this.player = null;
        this.gameMap = null;
        this.inventory = null;
        this.projectiles = [];
        this.currentRoom = 'main'; // Reset to main room for next game
        
        // Don't clear rooms - reuse them for performance
        // this.rooms = {}; // REMOVED - keep rooms for next game
        
        // Reset game over timer
        this.gameOverStartTime = null;
        
        console.log('🏠 Returned to title screen');
    }
    
    // Debug method to test tileset coordinates
    testTilesetCoordinates() {
        if (!this.spriteLoader || !this.spriteLoader.tilesetLoaded) {
            console.log('❌ Tileset not loaded yet!');
            return;
        }
        
        console.log('🔍 Testing tileset coordinates...');
        
        // Test extracting tiles from different coordinates
        const testCoords = [
            { x: 0, y: 0, name: 'Top-left' },
            { x: 1, y: 0, name: 'Second tile' },
            { x: 0, y: 1, name: 'Second row' },
            { x: 5, y: 5, name: 'Middle area' },
            { x: 10, y: 10, name: 'Further out' }
        ];
        
        testCoords.forEach(coord => {
            const tile = this.spriteLoader.getTileFromTileset(coord.x, coord.y);
            if (tile) {
                console.log(`✅ ${coord.name} (${coord.x}, ${coord.y}): Extracted successfully`);
                
                // Create a temporary debug display
                const debugDiv = document.createElement('div');
                debugDiv.style.cssText = `
                    position: fixed; 
                    top: ${50 + coord.y * 60}px; 
                    left: ${50 + coord.x * 60}px; 
                    background: rgba(0,0,0,0.8); 
                    color: white; 
                    padding: 5px; 
                    border: 1px solid white;
                    font-size: 12px;
                    z-index: 1000;
                `;
                debugDiv.innerHTML = `${coord.name}<br>(${coord.x}, ${coord.y})`;
                
                const canvas = document.createElement('canvas');
                canvas.width = 48;
                canvas.height = 48;
                canvas.style.display = 'block';
                const ctx = canvas.getContext('2d');
                ctx.drawImage(tile, 0, 0, 48, 48);
                
                debugDiv.appendChild(canvas);
                document.body.appendChild(debugDiv);
                
                // Remove after 5 seconds
                setTimeout(() => {
                    if (debugDiv.parentNode) {
                        debugDiv.parentNode.removeChild(debugDiv);
                    }
                }, 5000);
            } else {
                console.log(`❌ ${coord.name} (${coord.x}, ${coord.y}): Failed to extract`);
            }
        });
    }
    
    showMessage(text, duration = 3000) {
        this.messageText = text;
        this.messageTimer = duration;
        
        // Clear message after duration
        setTimeout(() => {
            this.messageText = '';
            this.messageTimer = 0;
        }, duration);
    }
    
    // =====================================================
    // AUDIO SYSTEM
    // =====================================================
    
    initAudio() {
        console.log('🎵 Initializing audio system...');
        
        try {
            // Create audio element for background music
            this.backgroundMusic = new Audio('assets/audio/video game music for luke - 9_25_25, 22.43.m4a');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = this.musicVolume;
            
            // Add event listeners
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('🎵 Background music loaded and ready to play');
            });
            
            this.backgroundMusic.addEventListener('error', (e) => {
                console.error('❌ Error loading background music:', e);
            });
            
            console.log('✅ Audio system initialized');
        } catch (error) {
            console.error('❌ Failed to initialize audio system:', error);
        }
    }
    
    startBackgroundMusic() {
        if (this.backgroundMusic && this.isMusicEnabled) {
            try {
                const playPromise = this.backgroundMusic.play();
                
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('🎵 Background music started');
                    }).catch((error) => {
                        console.warn('⚠️ Autoplay prevented - music will start on user interaction:', error);
                    });
                }
            } catch (error) {
                console.error('❌ Error starting background music:', error);
            }
        }
    }
    
    stopBackgroundMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
            console.log('🔇 Background music stopped');
        }
    }
    
    toggleMusic() {
        this.isMusicEnabled = !this.isMusicEnabled;
        
        if (this.isMusicEnabled) {
            this.startBackgroundMusic();
        } else {
            this.stopBackgroundMusic();
        }
        
        console.log(`🎵 Music ${this.isMusicEnabled ? 'enabled' : 'disabled'}`);
        return this.isMusicEnabled;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1
        
        if (this.backgroundMusic) {
            this.backgroundMusic.volume = this.musicVolume;
        }
        
        console.log(`🔊 Music volume set to ${Math.round(this.musicVolume * 100)}%`);
    }
}
