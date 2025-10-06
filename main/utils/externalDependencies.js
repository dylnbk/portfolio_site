/**
 * External Dependencies Loader
 * Lazy loads marked.js and DOMPurify only when needed
 * This improves initial page load performance
 */

let markedLoaded = false;
let dompurifyLoaded = false;
let loadingPromise = null;

/**
 * Load external dependencies (marked.js and DOMPurify) on-demand
 * Returns a promise that resolves when both are loaded
 */
export async function loadExternalDependencies() {
  // Return existing promise if already loading
  if (loadingPromise) {
    return loadingPromise;
  }

  // Return immediately if already loaded
  if (markedLoaded && dompurifyLoaded) {
    return Promise.resolve();
  }

  loadingPromise = new Promise((resolve, reject) => {
    let markedScriptLoaded = false;
    let dompurifyScriptLoaded = false;

    const checkBothLoaded = () => {
      if (markedScriptLoaded && dompurifyScriptLoaded) {
        markedLoaded = true;
        dompurifyLoaded = true;
        console.log('External dependencies (marked, DOMPurify) loaded successfully');
        resolve();
      }
    };

    // Check if already loaded globally (from old script tags)
    if (typeof window.marked !== 'undefined') {
      markedScriptLoaded = true;
    }
    if (typeof window.DOMPurify !== 'undefined') {
      dompurifyScriptLoaded = true;
    }

    if (markedScriptLoaded && dompurifyScriptLoaded) {
      markedLoaded = true;
      dompurifyLoaded = true;
      resolve();
      return;
    }

    // Load marked.js
    if (!markedScriptLoaded) {
      const markedScript = document.createElement('script');
      markedScript.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
      markedScript.onload = () => {
        markedScriptLoaded = true;
        checkBothLoaded();
      };
      markedScript.onerror = () => {
        console.error('Failed to load marked.js');
        reject(new Error('Failed to load marked.js'));
      };
      document.head.appendChild(markedScript);
    }

    // Load DOMPurify
    if (!dompurifyScriptLoaded) {
      const dompurifyScript = document.createElement('script');
      dompurifyScript.src = 'https://cdn.jsdelivr.net/npm/dompurify@2.4.0/dist/purify.min.js';
      dompurifyScript.onload = () => {
        dompurifyScriptLoaded = true;
        checkBothLoaded();
      };
      dompurifyScript.onerror = () => {
        console.error('Failed to load DOMPurify');
        reject(new Error('Failed to load DOMPurify'));
      };
      document.head.appendChild(dompurifyScript);
    }
  });

  return loadingPromise;
}

/**
 * Check if dependencies are loaded
 */
export function areDependenciesLoaded() {
  return markedLoaded && dompurifyLoaded && 
         typeof window.marked !== 'undefined' && 
         typeof window.DOMPurify !== 'undefined';
}
