import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('recharts') || id.includes('d3')) return 'charts';
              if (id.includes('leaflet')) return 'maps';
              if (id.includes('motion')) return 'animation';
              if (id.includes('tsparticles')) return 'particles';
              if (id.includes('katex')) return 'katex';
              return 'vendor';
            }
          },
        },
      },
    },
    define: {
      // Keys handled server-side in server.ts
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // Port/host is managed by Express in server.ts — do not bind here
      watch: {
        // Ignore non-source directories that change at runtime and cause spurious full reloads
        ignored: [
          '**/backend/**',
          '**/dist/**',
          '**/graphify-out/**',
          '**/__pycache__/**',
          '**/*.pyc',
          '**/node_modules/**',
          '**/patch_graphify.cjs',
          '**/debug_page.js',
          '**/*.log',
          '**/*.txt',
          '**/missing_imports.json',
          '**/test-results/**',
          '**/supabase/**',
          '**/docs/**',
          '**/ARCHITECTURE.md',
          '**/METHODOLOGY.md',
          '**/README.md',
          '**/REFACTOR_PLAN.md',
          '**/UPGRADE_PLAN.md',
          '**/CHANGELOG.md',
          '**/seed_variables.ts',
          '**/generate_variables.ts',
          '**/trigger_sync.ts',
          '**/Tn_test-main/**',
          '**/.*',
          '**/*.tmp',
          '**/temp/**',
          '**/data/**',
          '**/logs/**',
          '**/backend/data/**',
          '**/public/data/**',
          '**/src/data/**',
          '**/*.json',
        ],
        usePolling: true,
        interval: 1000,
      },
      hmr: {
        overlay: false,
      },
    },
  };
});
