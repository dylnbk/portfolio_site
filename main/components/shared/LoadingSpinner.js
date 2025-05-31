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
}

export default LoadingSpinner;