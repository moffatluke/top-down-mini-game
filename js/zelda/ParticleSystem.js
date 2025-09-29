// Particle System for wind effects and other visual effects
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // Create wind particles for dash effect
    createWindBurst(x, y, direction, count = 12) {
        for (let i = 0; i < count; i++) {
            const particle = new WindParticle(x, y, direction);
            this.particles.push(particle);
        }
    }

    update(deltaTime) {
        // Update all particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.update(deltaTime);
            
            // Remove dead particles
            if (particle.isDead()) {
                this.particles.splice(i, 1);
            }
        }
    }

    render(ctx) {
        // Render all particles
        for (const particle of this.particles) {
            particle.render(ctx);
        }
    }
}

// Wind particle for dash effects
class WindParticle {
    constructor(x, y, direction) {
        this.x = x;
        this.y = y;
        this.startX = x;
        this.startY = y;
        
        // Particle properties
        this.life = 1.0;
        this.maxLife = Math.random() * 300 + 200; // 200-500ms
        this.size = Math.random() * 3 + 2; // 2-5px
        this.alpha = 0.8;
        
        // Wind movement based on dash direction
        this.velocityX = 0;
        this.velocityY = 0;
        
        // Create wind effect opposite to dash direction
        const speed = Math.random() * 60 + 40; // 40-100 pixels per second
        const spreadAngle = (Math.random() - 0.5) * Math.PI * 0.5; // ±45 degrees spread
        
        switch (direction) {
            case 'up':
                // Wind blows down (opposite of dash)
                this.velocityY = speed * Math.cos(spreadAngle);
                this.velocityX = speed * Math.sin(spreadAngle);
                break;
            case 'down':
                // Wind blows up
                this.velocityY = -speed * Math.cos(spreadAngle);
                this.velocityX = speed * Math.sin(spreadAngle);
                break;
            case 'left':
                // Wind blows right
                this.velocityX = speed * Math.cos(spreadAngle);
                this.velocityY = speed * Math.sin(spreadAngle);
                break;
            case 'right':
                // Wind blows left
                this.velocityX = -speed * Math.cos(spreadAngle);
                this.velocityY = speed * Math.sin(spreadAngle);
                break;
        }
        
        // Add some random variation
        this.velocityX += (Math.random() - 0.5) * 20;
        this.velocityY += (Math.random() - 0.5) * 20;
        
        // Color variations (light blue/white wind)
        this.hue = Math.random() * 60 + 180; // 180-240 (blue range)
        this.saturation = Math.random() * 30 + 20; // 20-50%
        this.lightness = Math.random() * 20 + 70; // 70-90%
    }

    update(deltaTime) {
        // Update position
        this.x += this.velocityX * (deltaTime / 1000);
        this.y += this.velocityY * (deltaTime / 1000);
        
        // Fade out over time
        this.life -= deltaTime;
        this.alpha = Math.max(0, this.life / this.maxLife);
        
        // Shrink over time
        this.size = Math.max(0.5, this.size * 0.995);
        
        // Add slight deceleration
        this.velocityX *= 0.98;
        this.velocityY *= 0.98;
    }

    render(ctx) {
        if (this.alpha <= 0) return;
        
        ctx.save();
        
        // Set alpha based on life
        ctx.globalAlpha = this.alpha;
        
        // Create wind streak effect
        const gradient = ctx.createRadialGradient(
            this.x, this.y, 0,
            this.x, this.y, this.size
        );
        
        const color = `hsl(${this.hue}, ${this.saturation}%, ${this.lightness}%)`;
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.fillStyle = gradient;
        
        // Draw particle as small circle
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a subtle streak effect
        ctx.strokeStyle = `hsla(${this.hue}, ${this.saturation}%, ${this.lightness}%, 0.3)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(this.startX, this.startY);
        ctx.lineTo(this.x, this.y);
        ctx.stroke();
        
        ctx.restore();
    }

    isDead() {
        return this.life <= 0;
    }
}