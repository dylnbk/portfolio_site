import './style.css'
import './portfolio-content-manager.js';

// Global reference to ASCII background manager
let asciiBackgroundManager = null;
let asciiStartPromise = null;

// Theme-based background colors (fallback for container)
const themeBackgrounds = {
  dark: '#000000',
  light: '#ffffff',
  party: '#000000' // Party mode uses black background as requested
};

/**
 * Single-flight loader for Three.js + ASCII (avoids parallel double init).
 */
function startAsciiBackground() {
  const container = document.getElementById('container');
  if (!container || asciiBackgroundManager) {
    return Promise.resolve();
  }
  if (asciiStartPromise) {
    return asciiStartPromise;
  }
  asciiStartPromise = (async () => {
    try {
      const { ASCIIBackgroundManager } = await import('./ascii-background/ASCIIBackgroundManager.js');
      if (!asciiBackgroundManager) {
        asciiBackgroundManager = new ASCIIBackgroundManager(container);
      }
    } catch (error) {
      console.error('Failed to initialize ASCII Background System:', error);
      asciiStartPromise = null;
      initializeFallbackBackground();
    }
  })();
  return asciiStartPromise;
}

let asciiScheduleArm = false;

/**
 * Begin ASCII background soon after main UI is visible, without blocking first paint:
 * - requestIdleCallback with a low timeout so work starts even if the main thread stays busy
 * - first pointer/key still bumps start earlier if the user interacts first
 */
function armASCIIBackgroundSchedule() {
  if (asciiScheduleArm) return;
  asciiScheduleArm = true;

  const scheduleInit = window.requestIdleCallback || ((cb) => setTimeout(cb, 1));

  const kick = () => {
    scheduleInit(() => {
      startAsciiBackground();
    }, { timeout: 700 });
  };

  kick();

  const boost = () => {
    window.removeEventListener('pointerdown', boost);
    window.removeEventListener('keydown', boost);
    startAsciiBackground();
  };
  window.addEventListener('pointerdown', boost, { passive: true });
  window.addEventListener('keydown', boost, { passive: true });
}

// When loading coordinator reveals content — earlier than window "load" on slow networks
document.addEventListener(
  'portfolio:ui-ready',
  () => {
    armASCIIBackgroundSchedule();
  },
  { once: true }
);

// Fallback if the event never fires (e.g. coordinator bypassed)
window.addEventListener('load', () => {
  armASCIIBackgroundSchedule();
});

console.log('Main.js: Portfolio Content Manager system loading...');

// Fallback background initialization (original system)
function initializeFallbackBackground() {
  const body = document.body;
  const currentTheme = body.getAttribute('data-theme') || 'dark';

  updateBackground(currentTheme);

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
    container.style.background = themeBackgrounds[theme];
    body.style.background = themeBackgrounds[theme];
  }
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (asciiBackgroundManager) {
    asciiBackgroundManager.stop();
    asciiBackgroundManager = null;
  }
});

// Export for potential external access
export { asciiBackgroundManager };
