// js/enemyTank.js

class EnemyTank {
    /**
     * @param {number} x The starting x-coordinate.
     * @param {number} y The starting y-coordinate.
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = 0.1; // pixels per millisecond
        this.direction = 'down';
        this.color = 'red';
        this.health = 50;
        
        // --- AI Properties ---
        this.state = 'moving'; // States: 'moving', 'stuck', 'chasing'
        this.allDirections = ['up', 'down', 'left', 'right'];

        // Direction Persistence
        this.directionTimer = 0;
        this.directionInterval = Math.random() * 2000 + 2000; // Move for 2-4 secs before new decision

        // Anti-Stuck Mechanism
        this.stuckTimer = 0;
        this.stuckCheckInterval = 500; // Check if stuck every 0.5s
        this.lastPosition = { x: this.x, y: this.y };
        
        // Firing Control
        this.fireTimer = 0;
        this.fireInterval = 1500; // Fire every 1.5 seconds
    }

    /**
     * Main AI update loop, now with state management.
     * @param {number} deltaTime The time elapsed since the last frame.
     * @param {Game} game The main game object.
     * @param {PlayerTank} playerTank The player object, for targeting.
     */
    update(deltaTime, game, playerTank) {
        this.updateTimers(deltaTime);
        this.handleStuckDetection();
        this.decideNextAction(playerTank);
        this.executeMove(deltaTime, game);
        this.handleFiring(deltaTime, game);
    }

    updateTimers(deltaTime) {
        this.directionTimer += deltaTime;
        this.stuckTimer += deltaTime;
        this.fireTimer += deltaTime;
    }

    /**
     * Checks if the tank has been stationary for too long and marks it as 'stuck'.
     */
    handleStuckDetection() {
        if (this.stuckTimer > this.stuckCheckInterval) {
            const distanceMoved = Math.hypot(this.x - this.lastPosition.x, this.y - this.lastPosition.y);
            if (distanceMoved < 1) { // If moved less than 1 pixel
                this.state = 'stuck';
            }
            this.lastPosition = { x: this.x, y: this.y };
            this.stuckTimer = 0;
        }
    }

    /**
     * Decides whether to change direction based on timers or state.
     * @param {PlayerTank} playerTank 
     */
    decideNextAction(playerTank) {
        if (this.directionTimer > this.directionInterval || this.state === 'stuck') {
            this.direction = this.chooseNewDirection(playerTank);
            this.directionTimer = 0;
            this.directionInterval = Math.random() * 2000 + 2000; // Reset decision timer
            this.state = 'moving'; // Return to normal moving state
        }
    }

    /**
     * Chooses a new direction with a bias towards the player's position.
     * @param {PlayerTank} playerTank 
     * @returns {string} The chosen direction.
     */
    chooseNewDirection(playerTank) {
        const dx = playerTank.x - this.x;
        const dy = playerTank.y - this.y;

        const weightedDirections = [];

        // Add higher weight to directions that close the distance to the player
        if (Math.abs(dx) > Math.abs(dy)) { // More horizontal distance
            weightedDirections.push(dx > 0 ? 'right' : 'left');
            weightedDirections.push(dx > 0 ? 'right' : 'left'); // Add extra weight
        } else { // More vertical distance
            weightedDirections.push(dy > 0 ? 'down' : 'up');
            weightedDirections.push(dy > 0 ? 'down' : 'up'); // Add extra weight
        }
        
        // Add all directions to allow for other movements
        weightedDirections.push(...this.allDirections);

        // Pick a random direction from the weighted list
        return weightedDirections[Math.floor(Math.random() * weightedDirections.length)];
    }

    /**
     * Executes the movement for the current frame using predictive collision.
     * @param {number} deltaTime 
     * @param {Game} game 
     */
    executeMove(deltaTime, game) {
        const moveAmount = this.speed * deltaTime;
        let moveX = 0;
        let moveY = 0;

        switch(this.direction) {
            case 'up': moveY = -moveAmount; break;
            case 'down': moveY = moveAmount; break;
            case 'left': moveX = -moveAmount; break;
            case 'right': moveX = moveAmount; break;
        }

        if (moveX !== 0 && game.map.canMoveTo(this.x + moveX, this.y, this.width, this.height)) {
            this.x += moveX;
        }
        if (moveY !== 0 && game.map.canMoveTo(this.x, this.y + moveY, this.width, this.height)) {
            this.y += moveY;
        }

        // Final boundary checks
        if (this.x < 0) this.x = 0;
        if (this.y < 0) this.y = 0;
        if (this.x + this.width > game.width) this.x = game.width - this.width;
        if (this.y + this.height > game.height) this.y = game.height - this.height;
    }

    /**
     * Handles periodic firing.
     * @param {number} deltaTime 
     * @param {Game} game 
     */
    handleFiring(deltaTime, game) {
        if (this.fireTimer > this.fireInterval) {
            game.bullets.push(this.fire());
            this.fireTimer = 0;
        }
    }
    
    draw(ctx) {
        ctx.save();
        // Translate and rotate the canvas to draw the tank facing the correct direction
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        let angle = 0;
        if (this.direction === 'down') angle = Math.PI;
        else if (this.direction === 'left') angle = -Math.PI / 2;
        else if (this.direction === 'right') angle = Math.PI / 2;
        ctx.rotate(angle);

        const w = this.width;
        const h = this.height;

        // --- Treads ---
        ctx.fillStyle = '#3E2723'; // Darker, almost black red-brown
        const treadWidth = 8;
        ctx.fillRect(-w / 2, -h / 2, treadWidth, h); // Left tread
        ctx.fillRect(w / 2 - treadWidth, -h / 2, treadWidth, h); // Right tread
        
        // --- Body ---
        ctx.fillStyle = '#B71C1C';
        const bodyWidth = w - treadWidth * 2;
        ctx.fillRect(-bodyWidth / 2, -h / 2, bodyWidth, h);

        // --- Turret (more blocky) ---
        const turretSize = w / 2;
        ctx.fillStyle = '#880E0E'; // Darker red
        ctx.fillRect(-turretSize / 2, -turretSize / 2, turretSize, turretSize);

        // Turret highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.fillRect(-turretSize/2, -turretSize/2, turretSize, 3);
        
        // --- Barrel (simple and blocky) ---
        const barrelWidth = 6;
        const barrelLength = h * 0.6;
        ctx.fillStyle = '#424242';
        ctx.fillRect(-barrelWidth / 2, -h / 2 - barrelLength + 5, barrelWidth, barrelLength);

        // --- Enemy 'X' Identifier ---
        ctx.strokeStyle = '#FBE9E7';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const xSize = 6;
        ctx.moveTo(-xSize, -xSize);
        ctx.lineTo(xSize, xSize);
        ctx.moveTo(xSize, -xSize);
        ctx.lineTo(-xSize, xSize);
        ctx.stroke();

        ctx.restore();
    }

    fire() {
        let bulletX = this.x + this.width / 2;
        let bulletY = this.y + this.height / 2;
        return new Bullet(this, bulletX, bulletY, this.direction, 0.2, 5);
    }
}