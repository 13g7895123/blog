# 研究文件：部落格文章管理系統

**功能**：部落格 CRUD 系統（Nuxt 3 + localStorage MVP）  
**日期**：2025-11-16

## 技術決策

### 1. 前端框架：Nuxt 3

**決策**：使用 Nuxt 3 作為主要前端框架

**理由**：
- **SSR/SSG 支援**：Nuxt 3 提供服務端渲染和靜態生成能力，有利於 SEO 和效能
- **Vue 3 Composition API**：完美支援 composables 模式，符合專案要求的 entity 化架構
- **檔案系統路由**：自動路由生成，簡化頁面管理
- **內建 TypeScript 支援**：提升程式碼品質和開發體驗
- **生態系統成熟**：豐富的模組和社群支援

**考慮的替代方案**：
- Next.js：React 生態系統，但團隊熟悉 Vue
- SvelteKit：較新且輕量，但生態系統較小
- 純 Vue 3 SPA：缺少 SSR/SSG，SEO 較差

### 2. Markdown 處理：marked + DOMPurify

**決策**：使用 `marked` 進行 Markdown 渲染，`DOMPurify` 進行 XSS 防護

**理由**：
- **marked**：
  - 輕量（~10KB gzipped）
  - 高效能（符合 SC-002 的 2 秒載入要求）
  - 支援所有標準 Markdown 語法（FR-009）
  - 可自定義渲染器
- **DOMPurify**：
  - 業界標準的 XSS 防護庫（滿足 FR-010、SC-015、SC-016）
  - 與 marked 搭配良好
  - 支援白名單配置

**考慮的替代方案**：
- markdown-it：功能更豐富但體積較大（~30KB）
- remark/rehype：更模組化但學習曲線陡峭
- showdown：較舊且效能較差

### 3. MVP 資料儲存：localStorage

**決策**：MVP 階段使用 localStorage 儲存文章和標籤資料

**理由**：
- **快速原型開發**：無需後端設定，立即可用
- **零伺服器成本**：適合 MVP 階段驗證概念
- **簡單的資料存取**：JSON 序列化/反序列化即可
- **易於遷移**：抽象層（usePost composable）使未來遷移到 API 變得簡單

**限制與權衡**：
- 容量限制：~5-10MB（足夠存 500 篇文章，符合 SC-004）
- 無法跨裝置同步：MVP 階段可接受
- 無法多人協作：符合假設（最後儲存者覆蓋）

**未來遷移路徑**：
- Phase 2：useApi composable 替換 localStorage 呼叫
- 保持相同的介面（usePost API 不變）
- 後端選項：Node.js + PostgreSQL / Supabase / Firebase

### 4. Entity 化架構：Composables Pattern

**決策**：使用 Vue 3 Composables 實作 entity 化資料存取層

**架構層次**：
```
UI 層（Pages/Components）
    ↓
Business Logic 層（usePost, useTag composables）
    ↓
Data Access 層（useApi composable）
    ↓
Storage 層（localStorage → 未來替換為 API）
```

**核心 Composables**：

1. **useApi**：
   - 抽象的資料存取介面
   - MVP：實作 localStorage 讀寫
   - 未來：實作 HTTP API 呼叫
   - 提供統一的錯誤處理

2. **usePost**：
   - 文章 entity 的 CRUD 操作
   - 方法：`fetchPosts()`, `getPost(id)`, `createPost()`, `updatePost()`, `deletePost()`
   - 內部使用 useApi
   - 管理文章狀態和快取

3. **useTag**：
   - 標籤 entity 的管理
   - 方法：`fetchTags()`, `getTagWithCount()`, `getPostsByTag()`
   - 自動計算標籤文章數量（FR-022）

**理由**：
- **關注點分離**：UI 不直接接觸資料儲存
- **易於測試**：每層可獨立測試
- **易於遷移**：只需修改 useApi 實作
- **可重用性**：composables 可在多個元件中使用

### 5. UI 框架：Tailwind CSS

**決策**：使用 Tailwind CSS 進行樣式設計

**理由**：
- **開發速度快**：utility-first 方法加速開發
- **效能最佳化**：PurgeCSS 移除未使用的樣式（符合 SC-001 的套件大小限制）
- **響應式設計**：內建斷點系統（滿足 SC-013）
- **無障礙性**：可配合使用語義化 HTML（符合 SC-012）
- **Nuxt 整合良好**：官方模組 `@nuxtjs/tailwindcss`

**考慮的替代方案**：
- UnoCSS：更快但生態系統較小
- Bootstrap：體積較大且客製化較難
- 純 CSS：開發速度慢

### 6. 程式碼品質工具

**決策**：
- **ESLint**：程式碼檢查（符合憲章：程式碼檢查與格式化）
- **Prettier**：程式碼格式化
- **TypeScript**：型別安全
- **Vitest**：單元測試（符合憲章：測試標準）

