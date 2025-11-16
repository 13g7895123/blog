# 資料模型：部落格文章管理系統

**功能**：部落格 CRUD 系統  
**日期**：2025-11-16  
**儲存**：localStorage（MVP）→ API（未來）

## 核心實體

### 1. Article（文章）

**用途**：代表一篇部落格文章

**屬性**：

| 屬性名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `id` | string | ✓ | 唯一識別碼 | UUID v4 格式 |
| `title` | string | ✓ | 文章標題 | 長度 1-200 字元，不可空白 |
| `content` | string | ✓ | Markdown 格式內容 | 長度 1-50000 字元 |
| `createdAt` | Date (ISO 8601) | ✓ | 建立時間戳記 | 自動生成，精確到秒 |
| `updatedAt` | Date (ISO 8601) | ✓ | 最後更新時間 | 自動更新 |
| `tagIds` | string[] | ✗ | 關聯的標籤 ID 陣列 | 空陣列表示無標籤 |

**範例**：
```typescript
interface Article {
  id: string                // "550e8400-e29b-41d4-a716-446655440000"
  title: string             // "我的第一篇文章"
  content: string           // "# 標題\n\n這是內容..."
  createdAt: string         // "2025-11-16T10:30:00.000Z"
  updatedAt: string         // "2025-11-16T10:30:00.000Z"
  tagIds: string[]          // ["tag-uuid-1", "tag-uuid-2"]
}
```

**索引**：
- 主鍵：`id`
- 排序索引：`createdAt`（用於列表排序）

**業務規則**：
- `createdAt` 在建立後永不修改（FR-004）
- `updatedAt` 在每次更新時自動設定為當前時間
- 刪除文章時，相關的 tagIds 引用會被移除，但 Tag 實體保留（FR-015）

---

### 2. Tag（標籤）

**用途**：代表文章分類標籤

**屬性**：

| 屬性名稱 | 型別 | 必填 | 說明 | 驗證規則 |
|---------|------|------|------|---------|
| `id` | string | ✓ | 唯一識別碼 | UUID v4 格式 |
| `name` | string | ✓ | 標籤名稱 | 長度 1-50 字元，允許空格和標點 |
| `slug` | string | ✓ | URL 友善識別碼 | 小寫英數字加連字號 |
| `createdAt` | Date (ISO 8601) | ✓ | 建立時間 | 自動生成 |

**範例**：
```typescript
interface Tag {
  id: string                // "tag-uuid-1"
  name: string              // "Vue.js"
  slug: string              // "vue-js"
  createdAt: string         // "2025-11-16T10:30:00.000Z"
}
```

**索引**：
- 主鍵：`id`
- 唯一索引：`slug`（用於 URL 路由）
- 查詢索引：`name`（用於標籤搜尋）

**業務規則**：
- `name` 不區分大小寫，但保留原始大小寫顯示
- `slug` 由 `name` 自動生成（中文轉拼音，空格轉連字號）
- 標籤可以沒有任何文章關聯（但在側邊欄中不顯示，FR-023）

---

## 衍生資料結構

### 3. TagWithCount（帶計數的標籤）

**用途**：側邊欄顯示標籤及其文章數量（FR-022）

**屬性**：

| 屬性名稱 | 型別 | 說明 |
|---------|------|------|
| `tag` | Tag | 標籤實體 |
| `count` | number | 關聯的文章數量 |

**範例**：
```typescript
interface TagWithCount {
  tag: Tag
  count: number             // 5
}
```

**計算邏輯**：
```typescript
function getTagWithCount(tagId: string): TagWithCount {
  const tag = getTagById(tagId)
  const articles = getAllArticles()
  const count = articles.filter(a => a.tagIds.includes(tagId)).length
  return { tag, count }
}
```

---

### 4. ArticleSummary（文章摘要）

**用途**：文章列表頁面顯示（FR-018）

**屬性**：

| 屬性名稱 | 型別 | 說明 |
|---------|------|------|
| `id` | string | 文章 ID |
| `title` | string | 文章標題 |
| `excerpt` | string | 內容摘要 |
| `createdAt` | string | 建立日期 |
| `tags` | Tag[] | 關聯的標籤實體陣列 |

**範例**：
```typescript
interface ArticleSummary {
  id: string
  title: string
  excerpt: string           // 前 200 字元 + "..."
  createdAt: string
  tags: Tag[]
}
```

**計算邏輯**：
```typescript
function toArticleSummary(article: Article): ArticleSummary {
  return {
    id: article.id,
    title: article.title,
    excerpt: article.content.substring(0, 200) + '...',
    createdAt: article.createdAt,
    tags: article.tagIds.map(id => getTagById(id))
  }
}
```

---

## 關聯關係

### Article ↔ Tag（多對多）

```
Article (1) ────────(0..*) Article.tagIds ─────────(0..*) Tag
```

**實作方式**：
- Article 實體包含 `tagIds: string[]` 陣列
- 不建立獨立的 Junction Table（ArticleTag）
- localStorage 中分別儲存 articles 和 tags

**查詢範例**：

