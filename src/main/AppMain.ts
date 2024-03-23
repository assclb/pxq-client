import { app, BrowserWindow, globalShortcut, ipcMain } from 'electron'
import { optimizer } from '@electron-toolkit/utils'
import SystemTray from './SystemTray'
import WindowMain from './WindowMain'
import IPCMain from './IPCMain'
import { BROWSER_NAME_MAP } from './common'
import { mainLog } from './Logger'

export default class AppMain {
  static browserMap: browserMap = new Map()
  static isCanQuit = false
  @mainLog.info()
  static async actionElectronConfig() {
    const additionalData = { myKey: 'myValue' }
    const gotTheLock = app.requestSingleInstanceLock(additionalData)
    if (!gotTheLock) {
      app.exit()
    }
    app.disableHardwareAcceleration()
    app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
    // app.on('before-quit', async (event) => {
    //   console.log('before-quit')
    //   if (!this.isCanQuit) {
    //     event.preventDefault()
    //     await this.quitBefore()
    //     // this.isCanQuit = true
    //     // app.quit()
    //   }
    // })
    await app
      .whenReady()
      .then(() => {
        globalShortcut.register('Alt+L', () => {
          let win = AppMain.browserMap.get(BROWSER_NAME_MAP.MAIN)

          if (win) {
            win.webContents.openDevTools()
          } else if (BrowserWindow.getFocusedWindow()) {
            BrowserWindow.getFocusedWindow().webContents.openDevTools()
          }
        })

        // app.setUserTasks([
        //   {
        //     program: process.execPath,
        //     arguments: '--new-window',
        //     iconPath: process.execPath,
        //     iconIndex: 0,
        //     title: 'New Window',
        //     description: 'Create a new window'
        //   }
        // ])
      })
      .catch((err) => {
        console.log('err', err)
        app.quit()
      })

    app.on('browser-window-created', (_, window) => optimizer.watchWindowShortcuts(window))
    app.on(
      'activate',
      () => BrowserWindow.getAllWindows().length === 0 && AppMain.createWindowMain()
    )
    process.on('uncaughtException', function (error) {
      mainLog.error({ error: error })
    })

    return AppMain
  }

  // @mainLog.info()
  static actionTray(page: Electron.BrowserWindow) {
    new SystemTray(page)
    return AppMain
  }

  @mainLog.info()
  static createWindowMain() {
    const windowMain = new WindowMain()
    AppMain.browserMap.set(BROWSER_NAME_MAP.MAIN, windowMain.browser)
    return AppMain
  }

  @mainLog.info()
  static registerIPCMainEvent() {
    new IPCMain()
    return AppMain
  }

  static quitBefore(page = AppMain.browserMap.get(BROWSER_NAME_MAP.MAIN)) {
    return new Promise((resolve) => {
      page?.hide()
      ipcMain.once('exit', (e, arg) => {
        console.log(e, arg)
        // 以防万一，加个不会影响体验的延迟，确保 webview 页面正常调用 logout
        setTimeout(() => {
          resolve(1)
        }, 2000)
      })
      page.webContents.send('exit', 'this is test')
    })
  }
}
