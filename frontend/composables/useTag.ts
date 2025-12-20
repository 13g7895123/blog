import { ref } from 'vue'
import type { Tag, CreateTagInput, TagWithCount } from '~/types/tag'
import { useApi } from './useApi'
import { slugify } from '~/utils/slugify'
import { validateTag } from '~/utils/validation'
import { DuplicateTagError, NotFoundError, ValidationError, StorageError } from '~/types/api'

/**
 * useTag composable
 * 
 * 管理標籤（Tag）實體及其與文章的關聯
 */
export function useTag() {
  const api = useApi()

  // 狀態
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 取得所有標籤列表
   */
  async function fetchTags(): Promise<Tag[]> {
    loading.value = true
    error.value = null

    try {
      const data = await api.get<Tag[]>('blog:tags')
      
      // 按名稱字母排序
      tags.value = Array.isArray(data)
        ? data.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
        : []
      
      return tags.value
    } catch (e) {
      const message = e instanceof Error ? e.message : '無法取得標籤列表'
      error.value = message
      console.error('fetchTags 失敗:', e)
      return []
    } finally {
      loading.value = false
    }
  }

  /**
   * 依 ID 取得標籤（同步方法）
   */
  function getTagById(id: string): Tag | null {
    return tags.value.find(t => t.id === id) || null
  }

  /**
   * 依 slug 取得標籤（用於 URL 路由）
   */
  function getTagBySlug(slug: string): Tag | null {
    return tags.value.find(t => t.slug === slug) || null
  }

  /**
   * 建立新標籤
   */
  async function createTag(input: CreateTagInput): Promise<Tag> {
    // 驗證
    const validation = validateTag(input)
    if (!validation.valid) {
      const message = validation.errors.join('; ')
      error.value = message
      throw new ValidationError(message)
    }

    // 檢查是否已存在相同名稱（不區分大小寫）
    const exists = tags.value.some(
      t => t.name.toLowerCase() === input.name.toLowerCase()
    )
    if (exists) {
      error.value = `標籤已存在: ${input.name}`
      throw new DuplicateTagError(input.name)
    }

    loading.value = true
    error.value = null

    try {
      // 建立標籤
      const tag: Tag = {
        id: crypto.randomUUID(),
        name: input.name.trim(),
        slug: slugify(input.name),
        createdAt: new Date().toISOString()
      }

      // 儲存到 localStorage
      const updatedTags = [...tags.value, tag]
        .sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
      
      await api.set('blog:tags', updatedTags)

      // 更新快取
      tags.value = updatedTags

      return tag
    } catch (e) {
      if (e instanceof (DuplicateTagError || ValidationError || StorageError)) {
        throw e
      }
      const message = e instanceof Error ? e.message : '無法建立標籤'
      error.value = message
      throw new StorageError(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 刪除標籤
   */
  async function deleteTag(id: string): Promise<void> {
    loading.value = true
    error.value = null

    try {
      // 確認標籤存在
      const tag = tags.value.find(t => t.id === id)
      if (!tag) {
        throw new NotFoundError('標籤', id)
      }

      // 移除標籤
      const updatedTags = tags.value.filter(t => t.id !== id)
      await api.set('blog:tags', updatedTags)

      // 更新快取
      tags.value = updatedTags
    } catch (e) {
      if (e instanceof (NotFoundError || StorageError)) {
        throw e
      }
      const message = e instanceof Error ? e.message : '無法刪除標籤'
      error.value = message
      throw new StorageError(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * 取得所有標籤及其文章數量
   */
  async function getTagsWithCount(): Promise<TagWithCount[]> {
    try {
      const articles = await api.get<any[]>('blog:articles')
      
      const tagsWithCount = tags.value.map(tag => {
        const count = Array.isArray(articles)
          ? articles.filter(a => a.tagIds && a.tagIds.includes(tag.id)).length
          : 0

        return { tag, count }
      })

      // 按文章數量降冪排序
      return tagsWithCount.sort((a, b) => b.count - a.count)
    } catch (e) {
      console.error('getTagsWithCount 失敗:', e)
      return tags.value.map(tag => ({ tag, count: 0 }))
    }
  }

  /**
   * 取得有文章的標籤及其數量（用於側邊欄）
   * 只顯示 count > 0 的標籤
   */
  async function getActiveTagsWithCount(): Promise<TagWithCount[]> {
    try {
      const allTags = await getTagsWithCount()
      // 過濾掉 count = 0 的標籤
      return allTags.filter(t => t.count > 0)
    } catch (e) {
      console.error('getActiveTagsWithCount 失敗:', e)
      return []
    }
  }

  return {
    // 狀態
    tags: ref(tags),
    loading: ref(loading),
    error: ref(error),

    // 方法
    fetchTags,
    getTagById,
    getTagBySlug,
    createTag,
    deleteTag,
    getTagsWithCount,
    getActiveTagsWithCount
  }
}
