function createBaseData() {
  return {
    "src": "WEB", // 固定值
    "ver": "4.0.13-20240223084920", // 固定值
    "addressParam": {},
    "locationParam": { "locationCityId": "4401" },
    "paymentParam": { "totalAmount": "", "payAmount": "" },
    "priceItemParam": [

    ],
    "items": [
      {
        "sku": {
          "skuId": "",
          "skuType": "",
          "ticketPrice": "680.00", // 票单价
          "qty": 1, // 票数
          "ticketItems": [
            { // 观演人
              "id": "1709292129743100000015", // 计算规则为 当前毫秒时间戳 + （100000000 + count） // 未发现实际意义，错误照样下单成功 
              "audienceId": "65e035ce4834060001a7c4d7" // 半定值, 提前获取好观演人 id
            }
          ]
        },
        "spu": { // spu id
          "showId": "65d2fa3facbdf80001dc2249", // spu id
          "sessionId": "65d2fdf2f32c6a0001b7a36a" // 半定值, 提前获取好 saleShowSessionId 
        },
        "deliverMethod": "EXPRESS"
      }
    ],
    "priorityId": "",
    "many2OneAudience": {}
  }
}

let token = "";
function getToken() {
  if (!token) {
    token = localStorage.getItem('ACCESS_TOKEN') || defaultData.token;
  }
  return token
}

let spuMap = {}

function getAddress() {
  return '65e051ec16be6f00010fa357'
}


function getAddressList() {
  return new Promise((resolve, reject) => {
    fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/user/buyer/v3/user/addresses?src=WEB&ver=4.0.13-20240223084920", {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": getToken(),
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.0.13-20240223084920"
      },
      "referrer": "https://m.piaoxingqiu.com/address",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(res => res.json()).then(res => resolve(res.data))
  })
}


let defaultData = {
  audienceId: "65e035ce4834060001a7c4d7",
  sku: {
    "showId": "65d2fa3facbdf80001dc2249",
    "sessionId": "65d2fdf2f32c6a0001b7a36a"
  },

  token: "eyJ0eXAiOiJKV1QiLCJjdHkiOiJKV1QiLCJ6aXAiOiJERUYiLCJhbGciOiJSUzUxMiJ9.eNqEkM1qwzAQhN9lzz5Isn6cHFMSUmgJhObQU5GtNTFYUpDlkjbk3buuQ8ipPWqY-UY7F4h2zMfn0EZYhrHvCxgHTPP7AnX3_RQdwhI225ePVyhgGOvVXdRCG1sxRCd4paQwlW65XEjyUXIf-8m0Oryv96T43BwmtJuCClmpjJGtkw1njPGy1trdgv_ZNFwLwPOpS_jWeerghsvSaKUNeX4RuxMmm-OfGEVtTUKb7xS2EIwJpolGl34NGf186byMx9QcbciPa9E3HvsL-MQ0dDGQOE8ZrL8Brj8AAAD__w.f-ixNbacax13oxPQVOfRVsJqibcPd2ywczMb2TKuYP7SmaP31_ouTsriRKnCIm5wE8t1T-q7FkWccck-AXd8sWcYM4LkQgbRFtnWF6DxWunc0WMA947bRFt0ZVGu18FNcQQHhFymYKbZsG5CveuBxVQFDE92dDZCYe0wns8IdcY"
}

async function createOrder(params = {}) {
  const { spuId, startTime, price, audienceList } = params
  // const sessionId = await getSPUSaleShowSessionId(spuId)
  const sessionList = await getSPUSaleShowSeatPlans(spuId)

  if (!sessionList.length) {
    return console.error('sessionList length: ', sessionList.length);
  }

  // console.debug("express: ", express)
  let session = sessionList.filter(session => session.beginDateTime === startTime);
  let plan;
  if (session && session.length > 0) {
    session = session[0]
    plan = session.seatPlans.filter(plan => plan.originalPrice === price)
  } else {
    return console.error("未获取到场次信息")
  }

  if (!plan || !Array.isArray(plan) || plan.length <= 0) {
    return console.error("未获取到票价信息")
  } else {
    plan = plan[0]
  }

  const express = await getSPUExpressInfo({ spuId, sessionId: session.bizShowSessionId, skuId: session.seatPlans[0].seatPlanId, addressId: getAddress() })



  const priceItemTotal = audienceList.length * price
  const totalAmount = audienceList.length * price + express.priceItemVal
  let data = {
    "src": "WEB", // 固定值
    "ver": "4.0.13-20240223084920", // 固定值
    "addressParam": { "addressId": testData.addressId }, // 半定值，提前建好地址，并获取好 addressId
    "locationParam": { "locationCityId": testData.locationCityId }, // 定值，城市 id
    "paymentParam": { "totalAmount": String(totalAmount), "payAmount": String(totalAmount) }, // 总价格，计算得出
    "priceItemParam": [ // 价格明细
      {
        "applyTickets": [],
        "priceItemName": "票款总额",
        "priceItemVal": priceItemTotal,
        "priceItemType": "TICKET_FEE",
        "priceItemSpecies": "SEAT_PLAN",
        "direction": "INCREASE",
        "priceDisplay": `￥${priceItemTotal}`
      },
      {
        "applyTickets": [],
        ...express
      }
    ],
    "items": [
      {
        "sku": {
          "skuId": plan.seatPlanId, // sku id
          "skuType": "SINGLE", // 定值， sku 单选
          "ticketPrice": String(price), // 票单价
          "qty": audienceList.length, // 票数
          "ticketItems": audienceList.map((audienceId, index) => {
            return {
              id: `${Date.now()}${100000000 + index + 1}`,
              audienceId: audienceId
            }
          })
        },
        "spu": { // spu id
          "showId": spuId, // spu id
          "sessionId": session.bizShowSessionId // 半定值, 提前获取好 saleShowSessionId 
        },
        "deliverMethod": "EXPRESS" // 周杰伦场固定快递
      }
    ],
    "priorityId": "",
    "many2OneAudience": {}
  }
  // const spu = {
  //   showId: spuId,
  //   sessionId: sessionId,
  // }
  fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/trade/buyer/order/v5/create_order", {
    "headers": {
      "access-token": getToken(),
      "content-type": "application/json",
      "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "src": "WEB",
      "terminal-src": "WEB",
      "ver": "4.0.13-20240223084920"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify(data),
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
  }).then(res => res.json()).then(res => {
    console.log('reverse: createOrder res:', res)
  })
  // console.debug(spu);
}


