/**
 * Loading Spinner Component
 * Provides consistent loading indicators across all content sections
 */

class LoadingSpinner {
  static create(size = 'medium', text = 'Loading...') {
    const spinner = document.createElement('div');
    spinner.className = `loading-spinner loading-spinner--${size}`;
    
    spinner.innerHTML = `
      <div class="loading-spinner__dots">
        <div class="loading-spinner__dot"></div>
        <div class="loading-spinner__dot"></div>
        <div class="loading-spinner__dot"></div>
      </div>
      <div class="loading-spinner__text">${text}</div>
    `;
    
    return spinner;
  }

  static createMicro() {
    const spinner = document.createElement('div');
    spinner.className = 'loading-spinner--micro';
    
    spinner.innerHTML = `
      <div class="loading-spinner__dots loading-spinner__dots--micro">
        <div class="loading-spinner__dot loading-spinner__dot--micro"></div>
        <div class="loading-spinner__dot loading-spinner__dot--micro"></div>
        <div class="loading-spinner__dot loading-spinner__dot--micro"></div>
      </div>
    `;
    
    return spinner;
  }

  static createInline(text = 'Loading...') {
    const spinner = document.createElement('span');
    spinner.className = 'loading-spinner--inline';
    spinner.textContent = text;
    return spinner;
  }

  static remove(container) {
    if (!container) return;
    const spinners = container.querySelectorAll('.loading-spinner, .loading-spinner--inline, .loading-spinner--micro');
    spinners.forEach(spinner => spinner.remove());
  }

  static show(container, size = 'medium', text = 'Loading...') {
    if (!container) return null;
    
    this.remove(container);
    const spinner = this.create(size, text);
    container.appendChild(spinner);
    return spinner;
  }

  static createErrorState(message = 'Failed to load content') {
    const error = document.createElement('div');
    error.className = 'loading-error';
    error.innerHTML = `
      <div class="loading-error__icon">⚠️</div>
      <div class="loading-error__message">${message}</div>
      <button class="loading-error__retry" onclick="location.reload()">Retry</button>
    `;
    return error;
  }

  // Gallery-specific loading indicators
  static createGalleryContentLoading(contentType = 'content') {
    const loader = document.createElement('div');
    loader.className = 'gallery-content-loading';
    loader.innerHTML = `
      <div class="gallery-content-loading__dots">
        <div class="gallery-content-loading__dot"></div>
        <div class="gallery-content-loading__dot"></div>
        <div class="gallery-content-loading__dot"></div>
      </div>
      <div class="gallery-content-loading__text">Loading ${contentType}...</div>
    `;
    return loader;
  }

  static createThumbnailLoadingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'gallery-item__thumbnail-loading';
    indicator.innerHTML = `
      <div class="gallery-item__thumbnail-loading__indicator"></div>
    `;
    return indicator;
  }

  static createImageLoadingShimmer() {
    const shimmer = document.createElement('div');
    shimmer.className = 'gallery-item__image-loading';
    return shimmer;
  }

  static createSkeletonItem(aspectRatio = '4/3') {
    const skeleton = document.createElement('div');
    skeleton.className = 'gallery-item gallery-item--skeleton';
    skeleton.style.aspectRatio = aspectRatio;
    skeleton.style.minHeight = '200px';
    return skeleton;
  }

  static createLoadingProgress(loaded = 0, total = 100, text = 'Loading...') {
    const progress = document.createElement('div');
    progress.className = 'gallery-loading-progress';
    progress.innerHTML = `
      <div class="gallery-loading-progress__bar">
        <div class="gallery-loading-progress__fill" style="width: ${(loaded / total) * 100}%"></div>
      </div>
      <span>${text}</span>
    `;
    return progress;
  }

  // Update existing methods to handle gallery-specific spinners
  static remove(container) {
    if (!container) return;
    const spinners = container.querySelectorAll(`
      .loading-spinner,
      .loading-spinner--inline,
      .loading-spinner--micro,
      .gallery-content-loading,
      .gallery-item__thumbnail-loading,
      .gallery-item__image-loading,
      .gallery-loading-progress
    `);
    spinners.forEach(spinner => spinner.remove());
  }
}

export default LoadingSpinner;