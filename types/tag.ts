/**
 * 標籤實體
 */
export interface Tag {
  id: string
  name: string
  slug: string
  createdAt: string
}

/**
 * 帶計數的標籤（用於側邊欄）
 */
export interface TagWithCount {
  tag: Tag
  count: number
}

/**
 * 建立標籤輸入
 */
export interface CreateTagInput {
  name: string
}
