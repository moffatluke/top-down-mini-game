// Basic Enemy Class for Zelda-style Game
class ZeldaEnemy {
    constructor(x, y, type = 'rabbit') {
        this.x = x;
        this.y = y;
        this.type = type;
        
        // Set animal-specific properties
        this.setAnimalProperties();
        
        // Movement and physics
        this.direction = Math.random() * Math.PI * 2; // Random starting direction
        
        // Visual properties
        this.width = 24;
        this.height = 24;
        
        // AI behavior
        this.aiState = 'wander'; // 'wander', 'chase', 'attack', 'hurt', 'dead'
        this.wanderTimer = 0;
        this.wanderInterval = 2000; // Change direction every 2 seconds
        this.wanderDirection = Math.random() * Math.PI * 2;
        
        // Animation and effects
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 300; // milliseconds per frame
        this.hurtTimer = 0;
        this.knockbackVelocityX = 0;
        this.knockbackVelocityY = 0;
        
        // Combat states
        this.isInvulnerable = false;
        this.invulnerabilityDuration = 500; // milliseconds
        this.invulnerabilityTimer = 0;
    }
    
    setAnimalProperties() {
        switch (this.type) {
            case 'rabbit':
                this.speed = 0.8; // Reduced speed for better control
                this.maxHealth = 20;
                this.attackDamage = 5;
                this.attackRange = 28;
                this.detectionRange = 60;
                this.attackCooldown = 1500;
                this.wanderInterval = 1500; // Change direction more often (nervous)
                break;
            case 'wolf':
                this.speed = 1.2; // Reduced but still fast
                this.maxHealth = 40;
                this.attackDamage = 15;
                this.attackRange = 35;
                this.detectionRange = 100;
                this.attackCooldown = 800;
                this.wanderInterval = 3000; // More focused movement
                break;
            case 'bear':
                this.speed = 0.6; // Slow and steady
                this.maxHealth = 60;
                this.attackDamage = 20;
                this.attackRange = 40;
                this.detectionRange = 80;
                this.attackCooldown = 1200;
                this.wanderInterval = 4000; // Slow, deliberate movement
                break;
            case 'fox':
                this.speed = 1.0; // Quick but controlled
                this.maxHealth = 25;
                this.attackDamage = 12;
                this.attackRange = 32;
                this.detectionRange = 90;
                this.attackCooldown = 1000;
                this.wanderInterval = 2000; // Moderate movement changes
                break;
            default:
                this.speed = 0.8;
                this.maxHealth = 30;
                this.attackDamage = 10;
                this.attackRange = 32;
                this.detectionRange = 80;
                this.attackCooldown = 1000;
                this.wanderInterval = 2000;
        }
        
        this.health = this.maxHealth;
        this.lastAttackTime = 0;
    }
    
    update(deltaTime, player, gameMap) {
        if (this.health <= 0) {
            this.aiState = 'dead';
            return;
        }
        
        // Update timers
        this.animationTimer += deltaTime;
        if (this.animationTimer >= this.animationSpeed) {
            this.animationFrame = (this.animationFrame + 1) % 4;
            this.animationTimer = 0;
        }
        
        // Update hurt state
        if (this.hurtTimer > 0) {
            this.hurtTimer -= deltaTime;
        }
        
        // Update invulnerability
        if (this.invulnerabilityTimer > 0) {
            this.invulnerabilityTimer -= deltaTime;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }
        
        // Apply knockback (more controlled)
        if (this.knockbackVelocityX !== 0 || this.knockbackVelocityY !== 0) {
            const newX = this.x + this.knockbackVelocityX;
            const newY = this.y + this.knockbackVelocityY;
            
            // Only apply knockback if the new position is valid
            if (this.canMoveTo(newX, newY, gameMap)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Stop knockback if hitting obstacle
                this.knockbackVelocityX = 0;
                this.knockbackVelocityY = 0;
            }
            
            // Reduce knockback over time
            this.knockbackVelocityX *= 0.85;
            this.knockbackVelocityY *= 0.85;
            
            // Stop very small knockback
            if (Math.abs(this.knockbackVelocityX) < 0.1) this.knockbackVelocityX = 0;
            if (Math.abs(this.knockbackVelocityY) < 0.1) this.knockbackVelocityY = 0;
        }
        
        // AI behavior
        this.updateAI(deltaTime, player, gameMap);
        
        // Keep enemy in bounds
        this.keepInBounds(gameMap);
    }
    
