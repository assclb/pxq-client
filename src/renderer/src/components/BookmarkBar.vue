<script setup lang="ts">
import { provideKeys } from '@renderer/keys'
import { inject, onMounted } from 'vue'
// const iconShop = new URL("./../assets/image/bookmark/icon-shop.png", import.meta.url).href
import iconShop from './../assets/image/bookmark/icon-shop.png'

function loadPreloadFileUrlByEnv() {
  if (import.meta.env.DEV) {
    console.log(
      "window.electronAPI.getWebviewPreloadFilePath('tencentChannelsShop')",
      `file://${window.electronAPI.getWebviewPreloadFilePath('tencentChannelsShop')}`
    )
    return `file:\\\\${window.electronAPI.getWebviewPreloadFilePath('tencentChannelsShop')}`
  }

  if (import.meta.env.PROD) {
    return '../../out/preload/tencentChannelsShop.js'
  }

  return ''
}

const tencentChannelsShop: IBookmark = {
  id: 'tencentChannelsShop',
  label: '票星球',
  color: 'rgba(4, 8, 20, 0.9)',
  url: 'https://m.piaoxingqiu.com/',
  icon: iconShop,
  preloadFileUrl: loadPreloadFileUrlByEnv()
}

// const tencentChannelsAssistant: IBookmark = {
//   id: 'tencentChannelsAssistant',
//   label: '视频号助手',
//   color: 'rgba(4, 8, 20, 0.9)',
//   url: 'https://channels.weixin.qq.com/platform/login-for-iframe?dark_mode=true&host_type=1',
//   icon: "/src/assets/image/bookmark/icon-assistant.png",
//   preloadFileUrl: window.electronAPI.getWebviewPreloadFilePath('tencentChannelsAssistant')
// }

const list: IBookmarkList = [
  tencentChannelsShop // tencentChannelsAssistant
]

const openNewTab = inject(provideKeys.openNewTab, () => {})

const sendToWebview = inject('sendToWebview', (e: any) => console.log(e))

function actionGetInfo() {
  sendToWebview({ cmd: 'getPreCreateOrderInfo' })
}

function actionPay() {
  sendToWebview({ cmd: 'createOrder' })
}

function actionLoopPay() {
  sendToWebview({ cmd: 'loopCreateOrder' })
}

const actionStopLoopPay = () => sendToWebview({ cmd: 'actionStopLoopPay' })

function actionRefresh() {
  sendToWebview({ cmd: 'actionRefresh' })
}

onMounted(() => {
  const storageList = JSON.parse(localStorage.getItem('list') || '[]')
  if (storageList.length == 0) {
    openNewTab(tencentChannelsShop, true)
    // openNewTab(tencentChannelsAssistant, false)
  }
})
</script>

<template>
  <div class="bookmark-bar">
    <div
      class="bookmark-item"
      v-for="bookmark in list"
      :key="bookmark.id"
      @click="openNewTab(bookmark)"
    >
      <img :src="bookmark.icon" alt="" class="icon" :class="`icon-${bookmark.id}`" />
      <div class="label">登录{{ bookmark.label }}</div>
    </div>

    <div class="bookmark-item function-item" @click="actionGetInfo">
      <div class="label">获取场次信息</div>
    </div>
    <div class="bookmark-item function-item" @click="actionPay">
      <div class="label">立即下单</div>
    </div>
    <div class="bookmark-item function-item" @click="actionLoopPay">
      <div class="label">循环下单</div>
    </div>
    <div class="bookmark-item function-item" @click="actionStopLoopPay">
      <div class="label">停止循环下单</div>
    </div>
    <div class="bookmark-item function-item" @click="actionRefresh">
      <div class="label">刷新</div>
    </div>
    <!-- <div class="bookmark-item function-item">定时下单</div> -->
  </div>
</template>

<style lang="less">
.bookmark-bar {
  width: 100%;
  height: 56px;
  padding: 16px;
  display: flex;
  align-items: center;
  background: #fff;

  .bookmark-item {
    max-width: 140px;
    width: fit-content;
    height: 32px;
    flex: 1;
    display: flex;
    padding: 5px 16px;
    align-items: center;
    border-radius: 4px;
    border: 1px solid #d3d7e0;
    background: #fff;
    margin-right: 8px;
    cursor: pointer;

    .icon {
      width: 20px;
      height: 20px;
      margin-right: 8px;
      flex: none;
      background: #fff;
    }

    .label {
      color: rgba(4, 8, 20, 0.9);
      font-size: 14px;
      font-family: PingFang SC;
      font-style: normal;
      font-weight: 400;
      line-height: 22px;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .function-item {
    padding: 0 10px;
    .label {
      width: fit-content;
    }
    text-align: center;
  }
}
</style>
