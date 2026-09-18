/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages публикует проект по /<repo>/ — base задаётся из CI (VITE_BASE_PATH)
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Оптимизация (Шаг 8): supabase-js в отдельный чанк — кэшируется отдельно от кода приложения
        manualChunks: (id: string) => (id.includes('@supabase') ? 'supabase' : undefined),
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
})
