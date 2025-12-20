# 實作計畫：部落格文章管理系統

**分支**：`001-blog-crud` | **日期**：2025-11-16 | **規格**：[spec.md](./spec.md)  
**輸入**：功能規格來自 `/specs/001-blog-crud/spec.md`

**注意**：本文件由 `/speckit.plan` 指令填寫。請參閱 `.specify/templates/commands/plan.md` 了解執行工作流程。

## 摘要

**主要需求**：建立部落格文章管理系統，支援以 Markdown 格式進行文章的 CRUD 操作、多標籤分類、按日期排序的文章列表，以及提供標籤側邊欄進行主題式瀏覽。

**技術方法**：
- **前端框架**：Nuxt 3（支援 SSR/SSG、Vue 3 Composition API、檔案系統路由）
- **MVP 資料儲存**：localStorage（5-10MB 容量，足夠 500 篇文章）
- **架構模式**：Entity 化設計，使用 Composables（useApi、usePost、useTag）進行三層架構（UI → Business Logic → Data Access）
- **Markdown 處理**：marked（輕量解析）+ DOMPurify（XSS 防護）
- **UI 框架**：Tailwind CSS（工具優先、響應式設計）
- **遷移路徑**：useApi 提供抽象層，未來可無縫遷移至後端 API（Node.js + PostgreSQL / Supabase）

## 技術環境

**語言/版本**：Node.js >= 18.0.0, TypeScript 5.x  
**主要相依套件**：
- **Nuxt 3** (latest stable)：前端框架（SSR/SSG、檔案系統路由）
- **Vue 3**：UI 框架（Composition API）
- **Tailwind CSS**：樣式框架（工具優先、響應式）
- **marked**：Markdown 解析器（~10KB gzipped）
- **DOMPurify**：XSS 防護庫
- **Vitest**：單元測試框架
- **ESLint + Prettier**：程式碼品質工具

**資料儲存**：
- **MVP 階段**：localStorage（瀏覽器端，5-10MB 容量）
- **未來階段**：後端 API（Node.js + PostgreSQL 或 Supabase/Firebase）

**測試**：Vitest（單元測試）+ Playwright（E2E 測試，可選）  
**目標平台**：現代網頁瀏覽器（Chrome、Firefox、Safari、Edge 最近 2 個版本）  
**專案類型**：Web 應用程式（單一 Nuxt 專案）

**效能目標**（依據憲章原則四與 Success Criteria）：
- **頁面載入時間**：初始載入 < 3s，LCP < 2.5s（SC-001）
- **互動延遲**：文章切換 < 1s（SC-002）
- **Bundle 大小**：JS < 200KB (gzipped), CSS < 50KB (gzipped)
- **Core Web Vitals**：LCP < 2.5s, FID < 100ms, CLS < 0.1

**限制與約束**（依據憲章與規格）：
- **憲章要求**：
  - 測試覆蓋率 ≥ 80%（關鍵路徑）
  - WCAG 2.1 Level AA 無障礙標準
  - 響應式設計支援（320px+、768px+、1024px+）
  - 所有文件使用繁體中文（zh-TW）
- **技術限制**：
  - localStorage 容量：5-10MB（足夠 500 篇文章，每篇平均 5KB，SC-004）
  - 無跨裝置同步（MVP 階段可接受）
  - 無多人協作（假設：最後儲存者覆蓋）

**規模/範圍**：
- **目標容量**：500 篇文章（~2.5MB localStorage，SC-004）
- **頁面數量**：~6 個主要頁面（首頁、文章檢視、新增/編輯、標籤篩選）
- **元件數量**：~10-15 個 Vue 元件
- **Composables**：3 個核心 composables（useApi、usePost、useTag）

## 憲章檢查

*關卡：必須在 Phase 0 研究前通過。Phase 1 設計後重新檢查。*

### 初次檢查（Phase 0 前）

| 原則 | 檢查項目 | 狀態 | 說明 |
|------|---------|------|------|
| **一、程式碼品質標準** | 是否規劃程式碼檢查與格式化？ | ✅ 通過 | 已規劃 ESLint + Prettier |
| | 是否採用可維護的架構？ | ✅ 通過 | Entity 化 Composables 架構，關注點分離 |
| **二、測試標準** | 是否規劃測試策略？ | ✅ 通過 | Vitest 單元測試，目標 80% 覆蓋率 |
| | 測試類型是否完整？ | ✅ 通過 | 單元測試（composables、utils）+ 元件測試 |
| **三、使用者體驗一致性** | 是否考慮響應式設計？ | ✅ 通過 | Tailwind CSS，支援 320px+、768px+、1024px+ |
| | 是否考慮無障礙性？ | ✅ 通過 | 語義化 HTML、鍵盤導航、螢幕閱讀器相容性（WCAG 2.1 AA） |
| **四、效能要求** | 是否設定效能目標？ | ✅ 通過 | LCP < 2.5s, JS < 200KB, CSS < 50KB, 3s 載入 |
| | 是否規劃最佳化策略？ | ✅ 通過 | Markdown 快取、SSG 靜態生成、Tailwind PurgeCSS |
| **五、文件語言標準** | 所有文件是否使用繁體中文？ | ✅ 通過 | spec.md、plan.md、research.md、contracts/ 均使用 zh-TW |

