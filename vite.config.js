import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  root: './web/',
  plugins: [react()],
  base: mode === 'development' ? '/' : '/eleicoes-2014/'
}))
