/**
 * Image Optimization Helper Script
 * 
 * This script provides guidance and utilities for optimizing images.
 * 
 * To actually compress images, you would need to install additional packages:
 * npm install --save-dev sharp
 * 
 * Then run this script with: node scripts/imageOptimizationHelper.js
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../assets/uploads');
const OUTPUT_DIR = path.join(__dirname, '../assets/optimized');

console.log('=== Image Optimization Helper ===\n');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
  console.log('✓ Sharp is installed\n');
} catch (err) {
  console.log('✗ Sharp is not installed');
  console.log('To use image optimization, install sharp:');
  console.log('  npm install --save-dev sharp\n');
  console.log('This script will now analyze images without optimizing them.\n');
}

// Analyze images
function analyzeImages() {
  console.log('Analyzing images in:', ASSETS_DIR);
  
  if (!fs.existsSync(ASSETS_DIR)) {
    console.log('Assets directory not found');
    return;
  }

  const files = fs.readdirSync(ASSETS_DIR);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|gif|webp)$/i.test(file)
  );

  console.log(`Found ${imageFiles.length} images\n`);

  let totalSize = 0;
  const imageStats = [];

  imageFiles.forEach(file => {
    const filePath = path.join(ASSETS_DIR, file);
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    totalSize += stats.size;

    imageStats.push({
      name: file,
      size: sizeKB,
      path: filePath
    });
  });

  // Sort by size (largest first)
  imageStats.sort((a, b) => parseFloat(b.size) - parseFloat(a.size));

  console.log('Top 10 largest images:');
  imageStats.slice(0, 10).forEach((img, i) => {
    console.log(`${i + 1}. ${img.name} - ${img.size} KB`);
  });

  console.log(`\nTotal size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  // Recommendations
  console.log('\n=== Optimization Recommendations ===\n');
  
  const largeImages = imageStats.filter(img => parseFloat(img.size) > 500);
  if (largeImages.length > 0) {
    console.log(`⚠ ${largeImages.length} images are larger than 500KB`);
    console.log('Consider compressing these images or using responsive images.\n');
  }

  if (sharp) {
    console.log('Ready to optimize! Run optimizeImages() function.');
  } else {
    console.log('Install sharp to enable automatic optimization:');
    console.log('  npm install --save-dev sharp');
  }

  return imageStats;
}

// Optimize images (requires sharp)
async function optimizeImages(imageStats) {
  if (!sharp) {
    console.log('Sharp is not installed. Cannot optimize images.');
    return;
  }

  console.log('\n=== Starting Image Optimization ===\n');

  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const img of imageStats) {
    const inputPath = img.path;
    const outputPath = path.join(OUTPUT_DIR, img.name);
    const ext = path.extname(img.name).toLowerCase();

    try {
      totalOriginalSize += parseFloat(img.size);

      // Optimize based on file type
      let sharpInstance = sharp(inputPath);

      if (ext === '.jpg' || ext === '.jpeg') {
        await sharpInstance
          .jpeg({ quality: 85, progressive: true })
          .toFile(outputPath);
      } else if (ext === '.png') {
        await sharpInstance
          .png({ compressionLevel: 9 })
          .toFile(outputPath);
      } else if (ext === '.webp') {
        await sharpInstance
          .webp({ quality: 80 })
          .toFile(outputPath);
      } else {
        // Copy as-is for unsupported formats
        fs.copyFileSync(inputPath, outputPath);
      }

      const outputStats = fs.statSync(outputPath);
      const outputSizeKB = (outputStats.size / 1024).toFixed(2);
      totalOptimizedSize += parseFloat(outputSizeKB);

      const savings = ((1 - outputStats.size / (parseFloat(img.size) * 1024)) * 100).toFixed(1);
      console.log(`✓ ${img.name}: ${img.size}KB → ${outputSizeKB}KB (${savings}% savings)`);

    } catch (err) {
      console.error(`✗ Error optimizing ${img.name}:`, err.message);
    }
  }

  const totalSavings = ((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1);
  console.log(`\n=== Optimization Complete ===`);
  console.log(`Original size: ${totalOriginalSize.toFixed(2)} KB`);
  console.log(`Optimized size: ${totalOptimizedSize.toFixed(2)} KB`);
  console.log(`Total savings: ${totalSavings}%`);
  console.log(`\nOptimized images saved to: ${OUTPUT_DIR}`);
  console.log('\nReview the optimized images, then replace originals if satisfied.');
}

// Run analysis
const imageStats = analyzeImages();

// Uncomment to run optimization (requires sharp)
// if (imageStats && sharp) {
//   optimizeImages(imageStats);
// }

module.exports = { analyzeImages, optimizeImages };