function createItems(spuId) {

}


function getSPUSaleShowSessionId(spuId) {
  if (spuMap[spuId]) {
    return Promise.resolve(spuMap[spuId].sessionId)
  }
  return new Promise((r, j) => {
    fetch(`https://m.piaoxingqiu.com/cyy_gatewayapi/show/pub/v5/show/${spuId}/dynamic?src=WEB&ver=4.0.13-20240223084920&source=FROM_QUICK_ORDER`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": getToken(),
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.0.13-20240223084920"
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(res => res.json())
      .then(res => {
        if (res.statusCode === 200) {
          const saleShowSessionId = res.data.saleShowSessionId
          console.log('reverse: saleShowSessionId', saleShowSessionId)
          if (!spuMap[spuId]) {
            spuMap[spuId] = {}
          }
          spuMap[spuId].sessionId = saleShowSessionId;
          spuMap[spuId].saleTime = res.data.saleTime;


          r(saleShowSessionId)
        }
      })
      .catch(err => console.error(err))
  })
}

function getSPUSaleShowSeatPlans(spuId) {
  return new Promise((r, j) => {
    fetch(
      `https://m.piaoxingqiu.com/cyy_gatewayapi/show/pub/v5/show/${spuId}/sessions?src=WEB&ver=4.0.13-20240223084920&source=FROM_QUICK_ORDER&isQueryShowBasicInfo=true`,
      {
        headers: {
          accept: "*/*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          "access-token":
            getToken(),
          "cache-control": "no-cache",
          pragma: "no-cache",
          "sec-ch-ua":
            '"Chromium";v="122", "Not(A:Brand";v="24", "Microsoft Edge";v="122"',
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": '"Windows"',
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          src: "WEB",
          "terminal-src": "WEB",
          ver: "4.0.13-20240223084920",
        },
        referrerPolicy: "strict-origin-when-cross-origin",
        body: null,
        method: "GET",
        mode: "cors",
        credentials: "include",
      }
    ).then(res => res.json())
      .then(res => {
        if (res.statusCode === 200) {
          if (!spuMap[spuId]) {
            spuMap[spuId] = {}
          }

          const sessionList = res.data.map(session => {
            return {
              sessionName: session.sessionName,
              sessionSaleTime: session.sessionSaleTime,
              bizShowSessionId: session.bizShowSessionId,
              beginDateTime: session.beginDateTime,
              beginDateTimeFormat: new Date(session.beginDateTime),
              seatPlans: session.seatPlans.map(plan => {
                return {
                  originalPrice: plan.originalPrice,
                  seatPlanName: plan.seatPlanName,
                  seatPlanId: plan.seatPlanId
                }
              })
            }
          })
          spuMap[spuId].sessionList = sessionList
          // console.trace('sessionList', sessionList)

          r(sessionList)
        }
      })
      .catch(err => console.error(err))
  })
}


function getSPUExpressInfo({ spuId, sessionId, skuId, addressId, ticketPrice = 400 }) {
  const data = {
    "src": "WEB",
    "ver": "4.0.13-20240223084920",
    "productItems": [],
    "items": [
      {
        "sku": {
          "skuId": skuId,
          "skuType": "SINGLE",
          "qty": 1,
          ticketPrice
        },
        "spu": {
          "showId": spuId,
          "sessionId": sessionId
        },
        "deliverMethod": "EXPRESS"
      }
    ],
    "locationCityId": "440113",
    "addressId": addressId
  }

  return new Promise((r, j) => {
    fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/trade/buyer/order/v5/price_items", {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": getToken(),
        "cache-control": "no-cache",
        "content-type": "application/json",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.0.13-20240223084920"
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": JSON.stringify(data),
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    }).then(res => res.json())
      .then(res => r(Array.isArray(res.data) ? res.data[0] : res.data))
  })
}

