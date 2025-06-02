/**
 * Netlify Function: Content Scanner
 * Provides real-time content directory scanning for dynamic content discovery
 * Returns discovered content files that may not be in static data files yet
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
    contentDir: '../../content/music/',
    description: 'Music tracks and compositions'
  },
  art: {
    contentType: 'art',
    contentDir: '../../content/art/',
    description: 'Digital art and visual creations'
  },
  photos: {
    contentType: 'photos',
    contentDir: '../../content/photos/',
    description: 'Photography and visual documentation'
  },
  code: {
    contentType: 'code',
    contentDir: '../../content/code/',
    description: 'Development projects and code repositories'
  }
};

/**
 * Scans a directory for .md files and returns sorted file paths
 */
function scanContentDirectory(contentDir, baseContentDir) {
  const fullPath = path.resolve(__dirname, contentDir);
  
  try {
    const files = fs.readdirSync(fullPath);
    const mdFiles = files
      .filter(file => file.endsWith('.md') && file !== '.gitkeep')
      .sort((a, b) => {
        // Sort by filename (which typically includes date) in descending order
        return b.localeCompare(a);
      })
      .map(file => `${baseContentDir}${file}`);
    
    return mdFiles;
  } catch (error) {
    console.error(`Error scanning directory ${contentDir}:`, error.message);
    return [];
  }
}

/**
 * Get file metadata without loading full content
 */
function getFileMetadata(filepath) {
  try {
    const fullPath = path.resolve(__dirname, '../..', filepath);
    const stats = fs.statSync(fullPath);
    
    return {
      filepath,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      lastAccess: stats.atime
    };
  } catch (error) {
    return {
      filepath,
      error: `Unable to read file metadata: ${error.message}`
    };
  }
}

/**
 * Main handler function
 */
export const handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        message: 'Only GET requests are supported'
      })
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const contentType = queryParams.type;
    const includeMetadata = queryParams.metadata === 'true';
    const limit = queryParams.limit ? parseInt(queryParams.limit) : null;

    // If no content type specified, scan all types
    if (!contentType) {
      const allContent = {};
      let totalFiles = 0;

      for (const [type, config] of Object.entries(contentConfig)) {
        const files = scanContentDirectory(config.contentDir, `content/${type}/`);
        allContent[type] = {
          files: limit ? files.slice(0, limit) : files,
          count: files.length,
          description: config.description
        };
        totalFiles += files.length;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          totalFiles,
          contentTypes: allContent,
          message: `Scanned all content types, found ${totalFiles} total files`
        })
      };
    }

    // Validate content type
    if (!contentConfig[contentType]) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid content type',
          message: `Content type '${contentType}' is not supported`,
          supportedTypes: Object.keys(contentConfig)
        })
      };
    }

    // Scan specific content type
    const config = contentConfig[contentType];
    const files = scanContentDirectory(config.contentDir, `content/${contentType}/`);
    const limitedFiles = limit ? files.slice(0, limit) : files;

    // Add metadata if requested
    let filesWithMetadata = limitedFiles;
    if (includeMetadata) {
      filesWithMetadata = limitedFiles.map(file => ({
        ...getFileMetadata(file),
        url: file
      }));
    }

    const response = {
      success: true,
      contentType,
      files: includeMetadata ? filesWithMetadata : limitedFiles,
      count: limitedFiles.length,
      totalFound: files.length,
      description: config.description,
      timestamp: new Date().toISOString(),
      message: `Found ${files.length} ${contentType} files`
    };

    if (limit && files.length > limit) {
      response.message += ` (showing first ${limit})`;
      response.hasMore = true;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Content scanning error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'Failed to scan content directories',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      })
    };
  }
};