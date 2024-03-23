interface BaseProtocol<T = any> {
  action: string
  body?: T
  info: string
}

interface LoginSuccessRes extends BaseProtocol {
  action: 'loginSuccess'
  body: number
}

interface HeartBeatReq extends BaseProtocol {
  action: 'heartBeat'
  body: {}
}

type HeartBeatRes = Omit<BaseProtocol, 'body' | 'info'>

interface OrderReceiveReq extends BaseProtocol {
  action: 'orderReceive'
  body: {
    accountId: number
    thirdMallId: string
    orderId: string
    iconUrl: string
    resultType: number
    clientId: string

    receiver: {
      address: string
      name: string
      phone: string
      rpaPhone: string
    }
  }
}

interface AccountStatusReq extends BaseProtocol {
  action: 'accountStatus'
  body: {
    accountId: number
    ifLogin: boolean
    riskStatus: boolean
    clientId: string
    shopType: 'WS_WECHATVIDEO'
  }
}

interface ConnectError extends BaseProtocol {
  action: 'infoError'
  body: '连接失败'
}

interface OrderSendRes extends BaseProtocol {
  action: 'orderSend'
  body: {
    name: string
    thirdMallId: string
    orderId: string
  }
}

type TyResponse<T> = {
  code: number
  data?: T
  msg: string
}

type ClientCheckReq = {
  deviceCode: string
  rsaId: string
}

type ClientCheckResFail = {
  code: '10016'
  msg: '客户端不存在'
}

type ClientCheckResSuccess = {
  code: '0'
  msg: 'ok'
  data: string
}

type ClientCheckRes = ClientCheckResFail | ClientCheckResSuccess
type RsaEncryptRes = { result: boolean; data: string }

/** 订单详情里的地址信息 */
type OrderDetailAddressInfo = {
  userName: string
  postalCode: string
  provinceName: string
  cityName: string
  countyName: string
  detailInfo: string
  nationalCode: string
  telNumber: string
  lat: number
  lng: number
  houseNumber: string
  fromOld: boolean
  virtualOrderTelNumber: string
}

type GatherOrderRes = {
  headImgUrl: string
  addressInfo: OrderDetailAddressInfo
}
