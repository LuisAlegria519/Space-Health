import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Fixed port (5173 is used by the separate ~/astro-twin project). strictPort
  // makes Vite fail loudly instead of silently moving to another port.
  server: { port: 5174, strictPort: true, open: true },
})
