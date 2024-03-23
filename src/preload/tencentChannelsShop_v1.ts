/**
 * @todo
 * @author ocass
 * 为了安全不应该直接暴露 ipcRenderer 在此处进行通讯，
 * 出于工期原因，后续再考虑合适的方式
 */
import { contextBridge, ipcRenderer } from 'electron'

enum ACCOUNT_TYPE {
  /** 票星球 */
  VIDEO_SHOP = 1,
  /** 视频号助手 */
  VIDEO_HELPER = 2
}

const RELOAD_PAGE_KEY = 'reload'

/** 日志自动上报装饰器
 * @author ocass
 * @todo
 * 1. 优化 `Promise.catch` 的处理
 * 2. 补充 `dom` 节点的兼容
 */
function autoLog(logData = {}) {
  return function (target, key, descriptor) {
    const originalMethod = descriptor.value
    descriptor.value = function (...args) {
      const result = originalMethod.apply(this, args)
      let data = {
        funcOrigin: target.name || target.constructor.name,
        funcName: key,
        result: '',
        info: JSON.stringify(this.info),
        shopId: this.info.shopId,
        ...logData
      }

      if (result instanceof Promise) {
        result
          .then((result) => (data.result = result || 'void'))
          .catch((err) => (data.result = err || 'void'))
          .finally(() => ipcRenderer.send('preloadLog', data))
      } else {
        data.result = result
        ipcRenderer.send('preloadLog', data)
      }

      return result
    }
    return descriptor
  }
}

// function reverseLog(target, logData = {}) {
//   let data = {
//     funcOrigin: Reverse.name || Reverse.constructor.name || '',
//     funcName: target.name,
//     ...logData
//   }
//   ipcRenderer.send('preloadLog', data)
// }

const wsAction = {
  res: {
    loginState: 'loginSuccess',
    heartBeat: 'heartBeat',
    orderSend: 'orderSend',
    connectError: 'infoError'
  },

  req: {
    heartBeat: 'heartBeat',
    orderReceive: 'orderReceive',
    accountStatus: 'accountStatus'
  }
}

class XwWebSocket<T> {
  ws: WebSocket
  wsUrl: string
  /** 连接状态，暂时无用 */
  connectState: boolean
  heartBeatTimer
  accountStatusTimer
  reconnectTimer
  reconnectLock: boolean
  provide: T
  accountId: number

  constructor(provide: T, url = '') {
    this.provide = provide
    this.wsUrl = url
  }

