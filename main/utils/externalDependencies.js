/**
 * Loads marked + DOMPurify via dynamic import (Vite-bundled, long cache on deploy).
 */

let markedLoaded = false;
let dompurifyLoaded = false;
let loadingPromise = null;

export async function loadExternalDependencies() {
  if (loadingPromise) {
    return loadingPromise;
  }

  if (markedLoaded && dompurifyLoaded) {
    return Promise.resolve();
  }

  loadingPromise = (async () => {
    try {
      const [markedMod, dompurifyMod] = await Promise.all([
        import('marked'),
        import('dompurify'),
      ]);
      window.marked = markedMod.marked;
      window.DOMPurify = dompurifyMod.default;
      markedLoaded = true;
      dompurifyLoaded = true;
    } catch (err) {
      loadingPromise = null;
      throw err;
    }
  })();

  return loadingPromise;
}

export function areDependenciesLoaded() {
  return (
    markedLoaded &&
    dompurifyLoaded &&
    typeof window.marked !== 'undefined' &&
    typeof window.DOMPurify !== 'undefined'
  );
}
