# 任務清單：部落格文章管理系統

**輸入**：設計文件來自 `/specs/001-blog-crud/`  
**前置條件**：plan.md（必要）、spec.md（使用者故事）、research.md、data-model.md、contracts/

**測試**：本專案不包含測試任務（規格未要求 TDD，測試將在實作完成後補充）

**組織方式**：任務按使用者故事分組，每個故事可獨立實作和測試

## 任務格式：`- [ ] [ID] [P?] [Story?] 描述`

- **[P]**：可平行執行（不同檔案，無相依性）
- **[Story]**：所屬使用者故事（例如 US1、US2、US3）
- 描述中包含確切的檔案路徑

## 路徑規範

根據 plan.md，本專案採用 **Nuxt 3 單一專案結構**：
- **Composables**: `composables/`
- **元件**: `components/`
- **頁面**: `pages/`
- **型別**: `types/`
- **工具**: `utils/`
- **測試**: `tests/`

---

## Phase 1：專案設置（共享基礎設施）

**目的**：專案初始化與基本結構建立

- [X] T001 根據 plan.md 建立專案目錄結構（composables/, components/, pages/, types/, utils/, tests/）
- [X] T002 初始化 Nuxt 3 專案並安裝核心相依套件（Vue 3, TypeScript, Tailwind CSS, marked, DOMPurify, Vitest, ESLint, Prettier）
- [X] T003 [P] 設定 ESLint 與 Prettier 規則（eslint.config.mjs, .prettierrc）
- [X] T004 [P] 設定 Tailwind CSS（tailwind.config.ts，定義顏色、字型、間距）
- [X] T005 [P] 設定 TypeScript（tsconfig.json，嚴格模式、路徑別名）
- [X] T006 [P] 設定 Vitest（vitest.config.ts，Vue 元件測試支援）
- [X] T007 [P] 建立 Nuxt 設定檔（nuxt.config.ts，模組、Tailwind、TypeScript、開發伺服器）

**檢查點**：✅ 專案結構與工具鏈設置完成，可開始開發

---

## Phase 2：基礎層（阻塞性前置作業）

**目的**：核心基礎設施，**必須完成**才能開始任何使用者故事的實作

**⚠️ 關鍵**：在此階段完成前，無法開始使用者故事工作

### 型別定義（Data Access Layer 基礎）

- [X] T008 [P] 建立 Article 型別定義在 types/article.ts（Article, CreateArticleInput, UpdateArticleInput, ArticleSummary）
- [X] T009 [P] 建立 Tag 型別定義在 types/tag.ts（Tag, TagWithCount, CreateTagInput）
- [X] T010 [P] 建立 API 錯誤型別定義在 types/api.ts（StorageError, ValidationError, NotFoundError, QuotaExceededError）

### 工具函式（共用邏輯）

- [X] T011 [P] 實作資料驗證工具在 utils/validation.ts（validateArticle, validateTag, validateTitle, validateContent）
- [X] T012 [P] 實作 Slug 生成工具在 utils/slugify.ts（slugify 函式，中文轉拼音，URL 友善）
- [X] T013 [P] 實作 Markdown 渲染工具在 utils/markdown.ts（renderMarkdown 函式，marked + DOMPurify，XSS 防護）
- [X] T014 [P] 實作 localStorage 輔助函式在 utils/storage.ts（safe get/set/remove，quota 檢查）

### 核心 Composables（資料存取層）

- [X] T015 實作 useApi composable 在 composables/useApi.ts（get, set, remove, clear, isAvailable 方法，localStorage 實作）
- [X] T016 實作 useStorageMonitor composable 在 composables/useStorageMonitor.ts（監控 localStorage 使用率，80% 警告）

**檢查點**：✅ 基礎設施就緒 - 使用者故事實作現在可以平行開始

---

## Phase 3：使用者故事 1 - 建立與編輯文章（優先級：P1）🎯 MVP

**目標**：作者可以建立新文章並以 Markdown 格式撰寫內容，系統自動記錄建立時間；作者可以編輯現有文章，系統保持原始建立時間不變

**獨立測試**：建立一篇新文章並儲存 → 編輯該文章並驗證建立時間不變

