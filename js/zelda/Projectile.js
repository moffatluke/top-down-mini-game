// Fireball Projectile System
class ZeldaProjectile {
    constructor(x, y, targetX, targetY, type = 'fireball') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isCharged = (type === 'charged_fireball');
        
        // Calculate direction to target
        const dx = targetX - x;
        const dy = targetY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Projectile properties (charged fireballs are bigger and slower)
        this.speed = this.isCharged ? 200 : 300; // pixels per second
        this.velocityX = (dx / distance) * this.speed;
        this.velocityY = (dy / distance) * this.speed;
        this.damage = this.isCharged ? 12 : 8; // Damage amount (reduced for multi-hit combat)
        
        // Visual properties
        this.size = this.isCharged ? 12 : 8;
        this.maxLifetime = 3000; // 3 seconds max
        this.lifetime = 0;
        this.active = true;
        this.explosionRadius = this.isCharged ? 60 : 0; // Only charged fireballs explode
        
        // Animation
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 100; // milliseconds per frame
        
        // Trail effect
        this.trail = [];
        this.maxTrailLength = 8;
    }
    
    update(deltaTime, gameMap) {
        if (!this.active) return;
        
        // Update lifetime
        this.lifetime += deltaTime;
        if (this.lifetime > this.maxLifetime) {
            this.active = false;
            return;
        }
        
        // Store previous position for trail
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift();
        }
        
        // Update position
        this.x += this.velocityX * (deltaTime / 1000);
        this.y += this.velocityY * (deltaTime / 1000);
        
        // Update animation
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4; // 4-frame animation
            this.animationTimer = 0;
        }
        
        // Check collision with walls
        if (this.checkWallCollision(gameMap)) {
            return this.explode();
        }
        
        return null;
    }
    
    checkWallCollision(gameMap) {
        // Use the new position-based collision detection
        return gameMap.isSolidAt(this.x, this.y);
    }
    
    explode() {
        this.active = false;
        
        if (this.isCharged) {
            console.log('💥 CHARGED Fireball exploded with area effect!');
            // Return explosion data for game to handle fire tiles
            return {
                x: this.x,
                y: this.y,
                radius: this.explosionRadius,
                createFireTiles: true
            };
        } else {
            console.log('💥 Fireball exploded!');
            return null;
        }
    }
    
    render(ctx) {
        if (!this.active) return;
        
        // Render trail
        this.renderTrail(ctx);
        
        // Render fireball
        this.renderFireball(ctx);
    }
    
    renderTrail(ctx) {
        ctx.save();
        
        // Disable smoothing for pixelated trail
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        for (let i = 0; i < this.trail.length; i++) {
            const pos = this.trail[i];
            const intensity = (i + 1) / this.trail.length;
            const pixelSize = Math.max(1, Math.floor(intensity * 3)); // 1-3 pixel trail
            
            // Pixelated trail particles
            const colors = ['#ff0000', '#ff6b00', '#ffff00'];
            const colorIndex = Math.min(2, Math.floor(intensity * colors.length));
            ctx.fillStyle = colors[colorIndex];
            
            // Draw small pixel squares instead of circles
            const pixelX = Math.floor(pos.x - pixelSize / 2);
            const pixelY = Math.floor(pos.y - pixelSize / 2);
            
            for (let py = 0; py < pixelSize; py++) {
                for (let px = 0; px < pixelSize; px++) {
                    if (Math.random() < intensity) { // Add some sparkle randomness
                        ctx.fillRect(pixelX + px, pixelY + py, 1, 1);
                    }
                }
            }
        }
        
        ctx.restore();
    }
    
    renderFireball(ctx) {
        ctx.save();
        
        // Disable image smoothing for pixelated look
        ctx.imageSmoothingEnabled = false;
        ctx.webkitImageSmoothingEnabled = false;
        ctx.mozImageSmoothingEnabled = false;
        ctx.msImageSmoothingEnabled = false;
        
        // Pulsing animation frame (charged fireballs pulse faster)
        const pulseSpeed = this.isCharged ? 0.012 : 0.008;
        const pulse = Math.floor(this.lifetime * pulseSpeed) % 2; // 0 or 1
        const baseSize = this.isCharged ? 10 : 6; // Charged fireballs are bigger
        const currentSize = baseSize + pulse; // Pulsing effect
        
        // Calculate pixel positions (centered)
        const startX = Math.floor(this.x - currentSize / 2);
        const startY = Math.floor(this.y - currentSize / 2);
        
        // Draw pixelated fireball layers (charged fireballs have more layers)
        if (this.isCharged) {
            // Charged fireball - bigger and more intense
            this.drawPixelLayer(ctx, startX, startY, currentSize, '#ffffff'); // White center
            this.drawPixelLayer(ctx, startX - 1, startY - 1, currentSize + 2, '#ffff88'); // Bright yellow
            this.drawPixelLayer(ctx, startX - 2, startY - 2, currentSize + 4, '#ffff00'); // Yellow layer
            this.drawPixelLayer(ctx, startX - 3, startY - 3, currentSize + 6, '#ff8800'); // Orange layer
            this.drawPixelLayer(ctx, startX - 4, startY - 4, currentSize + 8, '#ff4400'); // Dark orange
            this.drawPixelLayer(ctx, startX - 5, startY - 5, currentSize + 10, '#ff0000'); // Red outer
        } else {
            // Normal fireball
            this.drawPixelLayer(ctx, startX, startY, currentSize, '#ffffff'); // White center
            this.drawPixelLayer(ctx, startX - 1, startY - 1, currentSize + 2, '#ffff00'); // Yellow layer
            this.drawPixelLayer(ctx, startX - 2, startY - 2, currentSize + 4, '#ff6b00'); // Orange layer
            this.drawPixelLayer(ctx, startX - 3, startY - 3, currentSize + 6, '#ff0000'); // Red outer
        }
        
        ctx.restore();
    }
    
    drawPixelLayer(ctx, x, y, size, color) {
        ctx.fillStyle = color;
        
        // Create a pixelated circular pattern
        for (let py = 0; py < size; py++) {
            for (let px = 0; px < size; px++) {
                const centerX = size / 2;
                const centerY = size / 2;
                const distance = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2);
                
                // Only draw pixels within circular bounds with some randomness for pixel art feel
                if (distance <= size / 2) {
                    // Add some randomness for organic pixel art look
                    const pixelChance = 1 - (distance / (size / 2));
                    if (Math.random() < pixelChance || distance <= size / 4) {
                        ctx.fillRect(x + px, y + py, 1, 1);
                    }
                }
            }
        }
    }
    
    // Check if projectile hits a target (for enemy collision)
    checkCollision(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Use the target's width property (enemies have width, not hitboxWidth)
        const targetSize = target.width || target.hitboxWidth || 24;
        return distance < (this.size + targetSize / 2);
    }
}