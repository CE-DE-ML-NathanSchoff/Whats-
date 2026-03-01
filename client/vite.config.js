import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/communities': 'http://localhost:8000',
      '/events': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
      '/socket.io': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
  },
})