**需求對應**：FR-001, FR-002, FR-003, FR-004, FR-006, FR-007, FR-026

### 實作使用者故事 1

- [X] T017 [P] [US1] 實作 usePost composable 在 composables/usePost.ts（fetchArticles, getArticle, createArticle, updateArticle, deleteArticle, getArticlesByTag, getArticleSummaries 方法）
- [X] T018 [P] [US1] 建立 ArticleEditor 元件在 components/ArticleEditor.vue（Markdown 輸入欄位、標題輸入、儲存按鈕、載入狀態、錯誤顯示）
- [X] T019 [US1] 建立新增文章頁面在 pages/posts/new.vue（使用 ArticleEditor，呼叫 createArticle，導航到列表）
- [X] T020 [US1] 建立編輯文章頁面在 pages/posts/[id]/edit.vue（使用 ArticleEditor，呼叫 getArticle 與 updateArticle，保留 createdAt）
- [X] T021 [US1] 新增表單驗證（標題不為空、內容不為空、長度限制），在 ArticleEditor.vue 中使用 utils/validation.ts
- [X] T022 [US1] 新增錯誤處理與使用者提示（儲存失敗、quota 超限、驗證錯誤），顯示友善的錯誤訊息

**檢查點**：此時使用者故事 1 應完全功能正常且可獨立測試

---

## Phase 4：使用者故事 2 - 瀏覽文章列表（優先級：P2）

**目標**：讀者可以看到按日期排序的文章列表（最新的在最前面），列表顯示標題、建立日期和摘要

**獨立測試**：瀏覽首頁查看文章列表，驗證排序正確（最新文章在最上方）

**需求對應**：FR-016, FR-017, FR-018, FR-028

### 實作使用者故事 2

- [X] T023 [P] [US2] 建立 ArticleCard 元件在 components/ArticleCard.vue（顯示標題、建立日期、摘要、標籤，點擊導航到文章頁面）
- [X] T024 [P] [US2] 建立 ArticleList 元件在 components/ArticleList.vue（渲染 ArticleCard 陣列、按 createdAt 排序、空狀態提示）
- [X] T025 [US2] 建立首頁在 pages/index.vue（使用 usePost.fetchArticles，使用 ArticleList 元件，顯示載入狀態）
- [X] T026 [US2] 實作文章摘要生成邏輯（前 200 字元 + "..."），在 usePost composable 的 getArticleSummaries 方法中
- [X] T027 [US2] 新增空狀態處理（當文章列表為空時顯示「尚無文章」提示），在 ArticleList.vue 中

**檢查點**：此時使用者故事 1 和 2 應同時正常運作且可獨立測試

---

## Phase 5：使用者故事 3 - 檢視文章內容（優先級：P3）

**目標**：讀者可以看到文章的完整內容，Markdown 格式能正確渲染為視覺化的排版

**獨立測試**：點擊文章並閱讀完整內容，驗證 Markdown 渲染正確（標題、粗體、程式碼區塊等）

**需求對應**：FR-008, FR-009, FR-010, FR-019, FR-020

### 實作使用者故事 3

- [X] T028 [P] [US3] 建立 ArticleViewer 元件在 components/ArticleViewer.vue（使用 utils/markdown.ts 渲染內容、顯示標題、建立日期、標籤、v-html 綁定）
- [X] T029 [US3] 建立文章檢視頁面在 pages/posts/[id].vue（使用 usePost.getArticle，使用 ArticleViewer 元件，顯示載入與錯誤狀態）
- [ ] T030 [US3] 設定 Markdown 樣式（Tailwind CSS prose plugin，程式碼區塊語法高亮、適當的行距與字型）在 tailwind.config.ts 中
- [X] T031 [US3] 實作安全的 Markdown 渲染（marked 解析 + DOMPurify 清理，防止 XSS），在 utils/markdown.ts 中
- [X] T032 [US3] 新增「編輯」按鈕（導航到編輯頁面）與「刪除」按鈕（待 US6 實作）在 ArticleViewer.vue 中

**檢查點**：所有基本閱讀功能（建立、列表、檢視）應完全正常運作

---

## Phase 6：使用者故事 4 - 標籤管理（優先級：P4）

