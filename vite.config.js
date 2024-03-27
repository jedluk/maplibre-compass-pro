import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ command }) => {
  return {
    publicDir: command === 'serve',
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
  }
})
