/**
 * Lightbox Component
 * Simple fullscreen image viewer for gallery sections
 */

class Lightbox {
  constructor() {
    this.isOpen = false;
    this.currentImage = null;
    this.images = [];
    this.currentIndex = -1;
    this.overlay = null;
    
    this.init();
  }

  init() {
    // Create lightbox overlay
    this.overlay = document.createElement('div');
    this.overlay.className = 'lightbox-overlay';
    this.overlay.style.display = 'none';
    
    this.overlay.innerHTML = `
      <div class="lightbox">
        <button class="lightbox__close" title="Close">&times;</button>
        <button class="lightbox__prev" title="Previous">‹</button>
        <button class="lightbox__next" title="Next">›</button>
        <div class="lightbox__content">
          <img class="lightbox__image" alt="">
          <div class="lightbox__info">
            <h3 class="lightbox__title"></h3>
            <p class="lightbox__description"></p>
            <div class="lightbox__meta">
              <span class="lightbox__date"></span>
              <span class="lightbox__counter"></span>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.overlay);
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.overlay.querySelector('.lightbox__close');
    const prevBtn = this.overlay.querySelector('.lightbox__prev');
    const nextBtn = this.overlay.querySelector('.lightbox__next');
    
    // Close handlers
    closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    
    // Navigation handlers
    prevBtn.addEventListener('click', () => this.showPrevious());
    nextBtn.addEventListener('click', () => this.showNext());
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!this.isOpen) return;
      
      switch (e.key) {
        case 'Escape':
          this.close();
          break;
        case 'ArrowLeft':
          this.showPrevious();
          break;
        case 'ArrowRight':
          this.showNext();
          break;
      }
    });
  }

  open(imageData, allImages = [], startIndex = 0) {
    this.images = allImages;
    this.currentIndex = startIndex;
    this.currentImage = imageData;
    
    this.updateImage();
    this.updateNavigation();
    
    this.overlay.style.display = 'flex';
    this.isOpen = true;
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Fade in animation
    setTimeout(() => {
      this.overlay.classList.add('lightbox-overlay--active');
    }, 10);
  }

  close() {
    this.overlay.classList.remove('lightbox-overlay--active');
    
    setTimeout(() => {
      this.overlay.style.display = 'none';
      this.isOpen = false;
      document.body.style.overflow = '';
    }, 300);
  }

  showPrevious() {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.currentImage = this.images[this.currentIndex];
      this.updateImage();
      this.updateNavigation();
    }
  }

  showNext() {
    if (this.currentIndex < this.images.length - 1) {
      this.currentIndex++;
      this.currentImage = this.images[this.currentIndex];
      this.updateImage();
      this.updateNavigation();
    }
  }

  updateImage() {
    if (!this.currentImage) return;
    
    const img = this.overlay.querySelector('.lightbox__image');
    const title = this.overlay.querySelector('.lightbox__title');
    const description = this.overlay.querySelector('.lightbox__description');
    const date = this.overlay.querySelector('.lightbox__date');
    const counter = this.overlay.querySelector('.lightbox__counter');
    
    // Update image
    img.src = this.currentImage.imageFile || this.currentImage.image;
    img.alt = this.currentImage.title || this.currentImage.alt || '';
    
    // Update text content
    title.textContent = this.currentImage.title || 'Untitled';
    description.textContent = this.currentImage.description || '';
    
    // Format and display date
    if (this.currentImage.date || this.currentImage.createdDate) {
      const dateObj = new Date(this.currentImage.date || this.currentImage.createdDate);
      date.textContent = dateObj.toLocaleDateString();
    } else {
      date.textContent = '';
    }
    
    // Update counter
    if (this.images.length > 1) {
      counter.textContent = `${this.currentIndex + 1} of ${this.images.length}`;
    } else {
      counter.textContent = '';
    }
  }

  updateNavigation() {
    const prevBtn = this.overlay.querySelector('.lightbox__prev');
    const nextBtn = this.overlay.querySelector('.lightbox__next');
    
    // Show/hide navigation buttons based on current position
    prevBtn.style.display = this.currentIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = this.currentIndex < this.images.length - 1 ? 'block' : 'none';
  }

  destroy() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}

// Create global lightbox instance
window.lightbox = new Lightbox();

export default Lightbox;