import { ipcMain,session } from 'electron'
import AppMain from './AppMain'
import { BROWSER_NAME_MAP } from './common'
import { preloadLog, rendererLog } from './Logger'

export default class IPCMain {
  constructor() {
    ipcMain.on('window-minimize', (event, name: BROWSER_NAME_MAP) => {
      AppMain.browserMap.get(name)?.minimize()
      console.log(event)
    })

    ipcMain.on('window-maximize', (event, name: BROWSER_NAME_MAP) => {
      AppMain.browserMap.get(name)?.maximize()
      console.log(event)
    })

    ipcMain.on('window-restore', (event, name: BROWSER_NAME_MAP) => {
      AppMain.browserMap.get(name)?.restore()
      console.log(event)
    })

    ipcMain.on('window-hide', (event, name: BROWSER_NAME_MAP) => {
      AppMain.browserMap.get(name)?.close()
      console.log(event)
    })

    ipcMain.on('preloadLog', (event, logData) => {
      preloadLog.send(logData)
      console.log(event)
    })

    //获取cookie
    ipcMain.on('getCookie', async (event, id) => {
      const ses = session.fromPartition(`persist:${id}`)
      let cookie = ''
      let cookies = await ses.cookies.get({})
      // console.log('当前所有的',cookies);
      cookies.map((item) => {
        if (item.name == 'biz_token') {
          cookie = item.value
        }
      })
      // console.log('获取到了cookie',cookie);
      event.sender.send('cookieValue', cookie);
      // return cookie
    })


    ipcMain.on('rendererLog', (event, logData) => {
      rendererLog.send(logData)
      console.log(event)
    })
  }
}
