import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('node_modules/react') || id.includes('node_modules/axios')) return 'react'
          if (id.includes('node_modules/@mui/icons-material')) return 'icons'
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) return 'mui'
          if (id.includes('node_modules/chart.js') || id.includes('node_modules/react-chartjs-2')) return 'charts'
          if (id.includes('node_modules/leaflet')) return 'maps'
          return 'vendor'
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
})