**目標**：作者可以為每篇文章添加一個或多個標籤，組織和分類文章內容

**獨立測試**：為文章添加標籤並儲存，驗證標籤與文章正確關聯

**需求對應**：FR-011, FR-012, FR-013, FR-014, FR-015

### 實作使用者故事 4

- [X] T033 [P] [US4] 實作 useTag composable 在 composables/useTag.ts（fetchTags, getTagById, getTagBySlug, createTag, deleteTag, getTagsWithCount, getActiveTagsWithCount 方法）
- [X] T034 [P] [US4] 建立 TagInput 元件在 components/TagInput.vue（輸入標籤、建立新標籤、顯示已選標籤、移除標籤、自動完成建議）
- [X] T035 [US4] 整合 TagInput 到 ArticleEditor.vue（綁定 tagIds 屬性、在儲存時一併儲存標籤）
- [X] T036 [US4] 實作 Slug 生成策略（中文轉拼音、URL 友善）在 utils/slugify.ts 的 slugify 函式中
- [X] T037 [US4] 實作標籤驗證（名稱長度 1-50 字元、避免重複標籤）在 utils/validation.ts 中
- [X] T038 [US4] 更新 ArticleViewer.vue 顯示文章的標籤（標籤列表、可點擊導航到標籤篩選頁）

**檢查點**：文章可以被正確分類，標籤系統完全功能正常

---

## Phase 7：使用者故事 5 - 分類側邊欄（優先級：P5）

**目標**：讀者可以在側邊欄看到所有標籤及其文章數量，點擊標籤查看該分類下的所有文章

**獨立測試**：點擊側邊欄的某個分類標籤，驗證顯示該標籤下的所有文章

**需求對應**：FR-021, FR-022, FR-023, FR-024, FR-025

### 實作使用者故事 5

- [ ] T039 [P] [US5] 建立 TagSidebar 元件在 components/TagSidebar.vue（使用 useTag.getActiveTagsWithCount，顯示標籤列表、文章數量、當前選中狀態）
- [ ] T040 [P] [US5] 建立預設版面配置在 layouts/default.vue（包含主要內容區域與 TagSidebar，響應式設計）
- [ ] T041 [US5] 建立標籤篩選頁面在 pages/tags/[slug].vue（使用 usePost.getArticlesByTag 與 useTag.getTagBySlug，顯示篩選後的文章列表）
- [ ] T042 [US5] 實作標籤計數邏輯（計算每個標籤關聯的文章數量）在 useTag composable 的 getActiveTagsWithCount 方法中
- [ ] T043 [US5] 實作活躍標籤篩選（只顯示 count > 0 的標籤）在 useTag composable 的 getActiveTagsWithCount 方法中
- [ ] T044 [US5] 新增側邊欄樣式（Tailwind CSS，固定位置、響應式收合、標籤計數徽章）在 TagSidebar.vue 中

**檢查點**：讀者可以透過標籤輕鬆探索和瀏覽文章

---

## Phase 8：使用者故事 6 - 刪除文章（優先級：P6）

**目標**：作者可以刪除不再需要的文章，系統在刪除前顯示確認提示

**獨立測試**：刪除一篇文章，驗證文章不再出現在列表中，若標籤無其他文章則從側邊欄移除

**需求對應**：FR-005, FR-015

### 實作使用者故事 6

- [ ] T045 [P] [US6] 建立 ConfirmDialog 元件在 components/ConfirmDialog.vue（顯示確認訊息、取消與確認按鈕、關閉邏輯）
- [ ] T046 [US6] 實作刪除功能在 ArticleViewer.vue（點擊刪除按鈕 → 顯示 ConfirmDialog → 確認後呼叫 usePost.deleteArticle → 導航到首頁）
- [ ] T047 [US6] 實作刪除邏輯在 usePost composable 的 deleteArticle 方法中（移除文章、更新 localStorage、處理錯誤）
- [ ] T048 [US6] 更新 TagSidebar 在文章刪除後自動更新標籤計數（響應式資料更新）
- [ ] T049 [US6] 新增刪除成功提示（toast 通知或臨時訊息）在 pages/posts/[id].vue 中

**檢查點**：完整的 CRUD 功能全部實作完成

---

