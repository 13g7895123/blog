# Blog Application

基於 Nuxt.js + CodeIgniter 4 + PostgreSQL 的部落格應用程式，採用藍綠部署策略。

## 🚀 快速開始

### 前置需求

- Docker 20.10+
- Docker Compose 2.0+
- Git

### 安裝步驟

1. **Clone 專案**

```bash
git clone <repository-url>
cd blog
```

2. **配置環境變數**

```bash
cp .env.example .env
# 編輯 .env 設定你的端口和資料庫資訊
```

3. **啟動服務**

```bash
./scripts/start.sh
```

4. **建立管理員帳號**

```bash
./scripts/create-admin.sh
```

5. **訪問應用**

- Frontend: http://localhost:9101
- Backend API: http://localhost:9201
- Database: localhost:9301

## 📁 專案結構

```
blog/
├── frontend/           # Nuxt.js 前端應用
├── backend/            # CodeIgniter 4 後端 API
├── nginx/              # Nginx 反向代理配置
│   ├── nginx.conf      # 當前使用的配置
│   ├── nginx.blue.conf # Blue 環境配置
│   └── nginx.green.conf# Green 環境配置
├── scripts/            # 部署和管理腳本
│   ├── start.sh        # 啟動服務
│   ├── deploy.sh       # 藍綠部署
│   ├── rollback.sh     # 快速回滾
│   ├── status.sh       # 狀態查看
│   ├── stop.sh         # 停止服務
│   ├── migrate.sh      # 資料庫遷移
│   ├── create-admin.sh # 建立管理員
│   └── pre-deploy-check.sh # 部署前檢查
├── docs/               # 文檔
│   └── DEPLOYMENT.md   # 詳細部署文檔
├── docker-compose.yml  # Production 配置
└── docker-compose.local.yml # Local 開發配置
```

## 🎯 核心功能

- ✅ **藍綠部署**：零停機時間的部署策略
- ✅ **健康檢查**：自動重試機制確保部署可靠性
- ✅ **快速回滾**：出問題時可立即回滾
- ✅ **資料庫遷移**：自動化的資料庫版本管理
- ✅ **容器化**：完整的 Docker 配置
- ✅ **環境隔離**：Production 和 Local 環境分離

## 🛠️ 腳本使用

### 基本操作

```bash
# 啟動服務（首次或完整重啟）
./scripts/start.sh

# 查看狀態
./scripts/status.sh

# 停止服務
./scripts/stop.sh
```

### 部署操作

```bash
# 部署前檢查（推薦每次部署前執行）
./scripts/pre-deploy-check.sh

# 執行藍綠部署
./scripts/deploy.sh

# 快速回滾到上一個環境
./scripts/rollback.sh

# 手動切換環境
./scripts/switch.sh [blue|green]
```

### 資料庫操作

```bash
# 執行資料庫遷移
./scripts/migrate.sh

# 查看遷移狀態
./scripts/migrate.sh status

# 回滾最後一個遷移
./scripts/migrate.sh rollback

# 重置資料庫（⚠️ 會刪除所有資料）
./scripts/migrate.sh refresh
```

### 管理操作

```bash
# 建立管理員帳號
./scripts/create-admin.sh
```

## 🏥 健康檢查機制

### 自動健康檢查

部署腳本內建完整的健康檢查機制：

- **容器狀態檢查**：確保容器成功啟動
- **健康端點重試**：10 次重試，每次間隔 3 秒
- **Nginx 驗證**：切換後驗證 Nginx 仍正常運行
- **自動回滾**：失敗時自動還原到穩定環境

### 手動健康檢查

```bash
# 完整檢查
./scripts/pre-deploy-check.sh

# 查看當前狀態
./scripts/status.sh

# 測試健康端點
curl http://localhost:9101/health/blue
curl http://localhost:9101/health/green
curl http://localhost:9101/health/backend
```

## 🔄 藍綠部署流程

