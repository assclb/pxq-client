<script setup lang="ts">
import { inject, onMounted, reactive, ref, watch } from 'vue'
const iconHide = new URL('./../assets/image/tabbar/hide.png', import.meta.url).href
const iconMinimize = new URL('./../assets/image/tabbar/minimize.png', import.meta.url).href
const iconMaximize = new URL('./../assets/image/tabbar/maximize.png', import.meta.url).href
const iconRestore = new URL('./../assets/image/tabbar/restore.png', import.meta.url).href

class Tab {
  id: number
  label?: string
  url: string
  icon?: string
  activeIcon?: string
  show: boolean
  loading: boolean
  status: boolean
  color?: string
  originId: IBookmark['id']
  preloadFileUrl: any

  constructor(bookmark: IBookmark, id = new Date().valueOf()) {
    this.id = id
    this.url = bookmark.url
    this.show = true
    this.loading = true
    this.status = true
    this.originId = bookmark.id
    this.label = bookmark.label
    this.icon = bookmark.icon
    this.preloadFileUrl = bookmark.preloadFileUrl
  }
}

const storageList = localStorage.getItem('list') || '[]'
const list: ITab[] = reactive(JSON.parse(storageList))
const currentTabIndex = ref<number>(0)

function openNewTab(bookmark: IBookmark) {
  const tab = new Tab(bookmark)
  currentTabIndex.value = list.length
  list.push(tab)

  mousewheel({ deltaY: 99999 })
}

async function closeTab(index: number) {
  // @ts-ignore
  const result = await closeWebview([list[index].id], false)
  console.log('close-tab result', result)
  if (index <= currentTabIndex.value) {
    currentTabIndex.value -= 1
  }

  if (currentTabIndex.value < 0) {
    currentTabIndex.value = 0
  }
  list.splice(index, 1)
}

function changeActiveTab(index: number) {
  currentTabIndex.value = index
}

defineProps(['list', 'tabIndex'])
const emits = defineEmits(['changeList', 'update:tabIndex'])
watch(
  list,
  () => {
    console.log('list', list)
    localStorage.setItem('list', JSON.stringify(list))
    emits('changeList', list)
  },
  { immediate: true }
)
watch(currentTabIndex, () => emits('update:tabIndex', currentTabIndex.value), { immediate: true })
defineExpose({ openNewTab })

const closeWebview = inject('closeWebview') || function () {}
const isMaximize = ref(false)
const CURRENT_BROWSER_NAME = 'MAIN'
async function actionElectronFunc(functionKey: string) {
  if (window.electronAPI[functionKey]) {
    switch (functionKey) {
      case 'maximize':
        isMaximize.value = true
        break
      case 'restore':
        isMaximize.value = false
        break
      case 'hide':
        // @ts-ignore
        await closeWebview([], true)
      default:
        break
    }

    window.electronAPI[functionKey](CURRENT_BROWSER_NAME)
  }
}

let listDom: null | Element = null
onMounted(() => {
  listDom = document.querySelector('#tab-bar .list')
})

function mousewheel(e) {
  if (!listDom) {
    return
  }

  listDom.scrollTo({ left: listDom.scrollLeft + e.deltaY * 3, behavior: 'smooth' })
}

const icon = reactive({
  iconHide,
  iconMinimize,
  iconMaximize,
  iconRestore
})
</script>

<template>
  <div id="tab-bar" class="tab-bar">
    <div class="list" @mousewheel="mousewheel">
      <div
        class="tab-item"
        v-for="(tab, index) in list"
        :class="currentTabIndex === index ? 'active' : ''"
        :key="tab.id"
        @click="changeActiveTab(index)"
      >
        <img :src="tab.icon" alt="" class="icon" :class="`icon-${tab.originId}`" />
        <span class="label">{{ tab.label || '标签' }}</span>
        <div class="btn-close" @click.stop="closeTab(index)">
          <img :src="icon.iconHide" class="btn-close-icon" />
        </div>
      </div>
    </div>

    <div class="function-box">
      <div class="btn-item" @click="actionElectronFunc('minimize')">
        <img :src="icon.iconMinimize" alt="" class="icon" />
      </div>

      <div class="btn-item" @click="actionElectronFunc('maximize')" v-if="!isMaximize">
        <img :src="icon.iconMaximize" alt="" class="icon" />
      </div>

      <div class="btn-item" @click="actionElectronFunc('restore')" v-else-if="isMaximize">
        <img :src="icon.iconRestore" alt="" class="icon" />
      </div>

      <div class="btn-item" @click="actionElectronFunc('hide')">
        <img :src="icon.iconHide" alt="" class="icon" />
      </div>
    </div>
  </div>
</template>

<style lang="less">
.tab-bar {
  width: 100%;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #eee;
  -webkit-app-region: drag;

  .list {
    display: flex;
    align-items: center;
    flex: 1;
    padding: 0 8px;
    overflow: auto;
    overflow-y: hidden;
    width: calc(100% - 150px);

    &::-webkit-scrollbar {
      display: none;
    }

    .tab-item {
      flex: none;
      width: fit-content;
      padding: 14px 16px;
      height: 50px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(0, 0, 0, 0.05);
      cursor: pointer;
      -webkit-app-region: no-drag;

      .icon {
        width: 20px;
        height: 20px;
      }

      .label {
        color: rgba(4, 8, 20, 0.9);
        font-size: 14px;
        font-family: PingFang SC;
        line-height: 22px;
        margin: 0 4px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .btn-close {
        width: 12px;
        height: 12px;
        display: flex;
        align-items: center;

        .btn-close-icon {
          width: 14px;
          height: 14px;
        }
      }

      &.active {
        background: #fff;
      }
    }
  }

  .function-box {
    flex: none;
    width: fit-content;
    display: flex;
    align-items: center;
    justify-content: space-between;
    user-select: none;
    -webkit-app-region: no-drag;

    .btn-item {
      width: 50px;
      height: 50px;
      background: #eee;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      .icon {
        width: 16px;
        height: 16px;
      }

      &:hover {
        background: #fff;
      }
    }
  }
}
</style>