function getAudienceList() {
  return new Promise((resolve, reject) => {
    fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/user/buyer/v3/user_audiences?length=500&offset=0&src=WEB&ver=4.0.13-20240223084920", {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": getToken(),
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.0.13-20240223084920"
      },
      "referrer": "https://m.piaoxingqiu.com/viewer",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(res => res.json()).then(res => { resolve(res.data) })
  })
}


function getUserInfo() {
  return new Promise((resolve, reject) => {
    fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/user/buyer/v3/profile?src=WEB&ver=4.0.13-20240223084920", {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": getToken(),
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.0.13-20240223084920"
      },
      "referrer": "https://m.piaoxingqiu.com/mine",
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(res => res.json()).then(res => resolve(res.data))
  })
}

function getSPUInfo(spuId) {
  return new Promise((resolve, reject) => {
    fetch(`https://m.piaoxingqiu.com/cyy_gatewayapi/show/pub/v5/show/${spuId}/static?src=WEB&ver=4.0.13-20240223084920&cityId=4401&source=FROM_QUICK_ORDER`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": getToken(),
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.0.13-20240223084920"
      },
      "referrerPolicy": "strict-origin-when-cross-origin",
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(res => res.json()).then(res => resolve(res.data.basicInfo))
  })
}


function triggerDomState(dom, isActive) {
  if (isActive !== undefined) {
    dom.style['border'] = isActive ? '1px solid' : ''
    return;
  }
  dom.style['border'] = dom.style['border'] ? '' : '1px solid'
}


