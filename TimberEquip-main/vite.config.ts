import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  void env;

  return {
    plugins: [react(), tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined;

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router/') ||
              id.includes('/react-router-dom/') ||
              id.includes('/scheduler/')
            ) {
              return 'react-vendor';
            }

            if (id.includes('/firebase/')) {
              return 'firebase-vendor';
            }

            if (id.includes('/framer-motion/') || id.includes('/motion/')) {
              return 'motion-vendor';
            }

            if (id.includes('/lucide-react/')) {
              return 'icons-vendor';
            }

            if (id.includes('/stripe/')) {
              return 'stripe-vendor';
            }

            const packagePath = id.split('node_modules/')[1];
            if (!packagePath) return 'vendor';

            const segments = packagePath.split('/');
            const packageName = segments[0].startsWith('@') ? `${segments[0]}-${segments[1] || 'pkg'}` : segments[0];
            if (packageName === 'set-cookie-parser') {
              return undefined;
            }
            return `vendor-${packageName.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify; file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
