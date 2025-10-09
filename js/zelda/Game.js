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
        this.gameState = 'title';           // Current state: 'title', 'playing', 'paused', 'gameover'
        this.isRunning = false;             // Whether game loop is active
        this.lastTime = 0;                  // Timestamp of last frame (for delta time calculation)
        this.fps = 0;                       // Current frames per second
        this.frameCount = 0;                // Total frames rendered (for FPS calculation)
        this.fpsTimer = 0;                  // Timer for FPS updates
        
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
        this.gameMap = null;                // Current room's tile map
        this.player = null;                 // Player character object
        this.inventory = null;              // Player's inventory system
        this.projectiles = [];              // Array of active projectiles (magic staff shots, etc.)
        this.particleSystem = null;         // Visual effects system
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
        
        // Background images
        this.titleBackground = null;
        
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
        this.spriteLoader = new SpriteLoader();
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
            // Center camera on player
            cameraX = (this.canvas.width / this.zoom / 2) - this.player.x;
            cameraY = (this.canvas.height / this.zoom / 2) - this.player.y;
            
            // Clamp camera to map boundaries (same as render method)
            const mapWidth = this.gameMap.width * this.gameMap.tileSize;
            const mapHeight = this.gameMap.height * this.gameMap.tileSize;
            
            cameraX = Math.min(0, Math.max(cameraX, (this.canvas.width / this.zoom) - mapWidth));
            cameraY = Math.min(0, Math.max(cameraY, (this.canvas.height / this.zoom) - mapHeight));
        }
        
        return { x: cameraX, y: cameraY };
    }
    
    updateWorldMouseCoordinates() {
        if (!this.player) return;
        
        // Get the actual camera position used in rendering
        const camera = this.calculateCameraPosition();
        
        // Convert screen coordinates to world coordinates
        this.worldMouseX = (this.mouseX / this.zoom) - camera.x;
        this.worldMouseY = (this.mouseY / this.zoom) - camera.y;
    }
    
    handleMouseDown() {
        if (!this.player || !this.inventory) return;
        
        // Only charge if staff is equipped
        const currentWeapon = this.inventory.getCurrentWeapon();
        console.log('🔍 Mouse down - Current weapon:', currentWeapon.id, currentWeapon.name);
        if (currentWeapon.id !== 'staff') {
            console.log('❌ Cannot charge - staff not equipped!');
            return;
        }
        
        // Start charging the staff
        console.log('⚡ Starting staff charge...');
        this.player.startCharging();
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
        
        console.log('🔥 Shooting fireball with charge info:', chargeInfo);
        
        // Calculate staff position based on player's facing direction
        const staffOffset = this.player.getStaffWorldPosition();
        
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
            
            // Pause menu controls
            if (this.gameState === 'paused') {
                if (e.code === 'KeyS') {
                    e.preventDefault();
                    this.saveGame();
                }
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
                    this.startGame();
                }
                // L key - load saved game
                if (e.code === 'KeyL') {
                    e.preventDefault();
                    if (this.loadAndStartGame()) {
                        console.log('Loading saved game...');
                    } else {
                        this.showMessage('No Save Found!', 2000);
                    }
                }
            }
            
            // Game over screen controls
            if (this.gameState === 'gameover') {
                // R key - restart from last save
                if (e.code === 'KeyR') {
                    e.preventDefault();
                    this.restartFromSave();
                }
                // Q key - quit to title screen
                if (e.code === 'KeyQ') {
                    e.preventDefault();
                    this.quitToTitle();
                }
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
            
            // Inventory controls (only if inventory exists)
            if (this.inventory) {
                if (e.code === 'KeyI') {  // I key - toggle inventory
                    e.preventDefault();
                    this.inventory.toggle();
                }
                
                // Number keys for weapon selection
                if (e.code === 'Digit1') {  // 1 key - No weapon
                    e.preventDefault();
                    this.inventory.selectWeapon('none');
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
                }
                if (e.code === 'Digit2') {  // 2 key - Sword
                    e.preventDefault();
                    this.inventory.selectWeapon('sword');
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
                }
                if (e.code === 'Digit3') {  // 3 key - Magic Staff
                    e.preventDefault();
                    this.inventory.selectWeapon('staff');
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
                }
                
                // Debug: F2 key for tileset coordinate testing
                if (e.code === 'F2') {
                    e.preventDefault();
                    this.testTilesetCoordinates();
                }
                
                if (e.code === 'KeyQ') {  // Q key - cycle weapon (backup)
                    e.preventDefault();
                    this.inventory.cycleWeapon();
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
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
    
    startGame() {
        console.log('🎮 Starting new game...');
        this.gameState = 'playing';
        
        try {
            // Create rooms
            console.log('📍 Creating main room...');
            this.rooms['main'] = new ZeldaGameMap(this.spriteLoader, 'main');
            console.log('📍 Creating staff room...');
            this.rooms['staff_room'] = new ZeldaGameMap(this.spriteLoader, 'staff_room');
            console.log('📍 Creating forest room...');
            this.rooms['forest'] = new ZeldaGameMap(this.spriteLoader, 'forest');
            console.log('📍 Creating grove room...');
            this.rooms['grove'] = new ZeldaGameMap(this.spriteLoader, 'grove');
            console.log('📍 Creating orchard room...');
            this.rooms['orchard'] = new ZeldaGameMap(this.spriteLoader, 'orchard');
            this.gameMap = this.rooms[this.currentRoom];
            console.log('✅ All rooms created successfully');
            
            // Create player at spawn position
            console.log('🦙 Creating player...');
            const spawnPos = this.gameMap.getSpawnPosition();
            this.player = new ZeldaPlayer(spawnPos.x, spawnPos.y, this.spriteLoader);
            console.log('✅ Player created at:', spawnPos.x, spawnPos.y);
            
            // Create inventory system
            console.log('🎒 Creating inventory...');
            this.inventory = new ZeldaInventory(this.spriteLoader);
            
            // Create particle system
            console.log('✨ Creating particle system...');
            this.particleSystem = new ParticleSystem();
            
            // Connect player to inventory and particle system
            this.player.inventory = this.inventory;
            this.player.particleSystem = this.particleSystem;
            console.log('✅ Inventory and particle system connected to player');
            
            // Spawn enemies
            console.log('👹 Spawning enemies...');
            this.spawnEnemies();
            
            console.log('🎯 Game started! Use WASD to move, ESC to pause');
            console.log('💡 Press F1 to toggle debug mode');
            
        } catch (error) {
            console.error('❌ Error starting game:', error);
            this.errorMessage = `Game Start Error: ${error.message}`;
        }
    }
    
    loadAndStartGame() {
        try {
            // Create rooms first
            console.log('📍 Creating main room...');
            this.rooms['main'] = new ZeldaGameMap(this.spriteLoader, 'main');
            console.log('📍 Creating staff room...');
            this.rooms['staff_room'] = new ZeldaGameMap(this.spriteLoader, 'staff_room');
            console.log('📍 Creating forest room...');
            this.rooms['forest'] = new ZeldaGameMap(this.spriteLoader, 'forest');
            console.log('📍 Creating grove room...');
            this.rooms['grove'] = new ZeldaGameMap(this.spriteLoader, 'grove');
            console.log('📍 Creating orchard room...');
            this.rooms['orchard'] = new ZeldaGameMap(this.spriteLoader, 'orchard');
            this.gameMap = this.rooms[this.currentRoom];
            
            // Create player and inventory (will be overwritten by load)
            const spawnPos = this.gameMap.getSpawnPosition();
            this.player = new ZeldaPlayer(spawnPos.x, spawnPos.y, this.spriteLoader);
            this.inventory = new ZeldaInventory(this.spriteLoader);
            this.particleSystem = new ParticleSystem();
            this.player.inventory = this.inventory;
            this.player.particleSystem = this.particleSystem;
            
            // Try to load saved data
            if (this.loadGame()) {
                // Successfully loaded - start playing
                this.gameState = 'playing';
                console.log('🎮 Loaded saved game successfully!');
                return true;
            }
            return false;
        } catch (error) {
            console.error('❌ Error loading game:', error);
            return false;
        }
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
            
            // Check for room transitions
            const roomTransition = this.gameMap.checkRoomTransition(this.player.x, this.player.y);
            if (roomTransition) {
                this.changeRoom(roomTransition.targetRoom, roomTransition.targetX, roomTransition.targetY);
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
            this.checkCombat();
            
            // Update fire tiles (remove expired ones)
            if (this.gameMap && this.gameMap.updateFireTiles) {
                this.gameMap.updateFireTiles(deltaTime);
            }
            
            // Update particle system
            if (this.particleSystem) {
                this.particleSystem.update(deltaTime);
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
        // Update each enemy
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player, this.gameMap);
            
            // Remove dead enemies
            if (enemy.aiState === 'dead' && enemy.health <= 0) {
                this.enemies.splice(i, 1);
                console.log('🪦 Dead enemy removed');
            }
        }
    }

    checkCombat() {
        if (!this.player || this.enemies.length === 0) return;
        
        // Check projectile vs enemy collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (!projectile.active) continue;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                if (enemy.aiState === 'dead') continue;
                
                // Check collision
                if (enemy.checkCollision(projectile.x - projectile.size/2, 
                                       projectile.y - projectile.size/2, 
                                       projectile.size, 
                                       projectile.size)) {
                    
                    console.log(`🎯 Projectile hit enemy! Damage: ${projectile.damage}`);
                    
                    // Deal damage to enemy
                    const enemyDied = enemy.takeDamage(projectile.damage, projectile.x, projectile.y);
                    
                    if (enemyDied) {
                        console.log('💀 Enemy defeated by projectile!');
                    }
                    
                    // Remove projectile
                    projectile.active = false;
                    
                    // Create explosion effect for charged fireballs
                    if (projectile.isCharged && projectile.explosionRadius > 0) {
                        this.createExplosion(projectile.x, projectile.y, projectile.explosionRadius);
                        
                        // Damage other nearby enemies
                        for (let k = 0; k < this.enemies.length; k++) {
                            if (k === j) continue; // Skip the enemy we already hit
                            const otherEnemy = this.enemies[k];
                            if (otherEnemy.aiState === 'dead') continue;
                            
                            const distance = Math.sqrt(
                                Math.pow(otherEnemy.x - projectile.x, 2) + 
                                Math.pow(otherEnemy.y - projectile.y, 2)
                            );
                            
                            if (distance <= projectile.explosionRadius) {
                                otherEnemy.takeDamage(Math.floor(projectile.damage * 0.7), projectile.x, projectile.y);
                            }
                        }
                    }
                    
                    break; // Projectile can only hit one enemy at a time
                }
            }
        }
    }

    updateEnemies(deltaTime) {
        // Update all enemies
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(deltaTime, this.player, this.gameMap);
            
            // Remove dead enemies
            if (enemy.aiState === 'dead') {
                console.log(`💀 ${enemy.type} defeated!`);
                this.enemies.splice(i, 1);
            }
        }
    }

    checkCombat() {
        if (!this.player) return;
        
        // Check projectile vs enemy collisions
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const projectile = this.projectiles[i];
            if (!projectile.active) continue;
            
            for (let j = 0; j < this.enemies.length; j++) {
                const enemy = this.enemies[j];
                if (enemy.aiState === 'dead') continue;
                
                // Check collision between projectile and enemy
                if (projectile.checkCollision(enemy)) {
                    // Deal damage to enemy
                    const died = enemy.takeDamage(projectile.damage, projectile.x, projectile.y);
                    
                    // Remove projectile
                    projectile.active = false;
                    
                    // Create explosion if charged fireball
                    if (projectile.isCharged) {
                        this.createExplosion(projectile.x, projectile.y, projectile.explosionRadius);
                        
                        // Damage other nearby enemies
                        for (let k = 0; k < this.enemies.length; k++) {
                            if (k === j) continue; // Skip the enemy already hit
                            
                            const otherEnemy = this.enemies[k];
                            if (otherEnemy.aiState === 'dead') continue;
                            
                            const distance = Math.sqrt(
                                Math.pow(otherEnemy.x - projectile.x, 2) + 
                                Math.pow(otherEnemy.y - projectile.y, 2)
                            );
                            
                            if (distance <= projectile.explosionRadius) {
                                const explosionDamage = Math.round(projectile.damage * 0.7); // 70% damage from explosion
                                otherEnemy.takeDamage(explosionDamage, projectile.x, projectile.y);
                                console.log(`💥 Explosion hit ${otherEnemy.type} for ${explosionDamage} damage!`);
                            }
                        }
                    }
                    
                    break; // Projectile can only hit one enemy directly
                }
            }
        }
    }

    createExplosion(x, y, radius) {
        // Create explosion particles
        if (this.particleSystem) {
            // Create a burst of explosion particles
            for (let i = 0; i < 20; i++) {
                const angle = (Math.PI * 2 * i) / 20;
                this.particleSystem.createWindBurst(x, y, 'explosion', 8);
            }
        }
        
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
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render enemies
        this.enemies.forEach(enemy => {
            enemy.render(this.ctx);
        });
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        // Render particles (wind effects, etc.)
        if (this.particleSystem) {
            this.particleSystem.render(this.ctx);
        }
        
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
        
        // Check if save exists
        const hasSave = localStorage.getItem('llamaKnightSave') !== null;
        if (hasSave) {
            this.ctx.fillStyle = '#88ff88';
            this.ctx.font = '20px Arial';
            this.ctx.fillText('Press L to Load Saved Game', this.canvas.width / 2, 420);
        }
        
        // Game info
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('• Explore magical worlds with your trusty llama knight', this.canvas.width / 2, 480);
        this.ctx.fillText('• Collect armor and magical staffs', this.canvas.width / 2, 510);
        this.ctx.fillText('• Cast powerful charged fireballs', this.canvas.width / 2, 540);
        this.ctx.fillText('• Use WASD to move, Mouse to aim & shoot', this.canvas.width / 2, 570);
        
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
        this.ctx.fillText('S - Save Game', this.canvas.width / 2, menuY + 160);
        this.ctx.fillText('Q - Quit to Title', this.canvas.width / 2, menuY + 200);
        
        // Instructions
        this.ctx.font = '14px Arial';
        this.ctx.fillStyle = '#bdc3c7';
        this.ctx.fillText('Press the corresponding key to select an option', this.canvas.width / 2, menuY + 240);
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
        this.ctx.fillText('R - Restart from Last Save', this.canvas.width / 2, panelY + 190);
        
        this.ctx.fillStyle = '#cccccc';
        this.ctx.font = '22px Arial';
        this.ctx.fillText('Q - Return to Title Screen', this.canvas.width / 2, panelY + 230);
        
        // Instructions
        this.ctx.fillStyle = '#999999';
        this.ctx.font = '16px Arial';
        this.ctx.fillText('Press the corresponding key to select an option', this.canvas.width / 2, panelY + 280);
        
        // Save status
        const hasSave = localStorage.getItem('llamaKnightSave') !== null;
        if (!hasSave) {
            this.ctx.fillStyle = '#ff9999';
            this.ctx.font = '14px Arial';
            this.ctx.fillText('(No save file found - restart will begin new game)', this.canvas.width / 2, panelY + 310);
        }
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
        
        // Render inventory
        if (this.inventory) {
            this.inventory.render(this.ctx, this.canvas.width, this.canvas.height);
        }
        
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
        console.log(`✨ Collected ${item.type}!`);
        
        if (item.type === 'magic_staff') {
            // Add to inventory and switch to it
            this.inventory.addItem('staff');
            this.inventory.currentWeaponIndex = this.inventory.weapons.findIndex(w => w.id === 'staff');
            console.log('🔮 Magic Staff added to inventory!');
        } else if (item.type === 'staff') {
            // Handle staff type (alternative naming)
            this.inventory.addItem('staff');
            this.inventory.currentWeaponIndex = this.inventory.weapons.findIndex(w => w.id === 'staff');
            console.log('🔮 Magic Staff added to inventory!');
        } else if (item.type === 'sword') {
            // Add sword to inventory and switch to it
            this.inventory.addItem('sword');
            this.inventory.currentWeaponIndex = this.inventory.weapons.findIndex(w => w.id === 'sword');
            this.player.equipSword(); // Also set the fallback flag
            console.log('⚔️ Sword added to inventory!');
        }
        // Add other item types here as needed
    }
    
    spawnEnemies() {
        this.enemies = []; // Clear existing enemies
        
        // Spawn animals in different rooms
        if (this.currentRoom === 'main') {
            // Main room - peaceful animals and a fox
            this.enemies.push(new ZeldaEnemy(200, 150, 'rabbit'));
            this.enemies.push(new ZeldaEnemy(400, 300, 'rabbit'));
            this.enemies.push(new ZeldaEnemy(150, 400, 'fox'));
        } else if (this.currentRoom === 'forest') {
            // Forest room - wild animals
            this.enemies.push(new ZeldaEnemy(120, 200, 'wolf'));
            this.enemies.push(new ZeldaEnemy(350, 180, 'rabbit'));
            this.enemies.push(new ZeldaEnemy(280, 350, 'fox'));
            this.enemies.push(new ZeldaEnemy(450, 250, 'wolf'));
        } else if (this.currentRoom === 'grove') {
            // Grove room - mixed forest animals
            this.enemies.push(new ZeldaEnemy(180, 180, 'fox'));
            this.enemies.push(new ZeldaEnemy(320, 280, 'rabbit'));
            this.enemies.push(new ZeldaEnemy(200, 350, 'bear'));
        } else if (this.currentRoom === 'orchard') {
            // Orchard room - bears protecting their territory
            this.enemies.push(new ZeldaEnemy(150, 200, 'bear'));
            this.enemies.push(new ZeldaEnemy(400, 200, 'wolf'));
            this.enemies.push(new ZeldaEnemy(275, 320, 'fox'));
        }
        // Staff room - keep it peaceful for now
        
        console.log(`✅ Spawned ${this.enemies.length} animals in ${this.currentRoom} room`);
    }
    
    saveGame() {
        try {
            const saveData = {
                playerX: this.player.x,
                playerY: this.player.y,
                playerHealth: this.player.currentHealth,
                playerMaxHealth: this.player.maxHealth,
                playerStamina: this.player.currentStamina,
                playerMaxStamina: this.player.maxStamina,
                currentRoom: this.currentRoom,
                playerHasArmor: this.player.hasArmor,
                playerHasStaff: this.player.hasMagicStaff,
                inventoryItems: this.inventory ? this.inventory.items : [],
                inventoryWeaponIndex: this.inventory ? this.inventory.currentWeaponIndex : 0,
                collectedItems: this.getAllCollectedItems(),
                saveTime: new Date().toISOString()
            };
            
            localStorage.setItem('llamaKnightSave', JSON.stringify(saveData));
            console.log('💾 Game saved successfully!', saveData);
            
            // Show save confirmation
            this.showMessage('Game Saved!', 2000);
            
        } catch (error) {
            console.error('❌ Error saving game:', error);
            this.showMessage('Save Failed!', 2000);
        }
    }
    
    validateSaveData(saveData) {
        if (!saveData) return false;
        
        // Check required fields
        const requiredFields = ['playerX', 'playerY', 'currentRoom'];
        for (let field of requiredFields) {
            if (saveData[field] === undefined) {
                console.warn(`❌ Save data missing required field: ${field}`);
                return false;
            }
        }
        
        // Check if the saved room exists
        if (this.rooms && !this.rooms[saveData.currentRoom]) {
            console.warn(`❌ Save data references unknown room: ${saveData.currentRoom}`);
            return false;
        }
        
        // Validate numeric values
        if (isNaN(saveData.playerX) || isNaN(saveData.playerY)) {
            console.warn('❌ Save data has invalid player coordinates');
            return false;
        }
        
        return true;
    }
    
    getAllCollectedItems() {
        const allCollectedItems = [];
        
        // Collect items from all rooms
        Object.keys(this.rooms).forEach(roomName => {
            const room = this.rooms[roomName];
            if (room && room.items) {
                room.items.filter(item => item.collected).forEach(item => {
                    allCollectedItems.push({
                        x: item.x,
                        y: item.y,
                        type: item.type,
                        room: roomName
                    });
                });
            }
        });
        
        return allCollectedItems;
    }
    
    loadGame() {
        try {
            const saveData = JSON.parse(localStorage.getItem('llamaKnightSave'));
            if (!saveData) {
                console.log('No save data found');
                return false;
            }
            
            // Validate save data
            if (!this.validateSaveData(saveData)) {
                console.error('❌ Invalid save data detected');
                this.showMessage('Save file corrupted!', 3000);
                return false;
            }
            
            console.log('📂 Loading valid save data:', saveData);
            
            // Restore player position
            this.player.x = saveData.playerX;
            this.player.y = saveData.playerY;
            
            // Restore player health and stamina
            if (saveData.playerHealth !== undefined) {
                this.player.currentHealth = Math.max(1, saveData.playerHealth); // Ensure at least 1 HP
            }
            if (saveData.playerMaxHealth !== undefined) {
                this.player.maxHealth = saveData.playerMaxHealth;
            }
            if (saveData.playerStamina !== undefined) {
                this.player.currentStamina = saveData.playerStamina;
            }
            if (saveData.playerMaxStamina !== undefined) {
                this.player.maxStamina = saveData.playerMaxStamina;
            }
            
            // Restore room
            this.currentRoom = saveData.currentRoom;
            this.gameMap = this.rooms[this.currentRoom];
            
            // Restore player equipment
            if (saveData.playerHasArmor) {
                this.player.equipArmor();
            } else {
                this.player.hasArmor = false;
            }
            if (saveData.playerHasStaff) {
                this.player.equipMagicStaff();
            } else {
                this.player.hasMagicStaff = false;
            }
            
            // Restore inventory
            if (this.inventory && saveData.inventoryItems) {
                this.inventory.items = [...saveData.inventoryItems]; // Create a copy
            }
            if (this.inventory && saveData.inventoryWeaponIndex !== undefined) {
                this.inventory.currentWeaponIndex = Math.max(0, saveData.inventoryWeaponIndex);
            }
            
            // Restore collected items across all rooms
            if (saveData.collectedItems && Array.isArray(saveData.collectedItems)) {
                saveData.collectedItems.forEach(savedItem => {
                    try {
                        const room = savedItem.room ? this.rooms[savedItem.room] : this.gameMap;
                        if (room && room.items) {
                            const item = room.items.find(mapItem => 
                                mapItem.x === savedItem.x && 
                                mapItem.y === savedItem.y && 
                                mapItem.type === savedItem.type
                            );
                            if (item) {
                                item.collected = true;
                            }
                        }
                    } catch (error) {
                        console.warn('❌ Error restoring collected item:', savedItem, error);
                    }
                });
            }
            
            // Respawn enemies for current room
            this.spawnEnemies();
            
            console.log('📂 Game loaded successfully!');
            this.showMessage('Game Loaded!', 2000);
            return true;
            
        } catch (error) {
            console.error('❌ Error loading game:', error);
            this.showMessage('Load Failed!', 2000);
            return false;
        }
    }
    
    restartFromSave() {
        // Try to load from save first
        const saveData = localStorage.getItem('llamaKnightSave');
        
        if (saveData) {
            console.log('🔄 Restarting from last save...');
            
            try {
                // Reset game state to playing
                this.gameState = 'playing';
                
                // Make sure all rooms are initialized
                if (!this.rooms || Object.keys(this.rooms).length === 0) {
                    this.setupRooms();
                }
                
                // Make sure player and inventory exist
                if (!this.player) {
                    this.setupPlayer();
                }
                if (!this.inventory) {
                    this.setupInventory();
                    this.player.inventory = this.inventory;
                }
                
                // Load the saved game state
                if (this.loadGame()) {
                    // Reset player health to full (since they died)
                    this.player.currentHealth = this.player.maxHealth;
                    this.player.currentStamina = this.player.maxStamina;
                    
                    // Clear any status effects
                    this.player.isInvulnerable = false;
                    this.player.invulnerabilityTimer = 0;
                    this.player.hurtTimer = 0;
                    
                    // Clear projectiles and reset combat state
                    this.projectiles = [];
                    
                    console.log('✅ Successfully restarted from save!');
                    this.showMessage('Restarted from Save!', 2000);
                } else {
                    throw new Error('Failed to load save data');
                }
                
            } catch (error) {
                console.log('❌ Failed to load save, starting new game...', error);
                this.startNewGame();
            }
        } else {
            // No save file, start new game
            console.log('💫 No save found, starting new game...');
            this.startNewGame();
        }
    }
    
    startNewGame() {
        // Reset to initial game state
        this.gameState = 'playing';
        
        try {
            // Initialize a fresh game - start in main room
            this.currentRoom = 'main';
            
            // Create rooms if they don't exist
            if (!this.rooms || Object.keys(this.rooms).length === 0) {
                console.log('📍 Creating rooms...');
                this.rooms = {};
                this.rooms['main'] = new ZeldaGameMap(this.spriteLoader, 'main');
                this.rooms['staff_room'] = new ZeldaGameMap(this.spriteLoader, 'staff_room');
                this.rooms['forest'] = new ZeldaGameMap(this.spriteLoader, 'forest');
                this.rooms['grove'] = new ZeldaGameMap(this.spriteLoader, 'grove');
                this.rooms['orchard'] = new ZeldaGameMap(this.spriteLoader, 'orchard');
            }
            
            // Set current map
            this.gameMap = this.rooms[this.currentRoom];
            
            // Create fresh player at spawn position
            const spawnPos = this.gameMap.getSpawnPosition();
            this.player = new ZeldaPlayer(spawnPos.x, spawnPos.y, this.spriteLoader);
            
            // Create fresh inventory and particle system
            this.inventory = new ZeldaInventory(this.spriteLoader);
            this.particleSystem = new ParticleSystem();
            
            // Connect systems
            this.player.inventory = this.inventory;
            this.player.particleSystem = this.particleSystem;
            
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
        
        // Reset game objects but preserve sprite assets
        this.player = null;
        this.gameMap = null;
        this.inventory = null;
        this.projectiles = [];
        this.rooms = {};
        this.currentRoom = null;
        
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
}