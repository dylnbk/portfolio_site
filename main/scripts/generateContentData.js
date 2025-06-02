/**
 * Automated Content Discovery System
 * Scans content directories and generates/updates data files with complete file lists
 * Preserves existing structure and metadata while dynamically populating files arrays
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Content directory mappings
const contentConfig = {
  music: {
    contentType: 'music',
    contentDir: './content/music/',
    dataFile: './data/data/musicData.js',
    metadata: {
      section: 'MUSIC',
      description: 'Music tracks and compositions',
      icon: '🎵'
    }
  },
  art: {
    contentType: 'art',
    contentDir: './content/art/',
    dataFile: './data/data/artData.js',
    metadata: {
      section: 'ART',
      description: 'Digital art and visual creations',
      icon: '🎨'
    }
  },
  photos: {
    contentType: 'photos',
    contentDir: './content/photos/',
    dataFile: './data/data/photosData.js',
    metadata: {
      section: 'PHOTOS',
      description: 'Photography and visual documentation',
      icon: '📸'
    }
  },
  code: {
    contentType: 'code',
    contentDir: './content/code/',
    dataFile: './data/data/codeData.js',
    metadata: {
      section: 'CODE',
      description: 'Development projects and code repositories',
      icon: '💻'
    }
  }
};

/**
 * Scans a directory for .md files and returns sorted file paths
 */
function scanContentDirectory(contentDir) {
  const fullPath = path.resolve(__dirname, '..', contentDir);
  
  try {
    const files = fs.readdirSync(fullPath);
    const mdFiles = files
      .filter(file => file.endsWith('.md') && file !== '.gitkeep')
      .sort() // Sort alphabetically for consistent ordering
      .map(file => `${contentDir}${file}`);
    
    return mdFiles;
  } catch (error) {
    console.warn(`Warning: Could not read directory ${contentDir}:`, error.message);
    return [];
  }
}

/**
 * Generates the data file content with discovered files
 */
function generateDataFileContent(config, discoveredFiles) {
  const filesArray = discoveredFiles.map(file => `    '${file}'`).join(',\n');
  
  return `/**
 * ${config.metadata.section.charAt(0) + config.metadata.section.slice(1).toLowerCase()} Content Data Configuration
 * Lists all ${config.contentType} content files for the content loader
 */

export default {
  contentType: '${config.contentType}',
  files: [
${filesArray}
  ],
  metadata: {
    section: '${config.metadata.section}',
    description: '${config.metadata.description}',
    icon: '${config.metadata.icon}'
  }
};
`;
}

/**
 * Updates a single data file with discovered content
 */
function updateDataFile(contentType, config) {
  console.log(`🔍 Scanning ${config.contentDir}...`);
  
  const discoveredFiles = scanContentDirectory(config.contentDir);
  console.log(`   Found ${discoveredFiles.length} content files`);
  
  if (discoveredFiles.length > 0) {
    discoveredFiles.forEach(file => console.log(`   - ${file}`));
  }
  
  const dataFilePath = path.resolve(__dirname, '..', config.dataFile);
  const newContent = generateDataFileContent(config, discoveredFiles);
  
  try {
    fs.writeFileSync(dataFilePath, newContent, 'utf8');
    console.log(`✅ Updated ${config.dataFile}`);
  } catch (error) {
    console.error(`❌ Failed to update ${config.dataFile}:`, error.message);
  }
}

/**
 * Validate content files and report issues
 */
