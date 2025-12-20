import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Markdown 渲染快取
const markdownCache = new Map<string, string>()

/**
 * 安全地渲染 Markdown 為 HTML
 * 
 * 使用 marked 解析 Markdown，然後使用 DOMPurify 清理 HTML，防止 XSS 攻擊
 * 
 * @param markdown Markdown 格式的文字
 * @returns 清理後的 HTML
 */
export async function renderMarkdown(markdown: string): Promise<string> {
  // 檢查快取
  if (markdownCache.has(markdown)) {
    return markdownCache.get(markdown)!
  }

  try {
    // 使用 marked 解析 Markdown
    const rawHtml = await marked.parse(markdown, {
      async: true,
      gfm: true, // GitHub Flavored Markdown
      breaks: true // 自動換行
    })

    // 使用 DOMPurify 清理 HTML（防止 XSS）
    const cleanHtml = DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 's',
        'a', 'img',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'hr', 'div', 'span'
      ],
      ALLOWED_ATTR: [
        'href', 'title', 'target', 'rel',
        'src', 'alt', 'width', 'height',
        'class', 'id'
      ]
    })

    // 快取結果
    markdownCache.set(markdown, cleanHtml)

    // 限制快取大小（最多 50 個項目）
    if (markdownCache.size > 50) {
      const firstKey = markdownCache.keys().next().value
      if (firstKey) {
        markdownCache.delete(firstKey)
      }
    }

    return cleanHtml
  } catch (error) {
    console.error('Markdown 渲染失敗:', error)
    return '<p>渲染失敗</p>'
  }
}

/**
 * 清除 Markdown 快取
 */
export function clearMarkdownCache(): void {
  markdownCache.clear()
}

/**
 * 從 Markdown 內容生成純文字摘要
 * 
 * @param markdown Markdown 內容
 * @param maxLength 最大長度（預設 200）
 * @returns 純文字摘要
 */
export function generateExcerpt(markdown: string, maxLength = 200): string {
  // 移除 Markdown 語法
  let text = markdown
    // 移除標題符號
    .replace(/#{1,6}\s+/g, '')
    // 移除粗體和斜體
    .replace(/\*\*|__/g, '')
    .replace(/\*|_/g, '')
    // 移除連結
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除圖片
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
    // 移除程式碼區塊
    .replace(/```[\s\S]*?```/g, '')
    // 移除行內程式碼
    .replace(/`([^`]+)`/g, '$1')
    // 移除引用符號
    .replace(/>\s+/g, '')
    // 移除列表符號
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 移除多餘空白
    .replace(/\s+/g, ' ')
    .trim()

  // 截取指定長度
  if (text.length > maxLength) {
    text = text.substring(0, maxLength) + '...'
  }

  return text
}
