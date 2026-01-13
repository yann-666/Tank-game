// js/map.js

class GameMap {
    /**
     * @param {Array<Array<number>>} mapGrid The raw 2D array defining the map layout.
     */
    constructor(mapGrid) {
        this.tileSize = 40;
        
        // --- Pre-render the tile textures for performance ---
        this.brickTile = this._createBrickTexture();
        this.steelTile = this._createSteelTexture();

        // Automatically process the incoming grid to fix narrow passages upon creation.
        this.layout = this._widenNarrowPassages(mapGrid);
    }

    /**
     * Creates and returns an off-screen canvas with a detailed brick texture.
     * This is called only once for performance.
     * @private
     */
    _createBrickTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        
        const T = this.tileSize;
        const T2 = T / 2;
        
        // Base color
        ctx.fillStyle = '#6D4C41';
        ctx.fillRect(0, 0, T, T);

        // Mortar lines to create 4 sub-bricks
        ctx.fillStyle = '#5D4037'; // Darker mortar color
        ctx.fillRect(T2 - 1, 0, 2, T);
        ctx.fillRect(0, T2 - 1, T, 2);

        // Damage/texture lines on bricks
        ctx.fillStyle = '#8D6E63'; // Lighter color
        ctx.fillRect(5, 5, 8, 2);
        ctx.fillRect(T2 + 4, T2 + 10, 10, 2);
        ctx.fillStyle = '#5D4037'; // Darker color
        ctx.fillRect(8, T2 + 5, 10, 2);
        ctx.fillRect(T2 + 8, 8, 8, 2);

        // 3D Bevel effect
        ctx.fillStyle = '#8D6E63'; // Light edge
        ctx.fillRect(0, 0, T, 2); // Top
        ctx.fillRect(0, 0, 2, T); // Left
        ctx.fillStyle = '#5D4037'; // Dark edge
        ctx.fillRect(0, T - 2, T, 2); // Bottom
        ctx.fillRect(T - 2, 0, 2, T); // Right

        return canvas;
    }

    /**
     * Creates and returns an off-screen canvas with a detailed steel texture.
     * This is called only once for performance.
     * @private
     */
    _createSteelTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = this.tileSize;
        canvas.height = this.tileSize;
        const ctx = canvas.getContext('2d');
        const T = this.tileSize;

        // Metallic Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, T);
        gradient.addColorStop(0, '#E0E0E0');
        gradient.addColorStop(0.5, '#BDBDBD');
        gradient.addColorStop(1, '#9E9E9E');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, T, T);
        
        // 3D Bevel effect
        ctx.fillStyle = '#FAFAFA'; // Light edge
        ctx.fillRect(0, 0, T, 2); // Top
        ctx.fillRect(0, 0, 2, T); // Left
        ctx.fillStyle = '#757575'; // Dark edge
        ctx.fillRect(0, T - 2, T, 2); // Bottom
        ctx.fillRect(T - 2, 0, 2, T); // Right

        // Rivets in corners
        const rivetSize = 3;
        const rivetOffset = 5;
        ctx.fillStyle = '#FAFAFA';
        ctx.fillRect(rivetOffset, rivetOffset, rivetSize, rivetSize);
        ctx.fillRect(T - rivetOffset - rivetSize, rivetOffset, rivetSize, rivetSize);
        ctx.fillRect(rivetOffset, T - rivetOffset - rivetSize, rivetSize, rivetSize);
        ctx.fillRect(T - rivetOffset - rivetSize, T - rivetOffset - rivetSize, rivetSize, rivetSize);

        return canvas;
    }

    /**
     * A private method that analyzes a grid and widens any 1-cell-wide corridors.
     * @param {Array<Array<number>>} grid The original map grid.
     * @returns {Array<Array<number>>} A new, repaired map grid.
     * @private
     */
    _widenNarrowPassages(grid) {
        const newGrid = JSON.parse(JSON.stringify(grid));
        const height = newGrid.length;
        const width = newGrid[0].length;
        for (let r = 1; r < height - 1; r++) {
            for (let c = 1; c < width - 1; c++) {
                if (newGrid[r][c] !== 0) continue;
                const leftWall = newGrid[r][c - 1], rightWall = newGrid[r][c + 1];
                const topWall = newGrid[r - 1][c], bottomWall = newGrid[r + 1][c];
                if (leftWall > 0 && rightWall > 0) {
                    if (leftWall === 1) newGrid[r][c-1] = 0; else if (rightWall === 1) newGrid[r][c+1] = 0;
                }
                if (topWall > 0 && bottomWall > 0) {
                    if (topWall === 1) newGrid[r-1][c] = 0; else if (bottomWall === 1) newGrid[r+1][c] = 0;
                }
            }
        }
        return newGrid;
    }

    /**
     * Draws the map by stamping the pre-rendered tile canvases.
     * @param {CanvasRenderingContext2D} ctx The 2D rendering context.
     */
    draw(ctx) {
        for (let row = 0; row < this.layout.length; row++) {
            for (let col = 0; col < this.layout[row].length; col++) {
                const tile = this.layout[row][col];
                if (tile === 0) continue;

                const x = col * this.tileSize;
                const y = row * this.tileSize;

                if (tile === 1) {
                    ctx.drawImage(this.brickTile, x, y);
                } else if (tile === 2) {
                    ctx.drawImage(this.steelTile, x, y);
                }
            }
        }
    }

     canMoveTo(nextX, nextY, width, height) {
         const startCol = Math.floor(nextX / this.tileSize);
         const endCol = Math.floor((nextX + width - 1) / this.tileSize);
         const startRow = Math.floor(nextY / this.tileSize);
         const endRow = Math.floor((nextY + height - 1) / this.tileSize);

         for (let row = startRow; row <= endRow; row++) {
             for (let col = startCol; col <= endCol; col++) {
                 const tile = this.layout[row]?.[col];
                 if (tile === undefined || tile > 0) {
                     return false;
                 }
             }
         }
         return true;
     }
}