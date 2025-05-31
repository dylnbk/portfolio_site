/**
 * Portfolio Content Management System
 * Coordinates all content sections and navigation
 */

import LoadingSpinner from './components/shared/LoadingSpinner.js';
import MusicPlayer from './components/music/MusicPlayer.js';
import ImageGallery from './components/gallery/ImageGallery.js';
import ProjectGrid from './components/code/ProjectGrid.js';

class PortfolioContentManager {
  constructor() {
    this.currentSection = 'CHAT';
    this.sections = new Map();
    this.contentContainers = new Map();
    this.loadedSections = new Set();
    this.isTransitioning = false;
    
    // Component instances
    this.musicPlayer = null;
    this.artGallery = null;
    this.photosGallery = null;
    this.projectGrid = null;
    
    this.init();
  }

  async init() {
    console.log('Initializing Portfolio Content Manager...');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    this.createContentSections();
    this.setupNavigation();
    this.loadStylesheets();
    
    // Load content loader
    import('./data/contentLoader.js').then(() => {
      console.log('Content loader initialized');
      
      // Notify loading coordinator that portfolio content is ready
      if (window.loadingCoordinator) {
        window.loadingCoordinator.componentReady('portfolio-content');
      }
    }).catch(error => {
      console.error('Failed to load content loader:', error);
      
      // Still notify coordinator even if content loader fails
      if (window.loadingCoordinator) {
        window.loadingCoordinator.componentReady('portfolio-content');
      }
    });
  }

  createContentSections() {
    const contactDiv = document.getElementById('contact');
    if (!contactDiv) {
      console.error('Contact container not found');
      return;
    }

    // Create content section containers that will replace the chatbot/form
    const sectionsHTML = `
      <!-- Music Section -->
      <div id="music-section" class="content-section" style="display: none;">
        <div id="music-container"></div>
      </div>
      
      <!-- Art Section -->
      <div id="art-section" class="content-section" style="display: none;">
        <div id="art-container"></div>
      </div>
      
      <!-- Photos Section -->
      <div id="photos-section" class="content-section" style="display: none;">
        <div id="photos-container"></div>
      </div>
      
      <!-- Code Section -->
      <div id="code-section" class="content-section" style="display: none;">
        <div id="code-container"></div>
      </div>
    `;

    contactDiv.insertAdjacentHTML('beforeend', sectionsHTML);

    // Store references to containers
    this.contentContainers.set('MUSIC', document.getElementById('music-container'));
    this.contentContainers.set('ART', document.getElementById('art-container'));
    this.contentContainers.set('PHOTOS', document.getElementById('photos-container'));
    this.contentContainers.set('CODE', document.getElementById('code-container'));
    
    console.log('Content sections created');
  }

