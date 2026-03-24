/**
 * Lightbox Component
 * Fullscreen image and video viewer for gallery sections
 */

import { getYoutubeVideoId, getYoutubeEmbedUrl } from '../../utils/youtubeUtils.js';

class Lightbox {
  constructor() {
    this.isOpen = false;
    this.currentImage = null;
    this.images = [];
    this.currentIndex = -1;
    this.overlay = null;
    this.currentImageElement = null;
    
    this.init();
  }

  init() {
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
          <video class="lightbox__video" playsinline controls></video>
          <div class="lightbox__embed-wrap">
            <iframe class="lightbox__iframe" title="YouTube video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen loading="lazy"></iframe>
          </div>
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
    
    closeBtn.addEventListener('click', () => this.close());
    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) this.close();
    });
    
    prevBtn.addEventListener('click', () => this.showPrevious());
    nextBtn.addEventListener('click', () => this.showNext());
    
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
    this.images = allImages.map(img => {
      const youtubeId = getYoutubeVideoId(img.youtubeUrl || '');
      return {
        imageFile: img.imageFile || img.image,
        thumbnail: img.thumbnail,
        video: img.video || '',
        youtubeUrl: img.youtubeUrl || '',
        youtubeId,
        title: img.title,
        description: img.description,
        date: img.date || img.createdDate || img.creationDate || img.dateTaken || img.releaseDate,
        alt: img.alt
      };
    });
    this.currentIndex = startIndex;
    this.currentImage = this.images[this.currentIndex];
    
    this.updateImage();
    this.updateNavigation();
    
    this.overlay.style.display = 'flex';
    this.isOpen = true;
    
    document.body.style.overflow = 'hidden';
    
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
      
      this.cleanupImageMemory();
      this.clearImageReferences();
    }, 300);
  }

  showPrevious() {
    if (this.currentIndex > 0) {
      this.cleanupCurrentMedia();
      
      this.currentIndex--;
      this.currentImage = this.images[this.currentIndex];
      this.updateImage();
      this.updateNavigation();
    }
  }

  showNext() {
    if (this.currentIndex < this.images.length - 1) {
      this.cleanupCurrentMedia();
      
      this.currentIndex++;
      this.currentImage = this.images[this.currentIndex];
      this.updateImage();
      this.updateNavigation();
    }
  }

  resetLightboxMedia() {
    const img = this.overlay.querySelector('.lightbox__image');
    const video = this.overlay.querySelector('.lightbox__video');
    const embedWrap = this.overlay.querySelector('.lightbox__embed-wrap');
    const iframe = this.overlay.querySelector('.lightbox__iframe');
    if (iframe) {
      iframe.removeAttribute('src');
      iframe.src = '';
    }
    if (embedWrap) {
      embedWrap.style.display = 'none';
    }
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.removeAttribute('poster');
    }
    if (img) {
      img.src = '';
      img.removeAttribute('src');
    }
  }

  updateImage() {
    if (!this.currentImage) return;
    
    const img = this.overlay.querySelector('.lightbox__image');
    const video = this.overlay.querySelector('.lightbox__video');
    const embedWrap = this.overlay.querySelector('.lightbox__embed-wrap');
    const iframe = this.overlay.querySelector('.lightbox__iframe');
    const title = this.overlay.querySelector('.lightbox__title');
    const description = this.overlay.querySelector('.lightbox__description');
    const dateEl = this.overlay.querySelector('.lightbox__date');
    const counter = this.overlay.querySelector('.lightbox__counter');
    
    this.currentImageElement = img;
    
    this.resetLightboxMedia();
    
    const youtubeId = this.currentImage.youtubeId;
    const videoUrl = this.currentImage.video;
    const previewUrl = this.currentImage.thumbnail || this.currentImage.imageFile || this.currentImage.image;
    
    if (youtubeId && iframe && embedWrap) {
      img.style.display = 'none';
      img.classList.remove('lightbox__image--loading', 'lightbox__image--loaded');
      video.style.display = 'none';
      video.classList.remove('lightbox__image--loading', 'lightbox__image--loaded');
      embedWrap.style.display = 'block';
      iframe.src = getYoutubeEmbedUrl(youtubeId);
      iframe.classList.add('lightbox__image--loaded');
      iframe.classList.remove('lightbox__image--loading');
    } else if (videoUrl) {
      if (embedWrap) embedWrap.style.display = 'none';
      if (iframe) iframe.removeAttribute('src');
      img.style.display = 'none';
      img.classList.remove('lightbox__image--loading', 'lightbox__image--loaded');
      video.style.display = 'block';
      video.classList.add('lightbox__image--loading');
      video.classList.remove('lightbox__image--loaded');
      if (previewUrl) {
        video.poster = previewUrl;
      }
      video.src = videoUrl;
      video.onloadeddata = () => {
        video.classList.remove('lightbox__image--loading');
        video.classList.add('lightbox__image--loaded');
      };
    } else {
      if (embedWrap) embedWrap.style.display = 'none';
      if (iframe) iframe.removeAttribute('src');
      video.style.display = 'none';
      video.classList.remove('lightbox__image--loading', 'lightbox__image--loaded');
      img.style.display = 'block';
      
      img.classList.add('lightbox__image--loading');
      img.classList.remove('lightbox__image--loaded');
      
      const imageUrl = previewUrl;
      if (imageUrl) {
        img.src = imageUrl;
        img.alt = this.currentImage.title || this.currentImage.alt || '';
        
        img.onload = () => {
          img.classList.remove('lightbox__image--loading');
          img.classList.add('lightbox__image--loaded');
        };
      }
    }
    
    title.textContent = this.currentImage.title || 'Untitled';
    description.textContent = this.currentImage.description || '';
    
    const rawDate = this.currentImage.date;
    if (rawDate) {
      const dateObj = new Date(rawDate);
      dateEl.textContent = Number.isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString();
    } else {
      dateEl.textContent = '';
    }
    
    if (this.images.length > 1) {
      counter.textContent = `${this.currentIndex + 1} of ${this.images.length}`;
    } else {
      counter.textContent = '';
    }
  }

  updateNavigation() {
    const prevBtn = this.overlay.querySelector('.lightbox__prev');
    const nextBtn = this.overlay.querySelector('.lightbox__next');
    
    prevBtn.style.display = this.currentIndex > 0 ? 'block' : 'none';
    nextBtn.style.display = this.currentIndex < this.images.length - 1 ? 'block' : 'none';
  }

  destroy() {
    this.cleanupImageMemory();
    this.clearImageReferences();
    
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    this.isOpen = false;
    document.body.style.overflow = '';
    
    this.overlay = null;
    this.currentImageElement = null;
  }

  cleanupCurrentMedia() {
    const video = this.overlay ? this.overlay.querySelector('.lightbox__video') : null;
    const img = this.overlay ? this.overlay.querySelector('.lightbox__image') : null;
    const iframe = this.overlay ? this.overlay.querySelector('.lightbox__iframe') : null;
    const embedWrap = this.overlay ? this.overlay.querySelector('.lightbox__embed-wrap') : null;
    if (iframe) {
      iframe.removeAttribute('src');
      iframe.src = '';
    }
    if (embedWrap) {
      embedWrap.style.display = 'none';
    }
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.removeAttribute('poster');
    }
    if (img && img.src) {
      img.src = '';
      img.removeAttribute('src');
    }
  }

  cleanupImageMemory() {
    const img = this.overlay ? this.overlay.querySelector('.lightbox__image') : null;
    const video = this.overlay ? this.overlay.querySelector('.lightbox__video') : null;
    const iframe = this.overlay ? this.overlay.querySelector('.lightbox__iframe') : null;
    const embedWrap = this.overlay ? this.overlay.querySelector('.lightbox__embed-wrap') : null;
    if (iframe) {
      iframe.removeAttribute('src');
      iframe.src = '';
    }
    if (embedWrap) {
      embedWrap.style.display = 'none';
    }
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.removeAttribute('poster');
    }
    if (img) {
      img.src = '';
      img.removeAttribute('src');
      img.alt = '';
      
      if (img.complete) {
        img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      }
    }
    this.currentImageElement = null;
  }

  clearImageReferences() {
    this.images = [];
    this.currentImage = null;
    this.currentIndex = -1;
    
    if (window.gc && typeof window.gc === 'function') {
      setTimeout(() => window.gc(), 100);
    }
  }
}

window.lightbox = new Lightbox();

export default Lightbox;