  rsaEncrypt() {
    return new Promise((resolve: (obj: RsaEncryptRes) => void) => {
      if (!clientPermission.deviceCode || !clientPermission.publicKey) {
        return resolve({ result: false, data: null })
      }
      fetch(`http://shop-rpa.dev.feizhi-ai.com/api/rpa/rsa-encrypt`, {
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceCode: clientPermission.deviceCode,
          publicKey: clientPermission.publicKey
        }),
        method: 'POST',
        mode: 'cors',
        credentials: 'include'
      })
        .then((res) => res.json())
        .then((res) => {
          if (res.data) {
            resolve({ result: true, data: res.data })
          } else {
            resolve({ result: false, data: null })
          }
        })
        .catch(() => {
          resolve({ result: false, data: null })
        })
    })
  }

  clientCheck() {
    return new Promise(
      async (
        resolve: (v: ClientCheckResSuccess['data']) => void,
        reject: (err: ClientCheckResFail | 1) => void
      ) => {
        const rsaRes = await this.rsaEncrypt()
        if (!rsaRes || !rsaRes.result) {
          reject(1)
          return
        }

        fetch(`http://shop-rpa.dev.feizhi-ai.com/api/rpa/wechat-client-check`, {
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceCodeEncryption: rsaRes.data,
            rsaId: clientPermission.rsaId
          }),
          method: 'POST',
          mode: 'cors',
          credentials: 'include'
        })
          .then((response) => response.json())
          .then((res: ClientCheckRes) => {
            if (res.code === '0') {
              resolve(res.data)
            } else {
              reject(res)
            }
          })
          .catch((err) => {
            reject(err)
          })
      }
    )
  }

  actionConnect(url: string = this.wsUrl, openCb = () => { }) {
    this.wsUrl || (this.wsUrl = url)
    this.actionClearTimer()
    try {
      if (!this.ws) {
        this.ws = new WebSocket(url)
      }
    } catch (err) {
      if (this.provide['createCoverDom']) {
        this.provide['createCoverDom']('fail')
      }
    }

    const that = this
    this.ws.addEventListener('open', function open() {
      openCb && openCb()
      that.connectState = true
      that.actionTimer()
      clearInterval(that.reconnectTimer)
    })

    function message(e) {
      that.handleMessage.call(that, typeof e.data === 'string' ? JSON.parse(e.data) : e.data)
    }
    this.ws.addEventListener('message', message)

    function close(e) {
      that.handleClose.call(that, e)
    }
    this.ws.addEventListener('close', close)

    function error(e) {
      that.handleError.call(that, e)
    }
    this.ws.addEventListener('error', error)
    this.reconnectLock = false
  }

  actionReconnect() {
    if (this.reconnectLock) {
      return
    }
    if (this.ws) {
      this.ws.close()
    }
    this.reconnectLock = true
    this.reconnectTimer = setTimeout(() => this.actionConnect(), 2000)
  }

  handleMessage(data) {
    switch (data.action) {
      case wsAction.res.loginState:
        this.handleLoginSuccessRes(data)
        break
      case wsAction.res.heartBeat:
        this.handleHeartBeatRes(data)
        break
      case wsAction.res.orderSend:
        this.handleOrderSendRes(data)
        break
      case wsAction.res.connectError:
        this.provide['createCoverDom']?.('fail')
        this.actionCloseWs()
        break
      default:
        break
    }
  }

  handleSend(data) {
    this.ws.send(JSON.stringify(data))
  }

  handleClose(e) {
    console.log(e)
    delete this.ws
    this.ws = null
    // todo: 日志上报 重连
    this.actionReconnect()
  }
  handleError(e) {
    console.log(e)
    // todo: 日志上报 重连
    this.actionReconnect()
  }

  handleLoginSuccessRes(data: LoginSuccessRes) {
    const { body } = data
    this.accountId = body

    if (body && this.provide['createCoverDom']) {
      this.provide['createCoverDom']('success')
    }
  }

  handleHeartBeatRes(data: HeartBeatRes) {
    console.log('data', data)
    this.connectState = true
  }

  handleOrderSendRes(data: OrderSendRes) {
    const { body } = data
    // todo: 采集并上报
    if (body.orderId && this.provide['gatherOrder']) {
      this.provide['gatherOrder'](body.orderId)
    }
  }

  handleOrderReceiveReq(body: OrderReceiveReq['body']) {
    const data: OrderReceiveReq = {
      action: 'orderReceive',
      body: body,
      info: ''
    }
    this.handleSend(data)
  }

  handleAccountStatusReq(body: AccountStatusReq['body']) {
    const data: AccountStatusReq = {
      action: 'accountStatus',
      body: body,
      info: ''
    }
    this.handleSend(data)
  }

  handleHeartBeatReq() {
    const data: HeartBeatReq = {
      action: 'heartBeat',
      body: {},
      info: ''
    }
    this.handleSend(data)
  }

  actionHeartBeat(timeGap = 1000 * 30, iife = true) {
    iife && this.handleHeartBeatReq()
    this.heartBeatTimer = setInterval(() => {
      this.handleHeartBeatReq()
    }, timeGap)
  }

  actionAccountStatusReq(timeGap = 1000 * 30, iife = true) {
    iife && this.provide['handleAccountStatusReq'] && this.provide['handleAccountStatusReq']()
    this.accountStatusTimer = setInterval(() => {
      if (this.provide['handleAccountStatusReq']) {
        this.provide['handleAccountStatusReq']()
      }
    }, timeGap)
  }

  actionTimer() {
    this.actionAccountStatusReq()
    this.actionHeartBeat()
  }

  actionClearTimer() {
    this.heartBeatTimer && clearInterval(this.heartBeatTimer)
    this.accountStatusTimer && clearInterval(this.accountStatusTimer)
  }

  actionCloseWs() {
    this.reconnectLock = true
    this.actionClearTimer()
    this.reconnectTimer && clearTimeout(this.reconnectTimer)
    this.ws && this.ws.close()
  }
}