  loadStylesheets() {
    const stylesheets = [
      './components/shared/shared-styles.css',
      './components/music/music-styles.css',
      './components/gallery/gallery-styles.css',
      './components/code/code-styles.css'
    ];

    stylesheets.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
      }
    });
  }

  setupNavigation() {
    const navbar = document.getElementById('navbar');
    if (!navbar) {
      console.error('Navbar not found');
      return;
    }

    // Add click handlers for all navigation sections
    navbar.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (this.isTransitioning) return;
      
      const text = e.target.textContent;
      
      switch (text) {
        case 'MUSIC':
        case 'ART':
        case 'PHOTOS':
        case 'CODE':
          this.switchToSection(text);
          break;
        case 'CHAT':
        case 'CONTACT':
          this.switchToLegacySection(text);
          break;
      }
    });
  }

  async switchToSection(sectionName) {
    if (this.currentSection === sectionName || this.isTransitioning) return;
    
    this.isTransitioning = true;
    console.log(`Switching to section: ${sectionName}`);
    
    try {
      // Hide all sections first
      this.hideAllSections();
      
      // Show the target section
      await this.showSection(sectionName);
      
      this.currentSection = sectionName;
      
      // Close mobile navigation
      this.closeMobileNav();
      
      // Update browser history for better UX
      if (window.history && window.history.pushState) {
        const url = new URL(window.location);
        url.hash = sectionName.toLowerCase();
        window.history.pushState({ section: sectionName }, '', url);
      }
      
    } catch (error) {
      console.error(`Error switching to section ${sectionName}:`, error);
      // Show error state with retry functionality
      this.showErrorState(sectionName, error.message, () => this.switchToSection(sectionName));
    } finally {
      this.isTransitioning = false;
    }
  }

  async switchToLegacySection(sectionName) {
    if (this.currentSection === sectionName || this.isTransitioning) return;
    
    this.isTransitioning = true;
    console.log(`Switching to legacy section: ${sectionName}`);
    
    try {
      // Hide all sections except the target
      this.hideAllSectionsExcept(sectionName);
      
      // Wait a bit for fade out
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Show the appropriate legacy section with fade in
      const chatbot = document.querySelector('.chatbot');
      const form = document.querySelector('form[name="contact"]');
      
      if (sectionName === 'CHAT') {
        if (form) form.style.display = 'none';
        if (chatbot) {
          chatbot.style.display = 'block';
          chatbot.style.opacity = '0';
          chatbot.style.transform = 'translateY(20px)';
          // Trigger fade in
          setTimeout(() => {
            chatbot.style.transition = 'all 0.4s ease';
            chatbot.style.opacity = '1';
            chatbot.style.transform = 'translateY(0)';
          }, 10);
        }
      } else if (sectionName === 'CONTACT') {
        if (chatbot) chatbot.style.display = 'none';
        if (form) {
          form.style.display = 'block';
          form.style.opacity = '0';
          form.style.transform = 'translateY(20px)';
          // Trigger fade in
          setTimeout(() => {
            form.style.transition = 'all 0.4s ease';
            form.style.opacity = '1';
            form.style.transform = 'translateY(0)';
          }, 10);
        }
      }
      
      // Update current section
      this.currentSection = sectionName;
      
      // Close mobile navigation
      this.closeMobileNav();
      
      // Update browser history for better UX
      if (window.history && window.history.pushState) {
        const url = new URL(window.location);
        url.hash = sectionName.toLowerCase();
        window.history.pushState({ section: sectionName }, '', url);
      }
      
    } catch (error) {
      console.error(`Error switching to legacy section ${sectionName}:`, error);
    } finally {
      this.isTransitioning = false;
    }
  }

  hideAllSections() {
    this.hideAllSectionsExcept(null);
  }

  hideAllSectionsExcept(excludeSectionName) {
    // Hide original sections with fade out
    const chatbot = document.querySelector('.chatbot');
    const form = document.querySelector('form[name="contact"]');
    
    if (chatbot && chatbot.style.display !== 'none' && excludeSectionName !== 'CHAT') {
      chatbot.style.transition = 'all 0.3s ease';
      chatbot.style.opacity = '0';
      chatbot.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (excludeSectionName !== 'CHAT') { // Double-check to prevent race conditions
          chatbot.style.display = 'none';
        }
      }, 300);
    }
    
    if (form && form.style.display !== 'none' && excludeSectionName !== 'CONTACT') {
      form.style.transition = 'all 0.3s ease';
      form.style.opacity = '0';
      form.style.transform = 'translateY(-10px)';
      setTimeout(() => {
        if (excludeSectionName !== 'CONTACT') { // Double-check to prevent race conditions
          form.style.display = 'none';
        }
      }, 300);
    }
    
    // Hide new content sections with fade out
    document.querySelectorAll('.content-section').forEach(section => {
      if (section.style.display !== 'none') {
        section.style.transition = 'all 0.3s ease';
        section.style.opacity = '0';
        section.style.transform = 'translateY(-10px)';
        setTimeout(() => {
          section.style.display = 'none';
        }, 300);
      }
    });
  }

  async showSection(sectionName) {
    const sectionEl = document.getElementById(`${sectionName.toLowerCase()}-section`);
    if (!sectionEl) {
      throw new Error(`Section element not found: ${sectionName}`);
    }

    // Show the section container with fade in animation
    sectionEl.style.display = 'block';
    sectionEl.style.opacity = '0';
    sectionEl.style.transform = 'translateY(20px)';
    
    // Load content if not already loaded
    if (!this.loadedSections.has(sectionName)) {
      await this.loadSectionContent(sectionName);
      this.loadedSections.add(sectionName);
    }
    
    // Trigger fade in animation
    setTimeout(() => {
      sectionEl.style.transition = 'all 0.4s ease';
      sectionEl.style.opacity = '1';
      sectionEl.style.transform = 'translateY(0)';
    }, 10);
  }

  async loadSectionContent(sectionName) {
    const container = this.contentContainers.get(sectionName);
    if (!container) {
      throw new Error(`Container not found for section: ${sectionName}`);
    }

    // Show loading spinner
    LoadingSpinner.show(container, 'medium', `Loading ${sectionName.toLowerCase()}...`);

    try {
      switch (sectionName) {
        case 'MUSIC':
          await this.loadMusicSection(container);
          break;
        case 'ART':
          await this.loadArtSection(container);
          break;
        case 'PHOTOS':
          await this.loadPhotosSection(container);
          break;
        case 'CODE':
          await this.loadCodeSection(container);
          break;
        default:
          throw new Error(`Unknown section: ${sectionName}`);
      }
    } catch (error) {
      LoadingSpinner.remove(container);
      throw error;
    }
  }

  async loadMusicSection(container) {
    try {
      // Create music player
      this.musicPlayer = new MusicPlayer(container);
      
      // Add music player class to section for layout adjustments
      const musicSection = document.getElementById('music-section');
      if (musicSection) {
        musicSection.classList.add('has-music-player');
      }
      
      // Load music content
      const musicContent = await window.contentLoader.loadContentType('music');
      
      // Load tracks into player
      await this.musicPlayer.loadTracks(musicContent.items);
      
      console.log(`Loaded ${musicContent.items.length} music tracks`);
    } catch (error) {
      console.error('Error loading music section:', error);
      container.innerHTML = LoadingSpinner.createErrorState('Failed to load music content').outerHTML;
    }
  }

  async loadArtSection(container) {
    try {
      // Create art gallery
      this.artGallery = new ImageGallery(container, 'art');
      
      // Load art content
      const artContent = await window.contentLoader.loadContentType('art');
      
      // Load images into gallery
      await this.artGallery.loadImages(artContent.items);
      
      // Add tag filter if there are tags
      if (artContent.items.length > 0) {
        this.artGallery.addTagFilter();
      }
      
      console.log(`Loaded ${artContent.items.length} art pieces`);
    } catch (error) {
      console.error('Error loading art section:', error);
      container.innerHTML = LoadingSpinner.createErrorState('Failed to load art content').outerHTML;
    }
  }

  async loadPhotosSection(container) {
    try {
      // Create photos gallery
      this.photosGallery = new ImageGallery(container, 'photos');
      
      // Load photos content
      const photosContent = await window.contentLoader.loadContentType('photos');
      
      // Load images into gallery
      await this.photosGallery.loadImages(photosContent.items);
      
      // Add tag filter if there are tags
      if (photosContent.items.length > 0) {
        this.photosGallery.addTagFilter();
      }
      
      console.log(`Loaded ${photosContent.items.length} photographs`);
    } catch (error) {
      console.error('Error loading photos section:', error);
      container.innerHTML = LoadingSpinner.createErrorState('Failed to load photos content').outerHTML;
    }
  }

  async loadCodeSection(container) {
    try {
      // Create project grid
      this.projectGrid = new ProjectGrid(container);
      
      // Load code content
      const codeContent = await window.contentLoader.loadContentType('code');
      
      // Load projects into grid
      await this.projectGrid.loadProjects(codeContent.items);
      
      // Add filters if there are projects
      if (codeContent.items.length > 0) {
        this.projectGrid.addFilters();
      }
      
      console.log(`Loaded ${codeContent.items.length} code projects`);
    } catch (error) {
      console.error('Error loading code section:', error);
      container.innerHTML = LoadingSpinner.createErrorState('Failed to load code projects').outerHTML;
    }
  }

  showErrorState(sectionName, errorMessage, retryCallback = null) {
    const container = this.contentContainers.get(sectionName);
    if (container) {
      const errorElement = LoadingSpinner.createErrorState(
        `Failed to load ${sectionName.toLowerCase()}: ${errorMessage}`
      );
      
      // Add retry functionality if callback provided
      if (retryCallback) {
        const retryBtn = errorElement.querySelector('.loading-error__retry');
        if (retryBtn) {
          retryBtn.addEventListener('click', retryCallback);
        }
      }
      
      container.innerHTML = errorElement.outerHTML;
    }
  }

  closeMobileNav() {
    const mediaQuery = window.matchMedia('(min-width: 800px)');
    if (!mediaQuery.matches) {
      // Mobile view - close navigation
      document.getElementById("navbar").style.display = "none";
      document.getElementById("toggle-button").style.display = "block";
      document.getElementById("slide").style.height = "0%";
    }
  }

  // Public method to refresh content
  async refreshSection(sectionName) {
    if (this.loadedSections.has(sectionName)) {
      this.loadedSections.delete(sectionName);
      
      // Clear the component instance
      switch (sectionName) {
        case 'MUSIC':
          if (this.musicPlayer) {
            this.musicPlayer.destroy();
            this.musicPlayer = null;
          }
          break;
        case 'ART':
          if (this.artGallery) {
            this.artGallery.destroy();
            this.artGallery = null;
          }
          break;
        case 'PHOTOS':
          if (this.photosGallery) {
            this.photosGallery.destroy();
            this.photosGallery = null;
          }
          break;
        case 'CODE':
          if (this.projectGrid) {
            this.projectGrid = null;
          }
          break;
      }
      
      // Clear cache and reload
      window.contentLoader?.clearCache(sectionName.toLowerCase());
      
      if (this.currentSection === sectionName) {
        await this.showSection(sectionName);
        this.loadedSections.add(sectionName);
      }
    }
  }

  // Public method to get current section
  getCurrentSection() {
    return this.currentSection;
  }

  // Public method to check if section is loaded
  isSectionLoaded(sectionName) {
    return this.loadedSections.has(sectionName);
  }
}

// Initialize content manager when script loads
const portfolioContentManager = new PortfolioContentManager();

// Make it globally available for debugging
window.portfolioContentManager = portfolioContentManager;

export default PortfolioContentManager;