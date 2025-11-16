# Composable API 規格：useTag

**用途**：管理標籤（Tag）實體及其與文章的關聯  
**類型**：Vue 3 Composable  
**資料來源**：localStorage（MVP）→ API（未來）

## 公開介面

### 類型定義

```typescript
interface Tag {
  id: string
  name: string
  slug: string
  createdAt: string
}

interface TagWithCount {
  tag: Tag
  count: number
}

interface CreateTagInput {
  name: string
}

interface UseTagReturn {
  // 狀態
  tags: Ref<Tag[]>
  loading: Ref<boolean>
  error: Ref<string | null>
  
  // 方法
  fetchTags: () => Promise<Tag[]>
  getTagById: (id: string) => Tag | null
  getTagBySlug: (slug: string) => Tag | null
  createTag: (input: CreateTagInput) => Promise<Tag>
  deleteTag: (id: string) => Promise<void>
  getTagsWithCount: () => Promise<TagWithCount[]>
  getActiveTagsWithCount: () => Promise<TagWithCount[]>
}
```

## 方法規格

### 1. fetchTags()

**描述**：取得所有標籤列表

**簽名**：
```typescript
fetchTags(): Promise<Tag[]>
```

**行為**：
- 從 localStorage 讀取 `blog:tags`
- 依 `name` 字母排序
- 更新 `tags` ref
- 快取結果

**錯誤處理**：
- localStorage 讀取失敗：回傳空陣列，設定 error
- JSON 解析失敗：回傳空陣列，記錄錯誤

**範例**：
```typescript
const { fetchTags, tags } = useTag()

await fetchTags()
console.log(tags.value) // [Tag, Tag, ...]
```

---

### 2. getTagById(id)

**描述**：依 ID 取得標籤（同步方法）

**簽名**：
```typescript
getTagById(id: string): Tag | null
```

**參數**：
- `id`: 標籤唯一識別碼

**行為**：
- 從 `tags` ref 中尋找
- 若找不到，回傳 null
- **不觸發 API 呼叫**（假設已呼叫 fetchTags）

**範例**：
```typescript
const { getTagById } = useTag()

const tag = getTagById('tag-id')
if (tag) {
  console.log(tag.name)
}
```

---

### 3. getTagBySlug(slug)

**描述**：依 slug 取得標籤（用於 URL 路由）

**簽名**：
```typescript
getTagBySlug(slug: string): Tag | null
```

**參數**：
- `slug`: URL 友善的標籤識別碼（例如：`vue-js`）

**行為**：
- 從 `tags` ref 中尋找符合 slug 的標籤
- 若找不到，回傳 null

**範例**：
```typescript
const { getTagBySlug } = useTag()

const tag = getTagBySlug('nuxt')
if (tag) {
  console.log(tag.name) // "Nuxt"
}
```

---

### 4. createTag(input)

**描述**：建立新標籤

**簽名**：
```typescript
createTag(input: CreateTagInput): Promise<Tag>
```

**參數**：
```typescript
interface CreateTagInput {
  name: string  // 必填，1-50 字元
}
```

**行為**：
1. 驗證標籤名稱
2. 檢查是否已存在相同名稱（不區分大小寫）
3. 生成 UUID v4 作為 `id`
4. 生成 `slug`（將名稱轉為 URL 友善格式）
5. 設定 `createdAt` 為當前時間
6. 儲存到 localStorage
7. 更新 `tags` ref

**Slug 生成規則**：
- 中文轉拼音（例如：「前端」→ `qian-duan`）
- 英文轉小寫
- 空格和特殊字元轉連字號
- 多個連續連字號合併為一個
- 去除首尾連字號

**驗證規則**：
- `name`：非空白，長度 1-50
- 不可包含 `<>\/` 等非法字元
- 不可與現有標籤重複（不區分大小寫）

**錯誤處理**：
- 驗證失敗：拋出 ValidationError
- 標籤已存在：拋出 DuplicateTagError
- localStorage quota 超限：拋出 QuotaExceededError

**範例**：
```typescript
const { createTag } = useTag()

try {
  const tag = await createTag({ name: 'Vue.js' })
  console.log('建立成功:', tag.slug) // "vue-js"
} catch (error) {
  console.error('建立失敗:', error.message)
}
```

---

### 5. deleteTag(id)

**描述**：刪除標籤

**簽名**：
```typescript
deleteTag(id: string): Promise<void>
```

**參數**：
- `id`: 要刪除的標籤 ID

