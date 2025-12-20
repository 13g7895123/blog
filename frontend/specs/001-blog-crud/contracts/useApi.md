# Composable API 規格：useApi

**用途**：抽象的資料存取層，統一localStorage和未來API的介面  
**類型**：Vue 3 Composable  
**當前實作**：localStorage（MVP）  
**未來實作**：HTTP API

## 設計原則

`useApi` 是資料存取的抽象層，提供統一的介面給 `usePost` 和 `useTag` 使用。

當從 localStorage 遷移到後端 API 時，**只需修改 useApi 的實作**，而 usePost 和 useTag 的程式碼完全不需變動。

## 公開介面

### 類型定義

```typescript
interface UseApiReturn {
  // 基本 CRUD 操作
  get: <T>(key: string) => Promise<T>
  set: <T>(key: string, value: T) => Promise<void>
  remove: (key: string) => Promise<void>
  clear: () => Promise<void>
  
  // 健康檢查
  isAvailable: () => Promise<boolean>
}
```

## 方法規格

### 1. get<T>(key)

**描述**：取得資料

**簽名**：
```typescript
get<T>(key: string): Promise<T>
```

**參數**：
- `key`: 資料鍵值
  - localStorage 版本：直接使用 key（例如：`blog:articles`）
  - API 版本：轉換為 endpoint（例如：`/api/articles`）

**行為**：
- **localStorage 版本**：
  - 從 localStorage 讀取
  - JSON 解析
  - 若 key 不存在，回傳預設值（空陣列或 null）
  
- **未來 API 版本**：
  - HTTP GET 請求
  - 處理回應
  - 錯誤處理

**錯誤處理**：
- localStorage 不可用：拋出 StorageError
- JSON 解析失敗：拋出 ParseError
- API 錯誤：拋出 ApiError

**範例**：
```typescript
const api = useApi()

// localStorage 版本
const articles = await api.get<Article[]>('blog:articles')

// 未來 API 版本（相同的呼叫方式）
const articles = await api.get<Article[]>('articles')
```

---

### 2. set<T>(key, value)

**描述**：儲存資料

**簽名**：
```typescript
set<T>(key: string, value: T): Promise<void>
```

**參數**：
- `key`: 資料鍵值
- `value`: 要儲存的資料（會自動 JSON 序列化）

**行為**：
- **localStorage 版本**：
  - JSON 序列化
  - 寫入 localStorage
  - 檢查 quota 限制
  
- **未來 API 版本**：
  - HTTP POST/PUT 請求
  - 處理回應

**錯誤處理**：
- Quota 超限：拋出 QuotaExceededError
- JSON 序列化失敗：拋出 SerializeError
- API 錯誤：拋出 ApiError

**範例**：
```typescript
const api = useApi()

const articles: Article[] = [/* ... */]
await api.set('blog:articles', articles)
```

---

### 3. remove(key)

**描述**：移除資料

**簽名**：
```typescript
remove(key: string): Promise<void>
```

**參數**：
- `key`: 要移除的資料鍵值

**行為**：
- **localStorage 版本**：
  - 從 localStorage 移除 key
  
- **未來 API 版本**：
  - HTTP DELETE 請求

**範例**：
```typescript
const api = useApi()

await api.remove('blog:articles')
```

---

### 4. clear()

**描述**：清除所有部落格資料

**簽名**：
```typescript
clear(): Promise<void>
```

**行為**：
- **localStorage 版本**：
  - 移除所有以 `blog:` 開頭的 key
  
- **未來 API 版本**：
  - 呼叫清除 API（需要額外權限）

**範例**：
```typescript
const api = useApi()

await api.clear() // 清除所有部落格資料
```

---

### 5. isAvailable()

**描述**：檢查資料儲存是否可用

**簽名**：
```typescript
isAvailable(): Promise<boolean>
```

**行為**：
- **localStorage 版本**：
  - 測試寫入/讀取
  - 檢查 localStorage 是否被禁用（私密瀏覽模式）
  
- **未來 API 版本**：
  - Ping API health endpoint
  - 檢查網路連線

**範例**：
```typescript
const api = useApi()

if (await api.isAvailable()) {
  console.log('儲存可用')
} else {
  console.error('儲存不可用')
}
```

---

## localStorage 實作（MVP）

