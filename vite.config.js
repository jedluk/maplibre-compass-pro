import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  publicDir: false,
  build: {
    lib: {
      entry: resolve(__dirname, 'src/compass.ts'),
      name: 'compass',
      fileName: 'maplibre-compass-pro',
    },
    rollupOptions: {
      external: ['maplibre-gl'],
    },
    outDir: 'dist',
  },
})
