<script setup lang="ts">
import WebviewContainer from './components/WebviewContainer.vue'
import TabBar from './components/TabBar.vue'
import BookmarkBar from './components/BookmarkBar.vue'
import { provide, reactive, ref } from 'vue'
import { provideKeys } from './keys/index'
const tabBar = ref<InstanceType<typeof TabBar>>()
let tabList = reactive<ITab[]>([])
let tabIndex = ref(0)

function openNewTab(bookmark: IBookmark, isDefault = false) {
  if (isDefault && tabList.length > 0) {
    return
  }
  tabBar?.value?.openNewTab(bookmark)
}

function setTabList(list: ITab[]) {
  tabList = list
}

provide(provideKeys.openNewTab, openNewTab)
provide(provideKeys.setTabList, setTabList)

const container = ref(null)
function closeWebview(ids: string[], isAll: boolean) {
  if (container.value) {
    // @ts-ignore
    return container.value?.closeWebview(ids || [], isAll)
  }

  return Promise.resolve()
}

provide('closeWebview', closeWebview)
provide('sendToWebview', sendToWebview)

function sendToWebview(msg) {
  console.log('app:sendToWebview', msg)
  // @ts-ignore
  container.value.sendToWebview(msg)
}

function changeList(list: ITab[]) {
  tabList.length = 0
  tabList.push(...list)
  console.log('tabList', tabList)
}
</script>

<template>
  <div class="page">
    <tab-bar
      class="tab-bar"
      ref="tabBar"
      :list="tabList"
      v-model:tab-index="tabIndex"
      @changeList="changeList"
    ></tab-bar>
    <bookmark-bar class="bookmark-bar"></bookmark-bar>
    <webview-container
      ref="container"
      class="webview-container"
      :tab-index="tabIndex"
      :tab-list="tabList"
    ></webview-container>
  </div>
</template>

<style lang="less">
@import './assets/css/styles.less';
</style>

<style lang="less" scoped>
.page {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0;

  .tab-bar {
    flex: none;
  }

  .bookmark-bar {
    flex: none;
  }

  .webview-container {
    flex: 1;
    width: 100%;
    height: 100%;

    display: flex;
    flex-direction: column;
    align-items: center;
  }
}
</style>
