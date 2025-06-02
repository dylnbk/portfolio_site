// Debug CMS Path Issues
console.log('=== CMS PATH DEBUGGING ===');

// Check current repository structure
const fs = require('fs');
const path = require('path');

console.log('\n1. Repository Structure Check:');
console.log('Working directory:', process.cwd());

// Check if assets exist at different paths
const checkPath = (pathToCheck) => {
  try {
    const exists = fs.existsSync(pathToCheck);
    const isDir = exists && fs.statSync(pathToCheck).isDirectory();
    console.log(`${pathToCheck}: ${exists ? (isDir ? 'EXISTS (DIR)' : 'EXISTS (FILE)') : 'NOT FOUND'}`);
    
    if (exists && isDir) {
      const files = fs.readdirSync(pathToCheck);
      console.log(`  Contents (${files.length} items):`, files.slice(0, 5).join(', '));
      if (files.length > 5) console.log(`  ... and ${files.length - 5} more`);
    }
  } catch (error) {
    console.log(`${pathToCheck}: ERROR - ${error.message}`);
  }
};

// Check various asset path configurations
checkPath('assets/uploads');
checkPath('main/assets/uploads');
checkPath('./assets/uploads');
checkPath('./main/assets/uploads');
checkPath('assets/uploads/gallery');
checkPath('main/assets/uploads/gallery');

console.log('\n2. Specific Missing File Check:');
const missingFile = 'main/assets/uploads/gallery/cn800-23-.jpg';
checkPath(missingFile);

console.log('\n3. CMS Content vs File Reality:');
// Check content files that reference missing assets
const contentDir = 'content/photos';  // Fixed: we're in main/ already
if (fs.existsSync(contentDir)) {
  const contentFiles = fs.readdirSync(contentDir);
  contentFiles.forEach(file => {
    if (file.endsWith('.md')) {
      const content = fs.readFileSync(path.join(contentDir, file), 'utf8');
      const imageMatch = content.match(/image:\s*(.+)/);
      if (imageMatch) {
        const imagePath = imageMatch[1].trim();
        const fullImagePath = imagePath; // Since we're in main/, path should be relative
        const exists = fs.existsSync(fullImagePath);
        console.log(`${file}: ${imagePath} -> ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
      }
    }
  });
}

console.log('\n4. Git Status Check:');
const { execSync } = require('child_process');
try {
  const gitStatus = execSync('git status --porcelain assets/').toString();
  console.log('Git status for assets:', gitStatus || 'No changes');
  
  const gitLsFiles = execSync('git ls-files assets/').toString();
  console.log('Git tracked asset files:', gitLsFiles.split('\n').length - 1, 'files');
} catch (error) {
  console.log('Git check failed:', error.message);
}

console.log('\n=== END DEBUG ===');