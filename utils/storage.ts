/**
 * localStorage 輔助函式
 * 提供安全的 get/set/remove 操作，並處理 quota 檢查
 */

/**
 * 安全地從 localStorage 讀取資料
 */
export function safeGet<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    if (!item) {
      return defaultValue
    }
    return JSON.parse(item) as T
  } catch (error) {
    console.error(`localStorage 讀取失敗 (${key}):`, error)
    return defaultValue
  }
}

/**
 * 安全地寫入資料到 localStorage
 */
export function safeSet<T>(key: string, value: T): boolean {
  try {
    const serialized = JSON.stringify(value)
    localStorage.setItem(key, serialized)
    return true
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      console.error('localStorage 空間不足')
      throw error
    }
    console.error(`localStorage 寫入失敗 (${key}):`, error)
    return false
  }
}

/**
 * 安全地從 localStorage 移除資料
 */
export function safeRemove(key: string): boolean {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`localStorage 移除失敗 (${key}):`, error)
    return false
  }
}

/**
 * 檢查 localStorage 是否可用
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

/**
 * 取得 localStorage 使用量
 * 
 * @returns { used: number, total: number, percentage: number }
 */
export function getStorageUsage(): { used: number; total: number; percentage: number } {
  let used = 0

  try {
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        used += localStorage[key].length + key.length
      }
    }
  } catch (error) {
    console.error('無法計算儲存空間使用量:', error)
  }

  const total = 5 * 1024 * 1024 // 假設 5MB
  const percentage = (used / total) * 100

  return { used, total, percentage }
}

/**
 * 檢查是否應該顯示警告
 * 
 * @param threshold 警告閾值（預設 80%）
 * @returns 是否應該警告
 */
export function shouldWarnStorage(threshold = 80): boolean {
  const { percentage } = getStorageUsage()
  return percentage >= threshold
}

/**
 * 清除所有以指定前綴開頭的 localStorage 項目
 * 
 * @param prefix 前綴（例如：'blog:'）
 */
export function clearByPrefix(prefix: string): void {
  try {
    const keys = Object.keys(localStorage)
    const targetKeys = keys.filter(k => k.startsWith(prefix))

    targetKeys.forEach(key => {
      localStorage.removeItem(key)
    })

    console.log(`已清除 ${targetKeys.length} 個以 "${prefix}" 開頭的項目`)
  } catch (error) {
    console.error(`清除 localStorage 失敗 (前綴: ${prefix}):`, error)
  }
}
