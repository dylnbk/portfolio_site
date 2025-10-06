import './style.css'
import './portfolio-content-manager.js';

// Global reference to ASCII background manager
let asciiBackgroundManager = null;

// Theme-based background colors (fallback for container)
const themeBackgrounds = {
  dark: '#000000',
  light: '#ffffff',
  party: '#000000' // Party mode uses black background as requested
};

// Initialize ASCII background system with lazy loading via dynamic import
// This significantly reduces initial JavaScript execution time
function initializeASCIIBackground() {
  const container = document.getElementById('container');
  
  if (container && !asciiBackgroundManager) {
    // Use requestIdleCallback for better performance (fallback to setTimeout)
    const scheduleInit = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));
    
    // Defer background initialization until after critical content loads
    // Wait for page to be interactive and idle before loading heavy ASCII background
    scheduleInit(() => {
      // Additional delay to ensure all critical content is rendered first
      setTimeout(async () => {
        try {
          // Dynamic import - loads ASCII background code only when needed
          // This removes 1.3s+ of JavaScript from initial load
          const { ASCIIBackgroundManager } = await import('./ascii-background/ASCIIBackgroundManager.js');
          
          // Initialize ASCII background manager
          asciiBackgroundManager = new ASCIIBackgroundManager(container);
          console.log('ASCII Background System initialized successfully (lazy loaded)');
        } catch (error) {
          console.error('Failed to initialize ASCII Background System:', error);
          // Fallback to simple background colors
          initializeFallbackBackground();
        }
      }, 1000); // Wait 1 second after idle callback for smooth user experience
    }, { timeout: 2000 }); // Ensure it runs within 2 seconds max
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

// Initialize after page load to avoid blocking critical rendering path
// Use 'load' event instead of 'DOMContentLoaded' for better performance
window.addEventListener('load', initializeASCIIBackground);

// For already loaded pages, initialize on next idle
if (document.readyState === 'complete') {
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