**行為**：
1. 確認標籤存在
2. 檢查是否有文章使用此標籤
3. 若有文章使用，顯示警告（由 UI 層處理）
4. 從 localStorage 移除
5. 更新 `tags` ref
6. **注意**：不會自動移除文章的 tagIds 引用（由 UI 層處理）

**錯誤處理**：
- ID 不存在：拋出 NotFoundError
- localStorage 錯誤：拋出 StorageError

**範例**：
```typescript
const { deleteTag } = useTag()

await deleteTag('tag-id')
console.log('刪除成功')
```

---

### 6. getTagsWithCount()

**描述**：取得所有標籤及其文章數量

**簽名**：
```typescript
getTagsWithCount(): Promise<TagWithCount[]>
```

**行為**：
- 取得所有標籤
- 為每個標籤計算關聯的文章數量
- 回傳 TagWithCount 陣列
- 依文章數量降冪排序

**範例**：
```typescript
const { getTagsWithCount } = useTag()

const tagsWithCount = await getTagsWithCount()
tagsWithCount.forEach(({ tag, count }) => {
  console.log(`${tag.name}: ${count} 篇`)
})
```

---

### 7. getActiveTagsWithCount()

**描述**：取得有文章的標籤及其數量（用於側邊欄，FR-021, FR-023）

**簽名**：
```typescript
getActiveTagsWithCount(): Promise<TagWithCount[]>
```

**行為**：
- 呼叫 `getTagsWithCount()`
- 過濾掉 `count = 0` 的標籤（FR-023）
- 依文章數量降冪排序
- 回傳活躍標籤陣列

**範例**：
```typescript
const { getActiveTagsWithCount } = useTag()

const activeTags = await getActiveTagsWithCount()
// 只包含有文章的標籤
console.log(activeTags) // [{ tag: Tag, count: 5 }, ...]
```

---

## 狀態管理

### Reactive State

```typescript
const tags = ref<Tag[]>([])             // 所有標籤快取
const loading = ref<boolean>(false)     // 載入狀態
const error = ref<string | null>(null)  // 錯誤訊息
```

---

## 錯誤類型

```typescript
class DuplicateTagError extends Error {
  constructor(name: string) {
    super(`標籤已存在: ${name}`)
    this.name = 'DuplicateTagError'
  }
}

class NotFoundError extends Error {
  constructor(id: string) {
    super(`標籤不存在: ${id}`)
    this.name = 'NotFoundError'
  }
}

class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}
```

---

## 實作範例（localStorage 版本）

```typescript
// composables/useTag.ts
import { ref } from 'vue'
import { useApi } from './useApi'
import { slugify } from '~/utils/slugify'

export function useTag() {
  const api = useApi()
  
  const tags = ref<Tag[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  async function fetchTags(): Promise<Tag[]> {
    loading.value = true
    error.value = null
    
    try {
      const data = await api.get('blog:tags')
      tags.value = data.sort((a, b) => a.name.localeCompare(b.name))
      return tags.value
    } catch (e) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }
  
  function getTagById(id: string): Tag | null {
    return tags.value.find(t => t.id === id) || null
  }
  
  function getTagBySlug(slug: string): Tag | null {
    return tags.value.find(t => t.slug === slug) || null
  }
  
  async function createTag(input: CreateTagInput): Promise<Tag> {
    // 驗證
    if (!input.name?.trim()) {
      throw new ValidationError('標籤名稱不可為空白')
    }
    
    // 檢查重複（不區分大小寫）
    const exists = tags.value.some(
      t => t.name.toLowerCase() === input.name.toLowerCase()
    )
    if (exists) {
      throw new DuplicateTagError(input.name)
    }
    
    // 建立標籤
    const tag: Tag = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      slug: slugify(input.name),
      createdAt: new Date().toISOString()
    }
    
    // 儲存
    tags.value.push(tag)
    tags.value.sort((a, b) => a.name.localeCompare(b.name))
    await api.set('blog:tags', tags.value)
    
    return tag
  }
  
  async function getTagsWithCount(): Promise<TagWithCount[]> {
    const articles = await api.get('blog:articles')
    
    return tags.value.map(tag => {
      const count = articles.filter(a => 
        a.tagIds.includes(tag.id)
      ).length
      
      return { tag, count }
    }).sort((a, b) => b.count - a.count)
  }
  
  async function getActiveTagsWithCount(): Promise<TagWithCount[]> {
    const allTags = await getTagsWithCount()
    return allTags.filter(t => t.count > 0)
  }
  
  return {
    tags,
    loading,
    error,
    fetchTags,
    getTagById,
    getTagBySlug,
    createTag,
    deleteTag,
    getTagsWithCount,
    getActiveTagsWithCount
  }
}
```

