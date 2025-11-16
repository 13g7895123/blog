# Composable API 規格：usePost

**用途**：管理文章（Article）實體的 CRUD 操作  
**類型**：Vue 3 Composable  
**資料來源**：localStorage（MVP）→ API（未來）

## 公開介面

### 類型定義

```typescript
interface Article {
  id: string
  title: string
  content: string
  createdAt: string
  updatedAt: string
  tagIds: string[]
}

interface ArticleSummary {
  id: string
  title: string
  excerpt: string
  createdAt: string
  tags: Tag[]
}

interface CreateArticleInput {
  title: string
  content: string
  tagIds?: string[]
}

interface UpdateArticleInput {
  title?: string
  content?: string
  tagIds?: string[]
}

interface UsePostReturn {
  // 狀態
  articles: Ref<Article[]>
  currentArticle: Ref<Article | null>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // 方法
  fetchArticles: () => Promise<Article[]>
  getArticle: (id: string) => Promise<Article | null>
  createArticle: (input: CreateArticleInput) => Promise<Article>
  updateArticle: (id: string, input: UpdateArticleInput) => Promise<Article>
  deleteArticle: (id: string) => Promise<void>
  getArticlesByTag: (tagId: string) => Promise<Article[]>
  getArticleSummaries: () => Promise<ArticleSummary[]>
}
```

## 方法規格

### 1. fetchArticles()

**描述**：取得所有文章列表，依建立時間由新到舊排序

**簽名**：
```typescript
fetchArticles(): Promise<Article[]>
```

**行為**：
- 從 localStorage 讀取 `blog:articles`
- 依 `createdAt` 降冪排序（FR-017）
- 更新 `articles` ref
- 快取結果以提升效能

**錯誤處理**：
- localStorage 讀取失敗：回傳空陣列，設定 error
- JSON 解析失敗：回傳空陣列，記錄錯誤

**範例**：
```typescript
const { fetchArticles, articles } = usePost()

await fetchArticles()
console.log(articles.value) // [Article, Article, ...]
```

---

### 2. getArticle(id)

**描述**：依 ID 取得單篇文章

**簽名**：
```typescript
getArticle(id: string): Promise<Article | null>
```

**參數**：
- `id`: 文章唯一識別碼

**行為**：
- 從 `articles` ref 中尋找（如已快取）
- 若無快取，從 localStorage 讀取
- 更新 `currentArticle` ref
- 若找不到，回傳 null

**錯誤處理**：
- ID 不存在：回傳 null
- localStorage 錯誤：設定 error，回傳 null

**範例**：
```typescript
const { getArticle, currentArticle } = usePost()

await getArticle('article-id')
if (currentArticle.value) {
  console.log(currentArticle.value.title)
}
```

---

### 3. createArticle(input)

**描述**：建立新文章

**簽名**：
```typescript
createArticle(input: CreateArticleInput): Promise<Article>
```

**參數**：
```typescript
interface CreateArticleInput {
  title: string        // 必填，1-200 字元
  content: string      // 必填，1-50000 字元
  tagIds?: string[]    // 選填，預設空陣列
}
```

**行為**：
1. 驗證輸入（FR-026）
2. 生成 UUID v4 作為 `id`
3. 設定 `createdAt` 為當前時間（FR-002）
4. 設定 `updatedAt` 為當前時間
5. 儲存到 localStorage
6. 更新 `articles` ref

**驗證規則**：
- `title`：非空白，長度 1-200
- `content`：非空白，長度 1-50000
- `tagIds`：陣列中的每個 ID 必須存在

**錯誤處理**：
- 驗證失敗：拋出 ValidationError，設定 error（FR-027）
- localStorage quota 超限：拋出 QuotaExceededError
- 標籤 ID 不存在：拋出 InvalidTagError

