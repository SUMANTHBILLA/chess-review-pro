import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    proxy: {
      '/chess-api': {
        target: 'https://www.chess.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/chess-api/, ''),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*'
        }
      },
      '/lichess-api': {
        target: 'https://lichess.org',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/lichess-api/, '')
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
