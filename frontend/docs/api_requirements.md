# 前端 API 需求文件

本文件描述了前端應用程式目前所需的 API 接口，基於 `frontend/composables` 中的邏輯分析得出。

## 概觀

前端目前使用 `localStorage` 來模擬後端資料存儲。為了遷移到真實的後端，需要實現以下 RESTful API。

## 資源模型

### 1. 文章 (Article)

```json
{
  "id": "string (UUID)",
  "title": "string",
  "content": "string (Markdown)",
  "createdAt": "string (ISO 8601)",
  "updatedAt": "string (ISO 8601)",
  "tagIds": ["string (UUID)"]
}
```

### 2. 標籤 (Tag)

```json
{
  "id": "string (UUID)",
  "name": "string",
  "slug": "string",
  "createdAt": "string (ISO 8601)"
}
```

## API 接口列表

### 文章管理 (Article Endpoint)

| 方法 | 路徑 | 描述 | 參數/Body | 回傳值 |
|------|------|------|-----------|--------|
| GET | `/api/articles` | 取得文章列表 | - | `Article[]` |
| GET | `/api/articles/:id` | 取得單一文章 | `id`: 文章 ID | `Article` |
| POST | `/api/articles` | 建立新文章 | `CreateArticleInput` | `Article` |
| PUT | `/api/articles/:id` | 更新文章 | `id`: 文章 ID, `UpdateArticleInput` | `Article` |
| DELETE | `/api/articles/:id` | 刪除文章 | `id`: 文章 ID | `void` |

#### 特殊查詢

- **取得文章摘要 (`/api/articles/summary`)**
    - 用於首頁列表，需包含關聯的標籤資料。
    - 回傳結構：
        ```json
        [
          {
            "id": "string",
            "title": "string",
            "excerpt": "string (摘要)",
            "createdAt": "string",
            "tags": [ { "id": "...", "name": "...", "slug": "..." } ]
          }
        ]
        ```

### 標籤管理 (Tag Endpoint)

| 方法 | 路徑 | 描述 | 參數/Body | 回傳值 |
|------|------|------|-----------|--------|
| GET | `/api/tags` | 取得所有標籤 | - | `Tag[]` (按名稱排序) |
| POST | `/api/tags` | 建立新標籤 | `CreateTagInput` | `Tag` |
| DELETE | `/api/tags/:id` | 刪除標籤 | `id`: 標籤 ID | `void` |

#### 特殊查詢

- **取得標籤統計 (`/api/tags/stats`)**
    - 取得包含文章數量的標籤列表。
    - 回傳結構：
        ```json
        [
          {
            "tag": { "id": "...", "name": "...", "slug": "..." },
            "count": 10
          }
        ]
        ```

## 錯誤處理

API 應回傳適當的 HTTP 狀態碼：

- `200 OK`: 請求成功
- `201 Created`: 資源建立成功
- `400 Bad Request`: 輸入資料驗證失敗
- `404 Not Found`: 資源不存在
- `500 Internal Server Error`: 伺服器內部錯誤

## 實作建議

1. **資料驗證**: 後端應重複前端的驗證邏輯（如標題必填、內容長度限制等）。
2. **分頁 (Pagination)**: 目前前端一次載入所有資料，未來若資料量大，建議在 `/api/articles` 加入分頁支援。
3. **關聯查詢**: `/api/articles/summary` 是一個聚合查詢，建議後端使用 JOIN 或類似機制一次取出所需資料，減少前端 N+1 查詢問題。
