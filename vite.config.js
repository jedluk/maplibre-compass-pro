import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig(({ command }) => {
  return {
    publicDir: command === 'serve',
    build: {
      lib: {
        entry: resolve(__dirname, 'src/compass.ts'),
        name: 'compass',
        fileName: 'compass',
      },
      rollupOptions: {
        external: ['maplibre-gl'],
      },
    },
    ...(command === 'build' && {
      plugins: [
        dts({
          rollupTypes: true,
          outDir: __dirname,
        }),
      ],
    }),
  }
})