```typescript
// composables/useApi.ts

export function useApi(): UseApiReturn {
  const STORAGE_PREFIX = 'blog:'
  
  async function get<T>(key: string): Promise<T> {
    try {
      const fullKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`
      const item = localStorage.getItem(fullKey)
      
      if (!item) {
        // 回傳預設值
        return (Array.isArray(key) ? [] : null) as T
      }
      
      return JSON.parse(item) as T
    } catch (error) {
      throw new StorageError(`無法讀取: ${key}`)
    }
  }
  
  async function set<T>(key: string, value: T): Promise<void> {
    try {
      const fullKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`
      const serialized = JSON.stringify(value)
      localStorage.setItem(fullKey, serialized)
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        throw new QuotaExceededError()
      }
      throw new StorageError(`無法儲存: ${key}`)
    }
  }
  
  async function remove(key: string): Promise<void> {
    try {
      const fullKey = key.startsWith(STORAGE_PREFIX) ? key : `${STORAGE_PREFIX}${key}`
      localStorage.removeItem(fullKey)
    } catch (error) {
      throw new StorageError(`無法移除: ${key}`)
    }
  }
  
  async function clear(): Promise<void> {
    try {
      const keys = Object.keys(localStorage)
      const blogKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX))
      
      blogKeys.forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      throw new StorageError('無法清除資料')
    }
  }
  
  async function isAvailable(): Promise<boolean> {
    try {
      const testKey = `${STORAGE_PREFIX}test`
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
  
  return {
    get,
    set,
    remove,
    clear,
    isAvailable
  }
}

// 錯誤類型
export class StorageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StorageError'
  }
}

export class QuotaExceededError extends Error {
  constructor() {
    super('儲存空間已滿，請刪除部分文章')
    this.name = 'QuotaExceededError'
  }
}
```

---

## 未來 API 實作

```typescript
// composables/useApi.ts (API 版本)

export function useApi(): UseApiReturn {
  const config = useRuntimeConfig()
  const baseURL = config.public.apiBaseUrl
  
  async function get<T>(key: string): Promise<T> {
    try {
      const endpoint = keyToEndpoint(key)
      const response = await $fetch<T>(`${baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      return response
    } catch (error) {
      throw new ApiError(`API 請求失敗: ${key}`, error)
    }
  }
  
  async function set<T>(key: string, value: T): Promise<void> {
    try {
      const endpoint = keyToEndpoint(key)
      await $fetch(`${baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: value
      })
    } catch (error) {
      throw new ApiError(`API 儲存失敗: ${key}`, error)
    }
  }
  
  async function remove(key: string): Promise<void> {
    try {
      const endpoint = keyToEndpoint(key)
      await $fetch(`${baseURL}${endpoint}`, {
        method: 'DELETE'
      })
    } catch (error) {
      throw new ApiError(`API 刪除失敗: ${key}`, error)
    }
  }
  
  async function clear(): Promise<void> {
    try {
      await $fetch(`${baseURL}/api/reset`, {
        method: 'POST'
      })
    } catch (error) {
      throw new ApiError('API 清除失敗', error)
    }
  }
  
  async function isAvailable(): Promise<boolean> {
    try {
      await $fetch(`${baseURL}/api/health`)
      return true
    } catch {
      return false
    }
  }
  
  // 將 localStorage key 轉換為 API endpoint
  function keyToEndpoint(key: string): string {
    const mapping: Record<string, string> = {
      'blog:articles': '/api/articles',
      'blog:tags': '/api/tags',
      'articles': '/api/articles',
      'tags': '/api/tags'
    }
    
    return mapping[key] || `/api/${key}`
  }
  
  return {
    get,
    set,
    remove,
    clear,
    isAvailable
  }
}

export class ApiError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message)
    this.name = 'ApiError'
  }
}
```

---

## 混合模式（過渡期）

在從 localStorage 遷移到 API 的過渡期，可以實作混合模式：

```typescript
// composables/useApi.ts (混合版本)

export function useApi(): UseApiReturn {
  const config = useRuntimeConfig()
  const useApiBackend = config.public.useApiBackend || false
  
  const localStorageApi = useLocalStorageApi()
  const httpApi = useHttpApi()
  
  // 根據設定選擇實作
  const implementation = useApiBackend ? httpApi : localStorageApi
  
  return {
    get: async <T>(key: string) => {
      try {
        // 優先使用 API
        if (useApiBackend && await httpApi.isAvailable()) {
          return await httpApi.get<T>(key)
        }
      } catch (error) {
        console.warn('API 失敗，fallback 到 localStorage', error)
      }
      
      // Fallback 到 localStorage
      return await localStorageApi.get<T>(key)
    },
    
    set: async <T>(key: string, value: T) => {
      if (useApiBackend) {
        await httpApi.set(key, value)
      } else {
        await localStorageApi.set(key, value)
      }
    },
    
    remove: implementation.remove,
    clear: implementation.clear,
    isAvailable: implementation.isAvailable
  }
}
```

---

## 初始化與設定

### MVP（localStorage）

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      useApiBackend: false  // MVP 使用 localStorage
    }
  }
})
```

### 遷移到 API

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    public: {
      useApiBackend: true,
      apiBaseUrl: process.env.API_BASE_URL || 'http://localhost:3001'
    }
  }
})
```

