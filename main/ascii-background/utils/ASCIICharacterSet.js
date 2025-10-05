/**
 * ASCII Character Set Management
 * Handles ASCII character selection and mapping based on density
 */

export class ASCIICharacterSet {
    constructor() {
        // ASCII characters ordered by visual density (light to dark)
        // Enhanced set for better visual shimmer and gradation
        this.characters = [
            ' ', '`', '·', '.', '˙', ',', "'", ':', '·', ';', '¨', '"', 
            '°', '-', '=', '+', '~', 'i', 'l', 'o', '*', 'x', 'v', '?', 
            'c', 'z', 'e', 'a', 'X', 'O', '%', 'Y', 'H', 'M', 'W', 'S', 
            '#', '░', '@'
        ];
        
        // Additional characters for chaos/random effects
        // Expanded set for more visual variety and shimmer
        this.chaosCharacters = [
            '!', '|', '/', '\\', '^', '~', '<', '>', '{', '}', '[', ']', 
            '=', '-', '_', '&', '$', '€', '£', '¥', '§', '©', '®', '™',
            '¿', '¡', '±', '×', '÷', '≈', '≠', '∴', '∵', '∞', '∑', '∏',
            '◊', '◌', '○', '●', '□', '△', '▽', '◇', '◆', '▲', '▼',
            '→', '←', '↑', '↓', '↔', '↕', '┼', '┤', '├', '┬', '┴', '┌',
            '└', '┐', '┘', '│', '─', '╱', '╲', '╳', '※', '☆', '★', '♦',
            '♠', '♣', '♥', '¤', '¢', '⌐', '¬', 'µ', '¶', '·', 'º', 'ª'
        ];
        
        // All available characters
        this.allCharacters = [...this.characters, ...this.chaosCharacters];
    }

    /**
     * Get character based on density value
     * @param {number} density - Density value between 0 and 1
     * @returns {string} ASCII character
     */
    getCharacterByDensity(density) {
        // Clamp density to valid range
        density = Math.max(0, Math.min(1, density));
        
        // Map density to character index
        const index = Math.floor(density * (this.characters.length - 1));
        return this.characters[index];
    }

    /**
     * Get a random character for chaos effects
     * @returns {string} Random ASCII character
     */
    getRandomCharacter() {
        const randomIndex = Math.floor(Math.random() * this.allCharacters.length);
        return this.allCharacters[randomIndex];
    }

    /**
     * Get all standard density characters
     * @returns {Array<string>} Array of characters
     */
    getAllCharacters() {
        return [...this.allCharacters];
    }

    /**
     * Get character count
     * @returns {number} Number of available characters
     */
    getCharacterCount() {
        return this.allCharacters.length;
    }

    /**
     * Get density value for a character
     * @param {string} character - ASCII character
     * @returns {number} Density value between 0 and 1
     */
    getDensityForCharacter(character) {
        const index = this.characters.indexOf(character);
        if (index === -1) {
            // Character not in density array, return random value
            return Math.random();
        }
        return index / (this.characters.length - 1);
    }

    /**
     * Check if character is valid
     * @param {string} character - ASCII character to check
     * @returns {boolean} True if character is valid
     */
    isValidCharacter(character) {
        return this.allCharacters.includes(character);
    }

    /**
     * Get characters suitable for specific density range
     * @param {number} minDensity - Minimum density (0-1)
     * @param {number} maxDensity - Maximum density (0-1)
     * @returns {Array<string>} Array of characters in range
     */
    getCharactersInDensityRange(minDensity, maxDensity) {
        const minIndex = Math.floor(minDensity * (this.characters.length - 1));
        const maxIndex = Math.ceil(maxDensity * (this.characters.length - 1));
        
        return this.characters.slice(minIndex, maxIndex + 1);
    }

    /**
     * Get random character from density range
     * @param {number} minDensity - Minimum density (0-1)
     * @param {number} maxDensity - Maximum density (0-1)
     * @returns {string} Random character from range
     */
    getRandomCharacterFromRange(minDensity, maxDensity) {
        const charactersInRange = this.getCharactersInDensityRange(minDensity, maxDensity);
        const randomIndex = Math.floor(Math.random() * charactersInRange.length);
        return charactersInRange[randomIndex];
    }
}