/** 逆向类，负责控制整个流程
 * @author ocass
 */
class Reverse {
  /** ws 实例 */
  ws: XwWebSocket<ReturnType<typeof this.provide>>
  /** 已采集的订单 map */
  // gatherOrderMap: { [key: string]: string } = {}
  /** 等待采集的订单列表 */
  waitGatherOrderList: string[] = []
  /** 已采集信息 */
  info = {
    name: '',
    avatar: '',
    shopId: '',
    shopName: ''
  }
  /** 视频号页面 token */
  pageToken: string

  /** 轮询采集控制器 */
  pollingConfig = {
    timer: null,
    randomPollingTimeGap(min: number = 0, max: number = 500, baseTimeGap: number = 1000): number {
      min = Math.ceil(min)
      max = Math.floor(max)

      return (
        baseTimeGap +
        (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * (max - min)) + min)
      )
    }
  }

  clientId: string
  heartbeatTimer = null

  constructor() {
    this.ws = new XwWebSocket(this.provide())
  }

  // 缓存数据相关
  storageKey() {
    return `order_id_list__${this.info.shopId}__${this.info.name}`
  }

  @autoLog()
  setStorageWaitGatherOrderList() {
    localStorage.setItem(this.storageKey(), JSON.stringify(this.waitGatherOrderList))
    return this.waitGatherOrderList
  }

  @autoLog()
  getStorageWaitGatherOrderList(): Array<string> {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey())) || []
    } catch (err) {
      return []
    }
  }

  @autoLog()
  clearStorageWaitGatherOrderList() {
    localStorage.removeItem(this.storageKey())
  }

  /** 获取基础信息 */
  @autoLog()
  async getInfo() {
    try {
      this.getPageInfo()
      this.getUserInfo()
      await this.getShopProfile()
      return this.info
    } catch (err) {
      return err
    }
  }

  /** 页面必要信息（待定） */
  getPageInfo() { }

  /** 用户信息 */
  @autoLog()
  getUserInfo() {
    const userInfoDom = document.querySelector('.bounce_accounInfo')
    this.info.avatar = userInfoDom.querySelector('img').src
    const nameDom = userInfoDom.querySelector('.baunce_accounInfo_name')
    // @ts-ignore
    this.info.name = nameDom.title || ''
    return { name: this.info.name, avatar: this.info.avatar }
  }

  /** 店铺信息  */
  @autoLog()
  getShopProfile() {
    return new Promise((resolve, reject) => {
      fetch(
        `https://channels.weixin.qq.com/shop-faas/mmchannelstradebase/cgi/shop/getProfile?token=${this.pageToken}&lang=zh_CN`,
        {
          headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
          },
          referrer: 'https://channels.weixin.qq.com/shop/setting/home',
          referrerPolicy: 'strict-origin-when-cross-origin',
          body: null,
          method: 'GET',
          mode: 'cors',
          credentials: 'include'
        }
      )
        .then((response) => response.json())
        .then((res) => {
          if (res.success || res.code === 0) {
            this.info.shopId = res.appid
            this.info.shopName = res.nickName
            resolve(this.info)
          } else {
            reject(res)
          }
        })
        .catch((err) => {
          reject(err)
        })
    })
  }

  /** 创建页面遮罩
   * @description
   * 根据状态不同会创建不同的效果, 根据展示层级分别为
   *
   * `state` -> `main` -> `bg` -> `bg-mat`
   */
  @autoLog()
  createCoverDom(type = this.ws.accountId ? 'success' : 'fail') {
    const BG_ID = 'ty-bg'
    const BG_MAT_ID = 'ty-bg-mat'

    try {
      const body = document.querySelector('body')
      const isHasBg = body.querySelector(`#${BG_ID}`)
      isHasBg && body.removeChild(isHasBg)

      const bgMat = this.createDomBackgroundMat(BG_MAT_ID)
      const bg = this.createDomBackground(BG_ID)
      const main = this.createDomMain()

      const stateDomList = this.createDomShopState(type)

      for (let i = 0; i < stateDomList.length; i++) {
        const element = stateDomList[i]
        main.appendChild(element)
      }

      bg.appendChild(main)
      body.appendChild(bgMat)
      body.appendChild(bg)
      return true
    } catch (error) {
      return error
    }
  }

  /** 切换为掉线状态页面 */
  @autoLog()
  changeCoverDomToDisconnect() {
    const main = document.querySelector('#ty-cover-main')
    main.innerHTML = ''
    const stateDomList = this.createDomShopState('disconnect')
    for (let i = 0; i < stateDomList.length; i++) {
      const element = stateDomList[i]
      main.appendChild(element)
    }

    return 'disconnect'
  }

  createDomBackgroundMat(id: string) {
    const bgMat = document.createElement('div')
    const { style } = bgMat
    style.position = 'fixed'
    style.left = '0'
    style.top = '0'
    style.width = '100vw'
    style.height = '100vh'
    style.background = '#fff'
    style.zIndex = '9999998'
    bgMat.id = id
    return bgMat
  }

  createDomBackground(id: string) {
    const bg = document.createElement('div')
    const { style } = bg
    style.position = 'fixed'
    style.left = '0'
    style.top = '0'
    style.width = '100vw'
    style.height = '100vh'
    style.backgroundPosition = 'center'
    style.backgroundImage = `url("https://saas-scrm-global-common.oss-cn-shenzhen.aliyuncs.com/assets/wc/bg.png")`
    style.backgroundRepeat = 'no-repeat'
    style.backgroundSize = '1920px 1080px'
    style.zIndex = '9999999'
    bg.id = id
    return bg
  }

  createDomMain() {
    const main = document.createElement('div')
    main.setAttribute('id', 'ty-cover-main')
    const { style } = main
    style.width = 'fit-content'
    style.height = 'fit-content'
    style.position = 'absolute'
    style.left = '50%'
    style.top = '50%'
    style.transform = 'translate(-50%,-50%)'
    style.display = 'flex'
    style.flexDirection = 'column'
    style.alignItems = 'center'
    return main
  }

  createDomShopState(type: string) {
    switch (type) {
      case 'success':
        return (() => {
          const icon = document.createElement('img')
          icon.setAttribute(
            'src',
            'https://saas-scrm-global-common.oss-cn-shenzhen.aliyuncs.com/assets/wc/state-success.png'
          )
          icon.style.width = '80px'
          icon.style.height = '80px'
          icon.style.marginBottom = '24px'

          const title = document.createElement('div')
          title.innerText = '登录成功'
          title.style.fontSize = '20px'
          title.style.fontWeight = '700'
          title.style.textAlign = 'center'
          title.style.lineHeight = '28px'

          const userName = document.createElement('div')
          userName.innerText = `登录账号：${this.info.name}`
          userName.style.background = '#EBFAEE'
          userName.style.padding = '8px 24px'
          userName.style.margin = '12px auto'
          userName.style.fontSize = '14px'
          userName.style.lineHeight = '22px'
          userName.style.color = '#2FC251'
          userName.style.borderRadius = '4px'
          userName.style.border = '1px solid #BCF3C8'

          const shopName = document.createElement('div')
          shopName.innerText = `登录店铺：${this.info.shopName}`
          shopName.style.background = '#FFF5E0'
          shopName.style.padding = '8px 24px'
          shopName.style.marginBottom = '12px'
          shopName.style.fontSize = '14px'
          shopName.style.lineHeight = '22px'
          shopName.style.color = '#FA0'
          shopName.style.borderRadius = '4px'
          shopName.style.border = '1px solid #FFE6A7'

          const tip = document.createElement('tip')
          tip.innerText = '温馨提示：为保障系统正常运转，请勿使用此账号在其他网页登录'
          tip.style.fontSize = '16px'
          tip.style.lineHeight = '24px'
          tip.style.color = 'rgba(4, 8, 20, 0.60)'
          tip.style.textAlign = 'center'

          return [icon, title, userName, shopName, tip]
        })()
      case 'disconnect':
        return (() => {
          const icon = document.createElement('img')
          icon.setAttribute(
            'src',
            'https://saas-scrm-global-common.oss-cn-shenzhen.aliyuncs.com/assets/wc/state-error.png'
          )
          icon.style.width = '182px'
          icon.style.height = '182px'
          icon.style.marginBottom = '24px'

          const title = document.createElement('div')
          title.innerText = '账号已掉线，请重新登录'
          title.style.fontSize = '20px'
          title.style.fontWeight = '700'
          title.style.textAlign = 'center'
          title.style.lineHeight = '28px'

          const userName = document.createElement('div')
          userName.innerText = `登录账号：${this.info.name}`
          userName.style.background = '#EBFAEE'
          userName.style.padding = '8px 24px'
          userName.style.margin = '12px auto'
          userName.style.fontSize = '14px'
          userName.style.lineHeight = '22px'
          userName.style.color = '#2FC251'
          userName.style.borderRadius = '4px'
          userName.style.border = '1px solid #BCF3C8'

          const shopName = document.createElement('div')
          shopName.innerText = `登录店铺：${this.info.shopName}`
          shopName.style.background = '#FFF5E0'
          shopName.style.padding = '8px 24px'
          shopName.style.marginBottom = '30px'
          shopName.style.fontSize = '14px'
          shopName.style.lineHeight = '22px'
          shopName.style.color = '#FA0'
          shopName.style.borderRadius = '4px'
          shopName.style.border = '1px solid #FFE6A7'

          const btn = document.createElement('div')
          btn.innerText = '重新登录'
          btn.style.padding = '4px 15px '
          btn.style.fontSize = '14px'
          btn.style.lineHeight = '22px'
          btn.style.color = 'rgba(0, 0, 0, 0.85))'
          btn.style.background = '#fff'
          btn.style.borderRadius = '4px'
          btn.style.border = '1px solid #D3D7E0'
          btn.style.boxShadow = '0px 2px 0px 0px rgba(0, 0, 0, 0.02)'
          btn.style.cursor = 'pointer'
          btn.addEventListener('click', () => {
            window.localStorage.setItem(RELOAD_PAGE_KEY, new Date().valueOf().toString())
            window.location.href = 'https://channels.weixin.qq.com/shop/'
          })
          return [icon, title, userName, shopName, btn]
        })()

      case 'fail':
        return (() => {
          const icon = document.createElement('img')
          icon.setAttribute(
            'src',
            'https://saas-scrm-global-common.oss-cn-shenzhen.aliyuncs.com/assets/wc/state-error.png'
          )
          icon.style.width = '182px'
          icon.style.height = '182px'
          icon.style.marginBottom = '24px'

          const title = document.createElement('div')
          title.innerText = '您登录的店铺或账号暂无权限，请重试'
          title.style.fontSize = '20px'
          title.style.fontWeight = '700'
          title.style.textAlign = 'center'
          title.style.lineHeight = '28px'
          title.style.marginBottom = '30px'

          const btn = document.createElement('div')
          btn.innerText = '重新登录'
          btn.style.padding = '4px 15px '
          btn.style.fontSize = '14px'
          btn.style.lineHeight = '22px'
          btn.style.color = 'rgba(0, 0, 0, 0.85))'
          btn.style.background = '#fff'
          btn.style.borderRadius = '4px'
          btn.style.border = '1px solid #D3D7E0'
          btn.style.boxShadow = '0px 2px 0px 0px rgba(0, 0, 0, 0.02)'
          btn.style.cursor = 'pointer'
          btn.addEventListener('click', () => {
            const logoutBtn = document.querySelector('.question-list_item')
            if (logoutBtn) {
              // @ts-ignore
              logoutBtn.click()
            }

            clearInterval(this.heartbeatTimer)
            setTimeout(this.pollingConfig.timer)
          })
          return [icon, title, btn]
        })()
      default:
        return []
    }
  }

  async getHttpOnlyToken(id) {
    return await new Promise((resolve) => {
      ipcRenderer.send('getCookie', id);
      ipcRenderer.on('cookieValue', (_event, data) => {
        console.log('获取到的cookie', data);
        resolve(data)
      })
    })
  }

  @autoLog()
  async getPageToken() {
    const token = document.cookie.split(';').filter((data) => data.search('data_token=') !== -1)
    // const bizToken = document.cookie.split(';').filter((data) => data.search('biz_token=') !== -1)
    if (token.length != 0) {
      this.pageToken = token[0].split('=')[1]
    } else {
      this.pageToken = await this.getHttpOnlyToken(currentId) as string
      console.log('走的getHttpOnlyToken');

    }
  }

  /** 定时器获取页面 token */
  @autoLog()
  getPageTokenTimer(): Promise<string> {
    return new Promise((resolve) => {
      const timer = setInterval(() => {
        if (this.pageToken) {
          clearInterval(timer)
          return resolve(this.pageToken)
        } else {
          this.getPageToken()
        }
      }, 500)
    })
  }

  /** 获取订单详情里的头像信息 */
  @autoLog()
  gatherOrder(orderId: string): Promise<GatherOrderRes> {
    return new Promise((resolve, reject) => {
      fetch(
        `https://channels.weixin.qq.com/shop-faas/mmchannelstradeorder/cgi/getOrder?orderid=${orderId}&token=${this.pageToken}&lang=zh_CN`,
        { method: 'GET' }
      )
        .then((response) => response.json())
        .then((res) => {
          if (res.code === 0 || res.errcode === 0 || res.errmsg === 'ok') {
            const addressInfo: OrderDetailAddressInfo =
              res?.order?.orderInfo?.deliveryInfo?.addressInfo || null
            let data: GatherOrderRes = {
              headImgUrl: res?.order?.userInfo?.headImgUrl || '',
              addressInfo: {
                userName: '',
                postalCode: '',
                provinceName: '',
                cityName: '',
                countyName: '',
                detailInfo: '',
                nationalCode: '',
                telNumber: '',
                lat: 0,
                lng: 0,
                houseNumber: '',
                fromOld: false,
                virtualOrderTelNumber: ''
              }
            }

            if (addressInfo) {
              data.addressInfo = addressInfo
            }
            return resolve(data)
          }

          reject('error')
        })
        .catch((err) => reject(err))
    })
  }

  @autoLog()
  checkPageLoginUserLoginState(timeGap = 30 * 1000) {
    let timer = setInterval(() => {
      fetch(
        `https://channels.weixin.qq.com/shop-faas/mmchannelstradeevaluation/cgi/applyments/check?token=${this.pageToken}&lang=zh_CN`,
        {
          headers: {
            accept: 'application/json, text/plain, */*',
            'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
            'content-type': 'application/json',
            'sec-ch-ua': '"Not.A/Brand";v="8", "Chromium";v="114", "Microsoft Edge";v="114"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'sec-fetch-dest': 'empty',
            'sec-fetch-mode': 'cors',
            'sec-fetch-site': 'same-origin'
          },
          referrer: 'https://channels.weixin.qq.com/shop/home/',
          referrerPolicy: 'strict-origin-when-cross-origin',
          body: '{}',
          method: 'POST',
          mode: 'cors',
          credentials: 'include'
        }
      )
        .then((res) => res.json())
        .then((res) => {
          if (res?.msg?.includes('登录') || res?.code === -1001 || res?.respStatusCode === 200003) {
            console.log('登录状态：已掉线')
            clearInterval(timer)
            clearInterval(this.heartbeatTimer)
            clearTimeout(this.pollingConfig.timer)
            this.pageToken = ''
            // this.ws.actionCloseWs()
            this.changeCoverDomToDisconnect()
          } else {
            console.log('登录状态：登录中')
          }
        })
    }, timeGap)
  }

  createConnectUrl() {
    const BASE_URL = 'ws://shop-rpa.dev.feizhi-ai.com:8889/ws'
    // const BASE_URL = 'ws://192.168.40.108:8889/ws'
    return `${BASE_URL}?thirdMallId=${this.info.shopId}&clientId=${this.clientId}&name=${this.info.name}&accountType=${ACCOUNT_TYPE.VIDEO_SHOP}`
  }

  provide() {
    const that = this
    return {
      gatherOrder: function (orderId: string) {
        that.gatherOrder(orderId).then(({ headImgUrl, addressInfo }) => {
          const address =
            addressInfo.provinceName +
            addressInfo.cityName +
            addressInfo.countyName +
            addressInfo.detailInfo

          const orderSendData: OrderReceiveReq['body'] = {
            clientId: that.clientId,
            thirdMallId: that.info.shopId,
            iconUrl: headImgUrl,
            resultType: 0,
            accountId: that.ws.accountId,
            orderId,
            receiver: {
              address: address,
              name: addressInfo.userName,
              phone: addressInfo.telNumber,
              rpaPhone: addressInfo.telNumber
            }
          }
          that.ws.handleOrderReceiveReq(orderSendData)
        })
      },

      handleAccountStatusReq: function () {
        const body: AccountStatusReq['body'] = {
          shopType: 'WS_WECHATVIDEO',
          accountId: that.ws.accountId,
          ifLogin: !!that.pageToken,
          riskStatus: false,
          clientId: that.clientId
        }
        that.ws.handleAccountStatusReq(body)
      },

      createCoverDom: function (type) {
        if (that.pageToken) {
          that.createCoverDom.call(that, type)
        }
      }
    }
  }
}

