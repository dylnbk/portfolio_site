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
 * Main function to update all content data files
 */
function generateAllContentData() {
  console.log('🚀 Starting automated content discovery...\n');
  
  Object.entries(contentConfig).forEach(([contentType, config]) => {
    updateDataFile(contentType, config);
    console.log(''); // Add spacing between content types
  });
  
  console.log('✨ Content discovery completed!');
  console.log('📝 All data files have been updated with current content.');
}

// Run the script
generateAllContentData();