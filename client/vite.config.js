import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    proxy: {
      '/auth': 'http://localhost:7000',
      '/users': 'http://localhost:7000',
      '/communities': 'http://localhost:7000',
      '/events': 'http://localhost:7000',
      '/health': 'http://localhost:7000',
      '/socket.io': {
        target: 'http://localhost:7000',
        ws: true,
      },
    },
  },
})
