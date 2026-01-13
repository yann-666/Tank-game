// js/explosion.js

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.maxRadius = 50;
        this.duration = 500; // ms
        this.lifeTimer = 0;
        this.isFinished = false;

        // --- Particle System ---
        this.particles = [];
        this.particleCount = 15; // Create 15 particles
        this._createParticles();
    }
    
    /**
     * Creates a set of particles with random velocities for the explosion.
     * This is called only once in the constructor.
     * @private
     */
    _createParticles() {
        for (let i = 0; i < this.particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.particles.push({
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed * 0.15, // Scale velocity by deltaTime
                vy: Math.sin(angle) * speed * 0.15,
                alpha: 1
            });
        }
    }

    update(deltaTime) {
        this.lifeTimer += deltaTime;
        if (this.lifeTimer >= this.duration) {
            this.isFinished = true;
        }
        
        // Update each particle's position and fade it out
        for (const p of this.particles) {
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.alpha = 1 - (this.lifeTimer / this.duration);
        }
    }

    /**
     * Draws the multi-layered explosion and flying particles.
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if (this.isFinished) return;

        const progress = this.lifeTimer / this.duration;
        const alpha = 1 - progress;

        // --- Layer 3: Expanding Smoke Ring (Outer) ---
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.maxRadius * progress, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(50, 50, 50, ${alpha * 0.3})`;
        ctx.fill();
        
        // --- Layer 2: Fireball (Middle) ---
        // Grows and then shrinks for a "poof" effect
        const fireRadius = this.maxRadius * Math.sin(progress * Math.PI);
        const fireGradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, fireRadius);
        fireGradient.addColorStop(0, `rgba(255, 255, 180, ${alpha})`); // Yellow center
        fireGradient.addColorStop(0.5, `rgba(255, 100, 0, ${alpha * 0.8})`); // Orange
        fireGradient.addColorStop(1, `rgba(200, 0, 0, 0)`); // Transparent red edge

        ctx.beginPath();
        ctx.arc(this.x, this.y, fireRadius, 0, Math.PI * 2);
        ctx.fillStyle = fireGradient;
        ctx.fill();

        // --- Layer 1: Bright Core Flash (Inner) ---
        if (progress < 0.3) {
            const coreProgress = progress / 0.3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.maxRadius * 0.2 * coreProgress, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${1 - coreProgress})`;
            ctx.fill();
        }

        // --- Layer 4: Draw Particles ---
        for (const p of this.particles) {
            ctx.fillStyle = `rgba(255, 220, 180, ${p.alpha})`;
            ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
        }
    }
}
