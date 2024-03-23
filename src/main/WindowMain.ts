import { shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/img/icon.png?asset'

export default class WindowMain {
  browser: null | BrowserWindow
  constructor() {
    // Create the browser window.
    const mainWindow = new BrowserWindow({
      width: 1000,
      height: 900,
      show: false,
      autoHideMenuBar: true,
      frame: false,
      ...(process.platform === 'linux' ? { icon } : {}),
      webPreferences: {
        nodeIntegrationInSubFrames: true,

        devTools: true,
        nodeIntegration: true,
        preload: join(__dirname, '../preload/index.js'),
        sandbox: false,
        webviewTag: true,
        contextIsolation: false
        // partition: "partition:webview"
      }
    })

    this.browser = mainWindow

    mainWindow.on('ready-to-show', () => {
      mainWindow.show()
      // mainWindow.webContents.openDevTools()
    })

    mainWindow.on('focus', () => {})
    mainWindow.on('blur', () => {})

    mainWindow.on('minimize', (e) => {
      console.log('e', e)
    })

    let canClose = true // 如果需要关闭前处理东西的话，则为 false
    mainWindow.on('close', (e) => {
      console.log('close', e)
      if (!canClose) {
        e.preventDefault()
        mainWindow.hide()
        ipcMain.on('closeHook', () => {
          console.log('closeHook')
          // setTimeout(() => {
          canClose = true
          mainWindow.close()
          // }, 5000)
        })
        mainWindow.webContents.send('closeHook', 'this is test')
      }
    })

    // mainWindow.addListener

    mainWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url)
      return { action: 'deny' }
    })

    // HMR for renderer base on electron-vite cli.
    // Load the remote URL for development or the local html file for production.
    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
      mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
      mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }
  }
}