function validateContentFiles(contentType, files) {
  const issues = [];
  
  files.forEach(file => {
    const fullPath = path.resolve(__dirname, '..', file);
    
    try {
      if (!fs.existsSync(fullPath)) {
        issues.push(`File not found: ${file}`);
        return;
      }
      
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Basic frontmatter validation
      if (!content.startsWith('---')) {
        issues.push(`Missing frontmatter in: ${file}`);
      }
      
      // Check for required fields based on content type
      const requiredFields = {
        music: ['title', 'audioFile'],
        art: ['title', 'imageFile'],
        photos: ['title', 'imageFile'],
        code: ['title', 'description']
      };
      
      if (requiredFields[contentType]) {
        const missingFields = [];
        requiredFields[contentType].forEach(field => {
          if (!content.includes(`${field}:`)) {
            missingFields.push(field);
          }
        });
        
        if (missingFields.length > 0) {
          issues.push(`Missing required fields in ${file}: ${missingFields.join(', ')}`);
        }
      }
      
    } catch (error) {
      issues.push(`Error reading ${file}: ${error.message}`);
    }
  });
  
  return issues;
}

/**
 * Generate build manifest with timestamp and content info
 */
function generateBuildManifest(contentStats) {
  const manifest = {
    buildTime: new Date().toISOString(),
    contentStats,
    totalFiles: Object.values(contentStats).reduce((sum, stats) => sum + stats.fileCount, 0),
    version: '1.0.0',
    generator: 'generateContentData.js'
  };
  
  const manifestPath = path.resolve(__dirname, '..', 'data/buildManifest.json');
  
  try {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
    console.log('📋 Build manifest updated');
  } catch (error) {
    console.warn('⚠️ Could not write build manifest:', error.message);
  }
}

/**
 * Main function to update all content data files
 */
function generateAllContentData() {
  console.log('🚀 Starting automated content discovery...\n');
  
  const contentStats = {};
  const allIssues = [];
  
  Object.entries(contentConfig).forEach(([contentType, config]) => {
    const discoveredFiles = scanContentDirectory(config.contentDir);
    
    // Validate content files
    const issues = validateContentFiles(contentType, discoveredFiles);
    if (issues.length > 0) {
      console.warn(`⚠️ Issues found in ${contentType} content:`);
      issues.forEach(issue => console.warn(`   ${issue}`));
      allIssues.push(...issues);
    }
    
    updateDataFile(contentType, config);
    
    contentStats[contentType] = {
      fileCount: discoveredFiles.length,
      issues: issues.length,
      lastScan: new Date().toISOString()
    };
    
    console.log(''); // Add spacing between content types
  });
  
  // Generate build manifest
  generateBuildManifest(contentStats);
  
  console.log('✨ Content discovery completed!');
  console.log('📝 All data files have been updated with current content.');
  
  if (allIssues.length > 0) {
    console.log(`⚠️ Total issues found: ${allIssues.length}`);
    console.log('   Please review and fix these issues for optimal content loading.');
  }
  
  // Return stats for programmatic use
  return {
    success: true,
    contentStats,
    totalIssues: allIssues.length,
    timestamp: new Date().toISOString()
  };
}

/**
 * Watch mode for development
 */
function watchMode() {
  console.log('👀 Starting content watch mode...');
  console.log('📁 Monitoring content directories for changes...\n');
  
  const chokidar = require('chokidar');
  
  // Watch all content directories
  const watchPaths = Object.values(contentConfig).map(config =>
    path.resolve(__dirname, '..', config.contentDir)
  );
  
  const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });
  
  let debounceTimer;
  
  const handleChange = (eventType, filePath) => {
    console.log(`📝 ${eventType}: ${filePath}`);
    
    // Debounce rapid changes
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      console.log('🔄 Regenerating content data...');
      generateAllContentData();
      console.log('✅ Content data updated!\n');
    }, 1000);
  };
  
  watcher
    .on('add', path => handleChange('File added', path))
    .on('change', path => handleChange('File changed', path))
    .on('unlink', path => handleChange('File removed', path));
  
  console.log('✅ Watch mode active. Press Ctrl+C to stop.');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--watch')) {
  watchMode();
} else {
  // Run the script normally
  const result = generateAllContentData();
  
  // Exit with error code if issues were found (for CI/CD)
  if (result.totalIssues > 0 && args.includes('--strict')) {
    process.exit(1);
  }
}