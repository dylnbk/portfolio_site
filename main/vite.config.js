// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(fileURLToPath(new URL('.', import.meta.url)), 'index.html'),
        contact: resolve(fileURLToPath(new URL('.', import.meta.url)), 'contact/contact.html')
      }
    }
  }
})