interface ITab {
  id: number
  label?: string
  url: string
  icon?: string
  activeIcon?: string
  show: boolean
  loading: boolean
  status: boolean
  color?: string
  originId: IBookmark['id'],
  preloadFileUrl: string
}

interface IBookmark {
  id: string
  url: string
  label: string
  icon?: string
  activeIcon?: string
  color: string
  activeColor?: string
  isDefault?: boolean
  preloadFileUrl: string
}

interface IBookmarkList {
  [index: number]: IBookmark
}
