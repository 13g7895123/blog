/**
 * 文章實體
 */
export interface Article {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  tagIds: string[]
}

/**
 * 建立文章輸入
 */
export interface CreateArticleInput {
  title: string
  content: string
  tagIds?: string[]
}

/**
 * 更新文章輸入
 */
export interface UpdateArticleInput {
  title?: string
  content?: string
  tagIds?: string[]
}

/**
 * 文章摘要（用於列表頁面）
 */
export interface ArticleSummary {
  id: string
  title: string
  excerpt: string
  createdAt: string
  tags: Tag[]
}

/**
 * 標籤實體（從 tag.ts 重新匯出）
 */
import type { Tag } from './tag'
export type { Tag }
