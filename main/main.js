import './style.css'

// Theme-based background colors
const themeBackgrounds = {
  dark: '#000000',
  light: '#ffffff', 
  party: '#000000' // Party mode uses black background as requested
};

// Initialize background based on current theme
function initializeBackground() {
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

// Update background color based on theme
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
document.addEventListener('DOMContentLoaded', initializeBackground);

// Also initialize immediately in case DOM is already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBackground);
} else {
  initializeBackground();
}