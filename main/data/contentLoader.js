/**
 * Content Loading System
 * Handles markdown processing and content loading for all portfolio sections
 */

import { loadExternalDependencies } from '../utils/externalDependencies.js';

class ContentLoader {
  constructor() {
    this.cache = new Map();
    this.loadingStates = new Map();
    this.dependenciesReady = false;
    this.waitForDependencies();
  }

  /**
   * Wait for external dependencies (marked, DOMPurify) to load
   * Now uses the external dependencies loader utility
   */
  async waitForDependencies() {
    try {
      await loadExternalDependencies();
      this.dependenciesReady = true;
      console.log('ContentLoader: Dependencies ready');
    } catch (error) {
      console.error('ContentLoader: Failed to load dependencies', error);
      // Continue anyway, features that need these will fail gracefully
      this.dependenciesReady = false;
    }
  }

  /**
   * Parse frontmatter from markdown content
   */
  parseFrontmatter(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      return { frontmatter: {}, content: content };
    }

    const frontmatterText = match[1];
    const markdownContent = match[2];
    
    // Enhanced YAML parser for frontmatter with multiline support
    const frontmatter = {};
    const lines = frontmatterText.split('\n');
    let currentKey = null;
    let isArray = false;
    let isMultiline = false;
    let multilineContent = [];
    let baseIndent = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      
      // Handle multiline content
      if (isMultiline) {
        const currentIndent = line.length - line.trimStart().length;
        
        // Check if this is a new key at the root level (end of multiline)
        if (currentIndent === 0 && trimmed.includes(':') && !trimmed.match(/^\s*-/)) {
          // Save the multiline content
          frontmatter[currentKey] = multilineContent.join('\n').trim();
          isMultiline = false;
          multilineContent = [];
          // Process this line as a new key-value pair
          i--; // Reprocess this line
          continue;
        } else {
          // Add to multiline content - preserve all content including empty lines
          multilineContent.push(line);
          continue;
        }
      }
      
      if (!trimmed) continue;
      
      if (trimmed.startsWith('- ')) {
        // Array item
        if (currentKey && isArray) {
          if (!Array.isArray(frontmatter[currentKey])) {
            frontmatter[currentKey] = [];
          }
          frontmatter[currentKey].push(trimmed.substring(2).replace(/['"]/g, ''));
        }
      } else if (trimmed.includes(':')) {
        // Key-value pair
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim();
        
        currentKey = key;
        
        if (value === '|' || value === '>') {
          // Start of multiline content
          isMultiline = true;
          isArray = false;
          multilineContent = [];
          baseIndent = 2; // Standard YAML indentation
        } else if (value === '') {
          // Likely start of array or object
          isArray = true;
          isMultiline = false;
          frontmatter[key] = [];
        } else {
          isArray = false;
          isMultiline = false;
          // Remove quotes and parse value
          let parsedValue = value.replace(/^['"]|['"]$/g, '');
          
          // Try to parse as number or boolean
          if (parsedValue === 'true') parsedValue = true;
          else if (parsedValue === 'false') parsedValue = false;
          else if (!isNaN(parsedValue) && parsedValue !== '') parsedValue = Number(parsedValue);
          
          frontmatter[key] = parsedValue;
        }
      } else if (currentKey && trimmed.includes(':') && isArray) {
        // Nested object in array
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        const value = trimmed.substring(colonIndex + 1).trim().replace(/^['"]|['"]$/g, '');
        
        if (typeof frontmatter[currentKey] === 'object' && !Array.isArray(frontmatter[currentKey])) {
          frontmatter[currentKey][key] = value;
        } else {
          frontmatter[currentKey] = { [key]: value };
        }
      }
    }
    
    // Handle case where multiline content extends to end of frontmatter
    if (isMultiline && multilineContent.length > 0) {
      frontmatter[currentKey] = multilineContent.join('\n').trim();
    }
    
    return { frontmatter, content: markdownContent };
  }

  /**
   * Load and parse a single markdown file
   */
  async loadMarkdownFile(filepath) {
    // Ensure dependencies are ready
    if (!this.dependenciesReady) {
      await this.waitForDependencies();
    }

    try {
      const response = await fetch(filepath);
      if (!response.ok) {
        throw new Error(`Failed to load ${filepath}: ${response.status}`);
      }
      
      const content = await response.text();
      const { frontmatter, content: markdownContent } = this.parseFrontmatter(content);
      
      // Parse markdown content to HTML
      const htmlContent = marked.parse(markdownContent);
      const sanitizedContent = DOMPurify.sanitize(htmlContent);
      
      return {
        ...frontmatter,
        content: sanitizedContent,
        rawContent: markdownContent,
        filepath
      };
    } catch (error) {
      console.error(`Error loading markdown file ${filepath}:`, error);
      throw error;
    }
  }

  /**
   * Load all content files for a specific content type
   */
  async loadContentType(contentType) {
    const cacheKey = `content_${contentType}`;
    
    // Return cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Prevent multiple simultaneous loads
    if (this.loadingStates.has(cacheKey)) {
      return this.loadingStates.get(cacheKey);
    }

    const loadPromise = this._loadContentTypeInternal(contentType);
    this.loadingStates.set(cacheKey, loadPromise);
    
    try {
      const result = await loadPromise;
      this.cache.set(cacheKey, result);
      this.loadingStates.delete(cacheKey);
      return result;
    } catch (error) {
      this.loadingStates.delete(cacheKey);
      throw error;
    }
  }

  /**
   * Internal method to load content type
   */
  async _loadContentTypeInternal(contentType) {
    try {
      // Try to load the data file first
      const dataModule = await import(`./data/${contentType}Data.js`);
      if (dataModule.default && dataModule.default.files) {
        const files = dataModule.default.files;
        const loadPromises = files.map(file => this.loadMarkdownFile(file));
        const content = await Promise.all(loadPromises);
        
        // Sort by date (newest first)
        content.sort((a, b) => {
          const dateA = new Date(a.releaseDate || a.date || a.createdDate || 0);
          const dateB = new Date(b.releaseDate || b.date || b.createdDate || 0);
          return dateB - dateA;
        });
        
        return {
          items: content,
          total: content.length,
          contentType
        };
      }
    } catch (error) {
      console.warn(`Could not load data file for ${contentType}, falling back to directory scan`, error);
    }

    // Fallback: try to scan the content directory
    // This is a simplified version since we can't easily scan directories in the browser
    throw new Error(`No content data file found for ${contentType}. Please ensure ${contentType}Data.js exists.`);
  }

  /**
   * Clear cache for a specific content type
   */
  clearCache(contentType = null) {
    if (contentType) {
      this.cache.delete(`content_${contentType}`);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get loading state for a content type
   */
  isLoading(contentType) {
    return this.loadingStates.has(`content_${contentType}`);
  }
}

// Create global instance
window.contentLoader = new ContentLoader();

export default ContentLoader;