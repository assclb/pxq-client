import { contextBridge, ipcRenderer } from 'electron'
// import { is } from '@electron-toolkit/utils'
import JSEncrypt from 'jsencrypt'
const path = require('path')





// Custom APIs for renderer
const api = {
  minimize(browserName) {
    ipcRenderer.send('window-minimize', browserName)
  },

  maximize(browserName) {
    ipcRenderer.send('window-maximize', browserName)
  },
  restore(browserName) {
    ipcRenderer.send('window-restore', browserName)
  },
  hide(browserName) {
    ipcRenderer.send('window-hide', browserName)
  },

  getWebviewPreloadFilePath(key: string) {
    return path.join(__dirname, `./${key}.js`)
  },

  watchAppExit(action: Function) {
    return ipcRenderer.on('closeHook', (e) => {
      if (action && typeof action === 'function') {
        action([], true).then((res) => {
          e.sender.send('closeHook', res)
        })
      } else {
        if (this.rendererLog) {
          // TODO: 待确定日志结构
          ipcRenderer.send('rendererLog', { error: 'exit and logout error' })
        }
      }
    })
  },


  preloadLog(logData) {
    return ipcRenderer.send('preloadLog', logData)
  },

  rendererLog(logData) {
    return ipcRenderer.send('rendererLog', logData)
  }


}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = api
}