## Phase 9：優化與跨功能改進

**目的**：影響多個使用者故事的改進

### 效能優化

- [ ] T050 [P] 實作 Markdown 渲染快取（避免重複渲染相同內容），在 utils/markdown.ts 中使用 Map 快取
- [ ] T051 [P] 實作 localStorage 使用率監控與警告（達 80% 時顯示警告），使用 useStorageMonitor composable
- [ ] T052 [P] 優化文章列表渲染（虛擬滾動或分頁，當文章數量 > 100 時），在 ArticleList.vue 中
- [ ] T053 [P] 設定 Tailwind PurgeCSS（移除未使用的樣式，減少 CSS bundle 大小），在 tailwind.config.ts 中

### 使用者體驗改善

- [ ] T054 [P] 新增載入動畫與骨架屏（所有資料載入時顯示），在各頁面元件中
- [ ] T055 [P] 實作響應式設計（320px、768px、1024px 斷點），在所有元件中使用 Tailwind 響應式類別
- [ ] T056 [P] 新增鍵盤導航支援（Tab、Enter、Escape 鍵），在互動元件中
- [ ] T057 [P] 實作 ARIA 屬性（無障礙標籤、角色、狀態），在所有元件中

### 安全性與驗證

- [ ] T058 [P] 驗證所有使用者輸入（防止空白、過長內容、惡意字元），在 utils/validation.ts 中
- [ ] T059 [P] 測試 XSS 防護（嘗試注入 `<script>` 標籤），驗證 DOMPurify 正常運作
- [ ] T060 [P] 實作錯誤邊界（捕捉元件錯誤並顯示友善訊息），在 layouts/default.vue 中

### 文件與維護

- [ ] T061 [P] 更新 quickstart.md（新增實作後的實際驗證步驟）
- [ ] T062 [P] 建立元件使用文件（每個可重用元件的 props、events、範例）在各元件檔案的註解中
- [ ] T063 [P] 程式碼清理與重構（移除 console.log、統一命名慣例、改善註解）
- [ ] T064 [P] 執行 quickstart.md 驗證（按照指南測試所有 6 個驗證場景）

---

## 相依性與執行順序

### 階段相依性

- **專案設置（Phase 1）**：無相依性 - 可立即開始
- **基礎層（Phase 2）**：相依於專案設置完成 - **阻塞所有使用者故事**
- **使用者故事（Phase 3-8）**：全部相依於基礎層完成
  - 使用者故事可以平行進行（如果有足夠人力）
  - 或依優先級順序執行（P1 → P2 → P3 → P4 → P5 → P6）
- **優化（Phase 9）**：相依於所需使用者故事完成

### 使用者故事相依性

- **使用者故事 1（P1）**：基礎層完成後即可開始 - 無其他故事相依
- **使用者故事 2（P2）**：基礎層完成後即可開始 - 無其他故事相依（但與 US1 整合更佳）
- **使用者故事 3（P3）**：基礎層完成後即可開始 - 無其他故事相依（但與 US1、US2 整合更佳）
- **使用者故事 4（P4）**：基礎層完成後即可開始 - 無其他故事相依（但整合到 US1 的編輯器）
- **使用者故事 5（P5）**：基礎層完成後即可開始 - **建議** US4 完成後執行（需要標籤資料）
- **使用者故事 6（P6）**：基礎層完成後即可開始 - **建議** US1、US2、US3 完成後執行（整合刪除按鈕到檢視頁）

### 故事內部順序

- **US1-US6**：Composables → 元件 → 頁面 → 整合
- 標記 [P] 的任務可以平行執行（不同檔案、無相依性）
- 故事完成後再移往下一優先級

### 平行執行機會

- 所有專案設置任務（T003-T007）可平行
- 所有基礎層型別與工具（T008-T014）可平行
- 基礎層完成後，所有使用者故事可由不同開發者平行進行
- 優化階段的大部分任務（T050-T064）可平行

---

## 平行執行範例：使用者故事 1

```bash
# 同時啟動 US1 的多個平行任務：
Task: "實作 usePost composable 在 composables/usePost.ts"
Task: "建立 ArticleEditor 元件在 components/ArticleEditor.vue"

# 等待完成後，依序執行：
Task: "建立新增文章頁面在 pages/posts/new.vue"
Task: "建立編輯文章頁面在 pages/posts/[id]/edit.vue"
Task: "新增表單驗證"
Task: "新增錯誤處理與使用者提示"
```

