// Main Zelda-style Game Controller
class ZeldaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.debugElement = document.getElementById('debug');
        
        // Game state
        this.isRunning = false;
        this.lastTime = 0;
        this.fps = 0;
        this.frameCount = 0;
        this.fpsTimer = 0;
        
        // Camera and zoom
        this.zoom = 1.5;  // Zoom level for better detail visibility
        
        // Game objects
        this.spriteLoader = null;
        this.gameMap = null;
        this.player = null;
        this.inventory = null;
        this.projectiles = [];
        
        // Mouse input
        this.mouseX = 0;
        this.mouseY = 0;
        this.worldMouseX = 0;
        this.worldMouseY = 0;
        
        // Room system
        this.currentRoom = 'main';
        this.rooms = {};
        
        // Debug mode
        window.DEBUG_MODE = false;
        
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
        
        // Setup input handlers
        this.setupMouseControls();
        
        // Load sprites first
        this.spriteLoader = new SpriteLoader();
        this.spriteLoader.load(() => {
            console.log('📦 All sprites loaded, initializing game...');
            this.onSpritesLoaded();
        });
        
        // Setup debug controls
        this.setupDebugControls();
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
    
    updateWorldMouseCoordinates() {
        if (!this.player) return;
        
        // Calculate camera offset
        const cameraX = (this.canvas.width / this.zoom / 2) - this.player.x;
        const cameraY = (this.canvas.height / this.zoom / 2) - this.player.y;
        
        // Convert screen coordinates to world coordinates
        this.worldMouseX = (this.mouseX / this.zoom) - cameraX;
        this.worldMouseY = (this.mouseY / this.zoom) - cameraY;
    }
    
    handleMouseDown() {
        if (!this.player || !this.inventory) return;
        
        // Only charge if staff is equipped
        const currentWeapon = this.inventory.getCurrentWeapon();
        if (currentWeapon.id !== 'staff') return;
        
        // Start charging the staff
        this.player.startCharging();
    }
    
    handleMouseUp() {
        if (!this.player || !this.inventory) return;
        
        // Only shoot if staff is equipped
        const currentWeapon = this.inventory.getCurrentWeapon();
        if (currentWeapon.id !== 'staff') return;
        
        // Stop charging and get charge info
        const chargeInfo = this.player.stopCharging();
        if (!chargeInfo) return;
        
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
        console.log(`🔥 ${projectileType} shot from staff towards:`, this.worldMouseX, this.worldMouseY);
    }

    setupDebugControls() {
        document.addEventListener('keydown', (e) => {
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
                
                if (e.code === 'KeyQ') {  // Q key - cycle weapon (backup)
                    e.preventDefault();
                    this.inventory.cycleWeapon();
                    console.log('Weapon:', this.inventory.getCurrentWeapon().name);
                }
                if (e.code === 'KeyE') {  // E key - cycle armor
                    e.preventDefault();
                    this.inventory.cycleArmor();
                    console.log('Armor:', this.inventory.getCurrentArmor().name);
                }
            }
        });
    }

    onSpritesLoaded() {
        console.log('✅ Sprites loaded, creating game world...');
        this.errorMessage = ''; // Clear any previous error messages
        
        try {
            // Create rooms
            console.log('📍 Creating main room...');
            this.rooms['main'] = new ZeldaGameMap(this.spriteLoader, 'main');
            console.log('📍 Creating staff room...');
            this.rooms['staff_room'] = new ZeldaGameMap(this.spriteLoader, 'staff_room');
            this.gameMap = this.rooms[this.currentRoom];
            console.log('✅ Rooms created successfully');
            
            // Create player at spawn position
            console.log('🦙 Creating player...');
            const spawnPos = this.gameMap.getSpawnPosition();
            this.player = new ZeldaPlayer(spawnPos.x, spawnPos.y, this.spriteLoader);
            console.log('✅ Player created at:', spawnPos.x, spawnPos.y);
            
            // Create inventory system
            console.log('🎒 Creating inventory...');
            this.inventory = new ZeldaInventory(this.spriteLoader);
            
            // Connect player to inventory
            this.player.inventory = this.inventory;
            console.log('✅ Inventory connected to player');
            
            // Start game loop
            console.log('🎮 Starting game loop...');
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
            
            console.log('🎯 Game started! Use WASD or Arrow Keys to move');
            console.log('💡 Press F1 to toggle debug mode');
            
        } catch (error) {
            console.error('❌ Error initializing game:', error);
            console.error('Error details:', error.stack);
            this.errorMessage = `Game Init Error: ${error.message}`;
            // Still start the game loop to show error
            this.isRunning = true;
            this.lastTime = performance.now();
            this.gameLoop();
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
        if (this.player && this.gameMap) {
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
        
        // Update projectiles
        this.updateProjectiles(deltaTime);
        
        // Update fire tiles (remove expired ones)
        if (this.gameMap && this.gameMap.updateFireTiles) {
            this.gameMap.updateFireTiles(deltaTime);
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
        
        // Apply zoom transformation
        this.ctx.save();
        this.ctx.scale(this.zoom, this.zoom);
        
        // Calculate camera position to center on player
        let cameraX = 0;
        let cameraY = 0;
        
        if (this.player && this.gameMap) {
            // Center camera on player
            cameraX = (this.canvas.width / this.zoom / 2) - this.player.x;
            cameraY = (this.canvas.height / this.zoom / 2) - this.player.y;
            
            // Clamp camera to map boundaries
            const mapWidth = this.gameMap.width * this.gameMap.tileSize;
            const mapHeight = this.gameMap.height * this.gameMap.tileSize;
            
            cameraX = Math.min(0, Math.max(cameraX, (this.canvas.width / this.zoom) - mapWidth));
            cameraY = Math.min(0, Math.max(cameraY, (this.canvas.height / this.zoom) - mapHeight));
        }
        
        this.ctx.translate(cameraX, cameraY);
        
        // Render game map
        if (this.gameMap) {
            this.gameMap.render(this.ctx);
        }
        
        // Render player
        if (this.player) {
            this.player.render(this.ctx);
        }
        
        // Render projectiles
        this.projectiles.forEach(projectile => {
            projectile.render(this.ctx);
        });
        
        this.ctx.restore();
        
        // Render UI overlay (not zoomed)
        this.renderUI();
        
        } catch (error) {
            console.error('❌ Render error:', error);
            this.errorMessage = `Render Error: ${error.message}`;
        }
        
        // Always render error messages or debug info if needed
        this.renderDebugInfo();
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
        }
    }

    collectItem(item) {
        console.log(`✨ Collected ${item.type}!`);
        
        if (item.type === 'magic_staff') {
            // Add to inventory and switch to it
            this.inventory.addItem('staff');
            this.inventory.currentWeaponIndex = this.inventory.weapons.findIndex(w => w.id === 'staff');
            console.log('🔮 Magic Staff added to inventory!');
        }
        // Add other item types here as needed
    }
}