    updateAI(deltaTime, player, gameMap) {
        if (this.aiState === 'dead') return;
        
        const distanceToPlayer = this.getDistanceToPlayer(player);
        
        // Animal-specific behavior modifications
        let shouldFlee = false;
        let shouldBeAggressive = false;
        
        switch (this.type) {
            case 'rabbit':
                // Rabbits flee when damaged or player is very close
                shouldFlee = (this.hurtTimer > 0) || (distanceToPlayer < 40);
                break;
            case 'wolf':
                // Wolves are always aggressive when they detect player
                shouldBeAggressive = distanceToPlayer <= this.detectionRange;
                break;
            case 'bear':
                // Bears are territorial but won't chase too far
                shouldBeAggressive = distanceToPlayer <= this.detectionRange;
                if (distanceToPlayer > this.detectionRange * 1.5) {
                    // Return to wandering if player gets too far
                    shouldBeAggressive = false;
                }
                break;
            case 'fox':
                // Foxes are cautious - hit and run tactics
                if (this.health < this.maxHealth * 0.5) {
                    shouldFlee = true; // Flee when below 50% health
                } else {
                    shouldBeAggressive = distanceToPlayer <= this.detectionRange;
                }
                break;
        }
        
        // State transitions with animal-specific logic
        if (shouldFlee) {
            this.aiState = 'flee';
        } else if (this.hurtTimer > 0) {
            this.aiState = 'hurt';
        } else if (distanceToPlayer <= this.attackRange && this.canAttack() && shouldBeAggressive) {
            this.aiState = 'attack';
        } else if (shouldBeAggressive) {
            this.aiState = 'chase';
        } else {
            this.aiState = 'wander';
        }
        
        // Execute behavior based on state
        switch (this.aiState) {
            case 'wander':
                this.wander(deltaTime, gameMap);
                break;
            case 'chase':
                this.chasePlayer(player, gameMap);
                break;
            case 'attack':
                this.attackPlayer(player);
                break;
            case 'flee':
                this.fleeFromPlayer(player, gameMap);
                break;
            case 'hurt':
                // Do nothing, just take knockback and recover
                break;
        }
    }
    
