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
        <div class="image-gallery__grid gallery-layout--${this.layoutMode}-col" id="imageGrid">
          ${LoadingSpinner.createInline('Loading images...').outerHTML}
        </div>
        <div class="gallery-layout-switcher" id="layoutSwitcher">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.9307 4.01587H14.7655C14.3582 2.84239 13.2428 2 11.9307 2C10.6185 2 9.50313 2.84239 9.09581 4.01587H6.93066C5.27381 4.01587 3.93066 5.35901 3.93066 7.01587V9.21205C2.80183 9.64283 2 10.7357 2 12.0159C2 13.296 2.80183 14.3889 3.93066 14.8197V17.0159C3.93066 18.6727 5.27381 20.0159 6.93066 20.0159H9.08467C9.48247 21.2064 10.6064 22.0645 11.9307 22.0645C13.255 22.0645 14.3789 21.2064 14.7767 20.0159H16.9307C18.5875 20.0159 19.9307 18.6727 19.9307 17.0159V14.8446C21.095 14.4322 21.929 13.3214 21.929 12.0159C21.929 10.7103 21.095 9.5995 19.9307 9.18718V7.01587C19.9307 5.35901 18.5875 4.01587 16.9307 4.01587ZM5.93066 14.8687V17.0159C5.93066 17.5682 6.37838 18.0159 6.93066 18.0159H9.11902C9.54426 16.8761 10.6427 16.0645 11.9307 16.0645C13.2187 16.0645 14.3171 16.8761 14.7423 18.0159H16.9307C17.4829 18.0159 17.9307 17.5682 17.9307 17.0159V14.8458C16.7646 14.4344 15.929 13.3227 15.929 12.0159C15.929 10.709 16.7646 9.59732 17.9307 9.18597V7.01587C17.9307 6.46358 17.4829 6.01587 16.9307 6.01587H14.7543C14.338 7.17276 13.2309 8 11.9307 8C10.6304 8 9.52331 7.17276 9.10703 6.01587H6.93066C6.37838 6.01587 5.93066 6.46358 5.93066 7.01587V9.16302C7.13193 9.55465 8 10.6839 8 12.0159C8 13.3479 7.13193 14.4771 5.93066 14.8687Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    `;
    
    this.setupLayoutSwitcher();
  }

  async loadImages(images) {
    this.images = images;
    const gridEl = this.container.querySelector('#imageGrid');
    
    if (images.length === 0) {
      gridEl.innerHTML = `<div class="image-gallery__empty">No ${this.contentType} available</div>`;
      return;
    }

    // Create initial DOM elements for viewport-based rendering
    this.renderInitialBatch(gridEl);
    
    // Setup intersection observers for progressive loading
    this.setupIntersectionObserver();
    this.setupThumbnailObserver();
  }

  renderInitialBatch(gridEl) {
    const initialItems = Math.min(this.itemsPerBatch, this.images.length);
    
    const imageHTML = this.images.slice(0, initialItems).map((image, index) => {
      return this.createImageHTML(image, index, true);
    }).join('');

    gridEl.innerHTML = imageHTML;
    this.visibleItemsCount = initialItems;

    // Add click handlers for rendered items
    this.addEventListeners(gridEl, 0, initialItems);

    // Create placeholder elements for remaining items
    if (this.images.length > initialItems) {
      const remainingHTML = this.images.slice(initialItems).map((image, index) => {
        const actualIndex = index + initialItems;
        return `<div class="gallery-item gallery-item--placeholder" data-index="${actualIndex}" style="min-height: 300px; background: var(--clr-surface-tonal-a10); border: 1px dashed var(--clr-border-secondary); display: flex; align-items: center; justify-content: center; color: var(--clr-text-secondary); font-size: 12px;">Loading...</div>`;
      }).join('');
      
      gridEl.insertAdjacentHTML('beforeend', remainingHTML);
    }
  }

  createImageHTML(image, index, isInitial = false) {
    const imageUrl = image.imageFile || image.image;
    const thumbnailUrl = this.generateThumbnailUrl(imageUrl);
    
    // For initial load, show thumbnail immediately and prepare full resolution for lazy loading
    const srcAttribute = isInitial ? `src="${thumbnailUrl}"` : '';
    const dataSrcAttribute = `data-src="${imageUrl}"`;
    const dataThumbnailAttribute = `data-thumbnail="${thumbnailUrl}"`;
    
    return `
      <div class="gallery-item" data-index="${index}">
        <div class="gallery-item__image-container">
          ${this.createPictureElement(imageUrl, thumbnailUrl, image.title, isInitial)}
        </div>
        <div class="gallery-item__info">
          <h3 class="gallery-item__title">${image.title || 'Untitled'}</h3>
          ${image.description ? `<p class="gallery-item__description">${this.truncateText(image.description, 120)}</p>` : ''}
        </div>
      </div>
    `;
  }

  createPictureElement(imageUrl, thumbnailUrl, title, isInitial = false) {
    const alt = title || 'Gallery image';
    
    // For progressive loading, start with thumbnail and upgrade to full resolution
    const loadingClass = isInitial ? 'gallery-item__image--thumbnail' : 'gallery-item__image--placeholder';
    
    // Use simple img element since we don't have multiple format variants available
    return `
      <img
        class="gallery-item__image ${loadingClass}"
        ${isInitial ? `src="${thumbnailUrl}"` : ''}
        data-src="${imageUrl}"
        data-thumbnail="${thumbnailUrl}"
        alt="${alt}"
        loading="lazy"
        decoding="async"
        style="opacity:${isInitial ? '0' : '0'}; transition: opacity 0.3s ease; cursor: pointer;"
        onload="this.style.opacity=1; this.classList.remove('gallery-item__image--thumbnail', 'gallery-item__image--placeholder'); this.classList.add('gallery-item__image--loaded');"
        onerror="this.src='${this.getPlaceholderImage()}'; this.style.opacity=1;"
      >
    `;
  }

  generateThumbnailUrl(imageUrl) {
    // Generate thumbnail URL (200px width) - this would typically be handled by a CDN or image processing service
    // For now, we'll use the original image with a query parameter hint
    return imageUrl + '?w=200&q=60';
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
        
        // Enhanced error handling
        imageEl.addEventListener('error', () => {
          imageEl.src = this.getPlaceholderImage();
          imageEl.alt = 'Image not found';
          imageEl.style.opacity = '1';
        });
      }
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
      this.container.querySelectorAll('.gallery-item--placeholder').forEach(placeholder => {
        this.intersectionObserver.observe(placeholder);
      });
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

  renderGalleryItem(placeholderEl, index) {
    const image = this.images[index];
    if (!image) return;

    const imageHTML = this.createImageHTML(image, index, false);
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = imageHTML;
    const newItem = tempDiv.firstElementChild;

    // Replace placeholder with actual gallery item
    placeholderEl.parentNode.replaceChild(newItem, placeholderEl);
    
    // Add event listeners for the new item
    this.addEventListeners(newItem.parentNode, index, index + 1);
    
    // Observe the new image for thumbnail enhancement
    const newImg = newItem.querySelector('.gallery-item__image');
    if (newImg && this.thumbnailObserver) {
      // Start with thumbnail loading
      const thumbnailUrl = newImg.dataset.thumbnail;
      if (thumbnailUrl) {
        newImg.src = thumbnailUrl;
        newImg.classList.add('gallery-item__image--thumbnail');
        this.thumbnailObserver.observe(newImg);
      }
    }
  }

  enhanceImageToFullResolution(img) {
    const fullResolutionSrc = img.dataset.src;
    
    if (fullResolutionSrc) {
      // Create a new image to preload full resolution
      const fullResImg = new Image();
      fullResImg.onload = () => {
        // Smooth transition from thumbnail to full resolution
        img.style.transition = 'opacity 0.5s ease';
        img.style.opacity = '0.7';
        
        setTimeout(() => {
          img.src = fullResolutionSrc;
          img.removeAttribute('data-src');
          img.classList.remove('gallery-item__image--thumbnail');
          img.classList.add('gallery-item__image--full');
          img.style.opacity = '1';
        }, 100);
      };
      
      fullResImg.onerror = () => {
        // If full resolution fails, keep thumbnail
        img.classList.remove('gallery-item__image--thumbnail');
        img.classList.add('gallery-item__image--error');
      };
      
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

}

export default ImageGallery;