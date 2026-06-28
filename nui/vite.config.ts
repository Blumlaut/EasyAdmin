import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative base so asset paths in the built HTML resolve correctly
  // from the ui_page location (nui/dist/) in FiveM's NUI system.
  // Without this, Vite emits absolute paths like /assets/... which FiveM
  // resolves to the resource root instead of nui/dist/assets/.
  base: './',
  plugins: [tailwindcss(), react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2022',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react';
          }
        },
      },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 3333,
    strictPort: true,
  },
})
