import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    base: './',
    build: {
        emptyOutDir: true, // Wipe dist folder before building
        outDir: 'dist',
        rollupOptions: {
            output: {
                // Force new filenames on every build to bust cache
                entryFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
                chunkFileNames: `assets/[name]-[hash]-${Date.now()}.js`,
                assetFileNames: `assets/[name]-[hash]-${Date.now()}.[ext]`
            }
        }
    },
    server: {
        port: 5173,
        host: true,
        open: false,
        proxy: {
            '/api': {
                target: 'https://rust-api-xqiw.onrender.com',
                changeOrigin: true,
                secure: false,
            }
        }
    }
})
