// js/input.js

class InputHandler {
    constructor() {
        this.keys = {
            up: false,
            down: false,
            left: false,
            right: false,
            fire: false,
            r: false // For Restart
        };

        // Listen for keydown events
        window.addEventListener('keydown', e => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = true;
                    break;
                case 'Space':
                    this.keys.fire = true;
                    break;
                case 'KeyR':
                    this.keys.r = true;
                    break;
            }
        });

        // Listen for keyup events
        window.addEventListener('keyup', e => {
            switch (e.code) {
                case 'ArrowUp':
                case 'KeyW':
                    this.keys.up = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    this.keys.down = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    this.keys.right = false;
                    break;
                case 'Space':
                    this.keys.fire = false;
                    break;
                case 'KeyR':
                    this.keys.r = false;
                    break;
            }
        });
    }
}
