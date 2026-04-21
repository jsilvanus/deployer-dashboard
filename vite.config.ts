import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  // Ensure Vite uses the real path on Windows (avoids cross-drive/junction mismatches)
  root: fs.realpathSync.native(path.resolve('./')),
  resolve: {
    preserveSymlinks: true,
  },
  plugins: [react()],
  server: {
    port: 5173
  }
})
