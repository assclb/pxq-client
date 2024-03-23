import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/preload/index.ts'),
          // tencentChannelsAssistant: resolve(__dirname, 'src/preload/tencentChannelsAssistant.ts'),
          tencentChannelsShop: resolve(__dirname, 'src/preload/tencentChannelsShop.ts')
        }
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    build: {
      assetsInlineLimit: 0
    },
    plugins: [vue()]
  }
})
