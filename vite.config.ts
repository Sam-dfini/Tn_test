import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig, loadEnv } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      visualizer({
        open: true,
        filename: 'dist/stats.html',
        title: 'TunisiaIntel Bundle Analysis',
      }),
    ],
    build: {
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('d3') || id.includes('recharts')) return 'charts';
              if (id.includes('leaflet') || id.includes('react-leaflet')) return 'maps';
              if (id.includes('motion') || id.includes('framer-motion')) return 'animation';
              if (id.includes('tsparticles') || id.includes('particles')) return 'particles';
              if (id.includes('katex')) return 'katex';
              if (id.includes('three') || id.includes('@react-three')) return 'three';
              if (id.includes('supabase')) return 'supabase';
              return 'vendor';
            }
            // Explicitly chunk lazy-loaded components
            if (id.includes('src/components/political/GeopoliticalNetworkGraph')) return 'political';
            if (id.includes('src/components/political/NationalActorNetwork')) return 'political';
            if (id.includes('src/components/security/SecurityIntelligence')) return 'security';
            if (id.includes('src/components/security/RadicalisationIntelligence')) return 'security';
            if (id.includes('src/components/economy/EconomyIntelligence')) return 'economy';
            if (id.includes('src/components/economy/BusinessInvestigator')) return 'economy';
            if (id.includes('src/components/agriculture/AgriIntelDashboard')) return 'agriculture';
            if (id.includes('src/components/agriculture/EnvironmentalIntelligence')) return 'agriculture';
            if (id.includes('src/components/predictive/StrategicModeling')) return 'predictive';
            if (id.includes('src/components/predictive/SimulationIntelligence')) return 'predictive';
            if (id.includes('src/components/social/SocialPoliticalIntelligence')) return 'social';
            if (id.includes('src/components/social/NarrativeIntelligence')) return 'social';
            return 'app';
          },
        },
        plugins: [visualizer()],
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
      host: true,
      port: 3000,
      hmr: process.env.DISABLE_HMR === 'true' ? false : undefined
    },
  };
});
