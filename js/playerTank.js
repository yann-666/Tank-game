// js/playerTank.js

class PlayerTank {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 0.15;
        this.direction = 'up';
        this.color = 'green';
        this.health = 1; // As requested, 1 hit kills
        this.isAlive = true;

        // --- Firing Cooldown Properties ---
        this.fireRate = 1000; // 1000ms = 1 second fire rate
        this.fireCooldown = 0;
    }

    takeDamage(amount) {
        if (!this.isAlive) return;
        this.health -= amount;
        if (this.health <= 0) {
            this.health = 0;
            this.isAlive = false;
        }
    }

    /**
     * Handles all tank logic, including movement and firing.
     * @returns {Bullet | null} A new Bullet instance if fired, otherwise null.
     */
    update(input, deltaTime, game) {
        // --- Cooldown Timer ---
        if (this.fireCooldown > 0) {
            this.fireCooldown -= deltaTime;
        }

        if (!this.isAlive) return null;

        // --- Movement ---
        const moveAmount = this.speed * deltaTime;
        let moveX = 0, moveY = 0;
        // (Movement logic is unchanged)
        if (input.keys.up) { this.direction = 'up'; moveY = -moveAmount; } 
        else if (input.keys.down) { this.direction = 'down'; moveY = moveAmount; }
        else if (input.keys.left) { this.direction = 'left'; moveX = -moveAmount; }
        else if (input.keys.right) { this.direction = 'right'; moveX = moveAmount; }
        if (moveX !== 0) { const nextX = this.x + moveX; if (game.map.canMoveTo(nextX, this.y, this.width, this.height)) this.x = nextX; }
        if (moveY !== 0) { const nextY = this.y + moveY; if (game.map.canMoveTo(this.x, nextY, this.width, this.height)) this.y = nextY; }
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x + this.width > game.width) this.x = game.width - this.width;
        if (this.y + this.height > game.height) this.y = game.height - this.height;

        // --- Firing Logic ---
        if (input.keys.fire && this.fireCooldown <= 0) {
            this.fireCooldown = this.fireRate; // Reset cooldown
            return this.fire(); // Return the new bullet to the game
        }
        
        return null; // Return null if no bullet was fired
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        let angle = 0;
        if (this.direction === 'down') angle = Math.PI;
        else if (this.direction === 'left') angle = -Math.PI / 2;
        else if (this.direction === 'right') angle = Math.PI / 2;
        ctx.rotate(angle);

        const w = this.width;
        const h = this.height;

        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 3;

        // Treads
        ctx.fillStyle = '#2E1F0B';
        const treadWidth = 8;
        ctx.fillRect(-w / 2, -h / 2, treadWidth, h);
        ctx.fillRect(w / 2 - treadWidth, -h / 2, treadWidth, h);
        ctx.fillStyle = '#4A3418';
        for (let i = 0; i < h; i += 8) {
            ctx.fillRect(-w / 2 + 1, -h / 2 + i, treadWidth - 2, 4);
            ctx.fillRect(w / 2 - treadWidth + 1, -h / 2 + i, treadWidth - 2, 4);
        }

        // Body
        const bodyWidth = w - treadWidth * 2;
        const bodyHeight = h * 0.9;
        const bodyRadius = 5;
        const gradient = ctx.createRadialGradient(0, 0, 1, 0, 0, bodyWidth);
        gradient.addColorStop(0, '#5A8A22');
        gradient.addColorStop(1, '#4C721D');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(-bodyWidth / 2 + bodyRadius, -bodyHeight / 2);
        ctx.arcTo(bodyWidth / 2, -bodyHeight / 2, bodyWidth / 2, bodyHeight / 2, bodyRadius);
        ctx.arcTo(bodyWidth / 2, bodyHeight / 2, -bodyWidth / 2, bodyHeight / 2, bodyRadius);
        ctx.arcTo(-bodyWidth / 2, bodyHeight / 2, -bodyWidth / 2, -bodyHeight / 2, bodyRadius);
        ctx.arcTo(-bodyWidth / 2, -bodyHeight / 2, bodyWidth / 2, -bodyHeight / 2, bodyRadius);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowColor = 'transparent';

        // Turret
        const turretRadius = w / 3.5;
        ctx.fillStyle = '#3A5A16';
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, turretRadius - 2, Math.PI * 1.2, Math.PI * 1.8);
        ctx.stroke();

        // Barrel
        const barrelWidth = 8;
        const barrelLength = h * 0.6;
        ctx.fillStyle = '#444';
        ctx.fillRect(-barrelWidth / 2, -h / 2 - barrelLength + 10, barrelWidth, barrelLength);
        ctx.fillStyle = '#666';
        ctx.fillRect(-barrelWidth / 2 + 2, -h / 2 - barrelLength - 2 + 10, 4, 4);

        // Player Star Identifier
        ctx.fillStyle = 'white';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 1);
        
        // --- Cooldown Indicator ---
        if (this.fireCooldown > 0) {
            const progress = this.fireCooldown / this.fireRate;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(-w/2, h/2 + 2, w, 4);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(-w/2, h/2 + 2, w * (1 - progress), 4);
        }

        ctx.restore();
    }

    fire() {
        // This logic is simplified as the cooldown is handled in update()
        const barrelOffset = 15;
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;
        
        // Correct starting position from center based on direction
        if (this.direction === 'up') bulletY -= barrelOffset;
        else if (this.direction === 'down') bulletY += barrelOffset;
        else if (this.direction === 'left') bulletX -= barrelOffset;
        else if (this.direction === 'right') bulletX += barrelOffset;

        return new Bullet(this, bulletX, bulletY, this.direction, 0.3, 10);
    }
}
