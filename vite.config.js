import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

export default defineConfig({
  plugins: [react()],
  build: { rollupOptions: { input: {
    main: resolve(import.meta.dirname, 'index.html'),
    order: resolve(import.meta.dirname, 'order/index.html'),
    fineprint: resolve(import.meta.dirname, 'fineprint/index.html'),
  } } },
})
