class RoomManager {
    constructor(spriteLoader) {
        this.spriteLoader = spriteLoader;
        this.currentRoom = null;
        this.rooms = new Map();
        
        try {
            console.log('🏗️ Initializing RoomManager...');
            // Initialize rooms
            this.initializeRooms();
            
            // Start in main room
            console.log('🏠 Switching to main room...');
            this.switchToRoom('main');
            console.log('✅ RoomManager initialized successfully');
        } catch (error) {
            console.error('❌ RoomManager initialization failed:', error);
            // Create a fallback default room
            this.createFallbackRoom();
        }
    }
    
    createFallbackRoom() {
        console.log('🔄 Creating fallback room...');
        this.currentRoom = new BaseRoom(this.spriteLoader, 'fallback');
        this.spawnPosition = this.currentRoom.getSpawnPosition();
    }
    
    initializeRooms() {
        // Only create rooms when needed to save memory
        this.roomCreators = {
            'main': () => new MainRoom(this.spriteLoader),
            'staff_room': () => new StaffRoom(this.spriteLoader),
            'forest': () => new ForestRoom(this.spriteLoader)
            // Add more rooms as needed
        };
    }
    
    getRoom(roomName) {
        if (!this.rooms.has(roomName)) {
            try {
                if (this.roomCreators[roomName]) {
                    console.log(`🏗️ Creating room: ${roomName}`);
                    this.rooms.set(roomName, this.roomCreators[roomName]());
                } else {
                    console.warn(`❌ Room '${roomName}' not found, creating BaseRoom fallback`);
                    this.rooms.set(roomName, new BaseRoom(this.spriteLoader, roomName));
                }
            } catch (error) {
                console.error(`❌ Failed to create room '${roomName}':`, error);
                // Create a basic BaseRoom as fallback
                this.rooms.set(roomName, new BaseRoom(this.spriteLoader, roomName));
            }
        }
        return this.rooms.get(roomName);
    }
    
    switchToRoom(roomName, spawnX = null, spawnY = null) {
        this.currentRoom = this.getRoom(roomName);
        
        // Set spawn position if provided
        if (spawnX !== null && spawnY !== null) {
            this.spawnPosition = { x: spawnX, y: spawnY };
        } else {
            this.spawnPosition = this.currentRoom.getSpawnPosition();
        }
        
        return this.currentRoom;
    }
    
    getCurrentRoom() {
        return this.currentRoom;
    }
    
    getSpawnPosition() {
        return this.spawnPosition || this.currentRoom.getSpawnPosition();
    }
    
    checkExits(playerX, playerY) {
        if (!this.currentRoom || !this.currentRoom.exits) return null;
        
        const playerTileX = Math.floor(playerX / this.currentRoom.tileSize);
        const playerTileY = Math.floor(playerY / this.currentRoom.tileSize);
        
        for (const exit of this.currentRoom.exits) {
            if (playerTileX >= exit.x && playerTileX < exit.x + (exit.width || 1) &&
                playerTileY >= exit.y && playerTileY < exit.y + (exit.height || 1)) {
                return exit;
            }
        }
        return null;
    }
    
    handleRoomTransition(exit) {
        if (exit && exit.targetRoom) {
            this.switchToRoom(exit.targetRoom, exit.targetX, exit.targetY);
            return this.getSpawnPosition();
        }
        return null;
    }
}