/**
 * Mouse Interaction Handler for ASCII Background
 * Handles mouse interactions with the ASCII grid to create excitement effects
 */

export class MouseInteraction {
    constructor(container, asciiGrid) {
        this.container = container;
        this.asciiGrid = asciiGrid;
        
        // Mouse state
        this.mousePosition = { x: 0, y: 0 };
        this.isMouseActive = false;
        this.lastMouseMove = 0;
        
        // Configuration - enhanced for better sparkle effect
        this.influenceRadius = 150; // Increased radius for more sparkle
        this.maxChaosMultiplier = 5; // Increased chaos for more sparkle
        this.mouseInactiveTimeout = 2000; // ms before mouse is considered inactive
        
        // Grid mapping
        this.gridDimensions = null;
        this.cellSize = 10;
        
        // Excitement state
        this.excitementMap = new Map(); // Grid position -> excitement level
        this.excitementDecay = 0.95; // How fast excitement decays per frame
        
        this.initialize();
    }

    /**
     * Initialize mouse interaction system
     */
    initialize() {
        this.updateGridDimensions();
        this.setupEventListeners();
    }

    /**
     * Update grid dimensions for coordinate mapping
     */
    updateGridDimensions() {
        this.gridDimensions = this.asciiGrid.getDimensions();
        this.cellSize = this.gridDimensions.cellSize;
    }

    /**
     * Set up mouse event listeners
     */
    setupEventListeners() {
        // Mouse move tracking on entire window for full viewport coverage
        window.addEventListener('mousemove', (event) => {
            this.handleMouseMove(event);
        });

        // Mouse enter/leave tracking on entire document
        document.addEventListener('mouseenter', () => {
            this.isMouseActive = true;
        });

        document.addEventListener('mouseleave', () => {
            this.isMouseActive = false;
            this.clearExcitement();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.updateGridDimensions();
        });
    }

    /**
     * Handle mouse movement
     * @param {MouseEvent} event - Mouse event
     */
    handleMouseMove(event) {
        // Use viewport coordinates directly since canvas is now fixed positioned
        this.mousePosition.x = event.clientX;
        this.mousePosition.y = event.clientY;
        
        this.isMouseActive = true;
        this.lastMouseMove = performance.now();
        
        this.updateExcitement();
    }

    /**
     * Update excitement map based on mouse position
     */
    updateExcitement() {
        if (!this.isMouseActive) return;

        // Convert screen mouse position to grid coordinates
        // Screen coordinates: (0,0) at top-left, positive Y goes down
        // Grid coordinates: (0,0) at top-left of grid, positive Y goes down
        const gridX = Math.floor(this.mousePosition.x / this.cellSize);
        const gridY = Math.floor(this.mousePosition.y / this.cellSize);
        
        // Calculate influence area
        const influenceGridRadius = Math.ceil(this.influenceRadius / this.cellSize);
        
        // Update excitement for cells within influence radius
        for (let x = Math.max(0, gridX - influenceGridRadius); 
             x < Math.min(this.gridDimensions.width, gridX + influenceGridRadius + 1); 
             x++) {
            for (let y = Math.max(0, gridY - influenceGridRadius); 
                 y < Math.min(this.gridDimensions.height, gridY + influenceGridRadius + 1); 
                 y++) {
                
                // Calculate distance from mouse position using screen coordinates
                const cellScreenX = (x + 0.5) * this.cellSize;
                const cellScreenY = (y + 0.5) * this.cellSize;
                const distance = Math.sqrt(
                    Math.pow(this.mousePosition.x - cellScreenX, 2) + 
                    Math.pow(this.mousePosition.y - cellScreenY, 2)
                );
                
                if (distance <= this.influenceRadius) {
                    // Calculate excitement level with more intense falloff for sparkle effect
                    const normalizedDistance = distance / this.influenceRadius;
                    const excitement = Math.pow(1 - normalizedDistance, 1.5) * 1.5; // Increased intensity
                    
                    const key = `${x},${y}`;
                    const currentExcitement = this.excitementMap.get(key) || 0;
                    this.excitementMap.set(key, Math.max(currentExcitement, excitement));
                }
            }
        }
    }

    /**
     * Update excitement decay and check for mouse inactivity
     * @param {number} deltaTime - Time elapsed since last update
     */
    update(deltaTime) {
        const currentTime = performance.now();
        
        // Check if mouse has been inactive
        if (this.isMouseActive && (currentTime - this.lastMouseMove) > this.mouseInactiveTimeout) {
            this.isMouseActive = false;
        }
        
        // Decay excitement levels
        for (const [key, excitement] of this.excitementMap.entries()) {
            const newExcitement = excitement * this.excitementDecay;
            if (newExcitement < 0.01) {
                this.excitementMap.delete(key);
            } else {
                this.excitementMap.set(key, newExcitement);
            }
        }
    }

    /**
     * Get excitement level for a grid position
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {number} Excitement level (0-1)
     */
    getExcitementLevel(x, y) {
        const key = `${x},${y}`;
        return this.excitementMap.get(key) || 0;
    }

    /**
     * Get chaos multiplier for character switching
     * @param {number} x - Grid X coordinate
     * @param {number} y - Grid Y coordinate
     * @returns {number} Chaos multiplier (1-maxChaosMultiplier)
     */
    getChaosMultiplier(x, y) {
        const excitement = this.getExcitementLevel(x, y);
        return 1 + (excitement * (this.maxChaosMultiplier - 1));
    }

    /**
     * Check if mouse is currently active
     * @returns {boolean} True if mouse is active
     */
    isActive() {
        return this.isMouseActive;
    }

    /**
     * Get current mouse position
     * @returns {Object} Mouse position {x, y}
     */
    getMousePosition() {
        return { ...this.mousePosition };
    }

    /**
     * Clear all excitement
     */
    clearExcitement() {
        this.excitementMap.clear();
    }

    /**
     * Get debug information
     * @returns {Object} Debug information
     */
    getDebugInfo() {
        return {
            mousePosition: this.mousePosition,
            isMouseActive: this.isMouseActive,
            excitementCount: this.excitementMap.size
        };
    }

    /**
     * Cleanup resources
     */
    dispose() {
        // Remove event listeners
        window.removeEventListener('mousemove', this.handleMouseMove);
        document.removeEventListener('mouseenter', () => {});
        document.removeEventListener('mouseleave', () => {});
        
        // Clear excitement map
        this.excitementMap.clear();
    }
}