// let webviewId = null

/** 开始执行
 * @author ocass
 * @description
 * 执行流程
 *
 * 1. 获取页面登录 token
 * 2. 获取页面信息
 * 3. 获取 ty token
 * 4. 注册 ipc 事件
 * 5. 开启心跳
 * 6. 开启采集轮询
 *
 */
async function startReverse() {
  const reverse = new Reverse()
  contextBridge.exposeInMainWorld('__reverse__', reverse)
  console.log(reverse)
  await reverse.getPageTokenTimer()
  await reverse.getInfo()
  reverse.ws
    .clientCheck()
    .then((clientId) => {
      reverse.clientId = clientId
      reverse.ws.actionConnect(reverse.createConnectUrl())
    })
    .catch((err) => {
      reverse.createCoverDom('fail')
      console.trace(err)
    })
    .finally(() => {
      reverse.checkPageLoginUserLoginState()
    })
}

let clientPermission = {
  publicKey: '',
  deviceCode: '',
  deviceCodeEncryption: '',
  rsaId: ''
}
let currentId //当前窗口ID

ipcRenderer.on('setId', (_event, id) => {
  currentId = id
  console.log('当前的窗口id', currentId);
})

ipcRenderer.on('clientPermission', (e, args) => {
  console.log('e', e)
  if (args['rsaId']) {
    clientPermission = args
  }
})


if (window.location.href.search('channels.weixin.qq.com/shop/home') != -1) {
  console.log('channels.weixin.qq.com/shop/home')

  window.onload = function () {
    startReverse()
  }
} else if (window.location.href.search('channels.weixin.qq.com/shop') != -1) {
  // 掉线重新登陆以后, 登录二维码有问题, 需要重新加载
  if (localStorage.getItem(RELOAD_PAGE_KEY)) {
    localStorage.removeItem(RELOAD_PAGE_KEY)
    window.onload = function () {
      console.log('page reload!')
      location.reload()
    }
  }
  console.log('channels.weixin.qq.com/shop')
} else {
  console.log('https://channels.weixin.qq.com/shop/home')
}
