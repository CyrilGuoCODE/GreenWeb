import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    },
    port: 5173, // 前端应用端口
    host: true // 允许局域网访问
  },
  build: {
    outDir: 'dist', // 输出目录
    assetsDir: 'assets', // 静态资源目录
    emptyOutDir: true, // 构建前清空输出目录
    minify: 'esbuild', // 使用esbuild最小化代码，替换terser
    chunkSizeWarningLimit: 1500, // 块大小警告限制
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'element-plus'],
          'charts': ['echarts', 'd3']
        }
      }
    }
  }
}) 