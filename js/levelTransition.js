// js/levelTransition.js

/**
 * Manages the drawing and state of the animated screen between levels.
 */
class LevelTransition {
    /**
     * @param {number} targetLevel The number of the level that is about to start.
     * @param {number} duration The total duration of the transition in milliseconds.
     */
    constructor(targetLevel, duration = 2000) {
        this.targetLevel = targetLevel;
        this.duration = duration;
        this.timer = 0;
        this.isComplete = false;
    }

    /**
     * Updates the animation timer.
     * @param {number} deltaTime The time elapsed since the last frame.
     */
    update(deltaTime) {
        this.timer += deltaTime;
        if (this.timer >= this.duration) {
            this.isComplete = true;
        }
    }

    /**
     * Draws the transition screen.
     * @param {CanvasRenderingContext2D} ctx The 2D rendering context.
     * @param {HTMLCanvasElement} canvas The canvas element for dimensions.
     */
    draw(ctx, canvas) {
        const progress = Math.min(this.timer / this.duration, 1);

        // 1. Fading black overlay
        ctx.fillStyle = `rgba(0, 0, 0, ${0.9 * progress})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (progress < 0.2) return; // Don't draw text immediately

        // 2. Main Text with "breathing" animation
        const textScale = 1 + Math.sin(this.timer / 150) * 0.04;
        ctx.font = `bold ${70 * textScale}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`关卡 ${this.targetLevel}`, canvas.width / 2, canvas.height / 2 - 40);

        // 3. Subtitle
        ctx.font = `30px Arial`;
        ctx.fillText('准备战斗！', canvas.width / 2, canvas.height / 2 + 30);
        
        // 4. Shrinking Circle Progress Indicator
        const circleRadius = (1 - progress) * (canvas.width / 3);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 15;
        ctx.beginPath();
        // Draw an arc that shrinks, but don't draw it when it's too small
        if (circleRadius > 5) {
             ctx.arc(canvas.width / 2, canvas.height / 2, circleRadius, 0, Math.PI * 2);
        }
        ctx.stroke();
    }
}
