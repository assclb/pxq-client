// 存储 provide key 的文件代码
import { InjectionKey } from 'vue'

export const provideKeys = {
  openNewTab: Symbol() as InjectionKey<(bookmark: IBookmark, isDefault?: boolean) => void>,
  setTabList: Symbol() as InjectionKey<(data: ITab[]) => void>,
  setCurrentTab: Symbol() as InjectionKey<(data: ITab) => void>
}
