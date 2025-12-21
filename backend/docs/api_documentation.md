# Backend API Documentation

本文件描述後端提供的 RESTful API 接口。

## Base URL
`/api`

## 資源模型

### Article (文章)
```json
{
  "id": "UUID (string)",
  "title": "文章標題 (string)",
  "content": "文章內容 Markdown (string)",
  "tagIds": ["UUID (string)"],
  "createdAt": "2024-12-21 10:00:00 (string)",
  "updatedAt": "2024-12-21 10:00:00 (string)"
}
```

### Tag (標籤)
```json
{
  "id": "UUID (string)",
  "name": "標籤名稱 (string)",
  "slug": "tag-slug (string)",
  "createdAt": "2024-12-21 10:00:00 (string)"
}
```

---

## Endpoints

### 1. Articles (文章)

#### 取得文章摘要列表
包含文章基本資訊與關聯的標籤，適合用於首頁列表。

- **Method:** `GET`
- **Path:** `/articles/summary`
- **Response:** `200 OK`
```json
[
  {
    "id": "uuid...",
    "title": "測試文章",
    "excerpt": "文章摘要...",
    "createdAt": "2024-12-21 10:00:00",
    "tags": [
      {
        "id": "uuid...",
        "name": "技術",
        "slug": "technology"
      }
    ]
  }
]
```

#### 取得所有文章
取得完整文章列表。

- **Method:** `GET`
- **Path:** `/articles`
- **Response:** `200 OK`
```json
[
  {
    "id": "uuid...",
    "title": "測試文章",
    "content": "完整內容...",
    "tagIds": ["uuid..."],
    "createdAt": "2024-12-21 10:00:00",
    "updatedAt": "2024-12-21 10:00:00"
  }
]
```

#### 取得單一文章
- **Method:** `GET`
- **Path:** `/articles/:id`
- **Response:** `200 OK`
```json
{
  "id": "uuid...",
  "title": "測試文章",
  "content": "完整內容...",
  "tagIds": ["uuid..."],
  "createdAt": "2024-12-21 10:00:00",
  "updatedAt": "2024-12-21 10:00:00"
}
```

#### 建立文章
- **Method:** `POST`
- **Path:** `/articles`
- **Body:**
```json
{
  "title": "新文章標題",
  "content": "文章與內容...",
  "tagIds": ["uuid-of-tag-1", "uuid-of-tag-2"] // Optional
}
```
- **Response:** `201 Created`

#### 更新文章
- **Method:** `PUT`
- **Path:** `/articles/:id`
- **Body:** (所有欄位皆為 Optional)
```json
{
  "title": "更新標題",
  "content": "更新內容...",
  "tagIds": [] 
}
```
- **Response:** `200 OK`

#### 刪除文章
- **Method:** `DELETE`
- **Path:** `/articles/:id`
- **Response:** `200 OK`
```json
{
  "message": "文章已刪除"
}
```

---

### 2. Tags (標籤)

#### 取得標籤列表
- **Method:** `GET`
- **Path:** `/tags`
- **Response:** `200 OK`
```json
[
  {
    "id": "uuid...",
    "name": "技術",
    "slug": "technology",
    "createdAt": "2024-12-21 10:00:00"
  }
]
```

#### 取得標籤統計
取得標籤列表及其關聯的文章數量。

- **Method:** `GET`
- **Path:** `/tags/stats`
- **Response:** `200 OK`
```json
[
  {
    "tag": {
      "id": "uuid...",
      "name": "技術",
      "slug": "technology"
    },
    "count": 5
  }
]
```

#### 建立標籤
- **Method:** `POST`
- **Path:** `/tags`
- **Body:**
```json
{
  "name": "新標籤"
}
```
- **Response:** `201 Created`
- **Error:** `400 Bad Request` (如果標籤已存在)

#### 刪除標籤
- **Method:** `DELETE`
- **Path:** `/tags/:id`
- **Response:** `200 OK`
```json
{
  "message": "標籤已刪除"
}
```
