// js/bullet.js

class Bullet {
    constructor(owner, x, y, direction, speed, power) {
        this.owner = owner;
        this.x = x;
        this.y = y;
        this.direction = direction;
        this.speed = speed;
        this.power = power;
        
        // --- Visual Properties & Pre-rendering ---
        this.radius = 5; // The core radius of the bullet
        this.width = this.height = this.radius * 2; // for collision box
        
        // Pre-render the bullet's texture for performance and style
        // Differentiate color based on the owner
        if (this.owner instanceof PlayerTank) {
            this.texture = this._createTexture('#FFFF00', '#FFFFFF'); // Yellow with white core
        } else {
            this.texture = this._createTexture('#FF8C00', '#FFD700'); // Orange/Red with yellow core
        }
    }

    /**
     * Creates a pre-rendered canvas texture for the bullet.
     * @param {string} baseColor The main color of the bullet's glow.
     * @param {string} coreColor The bright central color.
     * @returns {HTMLCanvasElement} An off-screen canvas with the rendered bullet.
     * @private
     */
    _createTexture(baseColor, coreColor) {
        const size = this.radius * 4; // Canvas size needs to include the glow
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        const centerX = size / 2;
        const centerY = size / 2;

        // Glowing aura using shadow
        ctx.shadowColor = baseColor;
        ctx.shadowBlur = 10;

        // Core gradient
        const gradient = ctx.createRadialGradient(centerX, centerY, 1, centerX, centerY, this.radius);
        gradient.addColorStop(0, coreColor);
        gradient.addColorStop(0.5, baseColor);
        gradient.addColorStop(1, 'rgba(255, 120, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
        ctx.fill();

        return canvas;
    }

    update(deltaTime) {
        const moveAmount = this.speed * deltaTime;
        switch (this.direction) {
            case 'up': this.y -= moveAmount; break;
            case 'down': this.y += moveAmount; break;
            case 'left': this.x -= moveAmount; break;
            case 'right': this.x += moveAmount; break;
        }
    }

    /**
     * Draws the pre-rendered bullet texture onto the main canvas.
     * @param {CanvasRenderingContext2D} ctx The 2D rendering context.
     */
    draw(ctx) {
        // Center the image on the bullet's x/y coordinates
        ctx.drawImage(this.texture, this.x - this.texture.width / 2, this.y - this.texture.height / 2);
    }

    isOutOfBounds(canvasWidth, canvasHeight) {
        return this.x < -10 || this.x > canvasWidth + 10 || this.y < -10 || this.y > canvasHeight + 10;
    }
}