const side = createSide();
async function getPreCreateOrderInfo(params = {}) {
  let { spuId, startTime, price } = params
  const detailURL = 'https://m.piaoxingqiu.com/content';
  if (!spuId) {
    if (window.location.href.includes(detailURL)) {
      for (let [key, value] of new URLSearchParams(window.location.href)) {
        if (key.includes('showId')) {
          spuId = value;
        }
      }
    }

    if (!spuId) {
      let text = '未传入 spuID, 且当前不在详情页';
      alert(text)
      return console.error(text)
    }
  }
  // const sessionId = await getSPUSaleShowSessionId(spuId)
  const userInfo = await getUserInfo();
  const userInfoConsole = {
    用户名: userInfo.nickname,
    手机号: userInfo.cellphone,
    token: getToken()
  }
  const userInfoDom = createBoxFrame('用户信息');
  side.appendChild(userInfoDom.box);
  userInfoDom.content.innerHTML = `
  <div><b>用户名</b> : ${userInfo.nickname}</div>
  <div><b>手机号</b> : ${userInfo.cellphone}</div>
  `
  console.group("用户信息")
  console.table(userInfoConsole)
  console.groupEnd();

  const spuInfo = await getSPUInfo(spuId);
  const spuInfoConsole = {
    名称: spuInfo.showName,
    时间: spuInfo.showDate,
    id: spuId,
  }

  const spuInfoDom = createBoxFrame('演唱会信息');
  side.appendChild(spuInfoDom.box);
  spuInfoDom.content.innerHTML = `
  <div><b>名称</b> : ${spuInfo.showName}</div>
  <div><b>时间</b> : ${spuInfo.showDate}</div>
  <div><b>SPUID</b> : ${spuId}</div>
  `
  console.group("演唱会信息")
  console.table(spuInfoConsole)
  console.groupEnd();

  const sessionList = await getSPUSaleShowSeatPlans(spuId)
  let activePlanIndex = null;
  let allPlan = []
  sessionList.map((session, index) => {
    const sessionDom = createBoxFrame(`场次列表`);
    side.appendChild(sessionDom.box);
    const sessionDescDom = document.createElement('div');
    sessionDescDom.innerHTML = `
<div><b>场次 ID</b> : ${session.bizShowSessionId}</div>
    <div><b>总场次</b> : ${sessionList.length}</div>
<div><b>当前场次</b> : 第 ${index + 1} 场 : ${session.sessionName}</div>
<div><b>可购买时间</b> : ${new Date(Number(session.sessionSaleTime)).toLocaleString()}</div>
<br />
    `
    sessionDom.content.appendChild(sessionDescDom)
    console.group(`场次列表 总场次: ${sessionList.length} 场， 当前第 ${index + 1} 场: ${session.sessionName} , 场次 ID:  ${session.bizShowSessionId} `)
    session.seatPlans.map(plan => {
      plan.sessionSaleTime = session.sessionSaleTime
      const planDom = document.createElement('div');
      planDom.style = `
        cursor: pointer;
      `
      planDom.innerHTML = `
<div><b>id</b> : ${plan.seatPlanId}</div>
<div><b>名称</b> : ${plan.seatPlanName}</div>
<div><b>价格</b> : ${plan.originalPrice}</div>
<br />
`
      planDom.addEventListener('click', function () {
        allPlan.map((item, index) => {
          if (item.plan.seatPlanId === plan.seatPlanId) {
            activePlanIndex = index;
            triggerDomState(item.planDom, true)
          } else {
            triggerDomState(item.planDom, false)
          }
        })
      })
      allPlan.push({ plan, planDom, session })
      sessionDom.content.appendChild(planDom)
      console.table({
        价格: plan.originalPrice,
        名称: plan.seatPlanName,
        id: plan.seatPlanId
      })
    })
    console.groupEnd();

  })

  const addressList = await getAddressList();
  const expressList = await Promise.all(addressList.map(address => getSPUExpressInfo({ spuId, sessionId: sessionList[0].bizShowSessionId, skuId: sessionList[0].seatPlans[0].seatPlanId, addressId: address.addressId })))

  console.group("地址列表")
  let activeAddressIndex = null;
  let allAddress = []
  const addressListDom = createBoxFrame('地址信息');
  side.appendChild(addressListDom.box);
  addressList.map((address, index) => {
    const express = expressList[index]

    const expressnDom = document.createElement('div');
    expressnDom.innerHTML = `
<div><b>id</b> : ${address.addressId}</div>
<div><b>收件人</b> : ${address.detailAddress}</div>
<div><b>手机号</b> : ${address.cellphone}</div>
<div><b>详细地址</b> : ${address.detailAddress}</div>
<div><b>邮寄费用</b> : ${express.priceItemVal}</div>
<br />
`

    expressnDom.addEventListener('click', function () {
      allAddress.map((item, index) => {
        if (item.address.addressId === address.addressId) {
          activeAddressIndex = index;
          triggerDomState(item.expressnDom, true)
        } else {
          triggerDomState(item.expressnDom, false)
        }
      })
    })
    allAddress.push({ address, expressnDom, express })
    addressListDom.content.appendChild(expressnDom)

    console.table({
      收件人: address.username,
      详细地址: address.detailAddress,
      手机号: address.cellphone,
      id: address.addressId,
      邮寄费用: express.priceItemVal,
      邮寄参数: JSON.stringify(express)
    })
  })
  console.groupEnd();




  console.group("观影人信息")
  const audienceListDom = createBoxFrame('观影人信息');
  side.appendChild(audienceListDom.box);
  const audienceList = await getAudienceList()
  let activeAudienceIndexList = [];
  let allAudience = []
  audienceList.map((audience) => {


    const audienceDom = document.createElement('div');
    audienceDom.innerHTML = `
<div><b>id</b> : ${audience.id}</div>
<div><b>名称</b> : ${audience.name}</div>
<div><b>类型</b> : ${audience.description}</div>
<br />
`


    audienceDom.addEventListener('click', function () {
      allAudience.map((item, index) => {
        if (item.audience.id === audience.id) {
          const result = activeAudienceIndexList.indexOf(index);
          if (result === -1) {
            activeAudienceIndexList.push(index)
            triggerDomState(item.audienceDom, true)
          } else {
            activeAudienceIndexList.splice(result, 1)
            triggerDomState(item.audienceDom, false)
          }

        }
      })
    })
    allAudience.push({ audience, audienceDom })

    audienceListDom.content.appendChild(audienceDom)

    console.table({
      名称: audience.name,
      类型: audience.description,
      id: audience.id,
    })
  })
  console.groupEnd();

  const btnBox = createBoxFrame('操作区');
  const btnPreview = document.createElement('button');
  btnPreview.innerText = '预览';
  btnPreview.addEventListener('click', () => {
    // console.log(allPlan[activePlanIndex], allAddress[activeAddressIndex], activeAudienceIndexList.map(audience => allAudience[audience]))
    console.log(createOrderParams({
      plan: allPlan[activePlanIndex], address: allAddress[activeAddressIndex], audience: activeAudienceIndexList.map(audience => allAudience[audience]), spu: {
        spuId: spuId,
        token: getToken()
      }
    }))
  })

  btnBox.content.appendChild(btnPreview)

  const btnCopy = document.createElement('button');
  btnCopy.innerText = '拷贝立即执行脚本';
  btnCopy.addEventListener('click', () => {

    copyToClip(`
    function actionCreateOrder({
      audienceList = [],
      addressId,
      token,
      price,
      skuId,
      spuId,
      sessionId,
      express
    }) {
      express = typeof express === 'string' ? JSON.parse(express) : express;
      const priceItemTotal = audienceList.length * price;
      const totalAmount = audienceList.length * price + express.priceItemVal;
      let data = {
        "src": "WEB", 
        "ver": "4.0.13-20240223084920",
        "addressParam": { "addressId": addressId },
        "locationParam": { "locationCityId": 4401 }, 
        "paymentParam": { "totalAmount": String(totalAmount), "payAmount": String(totalAmount) },
        "priceItemParam": [ 
          {
            "applyTickets": [],
            "priceItemName": "票款总额",
            "priceItemVal": priceItemTotal,
            "priceItemType": "TICKET_FEE",
            "priceItemSpecies": "SEAT_PLAN",
            "direction": "INCREASE",
            "priceDisplay": '￥' + priceItemTotal
          },
          {
            "applyTickets": [],
            ...express
          }
        ],
        "items": [
          {
            "sku": {
              "skuId": skuId, 
              "skuType": "SINGLE", 
              "ticketPrice": String(price), 
              "qty": audienceList.length, 
              "ticketItems": audienceList.map((audienceId, index) => {
                return {
                  id: String(Date.now()) + '' + 100000000 + index + 1,
                  audienceId: audienceId
                }
              })
            },
            "spu": {
              "showId": spuId,
              "sessionId": sessionId,
            },
            "deliverMethod": "EXPRESS" 
          }
        ],
        "priorityId": "",
        "many2OneAudience": {}
      };
    
      fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/trade/buyer/order/v5/create_order", {
        "headers": {
          "access-token": token || getToken(),
          "content-type": "application/json",
          "sec-ch-ua-mobile": "?0",
          "src": "WEB",
          "terminal-src": "WEB",
          "ver": "4.0.13-20240223084920"
        },
        "referrerPolicy": "strict-origin-when-cross-origin",
        "body": JSON.stringify(data),
        "method": "POST",
        "mode": "cors",
        "credentials": "omit"
      }).then(res => res.json()).then(res => {
        console.log('reverse: createOrder res:', res)
      })
    }
    
    
    actionCreateOrder(${JSON.stringify(createOrderParams({
      plan: allPlan[activePlanIndex], address: allAddress[activeAddressIndex], audience: activeAudienceIndexList.map(audience => allAudience[audience]), spu: {
        spuId: spuId,
        token: getToken()
      }
    }))})
    `)

    console.log(allPlan[activePlanIndex], allAddress[activeAddressIndex], activeAudienceIndexList.map(audience => allAudience[audience]))
  })

  btnBox.content.appendChild(btnCopy)


  const btnCreate = document.createElement('button');
  btnCreate.innerText = '下单';
  btnCreate.addEventListener('click', () => {
    // console.log(allPlan[activePlanIndex], allAddress[activeAddressIndex], activeAudienceIndexList.map(audience => allAudience[audience]))
    actionCreateOrder(createOrderParams({
      plan: allPlan[activePlanIndex], address: allAddress[activeAddressIndex], audience: activeAudienceIndexList.map(audience => allAudience[audience]), spu: {
        spuId: spuId,
        token: getToken()
      }
    }))
  })

  btnBox.content.appendChild(btnCreate)
  side.appendChild(btnBox.box);


  const btnCreateLoop = document.createElement('button');
  btnCreateLoop.innerText = '循环下单';
  btnCreateLoop.addEventListener('click', async () => {



    function startTimer(timer, timerGap, isReadyPurchase) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }

      let gap = 0;
      // let time = 0;
      let currentTime = 0;

      timer = setInterval(async () => {
        if (!isReadyPurchase || currentTime == 0) {
          const result = await getTimeGap();
          gap = result.gap;
        }
        const sessionSaleTime = allPlan[activePlanIndex].session.sessionSaleTime || Date.now();
        currentTime = Date.now() + gap;
        let remainingTime = sessionSaleTime - currentTime;

        if (remainingTime <= 300000) {
          if (isReadyPurchase) {
            if (remainingTime <= 500) {
              actionCreateOrder(createOrderParams({
                plan: allPlan[activePlanIndex], address: allAddress[activeAddressIndex], audience: activeAudienceIndexList.map(audience => allAudience[audience]), spu: {
                  spuId: spuId,
                  token: getToken()
                }
              }))
            } else {
              console.log(`剩余时间：${(remainingTime)}`)
            }
          } else {
            console.log("剩余时间不到五分钟或已开始,切换定时器, time:", remainingTime);
            startTimer(timer, 100, true)
          }
        } else {
          console.log(`开售时间: ${sessionSaleTime}, 服务器时间: ${currentTime}, 剩余时间：${(remainingTime)}`)
        }
      }, timerGap)
    }

    let timer = null;
    startTimer(timer, 2000, false)


    // console.log(allPlan[activePlanIndex], allAddress[activeAddressIndex], activeAudienceIndexList.map(audience => allAudience[audience]))
    // actionCreateOrder(createOrderParams({
    //   plan: allPlan[activePlanIndex], address: allAddress[activeAddressIndex], audience: activeAudienceIndexList.map(audience => allAudience[audience]), spu: {
    //     spuId: spuId,
    //     token: getToken()
    //   }
    // }))
  })

  btnBox.content.appendChild(btnCreateLoop)
  side.appendChild(btnBox.box);


  // const btnWatchBuy = document.createElement('button');
  // btnWatchBuy.innerText = '回流票购买';
  // btnWatchBuy.addEventListener('click', () => {
  //   // console.log(allPlan[activePlanIndex], allAddress[activeAddressIndex], activeAudienceIndexList.map(audience => allAudience[audience]))
  //   actionCreateOrder(createOrderParams({
  //     plan: allPlan[activePlanIndex], address: allAddress[activeAddressIndex], audience: activeAudienceIndexList.map(audience => allAudience[audience]), spu: {
  //       spuId: spuId,
  //       token: getToken()
  //     }
  //   }))
  // })

  // btnBox.content.appendChild(btnWatchBuy)
  // side.appendChild(btnBox.box);

}



