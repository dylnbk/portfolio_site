// vite.config.js
const { resolve } = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  publicDir: false, // Disable automatic public dir copying to avoid conflict with copy.js
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