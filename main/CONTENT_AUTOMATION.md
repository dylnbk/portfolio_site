# Content Automation System

This document explains the comprehensive content automation system that ensures new CMS content appears immediately without requiring manual builds.

## Overview

The system provides multiple layers of content discovery and automation:

1. **Static Data Files** (Primary) - Pre-generated during build for optimal performance
2. **Runtime Discovery** (Fallback) - Dynamic content scanning when static files are incomplete
3. **Direct File Access** (Last Resort) - Pattern-based content discovery
4. **Build Automation** - Automatic regeneration triggers and workflows

## Architecture

### Content Loading Flow

```
1. Try Static Data File (./data/data/{type}Data.js)
   ↓ (if fails)
2. Runtime Discovery via Netlify Function
   ↓ (if fails)  
3. Direct File Access with Common Patterns
   ↓ (if fails)
4. Return Empty Structure (prevents crashes)
```

### Key Components

#### 1. Enhanced Content Loader (`main/data/contentLoader.js`)

**New Features:**
- `_discoverContentRuntime()` - Calls Netlify function for real-time scanning
- `_attemptDirectFileAccess()` - Tries common file patterns directly
- `_tryLoadFile()` - Safe file loading with error handling
- `refreshContent()` - Manual cache clearing and reload

**Usage:**
```javascript
// Load content with automatic fallbacks
const musicContent = await contentLoader.loadContentType('music');

// Force refresh content
const freshContent = await contentLoader.refreshContent('music');
```

#### 2. Content Scanning Function (`main/netlify/functions/scanContent.js`)

**Endpoints:**
- `/.netlify/functions/scanContent?type=music` - Scan specific content type
- `/.netlify/functions/scanContent` - Scan all content types
- `/.netlify/functions/scanContent?metadata=true` - Include file metadata

**Response Format:**
```json
{
  "success": true,
  "contentType": "music",
  "files": ["content/music/2025-06-02-new-track.md"],
  "count": 1,
  "timestamp": "2025-06-02T13:44:00.000Z"
}
```

#### 3. Content Generation Script (`main/scripts/generateContentData.js`)

**Enhanced Features:**
- Content validation with error reporting
- Build manifest generation
- Watch mode for development
- Strict mode for CI/CD pipelines

**Usage:**
```bash
# Generate content data
npm run content:generate

# Watch for changes in development
npm run content:watch

# Generate with validation in strict mode
node scripts/generateContentData.js --strict
```

#### 4. Content Manager Utility (`main/scripts/contentManager.js`)

**Commands:**
```bash
# Test runtime discovery system
npm run content:test

# Create test content for testing
node scripts/contentManager.js create music

# Run full automation test
npm run content:test-full

# Clean up test files
npm run content:cleanup
```

## Development Workflows

### 1. Local Development with Auto-Regeneration

```bash
# Start development with content watching
npm run dev:watch

# This runs both:
# - Content watcher (regenerates data files on content changes)
# - Vite development server
```

### 2. Testing Content Discovery

```bash
# Test the entire automation system
npm run content:test-full

# This will:
# 1. Test current content discovery
# 2. Create test content
# 3. Verify discovery works
# 4. Trigger refresh
# 5. Clean up test files
```

### 3. Manual Content Refresh

```bash
# Regenerate all content data files
npm run content:refresh

# Test specific content type discovery
npm run content:test
```

## Production Deployment

### Build Process

The enhanced build process ensures content is always up-to-date:

1. **Pre-build**: `npm run content:generate` - Scans and generates data files
2. **Build**: `vite build` - Builds the application with current content
3. **Post-build**: `node copy.js` - Handles file copying

### Netlify Configuration

**Build Settings** (`netlify.toml`):
- Automatic content data generation
- Cache control for dynamic content
- API redirects for content scanning function
- Environment-specific build commands

**Edge Functions**:
- `/refresh-content` - Triggers content refresh and cache clearing