function copyToClip(content, message) {
  var aux = document.createElement("input");
  aux.setAttribute("value", content);
  document.body.appendChild(aux);
  aux.select();
  document.execCommand("copy");
  document.body.removeChild(aux);
}

function createOrderParams({ plan, address, audience, spu }) {
  return {
    audienceList: audience.map(item => item.audience.id),
    addressId: address?.address?.addressId,
    price: plan.plan.originalPrice,
    skuId: plan.plan.seatPlanId,
    spuId: spu.spuId,
    sessionId: plan.session.bizShowSessionId,
    express: address?.express,
    token: spu.token
  }
}

function actionCreateOrder({
  audienceList = [],
  addressId,
  token,
  price,
  skuId,
  spuId,
  sessionId,
  express
}) {
  express = typeof express === 'string' ? JSON.parse(express) : express;
  const priceItemTotal = audienceList.length * price;
  const totalAmount = audienceList.length * price + (express?.priceItemVal || 0);
  let data = {
    "src": "WEB", // 固定值
    "ver": "4.0.13-20240223084920", // 固定值
    "addressParam": { "addressId": addressId || "" }, // 半定值，提前建好地址，并获取好 addressId
    "locationParam": { "locationCityId": 4401 }, // 定值，城市 id
    "paymentParam": { "totalAmount": String(totalAmount), "payAmount": String(totalAmount) }, // 总价格，计算得出
    "priceItemParam": [ // 价格明细
      {
        "applyTickets": [],
        "priceItemName": "票款总额",
        "priceItemVal": priceItemTotal,
        "priceItemType": "TICKET_FEE",
        "priceItemSpecies": "SEAT_PLAN",
        "direction": "INCREASE",
        "priceDisplay": '￥' + priceItemTotal
      },
      {
        "applyTickets": [],
        ...(express || {})
      }
    ],
    "items": [
      {
        "sku": {
          "skuId": skuId, // sku id
          "skuType": "SINGLE", // 定值， sku 单选
          "ticketPrice": String(price), // 票单价
          "qty": audienceList.length, // 票数
          "ticketItems": audienceList.map((audienceId, index) => {
            return {
              id: String(Date.now()) + '' + 100000000 + index + 1,
              audienceId: audienceId
            }
          })
        },
        "spu": { // spu id
          "showId": spuId, // spu id
          "sessionId": sessionId // 半定值, 提前获取好 saleShowSessionId 
        },
        "deliverMethod": express ? "EXPRESS" : 'ID_CARD' // 周杰伦场固定快递
      }
    ],
    "priorityId": "",
    "many2OneAudience": {}
  }

  fetch("https://m.piaoxingqiu.com/cyy_gatewayapi/trade/buyer/order/v5/create_order", {
    "headers": {
      "access-token": token || getToken(),
      "content-type": "application/json",
      "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-platform": "\"Windows\"",
      "src": "WEB",
      "terminal-src": "WEB",
      "ver": "4.0.13-20240223084920"
    },
    "referrerPolicy": "strict-origin-when-cross-origin",
    "body": JSON.stringify(data),
    "method": "POST",
    "mode": "cors",
    "credentials": "omit"
  }).then(res => res.json()).then(res => {
    console.log('reverse: createOrder res:', res)
    if (res.statusCode == 200) {
      alert("抢票成功")
      console.log('抢票成功');
      window.location.reload()
    }
  })
}




