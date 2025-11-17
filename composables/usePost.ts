import { ref, computed } from 'vue'
import type { Article, CreateArticleInput, UpdateArticleInput, ArticleSummary } from '~/types/article'
import type { Tag } from '~/types/tag'
import { useApi } from './useApi'
import { validateArticle, validateTitle, validateContent } from '~/utils/validation'
import { generateExcerpt } from '~/utils/markdown'
import { NotFoundError, ValidationError, StorageError, QuotaExceededError } from '~/types/api'

/**
 * usePost composable
 * 
 * 管理文章（Article）實體的 CRUD 操作
 * 提供反應式狀態與方法，用於建立、讀取、更新、刪除文章
 */
export function usePost() {
  const api = useApi()

  // 狀態
  const articles = ref<Article[]>([])
  const currentArticle = ref<Article | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 取得所有文章列表，依建立時間由新到舊排序
   */
  async function fetchArticles(): Promise<Article[]> {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<Article[]>('blog:articles')
      
      // 確保每篇文章都有 tagIds（向後兼容舊資料）
      const normalizedData = Array.isArray(data)
        ? data.map(article => ({
            ...article,
            tagIds: Array.isArray(article.tagIds) ? article.tagIds : []
          }))
        : []
      
      // 按 createdAt 降冪排序（最新的在最前面）
      articles.value = normalizedData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      
      return articles.value
    } catch (e) {
      const message = e instanceof Error ? e.message : '無法取得文章列表'
      error.value = message
      console.error('fetchArticles 失敗:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * 取得單篇文章
   */
  async function getArticle(id: string): Promise<Article> {
    try {
      const article = articles.value.find(a => a.id === id)
      
      if (article) {
        // 確保有 tagIds
        const normalizedArticle = {
          ...article,
          tagIds: Array.isArray(article.tagIds) ? article.tagIds : []
        }
        currentArticle.value = normalizedArticle
        return normalizedArticle
      }
      
      // 如果在記憶體中找不到，先載入所有文章
      await fetchArticles()
      const foundArticle = articles.value.find(a => a.id === id)
      
      if (foundArticle) {
        const normalizedArticle = {
          ...foundArticle,
          tagIds: Array.isArray(foundArticle.tagIds) ? foundArticle.tagIds : []
        }
        currentArticle.value = normalizedArticle
        return normalizedArticle
      }
      
      throw new NotFoundError('文章', id)
    } catch (e) {
      if (e instanceof NotFoundError) {
        error.value = e.message
        throw e
      }
      const err = new StorageError(String(e))
      error.value = err.message
      throw err
    }
  }

  /**
   * 建立新文章
   */
  async function createArticle(input: CreateArticleInput): Promise<Article> {
    // 驗證
    const validation = validateArticle(input)
    if (!validation.valid) {
      const message = validation.errors.join('; ')
      error.value = message
      throw new ValidationError(message)
    }

    loading.value = true
    error.value = null

    try {
      // 建立文章
      const now = new Date().toISOString()
      const article: Article = {
        id: crypto.randomUUID(),
        title: input.title.trim(),
        content: input.content.trim(),
        createdAt: now,
        updatedAt: now,
        tagIds: Array.isArray(input.tagIds) ? input.tagIds : []
      }

      // 儲存到 localStorage
      const updatedArticles = [article, ...articles.value]
      await api.set('blog:articles', updatedArticles)

      // 更新快取
      articles.value = updatedArticles

      return article
    } catch (e) {
      if (e instanceof QuotaExceededError) {
        error.value = '儲存空間已滿，請刪除部分文章'
        throw e
      }
      const message = e instanceof Error ? e.message : '無法建立文章'
      error.value = message
      throw new StorageError(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新現有文章
   */
  async function updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
    // 驗證
    const validation = validateArticle(input)
    if (!validation.valid) {
      const message = validation.errors.join('; ')
      error.value = message
      throw new ValidationError(message)
    }

    loading.value = true
    error.value = null

    try {
      // 取得現有文章
      const article = articles.value.find(a => a.id === id)
      if (!article) {
        throw new NotFoundError('文章', id)
      }

      // 合併更新欄位
      const updated: Article = {
        ...article,
        ...(input.title !== undefined && { title: input.title.trim() }),
        ...(input.content !== undefined && { content: input.content.trim() }),
        ...(input.tagIds !== undefined && { tagIds: Array.isArray(input.tagIds) ? input.tagIds : [] }),
        updatedAt: new Date().toISOString(),
        // 確保 tagIds 始終存在
        tagIds: input.tagIds !== undefined 
          ? (Array.isArray(input.tagIds) ? input.tagIds : [])
          : (article.tagIds || [])
      }

      // 儲存到 localStorage
      const updatedArticles = articles.value.map(a => a.id === id ? updated : a)
      await api.set('blog:articles', updatedArticles)

      // 更新快取
      articles.value = updatedArticles
      currentArticle.value = updated

      return updated
    } catch (e) {
      if (e instanceof (NotFoundError || StorageError || ValidationError || QuotaExceededError)) {
        throw e
      }
      const message = e instanceof Error ? e.message : '無法更新文章'
      error.value = message
      throw new StorageError(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除文章
   */
  async function deleteArticle(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 確認文章存在
      const article = articles.value.find(a => a.id === id)
      if (!article) {
        throw new NotFoundError('文章', id)
      }

      // 移除文章
      const updatedArticles = articles.value.filter(a => a.id !== id)
      await api.set('blog:articles', updatedArticles)

      // 更新快取
      articles.value = updatedArticles

      // 清除當前文章（若為被刪除的文章）
      if (currentArticle.value?.id === id) {
        currentArticle.value = null
      }
    } catch (e) {
      if (e instanceof (NotFoundError || StorageError)) {
        throw e
      }
      const message = e instanceof Error ? e.message : '無法刪除文章'
      error.value = message
      throw new StorageError(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 取得特定標籤下的所有文章
   */
  async function getArticlesByTag(tagId: string): Promise<Article[]> {
    try {
      const filtered = articles.value.filter(a => a.tagIds.includes(tagId))
      
      // 按建立時間排序
      return filtered.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (e) {
      console.error('getArticlesByTag 失敗:', e)
      return []
    }
  }

  /**
   * 取得文章摘要列表（用於列表頁面）
   */
  async function getArticleSummaries(): Promise<ArticleSummary[]> {
    try {
      // 先確保有 tags 資料
      const tagComposable = (await import('./useTag')).useTag()
      await tagComposable.fetchTags()
      const { getTagById } = tagComposable

      return articles.value.map(article => {
        // 確保 tagIds 存在，如果不存在則使用空陣列
        const tagIds = article.tagIds || []
        
        // 將 tagIds 轉換為 Tag 物件
        const articleTags = tagIds
          .map(id => getTagById(id))
          .filter((tag): tag is Tag => tag !== null)

        return {
          id: article.id,
          title: article.title,
          excerpt: generateExcerpt(article.content, 200),
          createdAt: article.createdAt,
          tags: articleTags
        }
      })
    } catch (e) {
      console.error('getArticleSummaries 失敗:', e)
      return []
    }
  }

  return {
    // 狀態
    articles: computed(() => articles.value),
    currentArticle: computed(() => currentArticle.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),

    // 方法
    fetchArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    getArticlesByTag,
    getArticleSummaries
  }
}
