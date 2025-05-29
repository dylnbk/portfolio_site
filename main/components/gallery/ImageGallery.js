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
    
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="image-gallery">
        <div class="image-gallery__grid" id="imageGrid">
          ${LoadingSpinner.createInline('Loading images...').outerHTML}
        </div>
      </div>
    `;
  }

  async loadImages(images) {
    this.images = images;
    const gridEl = this.container.querySelector('#imageGrid');
    
    if (images.length === 0) {
      gridEl.innerHTML = `<div class="image-gallery__empty">No ${this.contentType} available</div>`;
      return;
    }

    const imageHTML = images.map((image, index) => {
      const imageUrl = image.imageFile || image.image;
      const thumbnailUrl = image.thumbnail || imageUrl;
      
      return `
        <div class="gallery-item" data-index="${index}">
          <div class="gallery-item__image-container">
            <img
              class="gallery-item__image"
              src="${thumbnailUrl}"
              alt="${image.title || 'Gallery image'}"
              loading="lazy"
              decoding="async"
              onload="this.style.opacity=1"
              onerror="this.src='${this.getPlaceholderImage()}'; this.style.opacity=1;"
              style="opacity:0; transition: opacity 0.3s ease; cursor: pointer;"
            >
          </div>
          <div class="gallery-item__info">
            <h3 class="gallery-item__title">${image.title || 'Untitled'}</h3>
            ${image.description ? `<p class="gallery-item__description">${this.truncateText(image.description, 120)}</p>` : ''}
          </div>
        </div>
      `;
    }).join('');

    gridEl.innerHTML = imageHTML;

    // Add click handlers for gallery items
    gridEl.querySelectorAll('.gallery-item').forEach((itemEl, index) => {
      const imageEl = itemEl.querySelector('.gallery-item__image');
      
      const openLightbox = () => {
        this.openLightbox(index);
      };
      
      imageEl.addEventListener('click', openLightbox);
      
      // Add error handling for images
      imageEl.addEventListener('error', () => {
        imageEl.src = this.getPlaceholderImage();
        imageEl.alt = 'Image not found';
      });
    });

    // Setup intersection observer for progressive loading
    this.setupIntersectionObserver();
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              this.intersectionObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px',
        threshold: 0.1
      });

      // Observe all lazy images
      this.container.querySelectorAll('img[data-src]').forEach(img => {
        this.intersectionObserver.observe(img);
      });
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
}

export default ImageGallery;