function createBoxFrame(titleText) {
  const box = document.createElement('div');
  box.style = `
    width: 100%;
    display: flex;
    align-items: center;
    flex-direction: column;
    padding-bottom: 20px;
  `

  const title = document.createElement('h2');
  title.innerText = titleText || "";
  box.appendChild(title);

  const content = document.createElement('div');
  box.appendChild(content);

  return { box, content }
}

function createSide() {
  let checkSide = document.querySelector(".__side");
  if (checkSide) {
    checkSide.remove()
  }
  const body = document.querySelector('body');

  const side = document.createElement('div')

  side.style = `
  width: 400px;
  height: 100vh;
  background: #fff;
  position: fixed;
  right: 0;
  top: 0;
  box-sizing: border-box;
  padding: 20px;
  z-index: 99999999;
  display: flex;
  align-items: center;
  // justify-content: center;
  flex-direction: column;
  overflow: auto;
  `
  body.appendChild(side)

  return side;
}

async function getTimeGap() {
  return new Promise((resolve, reject) => {
    const timeStart = Date.now();
    let gap = 0;
    fetch(`https://m.piaoxingqiu.com/get_time?time=${timeStart}&src=WEB&ver=4.1.2-20240305183007`, {
      "headers": {
        "accept": "*/*",
        "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
        "access-token": "eyJ0eXAiOiJKV1QiLCJjdHkiOiJKV1QiLCJ6aXAiOiJERUYiLCJhbGciOiJSUzUxMiJ9.eNqEkM1qwzAQhN9lzz5Isn6cHFMSUmgJhObQU5GtNTFYUpDlkjbk3buuQ8ipPWqY-UY7F4h2zMfn0EZYhrHvCxgHTPP7AnX3_RQdwhI225ePVyhgGOvVXdRCG1sxRCd4paQwlW65XEjyUXIf-8m0Oryv96T43BwmtJuCClmpjJGtkw1njPGy1trdgv_ZNFwLwPOpS_jWeerghsvSaKUNeX4RuxMmm-OfGEVtTUKb7xS2EIwJpolGl34NGf186byMx9QcbciPa9E3HvsL-MQ0dDGQOE8ZrL8Brj8AAAD__w.f-ixNbacax13oxPQVOfRVsJqibcPd2ywczMb2TKuYP7SmaP31_ouTsriRKnCIm5wE8t1T-q7FkWccck-AXd8sWcYM4LkQgbRFtnWF6DxWunc0WMA947bRFt0ZVGu18FNcQQHhFymYKbZsG5CveuBxVQFDE92dDZCYe0wns8IdcY",
        "cache-control": "no-cache",
        "pragma": "no-cache",
        "sec-ch-ua": "\"Chromium\";v=\"122\", \"Not(A:Brand\";v=\"24\", \"Microsoft Edge\";v=\"122\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "src": "WEB",
        "terminal-src": "WEB",
        "ver": "4.1.2-20240305183007"
      },
      "body": null,
      "method": "GET",
      "mode": "cors",
      "credentials": "include"
    }).then(res => {
      const timeEnd = Date.now();
      gap = timeEnd - new Date(res.headers.get('Date')).getTime() - 50;
      console.log("服务器时间:", new Date(res.headers.get('Date')).getTime())
      console.log("客户端时间:", timeEnd)
      console.log('与服务端时间差距为：', gap)
      resolve({ gap, time: timeEnd })
    })
  })
}