---

## 輔助工具：slugify

```typescript
// utils/slugify.ts

/**
 * 將標籤名稱轉為 URL 友善的 slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // 中文轉拼音（可使用 pinyin 套件）
    .replace(/[\u4e00-\u9fa5]/g, (char) => {
      // 簡化版：使用現成的拼音庫
      return pinyinConverter(char)
    })
    // 空格和特殊字元轉連字號
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // 去除首尾連字號
    .replace(/^-+|-+$/g, '')
}

// 簡化版實作（MVP 可先用這個）
export function slugifySimple(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}
```

---

## 與 usePost 的整合

### 情境：顯示文章的標籤

```typescript
// 在元件中
const { currentArticle } = usePost()
const { getTagById } = useTag()

const articleTags = computed(() => {
  if (!currentArticle.value) return []
  
  return currentArticle.value.tagIds
    .map(id => getTagById(id))
    .filter(tag => tag !== null)
})
```

### 情境：側邊欄顯示標籤

```typescript
// components/TagSidebar.vue
<script setup>
const { getActiveTagsWithCount } = useTag()

const activeTags = ref<TagWithCount[]>([])

onMounted(async () => {
  activeTags.value = await getActiveTagsWithCount()
})
</script>

<template>
  <aside>
    <h3>分類</h3>
    <ul>
      <li v-for="{ tag, count } in activeTags" :key="tag.id">
        <NuxtLink :to="`/tags/${tag.slug}`">
          {{ tag.name }} ({{ count }})
        </NuxtLink>
      </li>
    </ul>
  </aside>
</template>
```

---

## 未來 API 遷移

當遷移到後端 API 時，只需修改內部實作：

```typescript
// 未來的 API 版本
async function fetchTags(): Promise<Tag[]> {
  loading.value = true
  error.value = null
  
  try {
    const data = await api.get('/api/tags')  // HTTP 呼叫
    tags.value = data
    return tags.value
  } catch (e) {
    error.value = e.message
    return []
  } finally {
    loading.value = false
  }
}

async function getTagsWithCount(): Promise<TagWithCount[]> {
  // 後端已計算好數量
  const data = await api.get('/api/tags/with-count')
  return data
}
```

---

## 測試範例

```typescript
// tests/composables/useTag.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { useTag } from '~/composables/useTag'

describe('useTag', () => {
  beforeEach(() => {
    localStorage.clear()
  })
  
  it('應該建立新標籤', async () => {
    const { createTag, getTagById } = useTag()
    
    const tag = await createTag({ name: 'Vue.js' })
    
    expect(tag.id).toBeDefined()
    expect(tag.name).toBe('Vue.js')
    expect(tag.slug).toBe('vue-js')
  })
  
  it('應該防止重複標籤', async () => {
    const { createTag } = useTag()
    
    await createTag({ name: 'Vue.js' })
    
    await expect(
      createTag({ name: 'vue.js' })  // 不區分大小寫
    ).rejects.toThrow('標籤已存在')
  })
  
  it('應該只回傳有文章的標籤', async () => {
    const { createTag, getActiveTagsWithCount } = useTag()
    const { createArticle } = usePost()
    
    const tag1 = await createTag({ name: '有文章' })
    const tag2 = await createTag({ name: '無文章' })
    
    await createArticle({
      title: '測試',
      content: '內容',
      tagIds: [tag1.id]
    })
    
    const activeTags = await getActiveTagsWithCount()
    
    expect(activeTags).toHaveLength(1)
    expect(activeTags[0].tag.name).toBe('有文章')
  })
})
```

---

## 效能考量

### 快取策略
- 標籤清單通常較小（< 100 個），可完整快取
- `getTagById` 是同步操作，避免不必要的 async
- 標籤計數快取一定時間（例如 30 秒）

### 最佳化
- 標籤名稱搜尋使用索引（Map）
- 批次操作：一次取得所有標籤，避免多次呼叫

---

## 總結

`useTag` composable 提供：
- ✅ 完整的標籤 CRUD 操作
- ✅ 標籤與文章關聯查詢
- ✅ 側邊欄所需的計數功能
- ✅ URL 友善的 slug 生成
- ✅ 清晰的錯誤處理
- ✅ 未來 API 遷移路徑