1. **檢測當前環境**
   - 自動識別 Blue 或 Green 環境

2. **建置新環境**
   - 建置並啟動非活躍環境的容器

3. **容器狀態驗證**
   - 等待容器進入 running 狀態（最多 30 秒）

4. **健康檢查**
   - 最多 10 次重試，確保服務正常

5. **流量切換**
   - 更新 Nginx 配置
   - 重啟 Nginx
   - 驗證切換成功

6. **完成**
   - 新環境接管流量
   - 舊環境保持待命（可快速回滾）

## 📊 部署檢查項目

`pre-deploy-check.sh` 會檢查：

- ✅ Docker 環境狀態
- ✅ 必要檔案和目錄
- ✅ 環境變數配置
- ✅ 端口可用性
- ✅ 容器運行狀態
- ✅ 當前活躍環境
- ✅ 網路連通性

## 🚨 故障排除

### 健康檢查失敗

```bash
# 1. 檢查容器狀態
docker ps -a | grep blog

# 2. 查看容器日誌
docker logs blog-frontend-blue
docker logs blog-frontend-green
docker logs blog-nginx

# 3. 測試內部連通性
docker exec blog-nginx curl http://frontend-blue:3000
docker exec blog-nginx curl http://frontend-green:3000
```

### 容器無法啟動

```bash
# 1. 查看完整日誌
docker logs blog-frontend-blue --tail 100

# 2. 重新建置（不使用快取）
docker compose build --no-cache frontend-blue

# 3. 檢查端口衝突
lsof -i :9101
```

### 資料庫連線問題

```bash
# 1. 檢查資料庫健康狀態
docker ps | grep blog-db

# 2. 測試資料庫連線
docker exec blog-db pg_isready -U blog_user -d blog

# 3. 查看資料庫日誌
docker logs blog-db
```

更多故障排除，請參考 [部署文檔](docs/DEPLOYMENT.md#故障排除)。

## 📖 詳細文檔

- [完整部署文檔](docs/DEPLOYMENT.md) - 包含詳細的部署流程、檢查機制、故障排除等

## 🔐 安全性

### 環境變數

請勿將 `.env` 檔案提交到版本控制！

```bash
# .env 應包含敏感資訊
POSTGRES_PASSWORD=your_secure_password_here
```

### 資料庫備份

Production 環境建議定期備份：

```bash
# 備份資料庫
docker exec blog-db pg_dump -U blog_user blog > backup_$(date +%Y%m%d_%H%M%S).sql

# 還原資料庫
docker exec -i blog-db psql -U blog_user blog < backup_20260105_111500.sql
```

## 🌐 環境配置

### Production 環境

使用 `docker-compose.yml`（預設）：

- Nginx 反向代理
- Frontend Blue + Green（藍綠部署）
- Backend API
- PostgreSQL 資料庫

```bash
docker compose up -d
```

### Local 開發環境

使用 `docker-compose.local.yml`：

- 只啟動 Backend + Database
- Frontend 在本地以 dev mode 運行

```bash
# 啟動後端和資料庫
docker compose -f docker-compose.local.yml up -d

# 在另一個終端啟動前端 (需先 cd frontend/)
cd frontend && npm run dev
```

## 📝 開發工作流程

### 本地開發

1. 啟動 backend 和 database
2. 在本地運行 frontend dev server
3. 進行開發和測試
4. Commit 並 push

### Production 部署

1. 執行部署前檢查
2. 執行藍綠部署
3. 驗證新環境
4. 如有問題可立即回滾

## 🤝 貢獻指南

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. Commit 變更 (`git commit -m 'feat: 新增某功能'`)
4. Push 到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

[MIT License](LICENSE)

## 💬 聯絡方式

如有問題或建議，請開啟 Issue 或聯繫維護團隊。

---

**部署前必看**: [完整部署文檔](docs/DEPLOYMENT.md) 📚
