/**
 * Color Manager for ASCII Background
 * Handles theme detection and color management
 */

export class ColorManager {
    constructor() {
        this.currentTheme = 'dark';
        this.themeObservers = [];
        
        // Theme color definitions
        this.themeColors = {
            dark: {
                ascii: '#ffffff',
                background: '#000000'
            },
            light: {
                ascii: '#000000',
                background: '#ffffff'
            }
        };
    }

    /**
     * Detect current theme from DOM
     */
    detectThemeFromDOM() {
        const body = document.body;
        const theme = body.getAttribute('data-theme') || 'dark';
        this.currentTheme = theme;
        return theme;
    }

    /**
     * Get ASCII color for current theme
     * @returns {string} CSS color string
     */
    getASCIIColor() {
        return this.themeColors[this.currentTheme]?.ascii || '#ffffff';
    }

    /**
     * Get ASCII color as Three.js hex color
     * @returns {number} Hex color for Three.js
     */
    getThreeJSASCIIColor() {
        const colorString = this.getASCIIColor();
        // Convert CSS color to hex number
        return parseInt(colorString.replace('#', '0x'));
    }

    /**
     * Get background color for current theme
     * @returns {string} CSS color string
     */
    getBackgroundColor() {
        return this.themeColors[this.currentTheme]?.background || '#000000';
    }

    /**
     * Observe theme changes
     * @param {Function} callback - Callback function (newTheme, oldTheme) => void
     */
    observeThemeChanges(callback) {
        this.themeObservers.push(callback);
        
        // Set up mutation observer if not already done
        if (!this.mutationObserver) {
            this.setupThemeObserver();
        }
    }

    /**
     * Set up mutation observer for theme changes
     */
    setupThemeObserver() {
        const body = document.body;
        
        this.mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    const newTheme = body.getAttribute('data-theme') || 'dark';
                    const oldTheme = this.currentTheme;
                    
                    if (newTheme !== oldTheme) {
                        this.currentTheme = newTheme;
                        this.notifyThemeChange(newTheme, oldTheme);
                    }
                }
            });
        });
        
        this.mutationObserver.observe(body, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    /**
     * Notify all observers of theme change
     * @param {string} newTheme - New theme name
     * @param {string} oldTheme - Previous theme name
     */
    notifyThemeChange(newTheme, oldTheme) {
        this.themeObservers.forEach(callback => {
            try {
                callback(newTheme, oldTheme);
            } catch (error) {
                console.error('Error in theme change callback:', error);
            }
        });
    }

    /**
     * Get current theme
     * @returns {string} Current theme name
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * Cleanup resources
     */
    dispose() {
        if (this.mutationObserver) {
            this.mutationObserver.disconnect();
            this.mutationObserver = null;
        }
        this.themeObservers = [];
    }
}