```typescript
// 取得文章的所有標籤
function getArticleTags(articleId: string): Tag[] {
  const article = getArticleById(articleId)
  return article.tagIds.map(id => getTagById(id))
}

// 取得標籤下的所有文章
function getArticlesByTag(tagId: string): Article[] {
  const articles = getAllArticles()
  return articles.filter(a => a.tagIds.includes(tagId))
}

// 為文章添加標籤
function addTagToArticle(articleId: string, tagId: string): void {
  const article = getArticleById(articleId)
  if (!article.tagIds.includes(tagId)) {
    article.tagIds.push(tagId)
    saveArticle(article)
  }
}

// 從文章移除標籤
function removeTagFromArticle(articleId: string, tagId: string): void {
  const article = getArticleById(articleId)
  article.tagIds = article.tagIds.filter(id => id !== tagId)
  saveArticle(article)
}
```

---

## localStorage 儲存結構

### 儲存鍵值

| Key | 型別 | 說明 |
|-----|------|------|
| `blog:articles` | Article[] | 所有文章陣列 |
| `blog:tags` | Tag[] | 所有標籤陣列 |
| `blog:version` | string | 資料格式版本號（用於未來遷移） |

### 資料範例

```json
{
  "blog:articles": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Nuxt 3 入門教學",
      "content": "# Nuxt 3\n\n這是一篇關於 Nuxt 3 的教學...",
      "createdAt": "2025-11-16T10:30:00.000Z",
      "updatedAt": "2025-11-16T10:30:00.000Z",
      "tagIds": ["tag-uuid-1", "tag-uuid-2"]
    }
  ],
  "blog:tags": [
    {
      "id": "tag-uuid-1",
      "name": "Vue.js",
      "slug": "vue-js",
      "createdAt": "2025-11-16T10:00:00.000Z"
    },
    {
      "id": "tag-uuid-2",
      "name": "Nuxt",
      "slug": "nuxt",
      "createdAt": "2025-11-16T10:00:00.000Z"
    }
  ],
  "blog:version": "1.0.0"
}
```

### 容量估算

- 平均文章大小：~5KB（含 Markdown）
- 平均標籤大小：~200B
- 500 篇文章：~2.5MB
- 50 個標籤：~10KB
- **總計**：~2.51MB（遠低於 localStorage 5MB 限制）

---

## 資料驗證規則

### Article 驗證

```typescript
function validateArticle(article: Partial<Article>): ValidationResult {
  const errors: string[] = []
  
  // 標題驗證（FR-026）
  if (!article.title || article.title.trim().length === 0) {
    errors.push('標題不可為空白')
  }
  if (article.title && article.title.length > 200) {
    errors.push('標題長度不可超過 200 字元')
  }
  
  // 內容驗證
  if (!article.content || article.content.trim().length === 0) {
    errors.push('內容不可為空白')
  }
  if (article.content && article.content.length > 50000) {
    errors.push('內容長度不可超過 50000 字元')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

### Tag 驗證

```typescript
function validateTag(tag: Partial<Tag>): ValidationResult {
  const errors: string[] = []
  
  // 標籤名稱驗證
  if (!tag.name || tag.name.trim().length === 0) {
    errors.push('標籤名稱不可為空白')
  }
  if (tag.name && tag.name.length > 50) {
    errors.push('標籤名稱長度不可超過 50 字元')
  }
  
  // 檢查是否包含非法字元
  const invalidChars = /[<>\/\\]/
  if (tag.name && invalidChars.test(tag.name)) {
    errors.push('標籤名稱包含非法字元')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}
```

---

## 資料遷移策略（未來）

### localStorage → API

當從 localStorage 遷移到後端 API 時：

1. **保持相同的資料結構**：
   - API 回傳相同的 Article 和 Tag 介面
   - 只需修改 useApi composable 實作

2. **遷移工具**：
   ```typescript
   // 匯出 localStorage 資料
   function exportLocalData(): ExportData {
     return {
       articles: getFromLocalStorage('blog:articles'),
       tags: getFromLocalStorage('blog:tags'),
       version: '1.0.0',
       exportedAt: new Date().toISOString()
     }
   }
   
   // 匯入到後端
   async function importToBackend(data: ExportData): Promise<void> {
     await api.post('/import', data)
   }
   ```

3. **混合模式**（過渡期）：
   - 優先讀取 API
   - API 失敗時 fallback 到 localStorage
   - 離線編輯時儲存到 localStorage，連線後同步

---

## 效能考量

### 索引策略

雖然 localStorage 不支援原生索引，但可在記憶體中建立索引：

```typescript
class ArticleIndex {
  private byId: Map<string, Article>
  private byDate: Article[] // 預排序
  
  rebuild(articles: Article[]): void {
    this.byId = new Map(articles.map(a => [a.id, a]))
    this.byDate = [...articles].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
  }
  
  findById(id: string): Article | undefined {
    return this.byId.get(id)
  }
  
  getAllSorted(): Article[] {
    return this.byDate
  }
}
```

### 快取策略

- composables 中快取解析後的 Article 和 Tag
- Markdown 渲染結果快取（避免重複解析）
- 標籤計數快取（避免重複計算）

---

## 總結

此資料模型提供：
- ✅ 清晰的實體定義（Article, Tag）
- ✅ 簡單的多對多關聯（tagIds 陣列）
- ✅ 完整的驗證規則
- ✅ localStorage 儲存策略
- ✅ 未來 API 遷移路徑
- ✅ 效能最佳化考量
