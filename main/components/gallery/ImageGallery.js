/**
 * Image Gallery Component
 * One image per row layout for Art/Photos sections
 */

import LoadingSpinner from '../shared/LoadingSpinner.js';
import Lightbox from './Lightbox.js';

class ImageGallery {
  constructor(container, contentType) {
    this.container = container;
    this.contentType = contentType; // 'art' or 'photos'
    this.images = [];
    this.lightbox = new Lightbox();
    this.intersectionObserver = null;
    this.thumbnailObserver = null;
    this.visibleItemsCount = 0;
    this.itemsPerBatch = 5; // Initial viewport items
    this.layoutMode = 1; // 1, 2, or 3 columns
    
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="image-gallery">
        <div class="image-gallery__container">
          <div class="image-gallery__grid gallery-layout--${this.layoutMode}-col" id="imageGrid">
            ${this.createContentLoadingIndicator()}
          </div>
        </div>
        <div class="gallery-layout-switcher" id="layoutSwitcher">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.9307 4.01587H14.7655C14.3582 2.84239 13.2428 2 11.9307 2C10.6185 2 9.50313 2.84239 9.09581 4.01587H6.93066C5.27381 4.01587 3.93066 5.35901 3.93066 7.01587V9.21205C2.80183 9.64283 2 10.7357 2 12.0159C2 13.296 2.80183 14.3889 3.93066 14.8197V17.0159C3.93066 18.6727 5.27381 20.0159 6.93066 20.0159H9.08467C9.48247 21.2064 10.6064 22.0645 11.9307 22.0645C13.255 22.0645 14.3789 21.2064 14.7767 20.0159H16.9307C18.5875 20.0159 19.9307 18.6727 19.9307 17.0159V14.8446C21.095 14.4322 21.929 13.3214 21.929 12.0159C21.929 10.7103 21.095 9.5995 19.9307 9.18718V7.01587C19.9307 5.35901 18.5875 4.01587 16.9307 4.01587ZM5.93066 14.8687V17.0159C5.93066 17.5682 6.37838 18.0159 6.93066 18.0159H9.11902C9.54426 16.8761 10.6427 16.0645 11.9307 16.0645C13.2187 16.0645 14.3171 16.8761 14.7423 18.0159H16.9307C17.4829 18.0159 17.9307 17.5682 17.9307 17.0159V14.8458C16.7646 14.4344 15.929 13.3227 15.929 12.0159C15.929 10.709 16.7646 9.59732 17.9307 9.18597V7.01587C17.9307 6.46358 17.4829 6.01587 16.9307 6.01587H14.7543C14.338 7.17276 13.2309 8 11.9307 8C10.6304 8 9.52331 7.17276 9.10703 6.01587H6.93066C6.37838 6.01587 5.93066 6.46358 5.93066 7.01587V9.16302C7.13193 9.55465 8 10.6839 8 12.0159C8 13.3479 7.13193 14.4771 5.93066 14.8687Z" fill="currentColor"/>
          </svg>
        </div>
        <div class="gallery-loading-progress" id="loadingProgress">
          <div class="gallery-loading-progress__bar">
            <div class="gallery-loading-progress__fill" id="loadingProgressFill"></div>
          </div>
          <span id="loadingProgressText">Loading...</span>
        </div>
      </div>
    `;
    
    this.setupLayoutSwitcher();
  }

  // Create minimalist content loading indicator
  createContentLoadingIndicator() {
    return `
      <div class="gallery-content-loading">
        <div class="gallery-content-loading__dots">
          <div class="gallery-content-loading__dot"></div>
          <div class="gallery-content-loading__dot"></div>
          <div class="gallery-content-loading__dot"></div>
        </div>
        <div class="gallery-content-loading__text">Loading ${this.contentType}...</div>
      </div>
    `;
  }

  // Show/hide loading progress indicator
  updateLoadingProgress(loaded, total, text = 'Loading...') {
    const progressEl = this.container.querySelector('#loadingProgress');
    const fillEl = this.container.querySelector('#loadingProgressFill');
    const textEl = this.container.querySelector('#loadingProgressText');
    
    if (progressEl && fillEl && textEl) {
      if (loaded >= total) {
        // Show completion briefly before hiding
        progressEl.classList.add('gallery-loading-progress--active');
        fillEl.style.width = '100%';
        textEl.textContent = text;
        
        // Hide after 1 second to let users see completion
        setTimeout(() => {
          progressEl.classList.remove('gallery-loading-progress--active');
        }, 1000);
      } else {
        progressEl.classList.add('gallery-loading-progress--active');
        const percentage = (loaded / total) * 100;
        fillEl.style.width = `${percentage}%`;
        textEl.textContent = text;
      }
    }
  }

  async loadImages(images) {
    this.images = images;
    const gridEl = this.container.querySelector('#imageGrid');
    
    if (images.length === 0) {
      gridEl.innerHTML = `<div class="image-gallery__empty">No ${this.contentType} available</div>`;
      return;
    }

    // Show loading progress
    this.updateLoadingProgress(0, images.length, 'Preparing images...');

    // Simple approach: render all images with immediate loading
    await this.renderSimpleGallery(gridEl);
    
    // Hide loading progress after all items are rendered
    this.updateLoadingProgress(images.length, images.length, 'Images loaded');
  }

  async renderSimpleGallery(gridEl) {
    // Create simple gallery items that actually work
    const galleryHTML = this.images.map((image, index) => {
      const imageUrl = image.imageFile || image.image;
      const title = image.title || 'Gallery image';
      
      // Skip items without valid image URLs
      if (!imageUrl) {
        return '';
      }
      
      return `
        <div class="gallery-item" data-index="${index}">
          <div class="gallery-item__image-container">
            <picture class="gallery-item__picture">
              <div class="gallery-item__image-loading"></div>
              <img
                class="gallery-item__image gallery-item__image--loading"
                src="${imageUrl}"
                alt="${title}"
                loading="lazy"
                decoding="async"
                onload="this.classList.remove('gallery-item__image--loading'); this.classList.add('gallery-item__image--loaded'); this.parentNode.querySelector('.gallery-item__image-loading')?.remove();"
                onerror="this.classList.remove('gallery-item__image--loading'); this.classList.add('gallery-item__image--error');"
              >
            </picture>
          </div>
        </div>
      `;
    }).filter(html => html !== '').join('');
    
    // Set all HTML at once
    gridEl.innerHTML = galleryHTML;
    
    // Add click handlers for all items
    this.addEventListeners(gridEl, 0, this.images.length);
    
    this.visibleItemsCount = this.images.length;
  }

  async createImageHTML(image, index, isInitial = false) {
    const imageUrl = image.imageFile || image.image;
    
    // Calculate dimensions for aspect ratio preservation
    const dimensions = await this.calculateImageDimensions(imageUrl);
    const responsiveImage = await this.createResponsiveImageUrl(imageUrl);
    
    // Generate actual thumbnail for initial load
    const thumbnailUrl = isInitial ? await this.generateThumbnailUrl(imageUrl, index) : imageUrl;
    
    return `
      <div class="gallery-item" data-index="${index}">
        <div class="gallery-item__image-container" style="aspect-ratio: ${dimensions.width}/${dimensions.height};">
          ${await this.createPictureElement(responsiveImage, thumbnailUrl, image.title, isInitial, dimensions)}
        </div>
      </div>
    `;
  }

  async createPictureElement(responsiveImage, thumbnailUrl, title, isInitial = false, dimensions) {
    const alt = title || 'Gallery image';
    
    // For progressive loading, start with thumbnail and upgrade to full resolution
    const loadingClass = isInitial ? 'gallery-item__image--thumbnail' : 'gallery-item__image--placeholder';
    
    // Add glow loading overlay for images without initial source
    const glowOverlay = !isInitial ? '<div class="gallery-item__image-loading"></div>' : '';
    
    // Create responsive picture element with WebP support and srcset
    return `
      <picture class="gallery-item__picture">
        ${glowOverlay}
        <img
          class="gallery-item__image ${loadingClass} gallery-item__image--loading"
          ${isInitial ? `src="${thumbnailUrl}"` : ''}
          data-src="${responsiveImage.src}"
          data-srcset="${responsiveImage.srcset}"
          data-sizes="${responsiveImage.sizes}"
          data-thumbnail="${thumbnailUrl}"
          alt="${alt}"
          width="${dimensions.width}"
          height="${dimensions.height}"
          loading="lazy"
          decoding="async"
        >
      </picture>
    `;
  }

  async generateThumbnailUrl(imageUrl, index) {
    // Show thumbnail generation indicator
    this.showThumbnailLoadingIndicator(index);
    
    // Generate actual thumbnail using Canvas API blur-up technique
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate thumbnail dimensions (max 200px width, maintain aspect ratio)
          const maxWidth = 200;
          const aspectRatio = img.height / img.width;
          canvas.width = Math.min(maxWidth, img.width);
          canvas.height = canvas.width * aspectRatio;
          
          // Draw and blur the image
          ctx.filter = 'blur(2px)';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Convert to low-quality JPEG data URL
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.6);
          
          // Hide thumbnail generation indicator
          this.hideThumbnailLoadingIndicator(index);
          
          resolve(thumbnailUrl);
        } catch (error) {
          // Fallback to original image if canvas fails
          console.warn('Canvas thumbnail generation failed:', error);
          this.hideThumbnailLoadingIndicator(index);
          resolve(imageUrl);
        }
      };
      
      img.onerror = () => {
        // Fallback to original image if loading fails
        this.hideThumbnailLoadingIndicator(index);
        resolve(imageUrl);
      };
      
      img.src = imageUrl;
    });
  }

  // Show thumbnail loading indicator for specific image
  showThumbnailLoadingIndicator(index) {
    const galleryItem = this.container.querySelector(`[data-index="${index}"]`);
    if (galleryItem) {
      const imageContainer = galleryItem.querySelector('.gallery-item__image-container');
      if (imageContainer) {
        const indicator = document.createElement('div');
        indicator.className = 'gallery-item__thumbnail-loading gallery-item__thumbnail-loading--active';
        indicator.innerHTML = '<div class="gallery-item__thumbnail-loading__indicator"></div>';
        imageContainer.appendChild(indicator);
      }
    }
  }

  // Hide thumbnail loading indicator for specific image
  hideThumbnailLoadingIndicator(index) {
    const galleryItem = this.container.querySelector(`[data-index="${index}"]`);
    if (galleryItem) {
      const indicator = galleryItem.querySelector('.gallery-item__thumbnail-loading');
      if (indicator) {
        indicator.classList.remove('gallery-item__thumbnail-loading--active');
        setTimeout(() => indicator.remove(), 200);
      }
    }
  }

  // Add method to detect WebP support
  detectWebPSupport() {
    return new Promise((resolve) => {
      const webp = new Image();
      webp.onload = webp.onerror = () => {
        resolve(webp.height === 2);
      };
      webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // Enhanced method to create responsive image with WebP support
  async createResponsiveImageUrl(imageUrl) {
    const supportsWebP = await this.detectWebPSupport();
    const extension = imageUrl.split('.').pop().toLowerCase();
    
    // Generate different sizes for responsive loading
    const sizes = [400, 800, 1200];
    const srcset = [];
    
    for (const size of sizes) {
      if (supportsWebP && ['jpg', 'jpeg', 'png'].includes(extension)) {
        // In a real implementation, this would call a server endpoint
        // For now, we'll use the original image but structure for future enhancement
        srcset.push(`${imageUrl} ${size}w`);
      } else {
        srcset.push(`${imageUrl} ${size}w`);
      }
    }
    
    return {
      src: imageUrl,
      srcset: srcset.join(', '),
      sizes: '(max-width: 650px) 100vw, (max-width: 1200px) 50vw, 33vw'
    };
  }

  // Method to calculate image aspect ratio for layout stability
  async calculateImageDimensions(imageUrl) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height,
          aspectRatio: img.height / img.width
        });
      };
      img.onerror = () => {
        // Fallback to standard aspect ratio
        resolve({
          width: 800,
          height: 600,
          aspectRatio: 0.75
        });
      };
      img.src = imageUrl;
    });
  }

  addEventListeners(gridEl, startIndex, endIndex) {
    const items = gridEl.querySelectorAll('.gallery-item');
    
    for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
      const itemEl = items[i];
      const imageEl = itemEl.querySelector('.gallery-item__image');
      const index = parseInt(itemEl.dataset.index);
      
      if (imageEl && !itemEl.classList.contains('gallery-item--placeholder')) {
        const openLightbox = () => {
          this.openLightbox(index);
        };
        
        imageEl.addEventListener('click', openLightbox);
        
        // Add proper load event handler to replace inline onload
        imageEl.addEventListener('load', () => {
          this.handleImageLoad(imageEl);
        });
        
        // Enhanced error handling to replace inline onerror
        imageEl.addEventListener('error', () => {
          this.handleImageError(imageEl);
        });
      }
    }
  }

  // Handle image load events - replace inline onload handler
  handleImageLoad(imageEl) {
    // Remove loading states
    imageEl.classList.remove('gallery-item__image--loading', 'gallery-item__image--placeholder');
    imageEl.classList.add('gallery-item__image--loaded');
    
    // Remove glow overlay if present
    const glowOverlay = imageEl.closest('.gallery-item__picture').querySelector('.gallery-item__image-loading');
    if (glowOverlay) {
      glowOverlay.remove();
    }
    
    // Dispatch load event for any necessary layout updates
    imageEl.closest('.image-gallery').dispatchEvent(new CustomEvent('imageLoaded', { detail: { img: imageEl } }));
  }

  // Handle image error events - replace inline onerror handler
  handleImageError(imageEl) {
    imageEl.src = this.getPlaceholderImage();
    imageEl.alt = 'Image not found';
    imageEl.classList.remove('gallery-item__image--loading');
    imageEl.classList.add('gallery-item__image--error');
    
    // Remove glow overlay if present
    const glowOverlay = imageEl.closest('.gallery-item__picture').querySelector('.gallery-item__image-loading');
    if (glowOverlay) {
      glowOverlay.remove();
    }
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      // Observer for placeholder items to render them into full gallery items
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const placeholderEl = entry.target;
            const index = parseInt(placeholderEl.dataset.index);
            
            if (placeholderEl.classList.contains('gallery-item--placeholder')) {
              this.renderGalleryItem(placeholderEl, index);
              this.intersectionObserver.unobserve(placeholderEl);
            }
          }
        });
      }, {
        rootMargin: '200px', // Load items 200px before they become visible
        threshold: 0.1
      });

      // Observe all placeholder items
      const placeholders = this.container.querySelectorAll('.gallery-item--placeholder');
      placeholders.forEach(placeholder => {
        this.intersectionObserver.observe(placeholder);
      });
      
      // Fallback: load all visible placeholders immediately if observer fails
      setTimeout(() => {
        this.container.querySelectorAll('.gallery-item--placeholder').forEach(placeholder => {
          const rect = placeholder.getBoundingClientRect();
          if (rect.top < window.innerHeight + 200) { // Within viewport + 200px
            const index = parseInt(placeholder.dataset.index);
            this.renderGalleryItem(placeholder, index);
            if (this.intersectionObserver) {
              this.intersectionObserver.unobserve(placeholder);
            }
          }
        });
      }, 1000); // Give intersection observer 1 second to work
    }
  }

  setupThumbnailObserver() {
    if ('IntersectionObserver' in window) {
      // Observer for progressive image enhancement (thumbnail to full resolution)
      this.thumbnailObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            this.enhanceImageToFullResolution(img);
            this.thumbnailObserver.unobserve(img);
          }
        });
      }, {
        rootMargin: '100px', // Start loading full resolution 100px before visible
        threshold: 0.25
      });

      // Observe all thumbnail images
      this.container.querySelectorAll('.gallery-item__image--thumbnail').forEach(img => {
        this.thumbnailObserver.observe(img);
      });
    }
  }

  async renderGalleryItem(placeholderEl, index) {
    const image = this.images[index];
    if (!image) return;

    const imageHTML = await this.createImageHTML(image, index, false);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = imageHTML;
    const newItem = tempDiv.firstElementChild;

    // Replace placeholder with actual gallery item
    placeholderEl.parentNode.replaceChild(newItem, placeholderEl);
    
    // Add event listeners for the new item
    this.addEventListeners(newItem.parentNode, index, index + 1);
    
    // Load the image directly for lazy-loaded items
    const newImg = newItem.querySelector('.gallery-item__image');
    if (newImg) {
      const fullResolutionSrc = newImg.dataset.src;
      const srcset = newImg.dataset.srcset;
      const sizes = newImg.dataset.sizes;
      
      if (fullResolutionSrc) {
        // Set loading state
        newImg.classList.add('gallery-item__image--loading');
        
        // Load the image directly
        const imageLoader = new Image();
        imageLoader.onload = () => {
          // Update the actual img element
          newImg.src = fullResolutionSrc;
          if (srcset) newImg.srcset = srcset;
          if (sizes) newImg.sizes = sizes;
          
          // Remove loading state and add loaded state
          newImg.classList.remove('gallery-item__image--loading', 'gallery-item__image--placeholder');
          newImg.classList.add('gallery-item__image--loaded');
          
          // Remove glow overlay
          const glowOverlay = newImg.closest('.gallery-item__picture').querySelector('.gallery-item__image-loading');
          if (glowOverlay) {
            glowOverlay.remove();
          }
        };
        
        imageLoader.onerror = () => {
          this.handleImageError(newImg);
        };
        
        imageLoader.src = fullResolutionSrc;
      }
    }
  }

  enhanceImageToFullResolution(img) {
    const fullResolutionSrc = img.dataset.src;
    const srcset = img.dataset.srcset;
    const sizes = img.dataset.sizes;
    
    if (fullResolutionSrc && img.classList.contains('gallery-item__image--thumbnail')) {
      // State management: loading → thumbnail → transitioning → full
      const galleryItem = img.closest('.gallery-item');
      
      // Mark as loading full resolution
      if (galleryItem) {
        galleryItem.classList.add('gallery-item--loading-full-res');
      }
      img.classList.add('gallery-item__image--loading-full-res');
      
      // Create a new image to preload full resolution
      const fullResImg = new Image();
      
      fullResImg.onload = () => {
        // Only proceed if image is still in thumbnail state (not replaced/removed)
        if (!img.classList.contains('gallery-item__image--thumbnail')) {
          return;
        }
        
        // Start transition state
        img.classList.add('gallery-item__image--transitioning');
        img.classList.remove('gallery-item__image--loading-full-res');
        
        // Small delay to ensure transition CSS is applied
        setTimeout(() => {
          // Update source and attributes
          img.src = fullResolutionSrc;
          if (srcset) img.srcset = srcset;
          if (sizes) img.sizes = sizes;
          
          // Clean up data attributes
          img.removeAttribute('data-src');
          img.removeAttribute('data-srcset');
          img.removeAttribute('data-sizes');
          
          // Complete transition: thumbnail → transitioning → full
          setTimeout(() => {
            img.classList.remove('gallery-item__image--thumbnail', 'gallery-item__image--transitioning');
            img.classList.add('gallery-item__image--full', 'gallery-item__image--loaded');
            
            // Remove loading class from container
            if (galleryItem) {
              galleryItem.classList.remove('gallery-item--loading-full-res');
            }
            
            // Dispatch event for any necessary layout updates
            img.closest('.image-gallery').dispatchEvent(new CustomEvent('imageLoaded', { detail: { img: img } }));
          }, 100); // Allow CSS transition to complete
        }, 50);
      };
      
      fullResImg.onerror = () => {
        // If full resolution fails, keep thumbnail but mark as error
        img.classList.remove('gallery-item__image--loading-full-res', 'gallery-item__image--transitioning');
        img.classList.add('gallery-item__image--error');
        
        // Remove loading class
        if (galleryItem) {
          galleryItem.classList.remove('gallery-item--loading-full-res');
        }
        
        console.warn('Failed to load full resolution image:', fullResolutionSrc);
      };
      
      // Use srcset if available for responsive loading
      if (srcset) {
        fullResImg.srcset = srcset;
        fullResImg.sizes = sizes || '100vw';
      }
      fullResImg.src = fullResolutionSrc;
    }
  }

  openLightbox(index) {
    if (index < 0 || index >= this.images.length) return;
    
    const imageData = this.images[index];
    this.lightbox.open(imageData, this.images, index);
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  getPlaceholderImage() {
    // Return a simple placeholder SVG
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f0f0f0"/>
        <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">
          Image not found
        </text>
      </svg>
    `);
  }

  destroy() {
    if (this.lightbox) {
      this.lightbox.destroy();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (this.thumbnailObserver) {
      this.thumbnailObserver.disconnect();
      this.thumbnailObserver = null;
    }
  }

  // Method to filter images by tag
  filterByTag(tag) {
    const gridEl = this.container.querySelector('#imageGrid');
    const items = gridEl.querySelectorAll('.gallery-item');
    
    items.forEach((item, index) => {
      const image = this.images[index];
      const shouldShow = !tag || (image.tags && image.tags.includes(tag));
      item.style.display = shouldShow ? 'block' : 'none';
    });
  }

  // Method to get all unique tags from images
  getAllTags() {
    const allTags = new Set();
    this.images.forEach(image => {
      if (image.tags) {
        image.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }

  // Method to add tag filter UI - disabled for minimal design
  addTagFilter() {
    // Keep minimal - no filter UI
    return;
  }

  // Setup layout switcher functionality
  setupLayoutSwitcher() {
    const layoutSwitcher = this.container.querySelector('#layoutSwitcher');
    if (layoutSwitcher) {
      layoutSwitcher.addEventListener('click', () => {
        this.cycleLayoutMode();
      });
    }
  }


  // Cycle between 1, 2, and 3 column layouts
  cycleLayoutMode() {
    const layoutSwitcher = this.container.querySelector('#layoutSwitcher');
    
    // Add spin animation
    if (layoutSwitcher) {
      layoutSwitcher.classList.add('gallery-layout-switcher--spinning');
      
      // Remove the spinning class after animation completes
      setTimeout(() => {
        layoutSwitcher.classList.remove('gallery-layout-switcher--spinning');
      }, 500);
    }
    
    this.layoutMode = this.layoutMode === 3 ? 1 : this.layoutMode + 1;
    this.updateGridLayout();
  }

  // Update the grid layout class
  updateGridLayout() {
    const gridEl = this.container.querySelector('#imageGrid');
    if (gridEl) {
      // Remove all layout classes
      gridEl.classList.remove('gallery-layout--1-col', 'gallery-layout--2-col', 'gallery-layout--3-col');
      // Add the current layout class
      gridEl.classList.add(`gallery-layout--${this.layoutMode}-col`);
    }
  }

  // Force load all remaining placeholder items (fallback mechanism)
  loadAllRemainingItems() {
    const remainingPlaceholders = this.container.querySelectorAll('.gallery-item--placeholder');
    console.log(`Loading ${remainingPlaceholders.length} remaining placeholder items`);
    
    remainingPlaceholders.forEach(placeholder => {
      const index = parseInt(placeholder.dataset.index);
      if (!isNaN(index)) {
        this.renderGalleryItem(placeholder, index);
        if (this.intersectionObserver) {
          this.intersectionObserver.unobserve(placeholder);
        }
      }
    });
  }

  destroy() {
    if (this.lightbox) {
      this.lightbox.destroy();
    }
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    if (this.thumbnailObserver) {
      this.thumbnailObserver.disconnect();
      this.thumbnailObserver = null;
    }
  }

}

export default ImageGallery;