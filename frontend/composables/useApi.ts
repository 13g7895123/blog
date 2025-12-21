import type { UseApiReturn } from '~/types/api'
import { StorageError, QuotaExceededError, NotFoundError, ValidationError } from '~/types/api'

/**
 * useApi composable
 * 
 * 使用 Nuxt useFetch 實作的 API 客戶端
 */
export function useApi() {

  /**
   * 處理 API 錯誤
   */
  function handleError(error: any, context: string) {
    console.error(`API Error (${context}):`, error)

    if (error.statusCode === 404) {
      throw new NotFoundError(context)
    }
    if (error.statusCode === 400) {
      throw new ValidationError(error.data?.error || error.message)
    }

    // 其他錯誤
    throw new StorageError(error.data?.error || error.message || '發生未預期的錯誤')
  }

  /**
   * GET 請求
   */
  async function get<T>(endpoint: string): Promise<T> {
    const { data, error } = await useFetch<T>(`/api/${endpoint}`)

    if (error.value) {
      handleError(error.value, endpoint)
    }

    // 確保不回傳 null，對陣列類型回傳空陣列
    if (data.value === null) {
      return [] as unknown as T
    }

    return data.value as T
  }

  /**
   * POST 請求
   */
  async function post<T>(endpoint: string, body: any): Promise<T> {
    const { data, error } = await useFetch<T>(`/api/${endpoint}`, {
      method: 'POST',
      body
    })

    if (error.value) {
      handleError(error.value, endpoint)
    }

    return data.value as T
  }

  /**
   * PUT 請求
   */
  async function put<T>(endpoint: string, body: any): Promise<T> {
    const { data, error } = await useFetch<T>(`/api/${endpoint}`, {
      method: 'PUT',
      body
    })

    if (error.value) {
      handleError(error.value, endpoint)
    }

    return data.value as T
  }

  /**
   * DELETE 請求
   */
  async function remove(endpoint: string): Promise<void> {
    const { error } = await useFetch(`/api/${endpoint}`, {
      method: 'DELETE'
    })

    if (error.value) {
      handleError(error.value, endpoint)
    }
  }

  // Settings
  const getSettings = () => useFetch('/api/settings')
  const updateSettings = (settings: any) => $fetch('/api/settings', { method: 'POST', body: settings })

  return {
    get,
    post,
    put,
    remove,
    getSettings,
    updateSettings,
    // 相容舊介面 (set 改為 post/put, clear 不支援)
    isAvailable: async () => true
  }
}
