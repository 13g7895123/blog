import { ref } from 'vue'
import type { Tag, CreateTagInput, TagWithCount } from '~/types/tag'
import { useApi } from './useApi'

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
      const data = await api.get<Tag[]>('tags')
      tags.value = data
      return data
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
   * 建立新標籤
   */
  async function createTag(input: CreateTagInput): Promise<Tag> {
    loading.value = true
    error.value = null

    try {
      const tag = await api.post<Tag>('tags', input)
      tags.value.push(tag)
      // 重新排序
      tags.value.sort((a, b) => a.name.localeCompare(b.name, 'zh-TW'))
      return tag
    } catch (e) {
      const message = e instanceof Error ? e.message : '無法建立標籤'
      error.value = message
      throw e
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
      await api.remove(`tags/${id}`)
      tags.value = tags.value.filter(t => t.id !== id)
    } catch (e) {
      const message = e instanceof Error ? e.message : '無法刪除標籤'
      error.value = message
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * 取得所有標籤及其文章數量
   */
  async function getTagsWithCount(): Promise<TagWithCount[]> {
    try {
      const stats = await api.get<TagWithCount[]>('tags/stats')
      return stats
    } catch (e) {
      console.error('getTagsWithCount 失敗:', e)
      return []
    }
  }

  return {
    tags: ref(tags), // Keep ref for compatibility
    loading: ref(loading),
    error: ref(error),
    fetchTags,
    createTag,
    deleteTag,
    getTagsWithCount,
    // Helper methods (optional implementation if needed by UI)
    getTagById: (id: string) => tags.value.find(t => t.id === id) || null,
    getTagBySlug: (slug: string) => tags.value.find(t => t.slug === slug) || null,
    getActiveTagsWithCount: async () => {
      const stats = await getTagsWithCount()
      return (stats || []).filter(s => s.count > 0)
    }
  }
}