---

## 資料遷移工具

```typescript
// utils/migration.ts

/**
 * 將 localStorage 資料匯出為 JSON
 */
export async function exportLocalStorageData() {
  const api = useApi()
  
  const articles = await api.get<Article[]>('blog:articles')
  const tags = await api.get<Tag[]>('blog:tags')
  
  return {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    data: {
      articles,
      tags
    }
  }
}

/**
 * 將匯出的資料上傳到 API
 */
export async function importDataToApi(exportData: any) {
  const httpApi = useHttpApi()
  
  // 批次上傳
  await httpApi.set('articles', exportData.data.articles)
  await httpApi.set('tags', exportData.data.tags)
  
  console.log('資料匯入完成')
}

/**
 * 一鍵遷移：localStorage → API
 */
export async function migrateToApi() {
  const data = await exportLocalStorageData()
  await importDataToApi(data)
  console.log('遷移完成')
}
```

---

## 測試範例

```typescript
// tests/composables/useApi.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useApi } from '~/composables/useApi'

describe('useApi (localStorage)', () => {
  let api: ReturnType<typeof useApi>
  
  beforeEach(() => {
    localStorage.clear()
    api = useApi()
  })
  
  it('應該儲存和讀取資料', async () => {
    const data = [{ id: '1', name: 'test' }]
    
    await api.set('blog:test', data)
    const result = await api.get<typeof data>('blog:test')
    
    expect(result).toEqual(data)
  })
  
  it('應該處理 quota 超限', async () => {
    const largeData = new Array(10000000).fill('x').join('')
    
    await expect(
      api.set('blog:large', largeData)
    ).rejects.toThrow(QuotaExceededError)
  })
  
  it('應該檢查可用性', async () => {
    const available = await api.isAvailable()
    expect(available).toBe(true)
  })
})
```

---

## 監控與除錯

### localStorage 使用量監控

```typescript
// composables/useStorageMonitor.ts

export function useStorageMonitor() {
  function getUsage(): { used: number; total: number; percentage: number } {
    let used = 0
    
    for (const key in localStorage) {
      if (key.startsWith('blog:')) {
        used += localStorage[key].length + key.length
      }
    }
    
    const total = 5 * 1024 * 1024 // 5MB
    const percentage = (used / total) * 100
    
    return { used, total, percentage }
  }
  
  function shouldWarn(): boolean {
    return getUsage().percentage > 80
  }
  
  return {
    getUsage,
    shouldWarn
  }
}
```

### 使用範例

```typescript
const monitor = useStorageMonitor()

if (monitor.shouldWarn()) {
  const { percentage } = monitor.getUsage()
  console.warn(`儲存空間使用率: ${percentage.toFixed(1)}%`)
}
```

---

## 效能考量

### 批次操作

避免多次小量寫入，改用批次操作：

```typescript
// ❌ 不好：多次寫入
for (const article of articles) {
  await api.set(`blog:article:${article.id}`, article)
}

// ✅ 好：批次寫入
await api.set('blog:articles', articles)
```

### 快取策略

在 composables 層實作快取，減少 localStorage 讀取：

```typescript
const cachedArticles = ref<Article[]>([])
let cacheValid = false

async function fetchArticles(): Promise<Article[]> {
  if (cacheValid) {
    return cachedArticles.value
  }
  
  const api = useApi()
  cachedArticles.value = await api.get<Article[]>('blog:articles')
  cacheValid = true
  
  return cachedArticles.value
}
```

---

## 總結

`useApi` composable 提供：
- ✅ 統一的資料存取介面
- ✅ localStorage 完整實作（MVP）
- ✅ 清晰的 API 遷移路徑
- ✅ 混合模式支援（過渡期）
- ✅ 完整的錯誤處理
- ✅ 資料遷移工具
- ✅ 效能監控機制

**關鍵優勢**：透過抽象層設計，讓 usePost 和 useTag 完全不需修改即可從 localStorage 遷移到 API。
