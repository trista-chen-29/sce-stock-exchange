import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/start-monitoring": "http://localhost:3000",
      "/history": "http://localhost:3000",
      "/refresh": "http://localhost:3000",
      "/stop-monitoring": "http://localhost:3000",
    },
  },
});