**初次檢查結果**：✅ **全部通過**，可進入 Phase 0 研究

---

### 重新檢查（Phase 1 設計後）

| 原則 | 檢查項目 | 狀態 | 說明 |
|------|---------|------|------|
| **一、程式碼品質標準** | 架構設計是否清晰且可維護？ | ✅ 通過 | 三層架構（UI → usePost/useTag → useApi → Storage）<br>單一職責原則，每個 composable 專注於一個實體 |
| | 是否有程式碼審查機制？ | ✅ 通過 | 規劃 PR 審查流程（見 tasks.md 將生成） |
| **二、測試標準** | 測試策略是否具體？ | ✅ 通過 | 已規劃測試範例（見 contracts/*.md）<br>usePost/useTag/useApi 各有獨立測試 |
| | 關鍵路徑是否有測試覆蓋？ | ✅ 通過 | CRUD 操作、Markdown 渲染、標籤篩選均有測試規劃 |
| **三、使用者體驗一致性** | UI 元件是否遵循設計系統？ | ✅ 通過 | Tailwind 工具類，一致的間距、排版、顏色 |
| | 是否有無障礙性實作指引？ | ✅ 通過 | 語義化標籤（`<article>`、`<nav>`、`<main>`）<br>ARIA 屬性、鍵盤導航支援 |
| | 響應式設計是否具體？ | ✅ 通過 | Tailwind 響應式斷點（sm:、md:、lg:） |
| **四、效能要求** | 是否有效能預算？ | ✅ 通過 | JS < 200KB, CSS < 50KB, LCP < 2.5s |
| | 是否有效能監控計畫？ | ✅ 通過 | Lighthouse CI、useStorageMonitor（localStorage 使用率） |
| **五、文件語言標準** | 所有設計文件是否使用繁體中文？ | ✅ 通過 | data-model.md、quickstart.md、contracts/*.md 均使用 zh-TW |

**重新檢查結果**：✅ **全部通過**，可進入 Phase 2 任務分解

---

### 潛在風險與緩解策略

| 風險 | 影響 | 機率 | 緩解措施 |
|------|------|------|----------|
| localStorage 容量不足 | 使用者無法新增文章 | 低 | 1. 實作 useStorageMonitor 監控使用率<br>2. 達 80% 時顯示警告<br>3. 提供匯出/清除功能 |
| Markdown XSS 攻擊 | 資安漏洞 | 中 | 1. 使用 DOMPurify 清理所有渲染的 HTML<br>2. 設定白名單標籤<br>3. 安全性測試 |
| 效能不符預期 | 使用者體驗差 | 低 | 1. 實作 Markdown 渲染快取<br>2. SSG 靜態生成<br>3. Lighthouse CI 持續監控 |
| 無障礙性不足 | 部分使用者無法使用 | 中 | 1. 語義化 HTML<br>2. ARIA 屬性<br>3. 鍵盤導航測試 |
| API 遷移困難 | 技術債累積 | 低 | 1. useApi 抽象層設計<br>2. 保持介面一致性<br>3. 提供資料遷移工具 |

## 專案結構

### 文件結構（本功能）

```text
specs/001-blog-crud/
├── spec.md              # ✅ 功能規格（/speckit.specify 指令輸出）
├── plan.md              # ✅ 本文件（/speckit.plan 指令輸出）
├── research.md          # ✅ Phase 0 研究文件（/speckit.plan 指令）
├── data-model.md        # ✅ Phase 1 資料模型（/speckit.plan 指令）
├── quickstart.md        # ✅ Phase 1 快速開始指南（/speckit.plan 指令）
├── contracts/           # ✅ Phase 1 API 合約（/speckit.plan 指令）
│   ├── useApi.md        # useApi composable 規格
│   ├── usePost.md       # usePost composable 規格
│   └── useTag.md        # useTag composable 規格
├── checklists/          # 品質檢查清單
│   └── requirements.md  # 需求完整性檢查
└── tasks.md             # ⏳ Phase 2 任務分解（/speckit.tasks 指令 - 尚未建立）
```

### 原始碼結構（專案根目錄）

**結構決策**：採用 **Nuxt 3 單一專案結構**（Web 應用程式），因為這是前端驅動的部落格系統，MVP 階段無需後端，符合 Nuxt 的 Convention-over-Configuration 哲學。

```text
try.blog/                           # 專案根目錄
│
├── .specify/                       # 🔧 開發規範與工具
│   ├── memory/
│   │   └── constitution.md         # 專案憲章
│   ├── scripts/
│   │   └── bash/
│   │       ├── setup-plan.sh       # 計畫設置腳本
│   │       └── update-agent-context.sh  # 更新 AI 代理環境腳本
│   └── templates/                  # 文件範本
│
├── specs/                          # 📋 功能規格（見上方）
│   └── 001-blog-crud/
│
├── composables/                    # 🧩 Vue 3 Composables（Business Logic + Data Access）
│   ├── useApi.ts                   # 資料存取抽象層（localStorage ↔ API）
│   ├── usePost.ts                  # 文章實體管理（CRUD）
│   └── useTag.ts                   # 標籤實體管理
│
├── components/                     # 🎨 Vue 元件（UI 層）
│   ├── ArticleEditor.vue           # 文章編輯器（Markdown 輸入）
│   ├── ArticleList.vue             # 文章列表（含排序）
│   ├── ArticleCard.vue             # 文章卡片（列表項目）
│   ├── ArticleViewer.vue           # 文章檢視器（Markdown 渲染）
│   ├── TagInput.vue                # 標籤輸入元件
│   ├── TagSidebar.vue              # 標籤側邊欄（含計數）
│   └── ConfirmDialog.vue           # 確認對話框（刪除文章）
│
├── pages/                          # 📄 Nuxt 路由頁面（檔案系統路由）
│   ├── index.vue                   # 首頁：文章列表（按日期排序）
│   ├── posts/
│   │   ├── [id].vue                # 文章檢視頁（動態路由）
│   │   ├── new.vue                 # 新增文章頁
│   │   └── [id]/
│   │       └── edit.vue            # 編輯文章頁（巢狀動態路由）
│   └── tags/
│       └── [slug].vue              # 標籤篩選頁（動態路由）
│
├── layouts/                        # 🖼️ Nuxt 版面配置
│   └── default.vue                 # 預設版面（含 TagSidebar）
│
├── types/                          # 📐 TypeScript 類型定義
│   ├── article.ts                  # Article, CreateArticleInput, UpdateArticleInput
│   ├── tag.ts                      # Tag, TagWithCount, CreateTagInput
│   └── api.ts                      # UseApiReturn, 錯誤類型
│
├── utils/                          # 🛠️ 工具函式
│   ├── validation.ts               # 資料驗證（validateArticle, validateTag）
│   ├── slugify.ts                  # Slug 生成（中文轉拼音）
│   ├── markdown.ts                 # Markdown 渲染（marked + DOMPurify）
│   └── storage.ts                  # localStorage 輔助函式
│
├── tests/                          # 🧪 測試檔案（Vitest）
│   ├── composables/
│   │   ├── useApi.spec.ts
│   │   ├── usePost.spec.ts
│   │   └── useTag.spec.ts
│   ├── components/
│   │   ├── ArticleEditor.spec.ts
│   │   └── TagSidebar.spec.ts
│   └── utils/
│       ├── validation.spec.ts
│       └── slugify.spec.ts
│
├── public/                         # 🌍 靜態資源
│   └── favicon.ico
│
├── nuxt.config.ts                  # ⚙️ Nuxt 設定
├── tailwind.config.ts              # 🎨 Tailwind CSS 設定
├── tsconfig.json                   # 📘 TypeScript 設定
├── vitest.config.ts                # 🧪 Vitest 設定
├── .eslintrc.cjs                   # 📏 ESLint 設定
├── .prettierrc                     # ✨ Prettier 設定
├── package.json                    # 📦 專案相依套件
└── pnpm-lock.yaml                  # 🔒 套件版本鎖定
```

**關鍵目錄說明**：

1. **`composables/`**（3 個檔案）：
   - 核心業務邏輯層
   - 實作 Entity 化架構
   - 提供反應式狀態管理

2. **`components/`**（7 個元件）：
   - UI 呈現層
   - 可重用的 Vue 元件
   - 無直接資料存取（透過 composables）

3. **`pages/`**（6 個頁面）：
   - Nuxt 檔案系統路由
   - 對應使用者故事的頁面
   - 組合 components 與 composables

4. **`types/`**（3 個檔案）：
   - TypeScript 型別定義
   - 確保型別安全
   - 對應 data-model.md 的實體

5. **`tests/`**（目標 80% 覆蓋率）：
   - 單元測試：composables、utils
   - 元件測試：關鍵 UI 元件
   - 整合測試：資料流測試

**架構分層**：
```
┌─────────────────────────────────────┐
│  UI 層（pages/ + components/）       │  使用者介面
├─────────────────────────────────────┤
│  Business Logic（usePost, useTag）  │  業務邏輯
├─────────────────────────────────────┤
│  Data Access（useApi）               │  資料存取抽象
├─────────────────────────────────────┤
│  Storage（localStorage → API）       │  資料儲存
└─────────────────────────────────────┘
```

## 複雜度追蹤

> **僅在憲章檢查有違規且需要說明時填寫**

**狀態**：✅ **無違規項目**

本實作計畫完全符合專案憲章的所有五項核心原則，無需複雜度說明。

---

## Phase 0 產出：研究文件

✅ **已完成**：`research.md`

**關鍵決策**：
- **框架**：Nuxt 3（SSR/SSG、Vue 3、TypeScript 支援）
- **儲存**：localStorage（MVP）→ API（未來）
- **Markdown**：marked + DOMPurify（效能 + 安全性）
- **架構**：Entity 化 Composables（三層分離）
- **UI**：Tailwind CSS（工具優先、響應式）

---

## Phase 1 產出：設計文件

✅ **已完成**：

1. **`data-model.md`**：
   - Article 實體（id, title, content, createdAt, updatedAt, tagIds）
   - Tag 實體（id, name, slug, createdAt）
   - localStorage 儲存結構
   - 驗證規則與容量估算

2. **`contracts/useApi.md`**：
   - 抽象資料存取介面（get、set、remove、clear、isAvailable）
   - localStorage 實作（MVP）
   - 未來 API 實作規格
   - 混合模式（過渡期）
   - 資料遷移工具

3. **`contracts/usePost.md`**：
   - 文章管理 API（7 個方法）
   - 反應式狀態（articles、currentArticle、loading、error）
   - 錯誤處理（4 種錯誤類型）
   - 實作範例與測試

4. **`contracts/useTag.md`**：
   - 標籤管理 API（7 個方法）
   - Slug 生成策略（中文 → 拼音）
   - 標籤計數與篩選
   - 實作範例與測試

5. **`quickstart.md`**：
   - 開發環境設置指南
   - 功能驗證步驟（6 個測試場景）
   - 常見問題排解
   - 效能驗證與 localStorage 管理

---

## Phase 2：任務分解

⏳ **待執行**：執行 `/speckit.tasks` 指令生成 `tasks.md`

該指令將根據本計畫文件生成具體的實作任務，包含：
- 任務優先級與相依性
- 預估工時
- 驗收條件
- 測試要求

---

## 下一步行動

1. ✅ **憲章檢查通過**：所有原則符合，無違規項目
2. ✅ **Phase 0 完成**：技術研究文件已產出
3. ✅ **Phase 1 完成**：資料模型、API 合約、快速開始指南已產出
4. ⏳ **執行 Agent Context 更新**：
   ```bash
   .specify/scripts/bash/update-agent-context.sh copilot
   ```
5. ⏳ **執行任務分解**：
   ```bash
   # 執行 speckit.tasks 指令
   ```
6. ⏳ **開始實作**：依據 `tasks.md` 順序進行開發

---

## 附錄：關鍵決策記錄

### 決策 1：為何選擇 localStorage 作為 MVP 儲存？

**理由**：
- 快速原型開發，無需後端設定
- 零伺服器成本
- 容量足夠（5-10MB 可存 500 篇文章）
- useApi 抽象層讓未來遷移簡單

**權衡**：
- 無跨裝置同步（MVP 可接受）
- 無多人協作（符合假設）

### 決策 2：為何採用 Entity 化 Composables 架構？

**理由**：
- 符合使用者需求（「撰寫方法幫我用entity化的方式」）
- 關注點分離（UI、邏輯、資料存取）
- 易於測試（每層獨立測試）
- 易於遷移（只需修改 useApi）

**替代方案**：
- Vuex/Pinia 狀態管理：過度設計，MVP 不需要
- 直接在元件中操作 localStorage：難以測試和遷移

### 決策 3：為何使用 marked + DOMPurify？

**理由**：
- marked 輕量（~10KB）且高效
- DOMPurify 是業界標準的 XSS 防護
- 符合效能預算（JS < 200KB）

**替代方案**：
- markdown-it：功能更多但體積大（~30KB）
- remark/rehype：學習曲線陡峭

---

**計畫結束**。執行 `/speckit.tasks` 指令進入 Phase 2 任務分解。
````
