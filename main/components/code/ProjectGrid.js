/**
 * Project Grid Component
 * Card layout for code projects, one card per row
 */

import LoadingSpinner from '../shared/LoadingSpinner.js';
import ProjectModal from './ProjectModal.js';

class ProjectGrid {
  constructor(container) {
    this.container = container;
    this.projects = [];
    this.modal = new ProjectModal();
    
    this.init();
  }

  init() {
    this.container.innerHTML = `
      <div class="project-grid">
        <div class="project-grid__list" id="projectList">
          ${LoadingSpinner.createInline('Loading projects...').outerHTML}
        </div>
      </div>
    `;
  }

  async loadProjects(projects) {
    this.projects = projects;
    const listEl = this.container.querySelector('#projectList');
    
    if (projects.length === 0) {
      listEl.innerHTML = '<div class="project-grid__empty">No projects available</div>';
      return;
    }

    const projectHTML = projects.map((project, index) => {
      return `
        <div class="project-card" data-index="${index}">
          <div class="project-card__header">
            <h3 class="project-card__title">${project.title || 'Untitled Project'}</h3>
          </div>

          <div class="project-card__content">
            ${project.description ? `
              <p class="project-card__description">${project.description}</p>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    listEl.innerHTML = projectHTML;

    // Add click handlers for project cards
    listEl.querySelectorAll('.project-card').forEach((cardEl, index) => {
      cardEl.addEventListener('click', (e) => {
        // Don't expand if clicking on links
        if (e.target.closest('.project-card__link')) return;
        
        this.openProjectModal(index);
      });
    });
  }

  getStatusClass(status) {
    if (!status) return 'project-card__status--unknown';
    
    const statusLower = status.toLowerCase();
    if (statusLower.includes('complete') || statusLower.includes('finished')) {
      return 'project-card__status--completed';
    } else if (statusLower.includes('progress') || statusLower.includes('development')) {
      return 'project-card__status--in-progress';
    } else if (statusLower.includes('planned') || statusLower.includes('upcoming')) {
      return 'project-card__status--planned';
    } else if (statusLower.includes('archived') || statusLower.includes('deprecated')) {
      return 'project-card__status--archived';
    }
    
    return 'project-card__status--unknown';
  }

  openProjectModal(index) {
    if (index >= 0 && index < this.projects.length) {
      const project = this.projects[index];
      this.modal.open(project);
    }
  }

  formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short'
      });
    } catch (error) {
      return dateString;
    }
  }

  // Method to filter projects by technology
  filterByTechnology(tech) {
    const listEl = this.container.querySelector('#projectList');
    const cards = listEl.querySelectorAll('.project-card');
    
    cards.forEach((card, index) => {
      const project = this.projects[index];
      const shouldShow = !tech || (project.technologies && 
        project.technologies.some(t => t.toLowerCase().includes(tech.toLowerCase())));
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }

  // Method to filter projects by status
  filterByStatus(status) {
    const listEl = this.container.querySelector('#projectList');
    const cards = listEl.querySelectorAll('.project-card');
    
    cards.forEach((card, index) => {
      const project = this.projects[index];
      const shouldShow = !status || (project.status && 
        project.status.toLowerCase().includes(status.toLowerCase()));
      card.style.display = shouldShow ? 'block' : 'none';
    });
  }

  // Method to get all unique technologies
  getAllTechnologies() {
    const allTech = new Set();
    this.projects.forEach(project => {
      if (project.technologies) {
        project.technologies.forEach(tech => allTech.add(tech));
      }
    });
    return Array.from(allTech).sort();
  }

  // Method to get all unique statuses
  getAllStatuses() {
    const allStatuses = new Set();
    this.projects.forEach(project => {
      if (project.status) {
        allStatuses.add(project.status);
      }
    });
    return Array.from(allStatuses).sort();
  }

  // Method to add filter UI - disabled for minimal design
  addFilters() {
    // Keep minimal - no filter UI
    return;
  }

  destroy() {
    if (this.modal) {
      this.modal.destroy();
    }
  }
}

export default ProjectGrid;