**範例**：
```typescript
const { createArticle } = usePost()

try {
  const article = await createArticle({
    title: '我的第一篇文章',
    content: '# 標題\n\n內容...',
    tagIds: ['tag-id-1']
  })
  console.log('建立成功:', article.id)
} catch (error) {
  console.error('建立失敗:', error.message)
}
```

---

### 4. updateArticle(id, input)

**描述**：更新現有文章

**簽名**：
```typescript
updateArticle(id: string, input: UpdateArticleInput): Promise<Article>
```

**參數**：
```typescript
interface UpdateArticleInput {
  title?: string       // 選填，1-200 字元
  content?: string     // 選填，1-50000 字元
  tagIds?: string[]    // 選填
}
```

**行為**：
1. 驗證輸入
2. 取得現有文章
3. 合併更新欄位
4. **保持 `createdAt` 不變**（FR-004）
5. 更新 `updatedAt` 為當前時間
6. 儲存到 localStorage
7. 更新 `articles` 和 `currentArticle` ref

**驗證規則**：
- 與 createArticle 相同，但所有欄位為選填
- 至少提供一個欄位

**錯誤處理**：
- ID 不存在：拋出 NotFoundError
- 驗證失敗：拋出 ValidationError
- localStorage 錯誤：拋出 StorageError

**範例**：
```typescript
const { updateArticle } = usePost()

await updateArticle('article-id', {
  title: '更新後的標題',
  tagIds: ['tag-1', 'tag-2']
})
```

---

### 5. deleteArticle(id)

**描述**：刪除文章

**簽名**：
```typescript
deleteArticle(id: string): Promise<void>
```

**參數**：
- `id`: 要刪除的文章 ID

**行為**：
1. 確認文章存在
2. 顯示確認對話框（FR-005）- 由 UI 層處理
3. 從 localStorage 移除
4. 更新 `articles` ref
5. 清除 `currentArticle`（若為當前文章）
6. 標籤關聯自動移除（FR-015）

**錯誤處理**：
- ID 不存在：拋出 NotFoundError
- localStorage 錯誤：拋出 StorageError

**範例**：
```typescript
const { deleteArticle } = usePost()

try {
  await deleteArticle('article-id')
  console.log('刪除成功')
} catch (error) {
  console.error('刪除失敗:', error.message)
}
```

---

### 6. getArticlesByTag(tagId)

**描述**：取得特定標籤下的所有文章（FR-025）

**簽名**：
```typescript
getArticlesByTag(tagId: string): Promise<Article[]>
```

**參數**：
- `tagId`: 標籤 ID

**行為**：
- 篩選 `articles` 中 `tagIds` 包含指定 `tagId` 的文章
- 依 `createdAt` 降冪排序
- 回傳符合條件的文章陣列

**錯誤處理**：
- tagId 不存在：回傳空陣列（不拋錯）
- localStorage 錯誤：設定 error，回傳空陣列

**範例**：
```typescript
const { getArticlesByTag } = usePost()

const articles = await getArticlesByTag('tag-id')
console.log(`找到 ${articles.length} 篇文章`)
```

---

### 7. getArticleSummaries()

**描述**：取得文章摘要列表（用於列表頁面，FR-018）

**簽名**：
```typescript
getArticleSummaries(): Promise<ArticleSummary[]>
```

**行為**：
- 取得所有文章
- 轉換為 ArticleSummary 格式
  - `excerpt`：取前 200 字元 + "..."
  - `tags`：查詢關聯的 Tag 實體
- 依 `createdAt` 降冪排序

**範例**：
```typescript
const { getArticleSummaries } = usePost()

const summaries = await getArticleSummaries()
summaries.forEach(s => {
  console.log(s.title, s.excerpt)
})
```

---

## 狀態管理

### Reactive State

```typescript
const articles = ref<Article[]>([])          // 所有文章快取
const currentArticle = ref<Article | null>(null)  // 當前檢視的文章
const loading = ref<boolean>(false)          // 載入狀態
const error = ref<string | null>(null)       // 錯誤訊息
```

### 狀態更新時機

