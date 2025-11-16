import type { Article, CreateArticleInput, UpdateArticleInput } from '~/types/article'
import type { Tag, CreateTagInput } from '~/types/tag'
import type { ValidationResult } from '~/types/api'

/**
 * 驗證文章資料
 */
export function validateArticle(
  article: Partial<CreateArticleInput | UpdateArticleInput>
): ValidationResult {
  const errors: string[] = []

  // 標題驗證
  if ('title' in article) {
    if (!article.title || article.title.trim().length === 0) {
      errors.push('標題不可為空白')
    } else if (article.title.length > 200) {
      errors.push('標題長度不可超過 200 字元')
    }
  }

  // 內容驗證
  if ('content' in article) {
    if (!article.content || article.content.trim().length === 0) {
      errors.push('內容不可為空白')
    } else if (article.content.length > 50000) {
      errors.push('內容長度不可超過 50000 字元')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 驗證標籤資料
 */
export function validateTag(tag: Partial<CreateTagInput>): ValidationResult {
  const errors: string[] = []

  // 標籤名稱驗證
  if (!tag.name || tag.name.trim().length === 0) {
    errors.push('標籤名稱不可為空白')
  } else {
    if (tag.name.length > 50) {
      errors.push('標籤名稱長度不可超過 50 字元')
    }

    // 檢查非法字元
    const invalidChars = /[<>\/\\]/
    if (invalidChars.test(tag.name)) {
      errors.push('標籤名稱包含非法字元 (<>\/\\)')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 驗證標題（快速驗證）
 */
export function validateTitle(title: string): boolean {
  return title.trim().length > 0 && title.length <= 200
}

/**
 * 驗證內容（快速驗證）
 */
export function validateContent(content: string): boolean {
  return content.trim().length > 0 && content.length <= 50000
}
