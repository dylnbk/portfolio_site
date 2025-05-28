/**
 * ASCII Grid Management and Character Rendering
 * Uses Three.js InstancedMesh for high-performance character rendering
 */

import * as THREE from 'three';
import { ASCIICharacterSet } from './utils/ASCIICharacterSet.js';

export class ASCIIGrid {
    constructor(width, height, colorManager) {
        this.width = width;
        this.height = height;
        this.colorManager = colorManager;
        this.characterSet = new ASCIICharacterSet();
        
        // Grid configuration
        this.cellSize = 10; // Size of each character cell
        this.instancedMeshes = new Map(); // Map of character -> InstancedMesh
        this.characterInstances = new Map(); // Map of character -> instance data
        this.group = new THREE.Group();
        
        // Font configuration
        this.fontFamily = 'Inconsolata, monospace';
        this.fontSize = 12;
        
        this.initializeGrid();
    }

    /**
     * Initialize the ASCII grid with character meshes
     */
    initializeGrid() {
        this.createCharacterMeshes();
        this.updateCharacterPositions();
    }

    /**
     * Create instanced meshes for each ASCII character
     */
    createCharacterMeshes() {
        const characters = this.characterSet.getAllCharacters();
        const maxInstances = this.width * this.height;
        
        characters.forEach(char => {
            // Create canvas texture for character
            const texture = this.createCharacterTexture(char);
            
            // Create material
            const material = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                alphaTest: 0.1,
                color: this.colorManager.getThreeJSASCIIColor()
            });
            
            // Create geometry (simple plane)
            const geometry = new THREE.PlaneGeometry(this.cellSize, this.cellSize);
            
            // Create instanced mesh
            const instancedMesh = new THREE.InstancedMesh(geometry, material, maxInstances);
            instancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            instancedMesh.count = 0; // Start with no visible instances
            
            this.instancedMeshes.set(char, instancedMesh);
            this.characterInstances.set(char, []);
            this.group.add(instancedMesh);
        });
    }

    /**
     * Create texture for a single character
     * @param {string} character - ASCII character to render
     * @returns {THREE.CanvasTexture} Texture containing the character
     */
    createCharacterTexture(character) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        // Set canvas size
        const size = 64; // Higher resolution for better quality
        canvas.width = size;
        canvas.height = size;
        
        // Configure font
        context.font = `${size * 0.8}px ${this.fontFamily}`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = '#ffffff';
        
        // Clear canvas
        context.clearRect(0, 0, size, size);
        
        // Draw character
        context.fillText(character, size / 2, size / 2);
        
        // Create texture
        const texture = new THREE.CanvasTexture(canvas);
        texture.generateMipmaps = false;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        return texture;
    }

    /**
     * Update character positions and visibility based on density data
     * @param {Function} densityFunction - Function that returns density for x,y coordinates
     * @param {MouseInteraction} mouseInteraction - Mouse interaction instance for excitement effects
     */
    updateCharacterPositions(densityFunction = null, mouseInteraction = null) {
        // Clear all instances
        this.characterInstances.forEach((instances, char) => {
            instances.length = 0;
        });
        
        // Calculate grid positions
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                let density = 0;
                
                if (densityFunction) {
                    density = densityFunction(x, y);
                }
                
                // Apply mouse excitement effects to density threshold
                let threshold = 0.05;
                if (mouseInteraction) {
                    const excitement = mouseInteraction.getExcitementLevel(x, y);
                    threshold = Math.max(0.01, threshold - excitement * 0.04); // Lower threshold when excited
                }
                
                // Only show characters if density is above threshold
                if (density > threshold) {
                    // Use density-based character
                    let character = this.characterSet.getCharacterByDensity(density);
                    
                    // Apply chaos effects from mouse interaction
                    if (mouseInteraction) {
                        const chaosMultiplier = mouseInteraction.getChaosMultiplier(x, y);
                        if (chaosMultiplier > 1 && Math.random() < (chaosMultiplier - 1) * 0.1) {
                            // Random character substitution for chaos effect
                            character = this.characterSet.getRandomCharacter();
                        }
                    }
                    
                    const instances = this.characterInstances.get(character);
                    
                    if (instances) {
                        // Calculate world position
                        const worldX = (x - this.width / 2) * this.cellSize;
                        const worldY = (this.height / 2 - y) * this.cellSize;
                        
                        instances.push({
                            x: worldX,
                            y: worldY,
                            z: 0,
                            density: density
                        });
                    }
                }
            }
        }
        
        // Update instanced meshes
        this.updateInstancedMeshes();
    }

    /**
     * Update the instanced meshes with current character data
     */
    updateInstancedMeshes() {
        this.characterInstances.forEach((instances, char) => {
            const instancedMesh = this.instancedMeshes.get(char);
            if (!instancedMesh) return;
            
            instancedMesh.count = instances.length;
            
            // Use standard material
            const defaultColor = this.colorManager.getThreeJSASCIIColor();
            instancedMesh.material.color.setHex(defaultColor);
            
            // Update instance matrices
            const matrix = new THREE.Matrix4();
            instances.forEach((instance, index) => {
                matrix.makeTranslation(instance.x, instance.y, instance.z);
                instancedMesh.setMatrixAt(index, matrix);
            });
            
            instancedMesh.instanceMatrix.needsUpdate = true;
        });
    }

    /**
     * Update colors based on current theme
     */
    updateColors() {
        const color = this.colorManager.getThreeJSASCIIColor();
        
        this.instancedMeshes.forEach(instancedMesh => {
            instancedMesh.material.color.setHex(color);
        });
    }

    /**
     * Resize the grid
     * @param {number} newWidth - New grid width
     * @param {number} newHeight - New grid height
     */
    resize(newWidth, newHeight) {
        this.width = newWidth;
        this.height = newHeight;
        
        // Recreate meshes if needed (for now, just update dimensions)
        // In a more optimized version, we might want to recreate meshes
        // if the new size significantly exceeds the current capacity
    }

    /**
     * Get the Three.js group containing all character meshes
     * @returns {THREE.Group} Group object
     */
    getGroup() {
        return this.group;
    }

    /**
     * Dispose of all resources
     */
    dispose() {
        this.instancedMeshes.forEach(instancedMesh => {
            instancedMesh.geometry.dispose();
            instancedMesh.material.map?.dispose();
            instancedMesh.material.dispose();
        });
        
        this.instancedMeshes.clear();
        this.characterInstances.clear();
    }

    /**
     * Get grid dimensions
     * @returns {Object} Object with width and height
     */
    getDimensions() {
        return {
            width: this.width,
            height: this.height,
            cellSize: this.cellSize
        };
    }

    /**
     * Calculate optimal grid size based on container dimensions
     * @param {number} containerWidth - Container width in pixels
     * @param {number} containerHeight - Container height in pixels
     * @returns {Object} Optimal grid dimensions
     */
    static calculateOptimalGridSize(containerWidth, containerHeight) {
        const cellSize = 10;
        const width = Math.floor(containerWidth / cellSize);
        const height = Math.floor(containerHeight / cellSize);
        
        // Ensure minimum and maximum grid sizes
        return {
            width: Math.max(20, Math.min(200, width)),
            height: Math.max(15, Math.min(120, height))
        };
    }
}