- `loading = true`：任何非同步操作開始時
- `loading = false`：操作完成（成功或失敗）
- `error = null`：新操作開始時清除
- `error = message`：操作失敗時設定

---

## 錯誤類型

```typescript
class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

class NotFoundError extends Error {
  constructor(id: string) {
    super(`文章不存在: ${id}`)
    this.name = 'NotFoundError'
  }
}

class StorageError extends Error {
  constructor(message: string) {
    super(`儲存錯誤: ${message}`)
    this.name = 'StorageError'
  }
}

class QuotaExceededError extends Error {
  constructor() {
    super('儲存空間已滿')
    this.name = 'QuotaExceededError'
  }
}
```

---

## 實作範例（localStorage 版本）

```typescript
// composables/usePost.ts
import { ref } from 'vue'
import { useApi } from './useApi'
import { useTag } from './useTag'

export function usePost() {
  const api = useApi()
  const { getTagById } = useTag()
  
  const articles = ref<Article[]>([])
  const currentArticle = ref<Article | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  async function fetchArticles(): Promise<Article[]> {
    loading.value = true
    error.value = null
    
    try {
      const data = await api.get('blog:articles')
      articles.value = data
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      return articles.value
    } catch (e) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }
  
  async function createArticle(input: CreateArticleInput): Promise<Article> {
    // 驗證
    if (!input.title?.trim()) {
      throw new ValidationError('標題不可為空白')
    }
    
    // 建立文章
    const now = new Date().toISOString()
    const article: Article = {
      id: crypto.randomUUID(),
      title: input.title,
      content: input.content,
      createdAt: now,
      updatedAt: now,
      tagIds: input.tagIds || []
    }
    
    // 儲存
    articles.value.unshift(article)
    await api.set('blog:articles', articles.value)
    
    return article
  }
  
  // ... 其他方法
  
  return {
    articles,
    currentArticle,
    loading,
    error,
    fetchArticles,
    getArticle,
    createArticle,
    updateArticle,
    deleteArticle,
    getArticlesByTag,
    getArticleSummaries
  }
}
```

---

## 未來 API 遷移

當遷移到後端 API 時，只需修改內部實作，介面保持不變：

```typescript
// 未來的 API 版本
async function fetchArticles(): Promise<Article[]> {
  loading.value = true
  error.value = null
  
  try {
    const data = await api.get('/api/articles')  // HTTP 呼叫
    articles.value = data
    return articles.value
  } catch (e) {
    error.value = e.message
    return []
  } finally {
    loading.value = false
  }
}
```

**關鍵**：UI 層程式碼完全不需修改。

---

## 測試範例

```typescript
// tests/composables/usePost.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { usePost } from '~/composables/usePost'

describe('usePost', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  it('應該建立新文章', async () => {
    const { createArticle, getArticle } = usePost()
    
    const article = await createArticle({
      title: '測試文章',
      content: '測試內容'
    })
    
    expect(article.id).toBeDefined()
    expect(article.title).toBe('測試文章')
    expect(article.createdAt).toBeDefined()
  })
  
  it('應該驗證空白標題', async () => {
    const { createArticle } = usePost()
    
    await expect(
      createArticle({ title: '', content: '內容' })
    ).rejects.toThrow('標題不可為空白')
  })
  
  // ... 更多測試
})
```

---

## 效能考量

### 快取策略
- 首次 `fetchArticles()` 後，資料保存在 `articles` ref
- 後續操作直接使用快取，避免重複讀取 localStorage
- 寫入操作時同步更新快取

### 最佳化
- 大量文章時使用虛擬滾動（列表頁）
- Markdown 渲染快取（避免重複解析）
- 分頁載入（超過 100 篇文章時）

---

## 總結

`usePost` composable 提供：
- ✅ 完整的文章 CRUD 操作
- ✅ 清晰的錯誤處理
- ✅ Reactive 狀態管理
- ✅ 易於測試的設計
- ✅ 未來 API 遷移路徑
