/**
 * ASCII Background Manager
 * Main orchestrator class for the Interactive ASCII Mouse Effect
 */

import * as THREE from 'three';
import { ASCIIGrid } from './ASCIIGrid.js';
import { ColorManager } from './utils/ColorManager.js';
import { MouseInteraction } from './MouseInteraction.js';

export class ASCIIBackgroundManager {
    constructor(container) {
        this.container = container;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.asciiGrid = null;
        this.colorManager = null;
        this.mouseInteraction = null;
        
        // Animation properties
        this.animationId = null;
        this.lastTime = 0;
        this.isRunning = false;
        
        // Performance monitoring
        this.frameCount = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        
        // Resize handling
        this.resizeTimeout = null;
        this.boundResize = this.handleResize.bind(this);
        
        this.initialize();
    }

    /**
     * Initialize the ASCII background system
     */
    initialize() {
        this.ensureFullViewport();
        this.setupColorManager();
        this.setupThreeJS();
        this.setupASCIIGrid();
        this.setupInteractionSystems();
        this.setupEventListeners();
        this.start();
    }

    /**
     * Ensure full viewport coverage by injecting CSS
     */
    ensureFullViewport() {
        // Inject CSS to ensure full viewport coverage
        const style = document.createElement('style');
        style.textContent = `
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                box-sizing: border-box !important;
            }
            #container {
                margin: 0 !important;
                padding: 0 !important;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Set up color management and theme detection
     */
    setupColorManager() {
        this.colorManager = new ColorManager();
        this.colorManager.detectThemeFromDOM();
        
        // Observe theme changes
        this.colorManager.observeThemeChanges((newTheme, oldTheme) => {
            this.handleThemeChange(newTheme, oldTheme);
        });
    }

    /**
     * Set up Three.js scene, camera, and renderer
     */
    setupThreeJS() {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera using full viewport dimensions
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const aspect = viewportWidth / viewportHeight;
        const frustumSize = 100;
        
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            frustumSize / -2,
            1,
            1000
        );
        
        this.camera.position.z = 10;
        
        // Create renderer
        this.renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: false,
            powerPreference: "high-performance"
        });
        
        this.renderer.setSize(viewportWidth, viewportHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0); // Transparent background
        
        // Append to container
        this.container.appendChild(this.renderer.domElement);
        
        // Set canvas style to fill entire viewport with robust positioning
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.right = '0';
        this.renderer.domElement.style.bottom = '0';
        this.renderer.domElement.style.width = '100vw';
        this.renderer.domElement.style.height = '100vh';
        this.renderer.domElement.style.margin = '0';
        this.renderer.domElement.style.padding = '0';
        this.renderer.domElement.style.zIndex = '1';
        this.renderer.domElement.style.pointerEvents = 'auto';
        this.renderer.domElement.style.display = 'block';
        this.renderer.domElement.style.overflow = 'hidden';
    }

    /**
     * Set up ASCII grid system
     */
    setupASCIIGrid() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const gridSize = ASCIIGrid.calculateOptimalGridSize(viewportWidth, viewportHeight);
        
        this.asciiGrid = new ASCIIGrid(gridSize.width, gridSize.height, this.colorManager);
        this.scene.add(this.asciiGrid.getGroup());
        
        // Position camera to show full grid
        this.updateCameraForGrid();
    }

    /**
     * Set up interaction systems (mouse)
     */
    setupInteractionSystems() {
        // Set up mouse interaction
        this.mouseInteraction = new MouseInteraction(
            this.container,
            this.asciiGrid
        );
    }

    /**
     * Update camera to properly frame the ASCII grid
     */
    updateCameraForGrid() {
        const gridDimensions = this.asciiGrid.getDimensions();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const aspect = viewportWidth / viewportHeight;
        
        // Calculate frustum size to fit grid
        const gridWorldWidth = gridDimensions.width * gridDimensions.cellSize;
        const gridWorldHeight = gridDimensions.height * gridDimensions.cellSize;
        
        const frustumWidth = gridWorldWidth * 1; // Add 10% padding
        const frustumHeight = gridWorldHeight * 1;
        
        // Use the larger dimension to ensure everything fits
        const frustumSize = Math.max(frustumWidth / aspect, frustumHeight);
        
        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        
        this.camera.updateProjectionMatrix();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        window.addEventListener('resize', this.boundResize);
        
        // Handle visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });
    }

    /**
     * Handle window resize
     */
    handleResize() {
        // Debounce resize events
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        this.resizeTimeout = setTimeout(() => {
            this.performResize();
        }, 100);
    }

    /**
     * Perform the actual resize operation
     */
    performResize() {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // Update renderer size
        this.renderer.setSize(viewportWidth, viewportHeight);
        
        // Update grid size
        const newGridSize = ASCIIGrid.calculateOptimalGridSize(viewportWidth, viewportHeight);
        this.asciiGrid.resize(newGridSize.width, newGridSize.height);
        
        // Update interaction systems
        if (this.mouseInteraction) {
            this.mouseInteraction.updateGridDimensions();
        }
        
        // Update camera
        this.updateCameraForGrid();
    }

    /**
     * Handle theme changes
     * @param {string} newTheme - New theme name
     * @param {string} oldTheme - Previous theme name
     */
    handleThemeChange(newTheme, oldTheme) {
        if (this.asciiGrid) {
            this.asciiGrid.updateColors();
        }
    }

    /**
     * Animation loop
     * @param {number} currentTime - Current timestamp
     */
    animate(currentTime) {
        if (!this.isRunning) return;
        
        // Calculate delta time
        const deltaTime = currentTime - this.lastTime;
        
        // Limit frame rate for performance
        if (deltaTime >= this.frameInterval) {
            // Update interaction systems
            if (this.mouseInteraction) {
                this.mouseInteraction.update(deltaTime * 0.001);
            }
            
            // Create density function that only responds to mouse excitement
            const densityFunction = (x, y) => {
                const excitement = this.mouseInteraction ? this.mouseInteraction.getExcitementLevel(x, y) : 0;
                return excitement;
            };
            
            // Update ASCII grid with mouse excitement
            this.asciiGrid.updateCharacterPositions(densityFunction, this.mouseInteraction);
            
            // Render scene
            this.renderer.render(this.scene, this.camera);
            
            this.lastTime = currentTime;
            this.frameCount++;
        }
        
        // Continue animation
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    /**
     * Start the animation
     */
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.lastTime = performance.now();
        this.animationId = requestAnimationFrame((time) => this.animate(time));
    }

    /**
     * Pause the animation
     */
    pause() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * Resume the animation
     */
    resume() {
        if (!this.isRunning) {
            this.start();
        }
    }

    /**
     * Stop and cleanup the background system
     */
    stop() {
        this.pause();
        this.cleanup();
    }

    /**
     * Clean up resources
     */
    cleanup() {
        // Remove event listeners
        window.removeEventListener('resize', this.boundResize);
        
        // Clear timeouts
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
        }
        
        // Dispose of interaction systems
        if (this.mouseInteraction) {
            this.mouseInteraction.dispose();
        }
        
        // Dispose of Three.js resources
        if (this.asciiGrid) {
            this.asciiGrid.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
        
        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.asciiGrid = null;
        this.colorManager = null;
        this.mouseInteraction = null;
    }

    /**
     * Get mouse interaction instance for external use
     * @returns {MouseInteraction} Mouse interaction instance
     */
    getMouseInteraction() {
        return this.mouseInteraction;
    }
}