    fleeFromPlayer(player, gameMap) {
        const dx = this.x - player.x; // Opposite direction from chase
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Move away from player at increased speed (panic)
            const fleeSpeedMultiplier = 1.5;
            const moveDistance = this.speed * fleeSpeedMultiplier * (16.67 / 1000) * 60;
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            const moveX = normalizedX * moveDistance;
            const moveY = normalizedY * moveDistance;
            
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            
            if (this.canMoveTo(newX, newY, gameMap)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Try alternative escape routes
                if (this.canMoveTo(newX, this.y, gameMap)) {
                    this.x = newX;
                } else if (this.canMoveTo(this.x, newY, gameMap)) {
                    this.y = newY;
                }
            }
        }
    }
    
    wander(deltaTime, gameMap) {
        this.wanderTimer += deltaTime;
        
        // Change direction periodically or when hitting obstacles
        if (this.wanderTimer >= this.wanderInterval) {
            this.wanderDirection = Math.random() * Math.PI * 2;
            this.wanderTimer = 0;
        }
        
        // Move in wander direction with smaller, more controlled steps
        const moveDistance = this.speed * (deltaTime / 1000) * 60; // 60 FPS normalized
        const moveX = Math.cos(this.wanderDirection) * moveDistance;
        const moveY = Math.sin(this.wanderDirection) * moveDistance;
        
        const newX = this.x + moveX;
        const newY = this.y + moveY;
        
        // Check collision before moving
        if (this.canMoveTo(newX, newY, gameMap)) {
            this.x = newX;
            this.y = newY;
        } else {
            // Hit something, choose a new random direction
            this.wanderDirection = Math.random() * Math.PI * 2;
            this.wanderTimer = 0; // Reset timer to try new direction immediately
        }
    }
    
    chasePlayer(player, gameMap) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // Normalize direction and apply speed with frame-rate independent movement
            const moveDistance = this.speed * (16.67 / 1000) * 60; // Consistent 60 FPS movement
            const normalizedX = dx / distance;
            const normalizedY = dy / distance;
            
            const moveX = normalizedX * moveDistance;
            const moveY = normalizedY * moveDistance;
            
            const newX = this.x + moveX;
            const newY = this.y + moveY;
            
            // Try to move, but stop if blocked
            if (this.canMoveTo(newX, newY, gameMap)) {
                this.x = newX;
                this.y = newY;
            } else {
                // Try moving along one axis at a time if diagonal movement is blocked
                if (this.canMoveTo(newX, this.y, gameMap)) {
                    this.x = newX; // Move horizontally only
                } else if (this.canMoveTo(this.x, newY, gameMap)) {
                    this.y = newY; // Move vertically only
                }
                // If neither works, enemy stays put (realistic obstacle behavior)
            }
        }
    }
    
    attackPlayer(player) {
        if (this.canAttack()) {
            // Deal damage to player
            if (player.takeDamage) {
                player.takeDamage(this.attackDamage);
                console.log(`💥 Enemy attacked player for ${this.attackDamage} damage!`);
            }
            
            this.lastAttackTime = Date.now();
        }
    }
    
    canAttack() {
        return Date.now() - this.lastAttackTime >= this.attackCooldown;
    }
    
    getDistanceToPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    canMoveTo(x, y, gameMap) {
        // Add padding to prevent enemies from getting stuck at edges
        const padding = 2;
        
        // Check map collision with proper hitbox
        if (gameMap && gameMap.isCollision) {
            if (gameMap.isCollision(x - padding, y - padding, this.width + padding * 2, this.height + padding * 2)) {
                return false;
            }
        }
        
        // Check basic boundary limits (prevent flying off map)
        if (x < 0 || y < 0) return false;
        
        // Check against map bounds if available
        if (gameMap) {
            const mapWidth = gameMap.width * gameMap.tileSize || 640;
            const mapHeight = gameMap.height * gameMap.tileSize || 480;
            
            if (x + this.width > mapWidth || y + this.height > mapHeight) {
                return false;
            }
        }
        
        return true;
    }
    
    keepInBounds(gameMap) {
        // Enhanced boundary checking with proper constraints
        if (gameMap) {
            const mapWidth = (gameMap.width * gameMap.tileSize) || 640;
            const mapHeight = (gameMap.height * gameMap.tileSize) || 480;
            const margin = 5; // Small margin from edges
            
            if (this.x < margin) {
                this.x = margin;
                this.knockbackVelocityX = 0;
            }
            if (this.y < margin) {
                this.y = margin;
                this.knockbackVelocityY = 0;
            }
            if (this.x > mapWidth - this.width - margin) {
                this.x = mapWidth - this.width - margin;
                this.knockbackVelocityX = 0;
            }
            if (this.y > mapHeight - this.height - margin) {
                this.y = mapHeight - this.height - margin;
                this.knockbackVelocityY = 0;
            }
        } else {
            // Fallback bounds if no map available
            const defaultWidth = 640;
            const defaultHeight = 480;
            
            if (this.x < 0) this.x = 0;
            if (this.y < 0) this.y = 0;
            if (this.x > defaultWidth - this.width) this.x = defaultWidth - this.width;
            if (this.y > defaultHeight - this.height) this.y = defaultHeight - this.height;
        }
    }
    
    takeDamage(amount, sourceX, sourceY) {
        if (this.isInvulnerable || this.health <= 0) return false;
        
        this.health -= amount;
        this.hurtTimer = 300; // 300ms hurt state
        this.isInvulnerable = true;
        this.invulnerabilityTimer = this.invulnerabilityDuration;
        
        // Apply knockback
        if (sourceX !== undefined && sourceY !== undefined) {
            const dx = this.x - sourceX;
            const dy = this.y - sourceY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                // Reduced knockback strength for more realistic movement
                const knockbackStrength = 1.5; // Reduced from 3
                this.knockbackVelocityX = (dx / distance) * knockbackStrength;
                this.knockbackVelocityY = (dy / distance) * knockbackStrength;
            }
        }
        
        console.log(`🗡️ Enemy took ${amount} damage! Health: ${this.health}/${this.maxHealth}`);
        
        if (this.health <= 0) {
            console.log('💀 Enemy defeated!');
            return true; // Enemy died
        }
        
        return false; // Enemy survived
    }
    
    render(ctx) {
        if (this.aiState === 'dead') return; // Don't render dead enemies
        
        ctx.save();
        
        // Flash red when hurt or invulnerable
        if (this.hurtTimer > 0 || this.isInvulnerable) {
            ctx.globalAlpha = 0.7;
        }
        
        // Disable image smoothing for pixelated effect
        ctx.imageSmoothingEnabled = false;
        
        // Draw pixelated animal
        this.drawPixelatedAnimal(ctx);
        
        // Draw health bar above enemy
        this.drawHealthBar(ctx);
        
        ctx.restore();
    }
    
    drawPixelatedAnimal(ctx) {
        const scale = 3; // Scale factor for pixel art
        const pixelSize = 2; // Size of each "pixel"
        const startX = this.x;
        const startY = this.y;
        
        // Flash white when hurt
        const isHurt = this.hurtTimer > 0;
        
        switch (this.type) {
            case 'rabbit':
                this.drawRabbit(ctx, startX, startY, pixelSize, isHurt);
                break;
            case 'wolf':
                this.drawWolf(ctx, startX, startY, pixelSize, isHurt);
                break;
            case 'bear':
                this.drawBear(ctx, startX, startY, pixelSize, isHurt);
                break;
            case 'fox':
                this.drawFox(ctx, startX, startY, pixelSize, isHurt);
                break;
            default:
                this.drawRabbit(ctx, startX, startY, pixelSize, isHurt);
        }
    }
    
    drawRabbit(ctx, startX, startY, pixelSize, isHurt) {
        const colors = {
            body: isHurt ? '#fff' : '#e8d4b0',    // Light brown body
            ears: isHurt ? '#fff' : '#d4c4a0',    // Darker brown ears
            eye: isHurt ? '#000' : '#000',        // Black eyes
            nose: isHurt ? '#000' : '#ff69b4',    // Pink nose
            tail: isHurt ? '#fff' : '#fff'        // White tail
        };
        
        // Rabbit pixel pattern (12x12)
        const pattern = [
            '  oo    oo  ',  // Ears
            ' oooo  oooo ',  // Ears
            ' oooo  oooo ',
            'oooooooooooo',  // Head
            'oo##oooo##oo',  // Eyes
            'oooooooooooo',
            'oooo@@oooooo',  // Nose
            'oooooooooooo',  // Body
            'oooooooooooo',
            'oooo  oooooo',
            '##oo  oo  ##',  // Feet
            '  @@      @@'   // Tail
        ];
        
        this.drawPixelPattern(ctx, startX, startY, pixelSize, pattern, {
            'o': colors.body,
            '#': colors.eye,
            '@': colors.nose,
            ' ': null // Transparent
        });
    }
    
    drawWolf(ctx, startX, startY, pixelSize, isHurt) {
        const colors = {
            body: isHurt ? '#fff' : '#666',       // Gray body
            dark: isHurt ? '#aaa' : '#333',       // Dark gray
            eye: isHurt ? '#000' : '#ff0000',     // Red eyes
            teeth: isHurt ? '#fff' : '#fff'       // White teeth
        };
        
        // Wolf pixel pattern (12x12)
        const pattern = [
            ' oo      oo ',  // Ears
            'oooo    oooo',
            'oooooooooooo',  // Head
            'oo##oooo##oo',  // Eyes
            'oooooooooooo',
            'oo@@@@@@@@oo',  // Snout
            'oooo##oooooo',  // Nose
            'oo##@@@@##oo',  // Mouth with teeth
            'oooooooooooo',  // Body
            'oooooooooooo',
            'oo  oooo  oo',  // Legs
            'oo  oooo  oo'
        ];
        
        this.drawPixelPattern(ctx, startX, startY, pixelSize, pattern, {
            'o': colors.body,
            '#': colors.eye,
            '@': colors.dark,
            ' ': null
        });
    }
    
    drawBear(ctx, startX, startY, pixelSize, isHurt) {
        const colors = {
            body: isHurt ? '#fff' : '#8b4513',    // Brown body
            dark: isHurt ? '#aaa' : '#654321',    // Darker brown
            eye: isHurt ? '#000' : '#000',        // Black eyes
            nose: isHurt ? '#000' : '#000'        // Black nose
        };
        
        // Bear pixel pattern (12x12) - bigger and bulkier
        const pattern = [
            'oooo    oooo',  // Ears
            'oooooooooooo',  // Head
            'oooooooooooo',
            'oo##oooo##oo',  // Eyes
            'oooooooooooo',
            'oooo@@@@oooo',  // Snout
            'oooo@@@@oooo',
            'oooooooooooo',  // Body
            '@@oooooooo@@',  // Body with dark patches
            '@@oooooooo@@',
            '@@oo@@@@oo@@',  // Legs
            '@@oo@@@@oo@@'
        ];
        
        this.drawPixelPattern(ctx, startX, startY, pixelSize, pattern, {
            'o': colors.body,
            '#': colors.eye,
            '@': colors.dark,
            ' ': null
        });
    }
    
    drawFox(ctx, startX, startY, pixelSize, isHurt) {
        const colors = {
            body: isHurt ? '#fff' : '#ff4500',    // Orange body
            white: isHurt ? '#fff' : '#fff',      // White markings
            dark: isHurt ? '#aaa' : '#8b0000',    // Dark red
            eye: isHurt ? '#000' : '#000'         // Black eyes
        };
        
        // Fox pixel pattern (12x12)
        const pattern = [
            '  @@    @@  ',  // Ears
            ' oooo  oooo ',
            'oooooooooooo',  // Head
            'oo##oooo##oo',  // Eyes
            '@@oooooooo@@',  // Face markings
            'oooo@@@@oooo',  // Snout
            '@@@@@@@@@@@@',  // Body
            'oooooooooooo',
            '@@oooooooo@@',
            'oo  oooo  @@',  // Legs and tail start
            '    oooo  @@',
            '    @@@@  @@'   // Tail
        ];
        
        this.drawPixelPattern(ctx, startX, startY, pixelSize, pattern, {
            'o': colors.body,
            '#': colors.eye,
            '@': colors.dark,
            ' ': null
        });
    }
    
    drawPixelPattern(ctx, startX, startY, pixelSize, pattern, colorMap) {
        for (let row = 0; row < pattern.length; row++) {
            for (let col = 0; col < pattern[row].length; col++) {
                const char = pattern[row][col];
                const color = colorMap[char];
                
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        startX + col * pixelSize,
                        startY + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }
    
    drawHealthBar(ctx) {
        const barWidth = this.width;
        const barHeight = 4;
        const barY = this.y - 8;
        
        // Background
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, barY, barWidth, barHeight);
        
        // Health
        const healthPercent = this.health / this.maxHealth;
        const healthWidth = barWidth * healthPercent;
        
        if (healthPercent > 0.6) {
            ctx.fillStyle = '#4a4';
        } else if (healthPercent > 0.3) {
            ctx.fillStyle = '#aa4';
        } else {
            ctx.fillStyle = '#a44';
        }
        
        ctx.fillRect(this.x, barY, healthWidth, barHeight);
    }
    
    // Check collision with other objects (like projectiles)
    checkCollision(x, y, width, height) {
        return x < this.x + this.width &&
               x + width > this.x &&
               y < this.y + this.height &&
               y + height > this.y;
    }
}