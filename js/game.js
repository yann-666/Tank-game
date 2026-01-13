class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.gameState = 'loading'; // loading, playing, gameOver, gameWon, LEVEL_TRANSITION

        this.input = new InputHandler();
        this.levelManager = new LevelManager(this);

        this.score = 0;
        this.map = null;
        this.playerTank = null;
        this.enemies = [];
        this.bullets = [];
        this.activeExplosions = [];
        this.levelTransition = null;
        
        this.playerFireCooldown = 0;
        this.playerFireRate = 500;
        
        this.lastTime = 0;
        this.victoryAnimTimer = 0;
        
        this.gameLoop = this.gameLoop.bind(this);
    }

    start() {
        this.levelManager.reset();
        this.lastTime = performance.now();
        requestAnimationFrame(this.gameLoop);
    }

    gameLoop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        this.update(deltaTime);
        this.draw();
        requestAnimationFrame(this.gameLoop);
    }

    update(deltaTime) {
        if (this.gameState === 'playing') {
            // Player tank update now returns a bullet if one was fired
            if (this.playerTank.isAlive) {
                const newBullet = this.playerTank.update(this.input, deltaTime, this);
                if (newBullet) {
                    this.bullets.push(newBullet);
                }
            }
            
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                this.enemies[i].update(deltaTime, this, this.playerTank);
            }

            this.handleBullets(deltaTime);
            
            for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
                this.activeExplosions[i].update(deltaTime);
                if (this.activeExplosions[i].isFinished) {
                    this.activeExplosions.splice(i, 1);
                }
            }

            if (this.enemies.length === 0 && this.playerTank.isAlive) {
                this.levelManager.nextLevel();
            }

            if (!this.playerTank.isAlive && this.activeExplosions.length === 0) {
                this.gameState = 'gameOver';
            }

        } else if (this.gameState === 'LEVEL_TRANSITION') {
            this.levelTransition.update(deltaTime);
            if (this.levelTransition.isComplete) {
                this.gameState = 'playing';
                this.levelTransition = null;
            }
        }
        else if (this.gameState === 'gameWon' || this.gameState === 'gameOver') {
            if (this.input.keys.r) {
                this.levelManager.reset();
            }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        if (this.map) this.map.draw(this.ctx);
        if (this.playerTank && this.playerTank.isAlive) this.playerTank.draw(this.ctx);
        for (const enemy of this.enemies) enemy.draw(this.ctx);
        for (const bullet of this.bullets) bullet.draw(this.ctx);
        for (const explosion of this.activeExplosions) explosion.draw(this.ctx);
        
        this.drawUI();
        
        if (this.gameState === 'LEVEL_TRANSITION' && this.levelTransition) {
            this.levelTransition.draw(this.ctx, this.canvas);
        } else if (this.gameState === 'gameWon') {
            this.drawVictoryScreen(this.lastTime);
        } else if (this.gameState === 'gameOver') {
            this.drawGameOverScreen();
        }
    }
    
    loadLevel(levelData) {
        this.map = new GameMap(levelData.mapGrid);
        this.playerTank = new PlayerTank(levelData.playerSpawnPoint.x, levelData.playerSpawnPoint.y);
        this.enemies = levelData.enemySpawnPoints.map(p => new EnemyTank(p.x, p.y));
        
        this.score = 0;
        this.bullets = [];
        this.activeExplosions = [];
        this.playerFireCooldown = 0;

        this.gameState = 'LEVEL_TRANSITION';
        this.levelTransition = new LevelTransition(this.levelManager.currentLevelIndex + 1);
    }
    
    enterVictoryState() {
        this.gameState = 'gameWon';
        this.victoryAnimTimer = this.lastTime;
    }

    drawVictoryScreen(timestamp) {
        const elapsed = timestamp - this.victoryAnimTimer;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        const pulse = 1 + Math.sin(elapsed / 400) * 0.05;
        const hue = (elapsed / 30) % 360;
        this.ctx.font = `bold ${60 * pulse}px Arial`;
        this.ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('🎉 恭喜通关！ 🎉', this.width / 2, this.height / 2 - 40);
        this.ctx.font = '24px Arial';
        this.ctx.fillStyle = 'white';
        this.ctx.fillText('您成功征服了所有钢铁洪流', this.width / 2, this.height / 2 + 40);
        this.ctx.font = '20px Arial';
        this.ctx.fillStyle = '#ccc';
        if (Math.floor(elapsed / 500) % 2 === 0) {
            this.ctx.fillText('按 [R] 重新开始', this.width / 2, this.height - 80);
        }
    }
    
    drawGameOverScreen() {
        this.ctx.fillStyle = 'rgba(100, 0, 0, 0.5)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = 'white';
        this.ctx.font = 'bold 70px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText('GAME OVER', this.width / 2, this.height / 2);
        
        this.ctx.font = '20px Arial';
        this.ctx.fillText('按 [R] 重新开始', this.width / 2, this.height - 80);
    }
    
    handleBullets(deltaTime) {
        const tileSize = this.map.tileSize;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            if (!bullet) continue; 
            
            bullet.update(deltaTime);
            let bulletRemoved = false;

            if (bullet.isOutOfBounds(this.width, this.height)) {
                this.bullets.splice(i, 1);
                continue;
            }

            const bulletTileX = Math.floor(bullet.x / tileSize);
            const bulletTileY = Math.floor(bullet.y / tileSize);
            const wallType = this.map.layout[bulletTileY]?.[bulletTileX];
            
            if (wallType > 0) {
                const wall = { x: bulletTileX * tileSize, y: bulletTileY * tileSize, width: tileSize, height: tileSize };
                if (this.checkCollision(bullet, wall)) {
                    if (wallType === 1) {
                        this.map.layout[bulletTileY][bulletTileX] = 0;
                    }
                    this.bullets.splice(i, 1);
                    continue; 
                }
            }
            
            if (bullet.owner instanceof PlayerTank) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    if (this.checkCollision(bullet, this.enemies[j])) {
                        this.activeExplosions.push(new Explosion(this.enemies[j].x + this.enemies[j].width / 2, this.enemies[j].y + this.enemies[j].height / 2));
                        this.enemies.splice(j, 1);
                        this.bullets.splice(i, 1);
                        this.score += 100;
                        bulletRemoved = true;
                        break;
                    }
                }
            } else if (bullet.owner instanceof EnemyTank) {
                if (this.playerTank.isAlive && this.checkCollision(bullet, this.playerTank)) {
                    this.playerTank.takeDamage(bullet.power);
                    this.bullets.splice(i, 1);
                    if (!this.playerTank.isAlive) {
                        this.activeExplosions.push(new Explosion(this.playerTank.x + this.playerTank.width / 2, this.playerTank.y + this.playerTank.height / 2));
                    }
                    bulletRemoved = true;
                }
            }
            if (bulletRemoved) continue;
        }
    }

    drawUI() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Score: ${this.score}`, 10, 30);
        if (this.levelManager.currentLevelIndex !== -1) {
            this.ctx.fillText(`Level: ${this.levelManager.currentLevelIndex + 1}`, this.width / 2 - 50, 30);
        }
        if (this.playerTank) {
            this.ctx.fillText(`Health: ${this.playerTank.health}`, this.width - 150, 30);
        }
    }

    checkCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x && rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
    }
}

window.addEventListener('load', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game(canvas);
    game.start();
});