// function createView() {



// }




let testData = {
  addressId: "65e051ec16be6f00010fa357",
  locationCityId: "4401",

  sessionList: [
    {
      "sessionName": "2024-05-30 周四 19:30",
      "bizShowSessionId": "65d314f519b6c7000109470e",
      "beginDateTime": 1717034400000,
      "beginDateTimeFormat": "2024-05-30T02:00:00.000Z",
      "seatPlans": [
        {
          "originalPrice": 600,
          "seatPlanName": "看台 600元",
          "seatPlanId": "65d31669dbdbe30001f1dc95"
        },
        {
          "originalPrice": 800,
          "seatPlanName": "看台 800元",
          "seatPlanId": "65d31669dbdbe30001f1dc98"
        },
        {
          "originalPrice": 1000,
          "seatPlanName": "看台 1000元",
          "seatPlanId": "65d31669dbdbe30001f1dc9b"
        },
        {
          "originalPrice": 1200,
          "seatPlanName": "看台 1200元",
          "seatPlanId": "65d31669dbdbe30001f1dc9e"
        },
        {
          "originalPrice": 1600,
          "seatPlanName": "内场 1600元",
          "seatPlanId": "65d31669dbdbe30001f1dca1"
        },
        {
          "originalPrice": 1800,
          "seatPlanName": "内场VIP 1800元",
          "seatPlanId": "65d31669dbdbe30001f1dca4"
        },
        {
          "originalPrice": 2000,
          "seatPlanName": "内场至尊VIP 2000元",
          "seatPlanId": "65d31669dbdbe30001f1dca7"
        }
      ]
    },
    {
      "sessionName": "2024-05-31 周五 19:30",
      "bizShowSessionId": "65d314f519b6c70001094710",
      "beginDateTime": 1717120800000,
      "beginDateTimeFormat": "2024-05-31T02:00:00.000Z",
      "seatPlans": [
        {
          "originalPrice": 600,
          "seatPlanName": "看台 600元",
          "seatPlanId": "65d31669dbdbe30001f1dcaa"
        },
        {
          "originalPrice": 800,
          "seatPlanName": "看台 800元",
          "seatPlanId": "65d31669dbdbe30001f1dcad"
        },
        {
          "originalPrice": 1000,
          "seatPlanName": "看台 1000元",
          "seatPlanId": "65d31669dbdbe30001f1dcb0"
        },
        {
          "originalPrice": 1200,
          "seatPlanName": "看台 1200元",
          "seatPlanId": "65d31669dbdbe30001f1dcb3"
        },
        {
          "originalPrice": 1600,
          "seatPlanName": "内场 1600元",
          "seatPlanId": "65d31669dbdbe30001f1dcb6"
        },
        {
          "originalPrice": 1800,
          "seatPlanName": "内场VIP 1800元",
          "seatPlanId": "65d31669dbdbe30001f1dcb9"
        },
        {
          "originalPrice": 2000,
          "seatPlanName": "内场至尊VIP 2000元",
          "seatPlanId": "65d31669dbdbe30001f1dcbc"
        }
      ]
    },
    {
      "sessionName": "2024-06-01 周六 19:30",
      "bizShowSessionId": "65d314f519b6c70001094712",
      "beginDateTime": 1717207200000,
      "beginDateTimeFormat": "2024-06-01T02:00:00.000Z",
      "seatPlans": [
        {
          "originalPrice": 600,
          "seatPlanName": "看台 600元",
          "seatPlanId": "65d31669dbdbe30001f1dcbf"
        },
        {
          "originalPrice": 800,
          "seatPlanName": "看台 800元",
          "seatPlanId": "65d31669dbdbe30001f1dcc2"
        },
        {
          "originalPrice": 1000,
          "seatPlanName": "看台 1000元",
          "seatPlanId": "65d31669dbdbe30001f1dcc5"
        },
        {
          "originalPrice": 1200,
          "seatPlanName": "看台 1200元",
          "seatPlanId": "65d31669dbdbe30001f1dcc8"
        },
        {
          "originalPrice": 1600,
          "seatPlanName": "内场 1600元",
          "seatPlanId": "65d31669dbdbe30001f1dccb"
        },
        {
          "originalPrice": 1800,
          "seatPlanName": "内场VIP 1800元",

          "seatPlanId": "65d31669dbdbe30001f1dcce"
        },
        {
          "originalPrice": 2000,
          "seatPlanName": "内场至尊VIP 2000元",
          "seatPlanId": "65d31669dbdbe30001f1dcd1"
        }
      ]
    },
    {
      "sessionName": "2024-06-02 周日 19:30",
      "bizShowSessionId": "65d314f519b6c70001094714",
      "beginDateTime": 1717293600000,
      "beginDateTimeFormat": "2024-06-02T02:00:00.000Z",
      "seatPlans": [
        {
          "originalPrice": 600,
          "seatPlanName": "看台 600元",
          "seatPlanId": "65d31669dbdbe30001f1dcd5"
        },
        {
          "originalPrice": 800,
          "seatPlanName": "看台 800元",
          "seatPlanId": "65d31669dbdbe30001f1dcd8"
        },
        {
          "originalPrice": 1000,
          "seatPlanName": "看台 1000元",
          "seatPlanId": "65d31669dbdbe30001f1dcdb"
        },
        {
          "originalPrice": 1200,
          "seatPlanName": "看台 1200元",
          "seatPlanId": "65d31669dbdbe30001f1dcde"
        },
        {
          "originalPrice": 1600,
          "seatPlanName": "内场 1600元",
          "seatPlanId": "65d31669dbdbe30001f1dce1"
        },
        {
          "originalPrice": 1800,
          "seatPlanName": "内场VIP 1800元",
          "seatPlanId": "65d31669dbdbe30001f1dce4"
        },
        {
          "originalPrice": 2000,
          "seatPlanName": "内场至尊VIP 2000元",
          "seatPlanId": "65d31669dbdbe30001f1dce7"
        }
      ]
    }
  ],
  express: {
    "priceItemId": "65d314d3d3e36800012fe6e2",
    "priceItemType": "EXPRESS_FEE",
    "priceItemName": "快递费",
    "priceItemVal": 12,
    "direction": "INCREASE",
    "priceItemSpecies": "SEAT_PLAN"
  }
}


// createOrder({ spuId: "65d2fa3facbdf80001dc2249", startTime: 1710554400000, price: 480, audienceList: ['65e035ce4834060001a7c4d7'] })
getPreCreateOrderInfo({ spuId: "", startTime: 1710554400000, price: 480, audienceList: ['65e035ce4834060001a7c4d7'] })



/**
 * ```js
 *
 actionCreateOrder({
  audienceList: ["65e035ce4834060001a7c4d7"],
  addressId: '65e051ec16be6f00010fa357',
  price: 480,
  skuId: '65d2ff25dbdbe30001f1dc79',
  spuId: '65d2fa3facbdf80001dc2249',
  sessionId: "65d2fdf2f32c6a0001b7a36a",
  express: { "priceItemId": "65d2fa3facbdf80001dc2249", "priceItemType": "EXPRESS_FEE", "priceItemName": "快递费", "priceItemVal": 12, "direction": "INCREASE", "priceItemSpecies": "SEAT_PLAN" }
})

```
 * 
 * 
 * 
 */