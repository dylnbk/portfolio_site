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

let asciiInitHooked = false;

/**
 * Load Three.js ASCII background after first interaction, or after idle fallback,
 * so initial main-thread work stays available for LCP and input.
 */
function initializeASCIIBackground() {
  if (asciiInitHooked) return;
  asciiInitHooked = true;

  const container = document.getElementById('container');
  if (!container) return;

  const scheduleInit = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

  let fallbackTimer = null;
  const clearFallback = () => {
    if (fallbackTimer != null) {
      clearTimeout(fallbackTimer);
      fallbackTimer = null;
    }
  };

  const startAscii = async () => {
    if (asciiBackgroundManager) return;
    try {
      const { ASCIIBackgroundManager } = await import('./ascii-background/ASCIIBackgroundManager.js');
      asciiBackgroundManager = new ASCIIBackgroundManager(container);
    } catch (error) {
      console.error('Failed to initialize ASCII Background System:', error);
      initializeFallbackBackground();
    }
  };

  const onInteract = () => {
    window.removeEventListener('pointerdown', onInteract);
    window.removeEventListener('keydown', onInteract);
    clearFallback();
    scheduleInit(() => {
      setTimeout(startAscii, 0);
    }, { timeout: 3000 });
  };

  window.addEventListener('pointerdown', onInteract, { passive: true });
  window.addEventListener('keydown', onInteract, { passive: true });

  scheduleInit(() => {
    fallbackTimer = setTimeout(() => {
      fallbackTimer = null;
      startAscii();
    }, 4500);
  }, { timeout: 6000 });
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

const runAsciiWhenLoaded = () => initializeASCIIBackground();

if (document.readyState === 'complete') {
  runAsciiWhenLoaded();
} else {
  window.addEventListener('load', runAsciiWhenLoaded);
}

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
