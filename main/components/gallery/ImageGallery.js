/**
 * Image Gallery Component
 * One image per row layout for Art/Photos sections
 */

import LoadingSpinner from '../shared/LoadingSpinner.js';
import Lightbox from './Lightbox.js';
import { getYoutubeVideoId, getYoutubeThumbnailUrl } from '../../utils/youtubeUtils.js';

class ImageGallery {
  constructor(container, contentType) {
    this.container = container;
    this.contentType = contentType; // 'art' or 'photos'
    this.images = [];
    this.lightbox = new Lightbox();
    this.intersectionObserver = null;
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
            ${LoadingSpinner.createInline('Loading images...').outerHTML}
          </div>
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

  getPreviewUrl(image) {
    return image.thumbnail || image.imageFile || image.image || '';
  }

  /** Grid poster for art pieces with YouTube: custom image if set, else YouTube default thumb. */
  getYoutubeGridThumbUrl(image, videoId) {
    const custom = this.getPreviewUrl(image);
    return custom || getYoutubeThumbnailUrl(videoId);
  }

  async loadImages(images) {
    this.images = images;
    const gridEl = this.container.querySelector('#imageGrid');
    
    if (images.length === 0) {
      gridEl.innerHTML = `<div class="image-gallery__empty">No ${this.contentType} available</div>`;
      return;
    }

    this.renderInitialBatch(gridEl);
    this.setupIntersectionObserver();
  }

  renderInitialBatch(gridEl) {
    const initialItems = Math.min(this.itemsPerBatch, this.images.length);
    
    const imageHTML = this.images.slice(0, initialItems).map((image, index) => {
      return this.createImageHTML(image, index, true);
    }).join('');

    gridEl.innerHTML = imageHTML;
    this.visibleItemsCount = initialItems;

    this.addEventListeners(gridEl, 0, initialItems);

    if (this.images.length > initialItems) {
      const remainingHTML = this.images.slice(initialItems).map((image, index) => {
        const actualIndex = index + initialItems;
        return `<div class="gallery-item gallery-item--placeholder" data-index="${actualIndex}" style="min-height: 300px; background: var(--clr-surface-tonal-a10); border: 1px dashed var(--clr-border-secondary); display: flex; align-items: center; justify-content: center; color: var(--clr-text-secondary); font-size: 12px;">Loading...</div>`;
      }).join('');
      
      gridEl.insertAdjacentHTML('beforeend', remainingHTML);
    }
  }

  createImageHTML(image, index, isInitial = false) {
    const previewUrl = this.getPreviewUrl(image);
    const videoUrl = image.video;
    const youtubeId =
      this.contentType === 'art' ? getYoutubeVideoId(image.youtubeUrl) : null;

    let mediaInner;
    if (youtubeId) {
      const thumbUrl = this.getYoutubeGridThumbUrl(image, youtubeId);
      mediaInner = this.createYoutubePosterElement(thumbUrl, image.title, isInitial);
    } else if (videoUrl) {
      mediaInner = this.createVideoElement(videoUrl, previewUrl, image.title, isInitial);
    } else {
      mediaInner = this.createPictureElement(previewUrl, image.title, isInitial);
    }

    const itemClass = youtubeId ? 'gallery-item gallery-item--youtube' : 'gallery-item';

    return `
      <div class="${itemClass}" data-index="${index}">
        <div class="gallery-item__image-container">
          ${mediaInner}
        </div>
      </div>
    `;
  }

  createYoutubePosterElement(imageUrl, title, isInitial = false) {
    const url = imageUrl || this.getPlaceholderImage();
    const alt = title ? `${title} (YouTube)` : 'YouTube video';
    const loadingClass = isInitial ? 'gallery-item__image--visible' : 'gallery-item__image--placeholder';

    return `
      <div class="gallery-item__blur-wrapper gallery-item__blur-wrapper--youtube">
        <img
          class="gallery-item__image ${loadingClass}"
          ${isInitial ? `src="${url}"` : ''}
          data-src="${url}"
          alt="${alt}"
          loading="lazy"
          decoding="async"
          onload="this.classList.remove('gallery-item__image--placeholder'); this.classList.add('gallery-item__image--loaded'); this.closest('.gallery-item__blur-wrapper')?.classList.add('gallery-item__blur-wrapper--loaded'); this.closest('.image-gallery')?.dispatchEvent(new CustomEvent('imageLoaded', { detail: { img: this } }));"
          onerror="this.src='${this.getPlaceholderImage()}'; this.classList.add('gallery-item__image--error');"
        >
        <span class="gallery-item__yt-play" aria-hidden="true">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="28" cy="28" r="28" fill="rgba(0,0,0,0.55)"/>
            <path d="M22 18L40 28L22 38V18Z" fill="white"/>
          </svg>
        </span>
      </div>
    `;
  }

  createPictureElement(imageUrl, title, isInitial = false) {
    const url = imageUrl || this.getPlaceholderImage();
    const alt = title || 'Gallery image';
    const loadingClass = isInitial ? 'gallery-item__image--visible' : 'gallery-item__image--placeholder';
    
    return `
      <div class="gallery-item__blur-wrapper">
        <img
          class="gallery-item__image ${loadingClass}"
          ${isInitial ? `src="${url}"` : ''}
          data-src="${url}"
          alt="${alt}"
          loading="lazy"
          decoding="async"
          onload="this.classList.remove('gallery-item__image--placeholder'); this.classList.add('gallery-item__image--loaded'); this.closest('.gallery-item__blur-wrapper')?.classList.add('gallery-item__blur-wrapper--loaded'); this.closest('.image-gallery')?.dispatchEvent(new CustomEvent('imageLoaded', { detail: { img: this } }));"
          onerror="this.src='${this.getPlaceholderImage()}'; this.classList.add('gallery-item__image--error');"
        >
      </div>
    `;
  }

  createVideoElement(videoUrl, posterUrl, title, isInitial = false) {
    const loadingClass = isInitial ? 'gallery-item__image--visible' : 'gallery-item__image--placeholder';
    const posterAttr = posterUrl ? `poster="${posterUrl}"` : '';
    const srcAttr = isInitial && videoUrl ? `src="${videoUrl}"` : '';
    const dataSrcAttr = videoUrl ? `data-src="${videoUrl}"` : '';

    return `
      <div class="gallery-item__blur-wrapper">
        <video
          class="gallery-item__image gallery-item__image--video ${loadingClass}"
          ${srcAttr}
          ${dataSrcAttr}
          ${posterAttr}
          muted
          playsinline
          preload="metadata"
          aria-label="${title || 'Gallery video'}"
          onloadeddata="this.classList.remove('gallery-item__image--placeholder'); this.classList.add('gallery-item__image--loaded'); this.closest('.gallery-item__blur-wrapper')?.classList.add('gallery-item__blur-wrapper--loaded');"
        ></video>
      </div>
    `;
  }

  addEventListeners(gridEl, startIndex, endIndex) {
    const items = gridEl.querySelectorAll('.gallery-item');
    
    for (let i = startIndex; i < Math.min(endIndex, items.length); i++) {
      const itemEl = items[i];
      const index = parseInt(itemEl.dataset.index, 10);
      
      if (itemEl.classList.contains('gallery-item--placeholder')) continue;

      const openLightbox = () => {
        this.openLightbox(index);
      };

      itemEl.addEventListener('click', openLightbox);

      const imageEl = itemEl.querySelector('.gallery-item__image');
      if (imageEl && imageEl.tagName === 'IMG') {
        imageEl.addEventListener('error', () => {
          imageEl.src = this.getPlaceholderImage();
          imageEl.alt = 'Image not found';
          imageEl.classList.add('gallery-item__image--error');
        });
      }
    }
  }

  setupIntersectionObserver() {
    if ('IntersectionObserver' in window) {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const target = entry.target;
            
            if (target.classList.contains('gallery-item--placeholder')) {
              const index = parseInt(target.dataset.index, 10);
              this.renderGalleryItem(target, index);
              this.intersectionObserver.unobserve(target);
            }
            
            if (target.classList.contains('gallery-item__image--placeholder')) {
              const mediaUrl = target.dataset.src;
              if (mediaUrl) {
                if (target.tagName === 'VIDEO') {
                  target.src = mediaUrl;
                } else {
                  target.src = mediaUrl;
                }
                target.classList.remove('gallery-item__image--placeholder');
                this.intersectionObserver.unobserve(target);
              }
            }
          }
        });
      }, {
        rootMargin: '200px',
        threshold: 0.1
      });

      this.container.querySelectorAll('.gallery-item--placeholder, .gallery-item__image--placeholder').forEach(element => {
        this.intersectionObserver.observe(element);
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

    placeholderEl.parentNode.replaceChild(newItem, placeholderEl);
    
    this.addEventListeners(newItem.parentNode, index, index + 1);
    
    const newMedia = newItem.querySelector('.gallery-item__image--placeholder');
    if (newMedia && this.intersectionObserver) {
      this.intersectionObserver.observe(newMedia);
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

  filterByTag(tag) {
    const gridEl = this.container.querySelector('#imageGrid');
    const items = gridEl.querySelectorAll('.gallery-item');
    
    items.forEach((item, index) => {
      const image = this.images[index];
      const shouldShow = !tag || (image.tags && image.tags.includes(tag));
      item.style.display = shouldShow ? 'block' : 'none';
    });
  }

  getAllTags() {
    const allTags = new Set();
    this.images.forEach(image => {
      if (image.tags) {
        image.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }

  addTagFilter() {
    return;
  }

  setupLayoutSwitcher() {
    const layoutSwitcher = this.container.querySelector('#layoutSwitcher');
    if (layoutSwitcher) {
      layoutSwitcher.addEventListener('click', () => {
        this.cycleLayoutMode();
      });
    }
  }

  cycleLayoutMode() {
    const layoutSwitcher = this.container.querySelector('#layoutSwitcher');
    
    if (layoutSwitcher) {
      layoutSwitcher.classList.add('gallery-layout-switcher--spinning');
      
      setTimeout(() => {
        layoutSwitcher.classList.remove('gallery-layout-switcher--spinning');
      }, 500);
    }
    
    this.layoutMode = this.layoutMode === 3 ? 1 : this.layoutMode + 1;
    this.updateGridLayout();
  }

  updateGridLayout() {
    const gridEl = this.container.querySelector('#imageGrid');
    if (gridEl) {
      gridEl.classList.remove('gallery-layout--1-col', 'gallery-layout--2-col', 'gallery-layout--3-col');
      gridEl.classList.add(`gallery-layout--${this.layoutMode}-col`);
    }
  }

}

export default ImageGallery;
