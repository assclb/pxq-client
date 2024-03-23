import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electronAPI: {
      minimize: (string) => void
      maximize: (string) => void
      restore: (string) => void
      hide: (string) => void
      getWebviewPreloadFilePath: (string) => string
      preloadLog: () => void
      rendererLog: () => Promise<Object>
      watchAppExit: (func: Function) => Electron.IpcRenderer
      getClientPermission: () => {
        publicKey: string
        rsaId: string
        deviceCode: string
        deviceCodeEncryption: string
      }
    }
  }
}
