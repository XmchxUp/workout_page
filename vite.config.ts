import process from 'node:process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss(), viteTsconfigPaths()],
  base: process.env.PATH_PREFIX || '/',
  build: {
    outDir: './dist',
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            return 'vendors';
          }
        },
      },
    },
  },
});
