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
        // Manual chunk splitting for better caching and lazy loading
        manualChunks: (id) => {
          // Vendor chunks for third-party libraries
          if (id.includes('node_modules')) {
            // Three.js now lazy loaded, so keep it separate for code splitting
            if (id.includes('three')) {
              return 'vendor-three';
            }
            // OpenAI should be lazy loaded with chat
            if (id.includes('openai')) {
              return 'vendor-openai';
            }
            return 'vendor';
          }
          // Component chunks (all lazy loaded)
          if (id.includes('/components/')) {
            if (id.includes('/music/')) return 'components-music';
            if (id.includes('/gallery/')) return 'components-gallery';
            if (id.includes('/code/')) return 'components-code';
            return 'components-shared';
          }
          // Speech/chat chunks (lazy loaded)
          if (id.includes('/speech/')) {
            return 'speech';
          }
          if (id.includes('chat') && !id.includes('chat-cursor-effect')) {
            return 'chat';
          }
          // ASCII background as separate chunk (MUST be lazy loaded now)
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
    // Enable minification with aggressive settings
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console in production for better performance
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Multiple passes for better compression
        unsafe_arrows: true,
        unsafe_methods: true,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false, // Remove all comments
      }
    },
    // Chunk size warnings - stricter for performance monitoring
    chunkSizeWarningLimit: 500, // Reduced from 1000 to 500 KiB
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Source maps for debugging (disable in production for smaller builds)
    sourcemap: false,
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true
    },
    // Target modern browsers for smaller bundle size
    target: 'es2020',
    // Reduce module preload polyfill
    modulePreload: {
      polyfill: false
    }
  },
  // Optimize dependencies during dev and build
  optimizeDeps: {
    include: [], // Let Vite auto-detect to improve tree-shaking
    exclude: ['three'], // Exclude Three.js from pre-bundling for better tree-shaking
    esbuildOptions: {
      // Enable tree-shaking in dev
      treeShaking: true,
      target: 'es2020'
    }
  },
  // Enable esbuild for faster builds and better tree-shaking
  esbuild: {
    treeShaking: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
    legalComments: 'none'
  }
})