// Main Zelda-style Game Controller
class ZeldaGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.debugElement = document.getElementById('debug');
        
        // Game state
        this.gameState = 'title'; // 'title', 'playing', 'paused'
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
        
        // Message system
        this.messageText = '';
        this.messageTimer = 0;
        
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
            console.log('📦 All sprites loaded, showing title screen...');
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
        console.log(`🔥 ${projectileType} shot from staff at (${staffOffset.x}, ${staffOffset.y}) towards: (${this.worldMouseX}, ${this.worldMouseY})`);
        console.log(`📍 Mouse screen: (${this.mouseX}, ${this.mouseY}), Camera: (${this.calculateCameraPosition().x}, ${this.calculateCameraPosition().y}), Zoom: ${this.zoom}`);
    }

    setupDebugControls() {
        document.addEventListener('keydown', (e) => {
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
            
            // Enter key - start game from title screen
            if (e.code === 'Enter' || e.code === 'Space') {
                if (this.gameState === 'title') {
                    this.startGame();
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
            
            console.log('🎯 Game started! Use WASD to move, ESC to pause');
            console.log('💡 Press F1 to toggle debug mode');
            
        } catch (error) {
            console.error('❌ Error starting game:', error);
            this.errorMessage = `Game Start Error: ${error.message}`;
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
        // Dark blue background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#0a0a1a');
        gradient.addColorStop(1, '#1a1a3a');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Title text
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.font = 'bold 72px Arial';
        this.ctx.strokeStyle = '#cc7700';
        this.ctx.lineWidth = 4;
        this.ctx.strokeText('🦙 LLAMA KNIGHT', this.canvas.width / 2, 200);
        this.ctx.fillText('🦙 LLAMA KNIGHT', this.canvas.width / 2, 200);
        
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
    
    saveGame() {
        try {
            const saveData = {
                playerX: this.player.x,
                playerY: this.player.y,
                currentRoom: this.currentRoom,
                playerHasArmor: this.player.hasArmor,
                playerHasStaff: this.player.hasMagicStaff,
                inventoryItems: this.inventory.items,
                inventoryWeaponIndex: this.inventory.currentWeaponIndex,
                collectedItems: this.gameMap.items.filter(item => item.collected).map(item => ({
                    x: item.x,
                    y: item.y,
                    type: item.type
                })),
                saveTime: new Date().toISOString()
            };
            
            localStorage.setItem('llamaKnightSave', JSON.stringify(saveData));
            console.log('💾 Game saved successfully!');
            
            // Show save confirmation
            this.showMessage('Game Saved!', 2000);
            
        } catch (error) {
            console.error('❌ Error saving game:', error);
            this.showMessage('Save Failed!', 2000);
        }
    }
    
    loadGame() {
        try {
            const saveData = JSON.parse(localStorage.getItem('llamaKnightSave'));
            if (!saveData) {
                console.log('No save data found');
                return false;
            }
            
            // Restore player position
            this.player.x = saveData.playerX;
            this.player.y = saveData.playerY;
            
            // Restore room
            this.currentRoom = saveData.currentRoom;
            this.gameMap = this.rooms[this.currentRoom];
            
            // Restore player equipment
            if (saveData.playerHasArmor) {
                this.player.equipArmor();
            }
            if (saveData.playerHasStaff) {
                this.player.equipMagicStaff();
            }
            
            // Restore inventory
            if (saveData.inventoryItems) {
                this.inventory.items = saveData.inventoryItems;
            }
            if (saveData.inventoryWeaponIndex !== undefined) {
                this.inventory.currentWeaponIndex = saveData.inventoryWeaponIndex;
            }
            
            // Restore collected items
            if (saveData.collectedItems) {
                saveData.collectedItems.forEach(savedItem => {
                    const item = this.gameMap.items.find(mapItem => 
                        mapItem.x === savedItem.x && 
                        mapItem.y === savedItem.y && 
                        mapItem.type === savedItem.type
                    );
                    if (item) {
                        item.collected = true;
                    }
                });
            }
            
            console.log('📂 Game loaded successfully!');
            this.showMessage('Game Loaded!', 2000);
            return true;
            
        } catch (error) {
            console.error('❌ Error loading game:', error);
            return false;
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