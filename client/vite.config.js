import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// When deployed at a subpath (e.g. /communitree), set BASE_PATH so assets and router work
const basePath = process.env.BASE_PATH || ''
const base = basePath ? basePath.replace(/\/$/, '') + '/' : '/'

export default defineConfig({
  base,
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