**理由**：
- 強制執行程式碼品質標準
- 自動化格式化，減少爭議
- 型別安全防止執行時錯誤
- 符合憲章的程式碼品質和測試要求

### 7. 日期處理：原生 Date + Intl API

**決策**：使用原生 JavaScript Date 物件和 Intl.DateTimeFormat API

**理由**：
- **零依賴**：無需額外套件
- **現代瀏覽器支援**：2025 年全面支援
- **本地化支援**：Intl API 支援繁體中文格式化
- **精確度**：滿足 SC-010（精確到秒）

**考慮的替代方案**：
- date-fns：增加套件大小
- moment.js：已棄用且體積龐大
- dayjs：輕量但非必要

## 效能最佳化策略

### 1. Lazy Loading
- 頁面層級的程式碼分割（Nuxt 自動處理）
- Markdown 渲染器按需載入
- 圖片 lazy loading（FR-009 圖片支援）

### 2. 快取策略
- Composables 中實作記憶體快取
- localStorage 作為持久化快取
- 避免重複解析 Markdown

### 3. 效能預算
- JavaScript Bundle：< 200KB gzipped（SC-001）
- CSS：< 50KB gzipped（憲章要求）
- 首次載入：< 3 秒（SC-001）
- Markdown 渲染：< 500ms（貢獻到 SC-002 的 2 秒）

## 安全性考量

### 1. XSS 防護
- DOMPurify 清理 Markdown 渲染輸出（FR-010）
- Content Security Policy headers
- 輸入驗證：標題、內容、標籤名稱

### 2. 資料驗證
- 標題：非空白（FR-026）
- 標籤名稱：長度 ≤ 50 字元，允許空格和標點
- Markdown 內容：清理惡意腳本標籤

### 3. localStorage 安全
- 不儲存敏感資訊（MVP 無使用者認證）
- 資料結構化驗證（防止注入）
- 錯誤處理（quota 超限）

## 無障礙性策略

### 1. 語義化 HTML
- 使用正確的 HTML5 語義標籤
- 標題層級正確（h1-h6）
- ARIA labels 和 roles

### 2. 鍵盤導航
- 所有互動元素可用鍵盤操作
- 合理的 tab 順序
- 焦點指示器清晰

### 3. 螢幕閱讀器
- alt text 用於圖片
- aria-label 用於按鈕和連結
- 適當的 ARIA 屬性

## 開發工具鏈

### 1. 本地開發
- Nuxt Dev Server：HMR 和快速重新載入
- Vite：快速建置工具
- TypeScript：即時型別檢查

### 2. 建置與部署
- `nuxt generate`：靜態網站生成（可部署到任何靜態主機）
- Vercel/Netlify：一鍵部署（推薦）
- 建置時間目標：< 2 分鐘（遠優於憲章的 5 分鐘）

### 3. 測試環境
- Vitest：單元測試和 composables 測試
- @nuxt/test-utils：Nuxt 特定測試工具
- Playwright（未來）：E2E 測試

## 資料遷移計畫（localStorage → API）

### Phase 1: MVP（當前）
```typescript
// useApi.ts (localStorage 實作)
export const useApi = () => {
  const storage = useLocalStorage()
  
  return {
    get: (key) => storage.getItem(key),
    set: (key, value) => storage.setItem(key, value),
    // ...
  }
}
```

### Phase 2: API 遷移（未來）
```typescript
// useApi.ts (HTTP API 實作)
export const useApi = () => {
  const { $fetch } = useNuxtApp()
  
  return {
    get: (endpoint) => $fetch(endpoint),
    post: (endpoint, data) => $fetch(endpoint, { method: 'POST', body: data }),
    // ...
  }
}
```

**關鍵**：usePost 和 useTag 的介面保持不變，只需替換 useApi 實作。

## 未解決的技術問題

✅ **所有技術決策已明確** - 無 NEEDS CLARIFICATION

## 風險與緩解

### 風險 1：localStorage 容量限制
- **緩解**：監控使用量，超過 80% 時警告使用者
- **備案**：實作資料匯出功能

### 風險 2：Markdown 渲染效能
- **緩解**：實作渲染快取，避免重複解析
- **備案**：使用 Web Worker 進行背景渲染

### 風險 3：瀏覽器相容性
- **緩解**：設定 browserslist，Vite 自動轉譯
- **目標**：支援最近 2 個版本的主流瀏覽器

## 總結

此技術堆疊提供：
- ✅ 快速的 MVP 開發路徑（localStorage）
- ✅ 清晰的架構（Composables + Entity 模式）
- ✅ 易於遷移到後端 API
- ✅ 符合所有憲章要求（效能、安全性、無障礙性）
- ✅ 現代化的開發體驗（Nuxt 3 + TypeScript + Vite）
