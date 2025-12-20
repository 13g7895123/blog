/**
 * useApi composable 回傳介面
 */
export interface UseApiReturn {
  get: <T>(key: string) => Promise<T>
  set: <T>(key: string, value: T) => Promise<void>
  remove: (key: string) => Promise<void>
  clear: () => Promise<void>
  isAvailable: () => Promise<boolean>
}

/**
 * 儲存錯誤
 */
export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

/**
 * 驗證錯誤
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

/**
 * 找不到資源錯誤
 */
export class NotFoundError extends Error {
  constructor(resourceType: string, id: string) {
    super(`${resourceType}不存在: ${id}`)
    this.name = 'NotFoundError'
  }
}

/**
 * Quota 超限錯誤
 */
export class QuotaExceededError extends Error {
  constructor() {
    super('儲存空間已滿，請刪除部分文章')
    this.name = 'QuotaExceededError'
  }
}

/**
 * 重複標籤錯誤
 */
export class DuplicateTagError extends Error {
  constructor(name: string) {
    super(`標籤已存在: ${name}`)
    this.name = 'DuplicateTagError'
  }
}

/**
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
}
