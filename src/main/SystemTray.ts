import { Tray, Menu, app } from 'electron'
import icon from '../../resources/img/icon.png?asset'
// import { mainLog } from './Logger'
export default class SystemTray {
  public tray: Tray
  page: Electron.BrowserWindow
  constructor(page: Electron.BrowserWindow) {
    this.init()
    this.page = page
  }

  init() {
    this.tray = new Tray(icon)
    const trayContextMenu = Menu.buildFromTemplate([
      {
        label: '退出',
        click: () => {
          app.quit();
          // this.page?.hide()
          // ipcMain.once('exit', (e, arg) => {
          //   console.log(e, arg)
          //   setTimeout(() => {
          //     app.quit()
          //     // 事件待定，现在渲染线程上报时，不一定是处理完成的，加个延迟
          //   }, 2000)
          // })
          // this.page.webContents.send('exit', 'this is test')
        }
      }
    ])

    this.tray.setToolTip('票星球客户端')

    this.tray.on('click', () => {
      this.page.show()
    })

    this.tray.on('right-click', () => {
      this.tray?.popUpContextMenu(trayContextMenu)
    })
  }
}