### Cache Strategy

1. **Static Data Files**: Cached during build, served quickly
2. **Netlify Function**: 60s cache with 5-minute stale-while-revalidate
3. **Content Files**: 5-minute cache with 10-minute stale-while-revalidate

## CMS Integration

### Decap CMS Configuration

Enhanced `admin/config.yml` with:
- Editorial workflow for content review
- Preview links for immediate feedback
- Consistent slug generation
- Site branding and editor settings

### Content Types Supported

All content types have runtime discovery:
- **Music**: Tracks, albums, streaming links
- **Art**: Digital art, paintings, sculptures
- **Photos**: Photography with EXIF data
- **Code**: Projects, repositories, demos

## Error Handling & Fallbacks

### Graceful Degradation

1. **Static File Missing**: Falls back to runtime discovery
2. **Function Unavailable**: Falls back to direct file access
3. **Network Issues**: Returns cached content or empty structure
4. **Malformed Content**: Skips invalid files, reports errors

### Error Reporting

The system provides detailed error information:
- Build-time validation errors
- Runtime discovery failures
- File access issues
- Content validation problems

## Monitoring & Debugging

### Build Manifest

Generated at `main/data/buildManifest.json`:
```json
{
  "buildTime": "2025-06-02T13:44:00.000Z",
  "contentStats": {
    "music": { "fileCount": 5, "issues": 0 },
    "art": { "fileCount": 8, "issues": 1 }
  },
  "totalFiles": 23,
  "version": "1.0.0"
}
```

### Debug Information

Content loader provides debug info:
- Discovery method used (`static`, `runtime`, `direct-access`)
- Timestamp of last load
- Cache status
- Error details

## Performance Optimizations

### Content Loading

1. **Caching**: Aggressive caching with smart invalidation
2. **Lazy Loading**: Load content types only when needed
3. **Batch Processing**: Parallel file loading where possible
4. **Error Recovery**: Fast fallbacks prevent loading delays

### Build Optimizations

1. **Incremental Updates**: Only regenerate changed content types
2. **Validation**: Early error detection prevents deployment issues
3. **Parallel Processing**: Concurrent content type processing
4. **Smart Defaults**: Reasonable fallbacks for missing metadata

## Troubleshooting

### Common Issues

**Content Not Appearing:**
1. Check static data files exist in `main/data/data/`
2. Test runtime discovery: `npm run content:test`
3. Verify file naming follows pattern: `YYYY-MM-DD-slug.md`
4. Check file permissions and accessibility

**Build Failures:**
1. Run with strict mode: `node scripts/generateContentData.js --strict`
2. Check content validation errors
3. Verify all required frontmatter fields present

**Function Errors:**
1. Check Netlify function logs
2. Verify file paths and permissions
3. Test locally with `netlify dev`

### Debug Commands

```bash
# Test specific content type
node scripts/contentManager.js test

# Create and test with sample content
node scripts/contentManager.js create music
npm run content:test

# Full system test
npm run content:test-full
```

## Configuration

### Environment Variables

- `NETLIFY_BUILD_HOOK_URL`: Optional build hook for content refresh
- `NODE_ENV`: Environment mode (development/production)

### Customization

**Content Types**: Add new types in `scripts/generateContentData.js`
**Validation Rules**: Modify validation in `validateContentFiles()`
**Cache Duration**: Adjust cache headers in `netlify.toml`
**File Patterns**: Update patterns in `_attemptDirectFileAccess()`

## Benefits

1. **Immediate Visibility**: New content appears instantly without builds
2. **Performance**: Static files provide optimal loading speed
3. **Reliability**: Multiple fallback mechanisms ensure robustness
4. **Developer Experience**: Automated workflows reduce manual work
5. **Scalability**: System handles growing content libraries efficiently

This automation system transforms the portfolio from a static site requiring manual builds into a dynamic platform where content management "just works" for both creators and visitors.