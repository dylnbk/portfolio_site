// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  publicDir: 'assets', // Set assets as public directory for proper media handling
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        contact: resolve(__dirname, 'contact/contact.html')
      },
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks for third-party libraries
          if (id.includes('node_modules')) {
            if (id.includes('three')) {
              return 'vendor-three';
            }
            return 'vendor';
          }
          // Component chunks
          if (id.includes('/components/')) {
            if (id.includes('/music/')) return 'components-music';
            if (id.includes('/gallery/')) return 'components-gallery';
            if (id.includes('/code/')) return 'components-code';
            return 'components-shared';
          }
          // Speech/chat chunks
          if (id.includes('/speech/')) {
            return 'speech';
          }
          if (id.includes('chat')) {
            return 'chat';
          }
          // ASCII background as separate chunk (can be lazy loaded)
          if (id.includes('ascii-background')) {
            return 'ascii-background';
          }
        },
        // Better asset naming for caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          } else if (/woff|woff2|eot|ttf|otf/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      }
    },
    copyPublicDir: true,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Keep console for debugging, set to true for production
        drop_debugger: true,
        pure_funcs: ['console.log'] // Remove console.log in production
      }
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production for smaller builds)
    sourcemap: false,
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  // Optimize dependencies during dev and build
  optimizeDeps: {
    include: ['three', 'openai'],
    exclude: []
  }
})