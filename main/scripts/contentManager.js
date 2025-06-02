/**
 * Content Manager Utility
 * Provides utilities for manual content management and testing automation features
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentManager {
  constructor() {
    this.baseDir = path.resolve(__dirname, '..');
  }

  /**
   * Test the runtime content discovery system
   */
  async testRuntimeDiscovery() {
    console.log('🧪 Testing runtime content discovery system...\n');
    
    const results = {};
    const contentTypes = ['music', 'art', 'photos', 'code'];
    
    for (const contentType of contentTypes) {
      console.log(`Testing ${contentType} discovery...`);
      
      try {
        // Test Netlify function endpoint
        const response = await fetch(`http://localhost:8888/.netlify/functions/scanContent?type=${contentType}`);
        
        if (response.ok) {
          const data = await response.json();
          results[contentType] = {
            status: 'success',
            filesFound: data.files?.length || 0,
            method: 'netlify-function'
          };
          console.log(`✅ Found ${data.files?.length || 0} files via Netlify function`);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Netlify function failed: ${error.message}`);
        
        // Test direct file access fallback
        try {
          const contentDir = path.join(this.baseDir, 'content', contentType);
          const files = fs.readdirSync(contentDir)
            .filter(file => file.endsWith('.md'));
          
          results[contentType] = {
            status: 'fallback',
            filesFound: files.length,
            method: 'direct-access'
          };
          console.log(`⚠️ Fallback found ${files.length} files via direct access`);
        } catch (fallbackError) {
          results[contentType] = {
            status: 'failed',
            filesFound: 0,
            method: 'none',
            error: fallbackError.message
          };
          console.log(`❌ All methods failed: ${fallbackError.message}`);
        }
      }
      console.log('');
    }
    
    console.log('📊 Runtime Discovery Test Results:');
    console.table(results);
    
    return results;
  }

  /**
   * Simulate new content creation for testing
   */
  createTestContent(contentType = 'music') {
    console.log(`🎭 Creating test ${contentType} content...`);
    
    const timestamp = new Date().toISOString().split('T')[0];
    const randomId = Math.random().toString(36).substring(7);
    
    const testContent = {
      music: {
        frontmatter: {
          title: `Test Track ${randomId}`,
          artist: 'Test Artist',
          releaseDate: new Date().toISOString(),
          genre: 'Electronic',
          audioFile: '/assets/uploads/music/test-track.mp3',
          duration: '3:45',
          featured: true,
          tags: ['test', 'automation']
        },
        content: `This is a test music track created to verify the content automation system.

## About This Track
This track was automatically generated for testing purposes.

### Technical Details
- Created: ${new Date().toISOString()}
- Purpose: System testing
- Auto-discovery: Should appear immediately`
      },
      art: {
        frontmatter: {
          title: `Test Artwork ${randomId}`,
          creationDate: new Date().toISOString(),
          medium: 'Digital',
          image: '/assets/uploads/gallery/test-art.png',
          featured: true,
          tags: ['test', 'automation']
        },
        content: `This is a test artwork created to verify the content automation system.`
      },
      photos: {
        frontmatter: {
          title: `Test Photo ${randomId}`,
          dateTaken: new Date().toISOString(),
          location: 'Test Studio',
          photo: '/assets/uploads/gallery/test-photo.jpg',
          featured: true,
          tags: ['test', 'automation']
        },
        content: `This is a test photograph created to verify the content automation system.`
      },
      code: {
        frontmatter: {
          title: `Test Project ${randomId}`,
          date: new Date().toISOString(),
          projectType: 'Tool',
          technologies: ['JavaScript', 'Node.js'],
          status: 'Completed',
          featured: true,
          tags: ['test', 'automation']
        },
        content: `This is a test code project created to verify the content automation system.

## Features
- Automated content discovery
- Runtime fallback mechanisms
- Build integration

## Testing
This project tests the automation pipeline.`
      }
    };

    const template = testContent[contentType];
    if (!template) {
      console.error(`❌ Unknown content type: ${contentType}`);
      return null;
    }

    // Generate frontmatter
    const frontmatterLines = Object.entries(template.frontmatter)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}:\n${value.map(v => `  - ${v}`).join('\n')}`;
        }
        return `${key}: ${typeof value === 'string' ? `"${value}"` : value}`;
      });

    const fileContent = `---
${frontmatterLines.join('\n')}
---

${template.content}`;

    const filename = `${timestamp}-test-${randomId}.md`;
    const filepath = path.join(this.baseDir, 'content', contentType, filename);

    try {
      fs.writeFileSync(filepath, fileContent, 'utf8');
      console.log(`✅ Created test file: ${filename}`);
      console.log(`📁 Location: content/${contentType}/${filename}`);
      
      return {
        filename,
        filepath,
        contentType,
        created: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ Failed to create test file: ${error.message}`);
      return null;
    }
  }

  /**
   * Clean up test content
   */
  cleanupTestContent() {
    console.log('🧹 Cleaning up test content...');
    
    const contentTypes = ['music', 'art', 'photos', 'code'];
    let cleaned = 0;

    for (const contentType of contentTypes) {
      const contentDir = path.join(this.baseDir, 'content', contentType);
      
      try {
        const files = fs.readdirSync(contentDir);
        const testFiles = files.filter(file => file.includes('test-') && file.endsWith('.md'));
        
        for (const file of testFiles) {
          const filepath = path.join(contentDir, file);
          fs.unlinkSync(filepath);
          console.log(`🗑️ Removed: ${file}`);
          cleaned++;
        }
      } catch (error) {
        console.warn(`⚠️ Could not clean ${contentType}: ${error.message}`);
      }
    }

    console.log(`✅ Cleaned up ${cleaned} test files`);
    return cleaned;
  }

  /**
   * Trigger content refresh
   */
  async triggerRefresh(contentType = null) {
    console.log(`🔄 Triggering content refresh${contentType ? ` for ${contentType}` : ''}...`);
    
    try {
      const response = await fetch('http://localhost:8888/refresh-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contentType: contentType || 'all',
          trigger: 'manual',
          timestamp: new Date().toISOString()
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Refresh triggered successfully');
        console.log('📊 Result:', result);
        return result;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error(`❌ Refresh failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Full automation test workflow
   */
  async runFullTest() {
    console.log('🚀 Running full automation test workflow...\n');
    
    // 1. Test current discovery
    console.log('=== Step 1: Test Current Discovery ===');
    await this.testRuntimeDiscovery();
    
    // 2. Create test content
    console.log('\n=== Step 2: Create Test Content ===');
    const testFile = this.createTestContent('music');
    
    if (!testFile) {
      console.error('❌ Could not create test content, aborting test');
      return;
    }

    // 3. Wait a moment
    console.log('\n=== Step 3: Testing Discovery ===');
    console.log('⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Test discovery again
    const postResults = await this.testRuntimeDiscovery();
    
    // 5. Trigger refresh
    console.log('\n=== Step 4: Trigger Refresh ===');
    await this.triggerRefresh();
    
    // 6. Cleanup
    console.log('\n=== Step 5: Cleanup ===');
    this.cleanupTestContent();
    
    console.log('\n✨ Full automation test completed!');
    
    return {
      testFile,
      discoveryResults: postResults,
      timestamp: new Date().toISOString()
    };
  }
}

// CLI Interface
const args = process.argv.slice(2);
const manager = new ContentManager();

switch (args[0]) {
  case 'test':
    manager.testRuntimeDiscovery();
    break;
  case 'create':
    manager.createTestContent(args[1] || 'music');
    break;
  case 'cleanup':
    manager.cleanupTestContent();
    break;
  case 'refresh':
    manager.triggerRefresh(args[1]);
    break;
  case 'full-test':
    manager.runFullTest();
    break;
  default:
    console.log(`
Content Manager Utility

Usage:
  node scripts/contentManager.js <command> [options]

Commands:
  test              Test runtime content discovery
  create [type]     Create test content (type: music, art, photos, code)
  cleanup           Remove all test content files
  refresh [type]    Trigger content refresh
  full-test         Run complete automation test workflow

Examples:
  node scripts/contentManager.js test
  node scripts/contentManager.js create music
  node scripts/contentManager.js refresh
  node scripts/contentManager.js full-test
`);
}