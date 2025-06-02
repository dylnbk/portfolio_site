// Debug script to validate CMS path issues
const fs = require('fs');
const path = require('path');

console.log('=== CMS PATH DEBUGGING ===');
console.log('Current working directory:', process.cwd());
console.log('');

// Check file locations
const problematicFile = 'main/content/photos/main/assets/uploads/gallery/kodak-gc400-22-.jpg';
const expectedFile = 'main/assets/uploads/gallery/kodak-gc400-22-.jpg';

console.log('1. FILE LOCATION CHECK:');
console.log('Problematic nested path exists:', fs.existsSync(problematicFile));
console.log('Expected path exists:', fs.existsSync(expectedFile));
console.log('');

// Check all gallery files
console.log('2. GALLERY DIRECTORY CONTENTS:');
const galleryDir = 'main/assets/uploads/gallery';
if (fs.existsSync(galleryDir)) {
  const files = fs.readdirSync(galleryDir);
  console.log('Files in main/assets/uploads/gallery:', files);
} else {
  console.log('Gallery directory does not exist!');
}
console.log('');

// Check content file paths
console.log('3. CONTENT FILE ANALYSIS:');
const contentFiles = [
  'main/content/photos/2025-06-02-siem-reap-cambodia.md',
  'main/content/photos/2025-06-02-kuala-lumpur-malaysia.md'
];

contentFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const imageMatch = content.match(/image:\s*(.+)/);
    if (imageMatch) {
      console.log(`${path.basename(file)}: ${imageMatch[1]}`);
    }
  }
});
console.log('');

// Check if problematic file can be served
console.log('4. ASSET SERVING TEST:');
console.log('Checking if problematic file would be accessible...');
const relativeFromMain = problematicFile.replace('main/', '');
console.log('Relative path from main:', relativeFromMain);
console.log('Public URL would be:', `/assets/uploads/gallery/kodak-gc400-22-.jpg`);
console.log('But file is actually at:', problematicFile);