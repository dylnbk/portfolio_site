/**
 * Project Modal Component
 * Full-screen modal for detailed project view
 */

class ProjectModal {
  constructor() {
    this.isOpen = false;
    this.currentProject = null;
    this.modalElement = null;
    
    this.init();
  }

  init() {
    // Create modal structure
    this.modalElement = document.createElement('div');
    this.modalElement.className = 'project-modal';
    this.modalElement.style.display = 'none';
    
    this.modalElement.innerHTML = `
      <div class="project-modal__overlay">
        <div class="project-modal__container">
          <div class="project-modal__header">
            <button class="project-modal__close" title="Close">&times;</button>
          </div>
          <div class="project-modal__content">
            <div class="project-modal__body" id="projectModalBody">
              <!-- Content will be populated here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Append to body
    document.body.appendChild(this.modalElement);
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    const closeBtn = this.modalElement.querySelector('.project-modal__close');
    const overlay = this.modalElement.querySelector('.project-modal__overlay');
    
    // Close button
    closeBtn.addEventListener('click', () => this.close());
    
    // Click outside to close
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        this.close();
      }
    });
    
    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isOpen) {
        this.close();
      }
    });
  }

  open(project) {
    this.currentProject = project;
    this.renderContent();
    
    this.modalElement.style.display = 'block';
    
    // Trigger fade in
    setTimeout(() => {
      this.modalElement.classList.add('project-modal--active');
    }, 10);
    
    this.isOpen = true;
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.modalElement.classList.remove('project-modal--active');
    
    // Wait for fade out animation
    setTimeout(() => {
      this.modalElement.style.display = 'none';
      this.isOpen = false;
      
      // Restore body scroll
      document.body.style.overflow = '';
    }, 300);
  }

  renderContent() {
    if (!this.currentProject) return;
    
    const project = this.currentProject;
    const bodyEl = this.modalElement.querySelector('#projectModalBody');
    
    bodyEl.innerHTML = `
      <div class="project-modal__title-section">
        <h2 class="project-modal__title">${project.title || 'Untitled Project'}</h2>
        ${project.date ? `<div class="project-modal__date">${this.formatDate(project.date)}</div>` : ''}
      </div>
      
      ${project.longDescription ? `
        <div class="project-modal__section">
          <div class="project-modal__description">${this.formatContent(project.longDescription, project.title)}</div>
        </div>
      ` : ''}
      
      ${(project.repositoryUrl || project.liveDemoUrl) && (project.repositoryUrl !== '' || project.liveDemoUrl !== '') ? `
        <div class="project-modal__section">
          <div class="project-modal__links">
            ${project.repositoryUrl && project.repositoryUrl !== '' ? `
              <a href="${project.repositoryUrl}" target="_blank" class="project-modal__link">
                <span class="project-modal__link-icon">📁</span>
                View Repository
              </a>
            ` : ''}
            ${project.liveDemoUrl && project.liveDemoUrl !== '' ? `
              <a href="${project.liveDemoUrl}" target="_blank" class="project-modal__link">
                <span class="project-modal__link-icon">🚀</span>
                Live Demo
              </a>
            ` : ''}
          </div>
        </div>
      ` : ''}
      
      ${project.challenges && project.challenges.trim() !== '' ? `
        <div class="project-modal__section">
          <h2 class="project-modal__section-title">Challenges</h2>
          <div class="project-modal__text-content">
            ${this.formatContent(project.challenges)}
          </div>
        </div>
      ` : ''}
      
      ${project.lessonsLearned && project.lessonsLearned.trim() !== '' ? `
        <div class="project-modal__section">
          <h2 class="project-modal__section-title">Lessons Learned</h2>
          <div class="project-modal__text-content">
            ${this.formatContent(project.lessonsLearned)}
          </div>
        </div>
      ` : ''}
    `;
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  }

  formatContent(content, titleToRemove = null) {
    if (!content) return '';
    
    // Split content into lines for better processing
    let lines = content.split('\n');
    let html = '';
    let inList = false;
    let listItems = [];
    let currentParagraph = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      let trimmedLine = line.trim();
      
      // Check if this is a list item (handle both "- " and "  - " patterns)
      if (trimmedLine.match(/^-\s+/) || line.match(/^\s*-\s+/)) {
        // Close any open paragraph
        if (currentParagraph.length > 0) {
          html += `<p>${currentParagraph.join(' ')}</p>\n`;
          currentParagraph = [];
        }
        
        if (!inList) {
          inList = true;
          listItems = [];
        }
        // Extract list item content (remove the "- " prefix and any leading spaces)
        let listContent = trimmedLine.replace(/^-\s*/, '');
        // Process bold/italic formatting within list items
        listContent = listContent
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/`(.*?)`/g, '<code>$1</code>');
        listItems.push(listContent);
      } else {
        // If we were in a list and this line is not a list item, close the list
        if (inList) {
          html += '<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>\n';
          inList = false;
          listItems = [];
        }
        
        // Process headers
        if (trimmedLine.match(/^###\s+/)) {
          // Close any open paragraph
          if (currentParagraph.length > 0) {
            html += `<p>${currentParagraph.join(' ')}</p>\n`;
            currentParagraph = [];
          }
          html += `<h3>${trimmedLine.substring(4)}</h3>\n`;
        } else if (trimmedLine.match(/^##\s+/)) {
          // Close any open paragraph
          if (currentParagraph.length > 0) {
            html += `<p>${currentParagraph.join(' ')}</p>\n`;
            currentParagraph = [];
          }
          html += `<h2>${trimmedLine.substring(3)}</h2>\n`;
        } else if (trimmedLine.match(/^#\s+/)) {
          // Close any open paragraph
          if (currentParagraph.length > 0) {
            html += `<p>${currentParagraph.join(' ')}</p>\n`;
            currentParagraph = [];
          }
          html += `<h2>${trimmedLine.substring(2)}</h2>\n`;
        } else if (trimmedLine === '') {
          // Empty line - close current paragraph if any
          if (currentParagraph.length > 0) {
            html += `<p>${currentParagraph.join(' ')}</p>\n`;
            currentParagraph = [];
          }
        } else {
          // Regular content line - add to current paragraph
          let processedLine = trimmedLine
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
          currentParagraph.push(processedLine);
        }
      }
    }
    
    // Close any remaining paragraph
    if (currentParagraph.length > 0) {
      html += `<p>${currentParagraph.join(' ')}</p>\n`;
    }
    
    // Close any remaining list
    if (inList) {
      html += '<ul>' + listItems.map(item => `<li>${item}</li>`).join('') + '</ul>\n';
    }
    
    // Remove duplicate title if it exists as an H1 or H2
    if (titleToRemove) {
      const titlePattern1 = new RegExp(`<h1>${titleToRemove}[^<]*<\/h1>`, 'gi');
      const titlePattern2 = new RegExp(`<h2>${titleToRemove}[^<]*<\/h2>`, 'gi');
      html = html.replace(titlePattern1, '');
      html = html.replace(titlePattern2, '');
      
      // Also remove the "Project" suffix variation
      const titleProjectPattern1 = new RegExp(`<h1>${titleToRemove}\\s+Project[^<]*<\/h1>`, 'gi');
      const titleProjectPattern2 = new RegExp(`<h2>${titleToRemove}\\s+Project[^<]*<\/h2>`, 'gi');
      html = html.replace(titleProjectPattern1, '');
      html = html.replace(titleProjectPattern2, '');
    }
    
    // Clean up extra whitespace but preserve structure
    html = html.replace(/\n+/g, '\n').trim();
    
    return html;
  }

  destroy() {
    if (this.modalElement && this.modalElement.parentNode) {
      this.modalElement.parentNode.removeChild(this.modalElement);
    }
  }
}

export default ProjectModal;