import AppMain from './AppMain'
// import { BROWSER_NAME_MAP } from './common'
AppMain.actionElectronConfig().then((AppMain) => {
  AppMain.registerIPCMainEvent().createWindowMain()
  // .actionTray(AppMain.browserMap.get(BROWSER_NAME_MAP.MAIN))
})
