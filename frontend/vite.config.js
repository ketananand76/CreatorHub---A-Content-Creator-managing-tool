import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: (() => {
          const t = process.env.VITE_API_TARGET || process.env.VITE_API_URL;
          if (!t) {
            // eslint-disable-next-line no-console
            console.warn(
              '[vite proxy] Missing VITE_API_TARGET/VITE_API_URL. ' +
              'Falling back to http://127.0.0.1:5000. ' +
              'This will break in production deploys.'
            );
            return 'http://127.0.0.1:5000';
          }
          return t;
        })(),
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
