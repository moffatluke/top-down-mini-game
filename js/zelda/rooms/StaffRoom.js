class StaffRoom extends BaseRoom {
    constructor(spriteLoader) {
        super(spriteLoader, 'staff_room');
        this.generateContent();
    }
    
    generateContent() {
        // Simple grass room with some bushes
        this.place2TileBush(10, 15);
        this.place2TileBush(28, 15);
        
        // Add sword near crossroads
        this.items.push({
            type: 'sword',
            name: 'Iron Sword',
            x: 18 * this.tileSize + this.tileSize / 2,
            y: 13 * this.tileSize + this.tileSize / 2,
            collected: false
        });
        
        // Exit back to main room
        this.exits = [
            { x: 20, y: 31, width: 1, height: 1, targetRoom: 'main', targetX: 20, targetY: 6 }
        ];
    }
    
    place2TileBush(startX, startY) {
        for (let dx = 0; dx < 2; dx++) {
            const x = startX + dx;
            const y = startY;
            if (this.isValidTile(x, y)) {
                this.setOverlay(x, y, this.TILE_TYPES.BUSH);
            }
        }
    }
    
    renderOverlay(ctx, overlayType, x, y) {
        if (overlayType === this.TILE_TYPES.BUSH) {
            const sprite = this.spriteLoader.getTileFromTileset(0, 16);
            if (sprite) {
                ctx.drawImage(sprite, x, y, this.tileSize, this.tileSize);
                return;
            }
        }
        super.renderOverlay(ctx, overlayType, x, y);
    }
}