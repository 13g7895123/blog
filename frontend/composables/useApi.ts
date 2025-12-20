import type { UseApiReturn } from '~/types/api'
import { StorageError, QuotaExceededError } from '~/types/api'
import { safeGet, safeSet, safeRemove, isStorageAvailable } from '~/utils/storage'

/**
 * useApi composable
 * 
 * 資料存取抽象層，統一 localStorage 和未來 API 的介面
 * MVP 階段使用 localStorage 實作
 * 
 * @returns UseApiReturn
 */
export function useApi(): UseApiReturn {
  const STORAGE_PREFIX = 'blog:'

  /**
   * 取得資料
   */
  async function get<T>(key: string): Promise<T> {
    try {
      // 檢查 localStorage 是否可用（SSR 時不可用）
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return [] as T
      }

      const fullKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`

      // 讀取資料
      const item = localStorage.getItem(fullKey)

      if (!item || item === 'null' || item === 'undefined') {
        // 回傳預設值（空陣列）
        return [] as T
      }

      return JSON.parse(item) as T
    } catch (error) {
      console.error(`useApi.get 失敗 (${key}):`, error)
      throw new StorageError(`無法讀取資料: ${key}`)
    }
  }

  /**
   * 儲存資料
   */
  async function set<T>(key: string, value: T): Promise<void> {
    try {
      // 檢查 localStorage 是否可用（SSR 時不可用）
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      const fullKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`
      const serialized = JSON.stringify(value)

      // 儲存資料
      localStorage.setItem(fullKey, serialized)
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        throw new QuotaExceededError()
      }
      console.error(`useApi.set 失敗 (${key}):`, error)
      throw new StorageError(`無法儲存資料: ${key}`)
    }
  }

  /**
   * 移除資料
   */
  async function remove(key: string): Promise<void> {
    try {
      // 檢查 localStorage 是否可用（SSR 時不可用）
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      const fullKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`
      localStorage.removeItem(fullKey)
    } catch (error) {
      console.error(`useApi.remove 失敗 (${key}):`, error)
      throw new StorageError(`無法移除資料: ${key}`)
    }
  }

  /**
   * 清除所有部落格資料
   */
  async function clear(): Promise<void> {
    try {
      // 檢查 localStorage 是否可用（SSR 時不可用）
      if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
        return
      }

      const keys = Object.keys(localStorage)
      const blogKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX))

      blogKeys.forEach(key => {
        localStorage.removeItem(key)
      })

      console.log(`已清除 ${blogKeys.length} 個部落格資料項目`)
    } catch (error) {
      console.error('useApi.clear 失敗:', error)
      throw new StorageError('無法清除資料')
    }
  }

  /**
   * 檢查儲存是否可用
   */
  async function checkAvailable(): Promise<boolean> {
    return isStorageAvailable()
  }

  return {
    get,
    set,
    remove,
    clear,
    isAvailable: checkAvailable
  }
}