---

## 實作策略

### MVP 優先（僅使用者故事 1）

1. 完成 Phase 1：專案設置
2. 完成 Phase 2：基礎層（**關鍵 - 阻塞所有故事**）
3. 完成 Phase 3：使用者故事 1
4. **停止並驗證**：獨立測試使用者故事 1
5. 準備好即可部署/展示

### 漸進式交付

1. 完成專案設置 + 基礎層 → 基礎就緒
2. 新增使用者故事 1 → 獨立測試 → 部署/展示（MVP！）
3. 新增使用者故事 2 → 獨立測試 → 部署/展示
4. 新增使用者故事 3 → 獨立測試 → 部署/展示
5. 新增使用者故事 4 → 獨立測試 → 部署/展示
6. 新增使用者故事 5 → 獨立測試 → 部署/展示
7. 新增使用者故事 6 → 獨立測試 → 部署/展示
8. 每個故事都增加價值且不破壞先前故事

### 平行團隊策略

有多位開發者時：

1. 團隊一起完成專案設置 + 基礎層
2. 基礎層完成後：
   - 開發者 A：使用者故事 1
   - 開發者 B：使用者故事 2
   - 開發者 C：使用者故事 4
3. 故事獨立完成並整合

---

## 總任務統計

### 依階段統計

- **Phase 1（專案設置）**：7 個任務
- **Phase 2（基礎層）**：9 個任務（**阻塞性**）
- **Phase 3（US1）**：6 個任務
- **Phase 4（US2）**：5 個任務
- **Phase 5（US3）**：5 個任務
- **Phase 6（US4）**：6 個任務
- **Phase 7（US5）**：6 個任務
- **Phase 8（US6）**：5 個任務
- **Phase 9（優化）**：15 個任務

**總計**：64 個任務

### 依類型統計

- **設置與基礎**：16 個任務（25%）
- **使用者故事實作**：33 個任務（52%）
- **優化與改進**：15 個任務（23%）

### 平行執行能力

- **可平行任務**：約 40 個任務標記 [P]（62%）
- **依序執行任務**：約 24 個任務（38%）

### MVP 範圍（建議）

**最小 MVP**（使用者故事 1）：
- Phase 1：專案設置（7 個任務）
- Phase 2：基礎層（9 個任務）
- Phase 3：使用者故事 1（6 個任務）
- **總計**：22 個任務

**擴展 MVP**（基本閱讀體驗）：
- 最小 MVP + US2 + US3
- **總計**：32 個任務

**完整功能**（所有故事）：
- 所有 Phase 1-8
- **總計**：49 個任務（不含 Phase 9 優化）

---

## 注意事項

- **[P] 任務** = 不同檔案，無相依性，可平行執行
- **[Story] 標籤**將任務對應到特定使用者故事，便於追蹤
- 每個使用者故事應可獨立完成並測試
- 在每個檢查點停止以獨立驗證故事
- 避免：模糊的任務、相同檔案衝突、破壞獨立性的跨故事相依性
- **基礎層（Phase 2）是關鍵**：必須完成才能開始任何使用者故事
- 依照優先級執行使用者故事（P1 → P2 → P3 → P4 → P5 → P6）
- 每完成一個故事提交程式碼
- 使用 quickstart.md 持續驗證功能

---

## 下一步行動

1. ✅ **設計文件完成**：plan.md、data-model.md、contracts/、quickstart.md
2. ✅ **任務分解完成**：本文件（tasks.md）
3. ⏳ **開始實作**：
   ```bash
   # 建立功能分支（如果尚未建立）
   git checkout -b 001-blog-crud
   
   # 開始 Phase 1：專案設置
   # 執行 T001-T007
   ```
4. ⏳ **持續驗證**：每完成一個 Phase 或使用者故事，依照 quickstart.md 驗證功能
5. ⏳ **提交程式碼**：每完成一個邏輯單元提交（建議每 2-3 個任務提交一次）

**準備好開始實作了！** 🚀
