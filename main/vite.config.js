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
      }
    },
    copyPublicDir: true
  }
})