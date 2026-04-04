import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // 關鍵：這行確保你的 CSS/JS 路徑正確，不會找不到檔案
  base: '/Silerune/', 
  plugins: [react()],
})
