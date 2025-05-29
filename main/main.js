import './style.css'
import { ASCIIBackgroundManager } from './ascii-background/ASCIIBackgroundManager.js';
import './portfolio-content-manager.js';

// Global reference to ASCII background manager
let asciiBackgroundManager = null;

// Theme-based background colors (fallback for container)
const themeBackgrounds = {
  dark: '#000000',
  light: '#ffffff',
  party: '#000000' // Party mode uses black background as requested
};

// Initialize ASCII background system
function initializeASCIIBackground() {
  const container = document.getElementById('container');
  
  if (container && !asciiBackgroundManager) {
    try {
      // Initialize ASCII background manager
      asciiBackgroundManager = new ASCIIBackgroundManager(container);
      console.log('ASCII Background System initialized successfully');
    } catch (error) {
      console.error('Failed to initialize ASCII Background System:', error);
      // Fallback to simple background colors
      initializeFallbackBackground();
    }
  }
}

// Fallback background initialization (original system)
function initializeFallbackBackground() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme') || 'dark';
  
  // Set initial background color
  updateBackground(currentTheme);
  
  // Watch for theme changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
        const newTheme = body.getAttribute('data-theme');
        updateBackground(newTheme);
      }
    });
  });
  
  observer.observe(body, {
    attributes: true,
    attributeFilter: ['data-theme']
  });
}

// Update background color based on theme (fallback)
function updateBackground(theme) {
  const container = document.getElementById('container');
  const body = document.body;
  
  if (container && themeBackgrounds[theme]) {
    // Set background color with smooth transition
    container.style.background = themeBackgrounds[theme];
    body.style.background = themeBackgrounds[theme];
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeASCIIBackground);

// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeASCIIBackground);
} else {
  initializeASCIIBackground();
}

// Portfolio content manager will initialize itself
console.log('Main.js: Portfolio Content Manager system loading...');

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (asciiBackgroundManager) {
    asciiBackgroundManager.stop();
    asciiBackgroundManager = null;
  }
});

// Export for potential external access
export { asciiBackgroundManager };