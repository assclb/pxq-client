<script setup lang="ts">
import { nextTick, watch, computed } from 'vue'

const props = defineProps<{ tabIndex: number; tabList: ITab[] }>()

const tab = computed(() => props.tabList[props.tabIndex])

const webviewList = computed(() =>
  props.tabList.map((tab) => {
    return {
      ...tab,
      webviewElementProps: {
        src: tab.url,
        // autosize: "on",
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36',
        disablewebsecurity: true,
        partition: `persist:${tab.id}`,
        preload: tab.preloadFileUrl,
        nodeintegration: true
      }
    }
  })
)

const sendToWebview = (msg) => {
  if (currentWebviewDom) {
    currentWebviewDom.send('webviewMessage', msg)
  }
}

const loggedWebview = {}
let waitLogoutList: number[] = []
let waitResolveFunc: null | Function = null

let currentWebviewDom: any = null
watch(
  () => props.tabIndex,
  (val) => {
    nextTick(() => {
      const id = props.tabList[val].id
      const webview = document.querySelector(`#webview-${id}`) as Electron.WebviewTag
      currentWebviewDom = webview
      webview.addEventListener('dom-ready', () => {
        console.log('webview', webview)
        // @ts-ignore
        // webview.openDevTools()
        // @ts-ignore
        // webview.send('clientPermission', window.electronAPI.getClientPermission())
        webview.send('setId', id)
      })
      webview.setAttribute(
        'userAgent',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.63 Safari/537.36'
      )
      webview.addEventListener('destroyed', (event) => {
        console.log('webview destroyed', event)
      })

      webview.addEventListener('close', (event) => {
        webview.send('actionLogin')
        console.log('webview close', event)
      })

      webview.addEventListener('crashed', (event) => {
        console.log('webview crashed', event)
      })

      // TODO: 可以先上报日志，再考虑是否处理
      webview.addEventListener('will-navigate', (e) => {
        console.log('will-navigate', e)
        // https://channels.weixin.qq.com/shop/home
      })

      webview.addEventListener('ipc-message', (e) => {
        // @ts-ignore, 例如：webview-1689564938823
        const id = +e.target.id.split('-')[1]
        switch (e.channel) {
          case 'logout':
            break
          case 'loginSuccess':
            loggedWebview[id] = null
            break
          case 'logoutSuccess':
            console.log('logoutSuccess', e)
            delete loggedWebview[id]
            const listIndex = waitLogoutList.indexOf(id)
            if (listIndex != -1) {
              waitLogoutList.splice(listIndex, 1)
            }

            if (waitLogoutList.length === 0 && waitResolveFunc) {
              waitResolveFunc(1)
              waitResolveFunc = null
            }
          default:
            break
        }
      })

      // webview.addEventListener("console-message", (e) => {
      //   const identifier = "@@@";

      //   if (!e.message.includes(identifier)) {
      //     return
      //   }

      //   // const [publicName, unparseMsg] = e.message.split(identifier);
      //   // const msg = typeof unparseMsg === 'string' ? JSON.parse(unparseMsg) : unparseMsg;
      //   // const {action, data} =
      //   console.log("e.sourceId", e.sourceId, e.message)
      // })

      // webview.addEventListener('ipc-message', async (event: any) => {
      //   console.log(event)
      //   // let data = JSON.parse(event.channel)

      //   // switch (data.type) {

      //   // }
      // });
    })
  },
  { immediate: true }
)

defineExpose({
  sendToWebview,
  closeWebview: (ids: number[], isAll: boolean) => {
    waitLogoutList.length = 0
    waitLogoutList.push(...ids)
    return new Promise((resolve) => {
      if (isAll) {
        ids = webviewList.value.map((webview) => webview.id)
      }

      ids = ids.filter((id) => Object.hasOwn(loggedWebview, id))

      if (ids.length === 0) {
        resolve(1)
      } else {
        waitResolveFunc = resolve
      }

      ids.map((id) => {
        const webviewDom = document.querySelector(`#webview-${id}`) as Electron.WebviewTag
        webviewDom?.send('logout')
      })
    })
  }
})
</script>

<template>
  <div class="webview-container">
    <webview
      :style="{
        visibility: webview.id === tab.id ? 'visible' : 'hidden'
      }"
      v-for="webview in webviewList"
      :key="webview.id"
      v-bind="webview.webviewElementProps"
      :id="`webview-${webview.id}`"
      :contextIsolation="false"
    ></webview>
  </div>
</template>

<style lang="less">
.webview-container {
  width: 100%;
  height: 100%;
  position: relative;

  webview {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
  }
}
</style>
