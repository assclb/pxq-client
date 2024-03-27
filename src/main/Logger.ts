// import { VERSION } from './common'
type LogOrigin = 'main' | 'preload' | 'renderer'

// /**
//  * @description: 时间戳格式化
//  * @param {string} fmt 格式 yyyy-MM-dd HH-mm-ss
//  * @return {stirng} 格式化时间字符串
//  */
// const format = function (fmt: string = 'yyyy-MM-dd HH:mm:ss:S') {
//   const date = new Date()
//   const o: any = {
//     'M+': date.getMonth() + 1, // 月份
//     'd+': date.getDate(), // 日
//     'H+': date.getHours(), // 小时
//     'm+': date.getMinutes(), // 分
//     's+': date.getSeconds(), // 秒
//     'q+': Math.floor((date.getMonth() + 3) / 3), // 季度
//     S: date.getMilliseconds() // 毫秒
//   }
//   if (/(y+)/.test(fmt))
//     fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length))
//   for (var k in o)
//     if (new RegExp('(' + k + ')').test(fmt))
//       fmt = fmt.replace(
//         RegExp.$1,
//         RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
//       )
//   return fmt
// }

const isObject = (data: any): boolean => Object.prototype.toString.call(data) === '[object Object]'

// function getLocalIP() {
//   const os = require('os')
//   const osType = os.type() //系统类型
//   const netInfo = os.networkInterfaces() //网络信息
//   let ip = ''
//   if (osType === 'Windows_NT') {
//     for (let dev in netInfo) {
//       //win7的网络信息中显示为本地连接，win10显示为以太网
//       if (dev === '本地连接' || dev === '以太网') {
//         for (let j = 0; j < netInfo[dev].length; j++) {
//           if (netInfo[dev][j].family === 'IPv4') {
//             ip = netInfo[dev][j].address
//             break
//           }
//         }
//       }
//     }
//   } else if (osType === 'Linux') {
//     ip = netInfo.eth0[0].address
//   } else if (osType === 'Darwin') {
//     // mac操作系统
//     // ip = netInfo.eth0[0].address;
//   } else {
//     // 其他操作系统
//   }

//   return ip
// }

class Logger {
  static instance: Logger
  origin: LogOrigin
  constructor(origin: LogOrigin) {
    Logger.instance = this
    this.origin = origin
  }

  formatLogData(logData): Array<{ key: string; value: string }> {
    if (!logData) {
      return []
    }
    let logContents = []

    try {
      if (isObject(logData)) {
        Object.keys(logData).map((key) => {
          const value = isObject(logData[key]) ? JSON.stringify(logData[key]) : logData[key]
          logContents.push({ key, value })
        })
      } else if (typeof logData === 'object') {
        logContents.push({ key: 'data', value: JSON.stringify(logData) })
      } else {
        logContents.push({ key: 'data', value: logData })
      }
    } catch (err) {
      logContents.push({ key: 'data', value: JSON.stringify(logData) })
      logContents.push({ key: 'err', value: err })
    }

    return logContents
  }

  info(data = {}) {
    const that = this
    return function (target, key, descriptor) {
      const originalMethod = descriptor.value
      descriptor.value = function (...args) {
        that.send.call(that, { funcOrigin: target.name, funcName: key, ...data })
        return originalMethod.apply(this, args)
      }
      return descriptor
    }
  }

  warn(data) {
    return this.send(data, 'warn')
  }

  error(data) {
    return this.send(data, 'error')
  }

  send(logData = {}, level = 'info') {
    const logContents = this.formatLogData(logData)
    console.info(logContents, level)
    return 1
  }
}

export default Logger

export const mainLog = new Logger('main')
export const preloadLog = new Logger('preload')
export const rendererLog = new Logger('renderer')
