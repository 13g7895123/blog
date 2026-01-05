# 部署流程文檔

## 📋 目錄

1. [部署前準備](#部署前準備)
2. [本地環境部署](#本地環境部署)
3. [Production 環境部署](#production-環境部署)
4. [部署檢查機制](#部署檢查機制)
5. [故障排除](#故障排除)
6. [回滾策略](#回滾策略)

---

## 部署前準備

### 1. 環境需求

- Docker 20.10+
- Docker Compose 2.0+
- curl (用於健康檢查)
- bash 4.0+

### 2. 檔案檢查清單

確保以下檔案存在：

```
blog/
├── docker-compose.yml          # Production 主配置
├── docker-compose.local.yml    # Local 開發配置
├── .env                        # 環境變數 (需自行建立)
├── .env.example                # 環境變數範本
├── nginx/
│   ├── nginx.conf             # 當前使用的配置
│   ├── nginx.blue.conf        # Blue 環境配置
│   ├── nginx.green.conf       # Green 環境配置
│   └── Dockerfile
├── frontend/
│   └── Dockerfile
├── backend/
│   └── Dockerfile
└── scripts/
    ├── start.sh               # 啟動服務
    ├── deploy.sh              # 藍綠部署
    ├── rollback.sh            # 快速回滾
    ├── status.sh              # 狀態檢查
    ├── stop.sh                # 停止服務
    ├── migrate.sh             # 資料庫遷移
    ├── create-admin.sh        # 建立管理員
    ├── pre-deploy-check.sh    # 部署前檢查
    └── switch.sh              # 手動切換環境
```

### 3. 環境變數配置

創建 `.env` 檔案（複製自 `.env.example`）：

```bash
cp .env.example .env
```

編輯 `.env` 設定正確的端口和資料庫資訊：

```env
# Nginx
NGINX_PORT=9101

# Backend  
BACKEND_PORT=9201

# Database
DB_PORT=9301
POSTGRES_DB=blog
POSTGRES_USER=blog_user
POSTGRES_PASSWORD=your_secure_password

# Blue-Green Deployment
ACTIVE_COLOR=blue
```

---

## 本地環境部署

### 使用 docker-compose.local.yml

本地開發只需要 backend 和 database：

```bash
# 啟動本地開發環境
docker compose -f docker-compose.local.yml up -d

# 執行資料庫遷移
docker compose -f docker-compose.local.yml exec backend php spark migrate

# 建立管理員帳號
docker compose -f docker-compose.local.yml exec backend php spark make:admin

# 查看日誌
docker compose -f docker-compose.local.yml logs -f

# 停止服務
docker compose -f docker-compose.local.yml down
```

---

## Production 環境部署

### 首次部署

1. **執行部署前檢查**

```bash
./scripts/pre-deploy-check.sh
```

2. **啟動所有服務**

```bash
./scripts/start.sh
```

此腳本會：
- 檢查並創建 `.env` 檔案
- 啟動所有容器（nginx, frontend-blue, frontend-green, backend, db）
- 自動執行資料庫遷移
- 顯示服務狀態和訪問 URL

3. **建立管理員帳號**

```bash
./scripts/create-admin.sh
```

### 藍綠部署流程

#### 標準部署（推薦）

```bash
# 1. 部署前檢查
./scripts/pre-deploy-check.sh

# 2. 執行藍綠部署
./scripts/deploy.sh
```

#### 部署步驟詳解

`deploy.sh` 會自動執行以下步驟：

1. **前置檢查** ✅
   - Docker 運行狀態
   - 必要檔案是否存在
   - Nginx 配置檔完整性

2. **環境識別** 🎯
   - 自動偵測當前活躍環境（blue/green）
   - 決定目標部署環境

3. **建置與啟動** 🔨
   - 建置目標環境的 Docker 映像
   - 啟動目標容器

4. **容器狀態檢查** 🔍
   - 等待容器進入 running 狀態（最多 30 秒）
   - 檢測容器是否異常退出

5. **健康檢查（重試機制）** 🏥
   - 最多重試 10 次
   - 每次間隔 3 秒
   - HTTP 200 或 304 視為成功

6. **流量切換** 🔀
   - 更新 nginx 配置
   - 重啟 nginx
   - 驗證切換後的健康狀態

7. **完成確認** ✅
   - 顯示部署結果
   - 提供後續操作建議

#### 部署配置參數

在 `deploy.sh` 中可調整：

```bash
HEALTH_CHECK_RETRIES=10      # 健康檢查重試次數
HEALTH_CHECK_INTERVAL=3      # 健康檢查間隔（秒）
CONTAINER_READY_TIMEOUT=30   # 容器啟動超時（秒）
```

---

## 部署檢查機制

### 1. 部署前檢查（pre-deploy-check.sh）

執行全面的部署前檢查：

```bash
./scripts/pre-deploy-check.sh
```

檢查項目包括：

- ✅ **Docker 環境**
  - Docker 運行狀態
  - Docker Compose 版本

- ✅ **檔案結構**
  - 必要檔案存在性
  - 目錄結構完整性

- ✅ **環境變數**
  - `.env` 檔案存在
  - 關鍵變數設定

- ✅ **端口可用性**
  - Nginx 端口
  - Backend 端口
  - Database 端口

- ✅ **容器狀態**
  - 各容器運行狀態

- ✅ **活躍環境**
  - 當前環境識別
  - 下次部署目標

- ✅ **網路連通性**
  - 健康檢查端點測試

### 2. 部署中檢查

`deploy.sh` 內建的檢查機制：

#### 容器狀態監控

```bash
# 持續監控容器狀態
while [ $WAIT_TIME -lt $CONTAINER_READY_TIMEOUT ]; do
    CONTAINER_STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME")
    
    if [ "$CONTAINER_STATUS" = "running" ]; then
        break
    elif [ "$CONTAINER_STATUS" = "exited" ] || [ "$CONTAINER_STATUS" = "dead" ]; then
        # 自動顯示錯誤日誌
        docker logs "$CONTAINER_NAME" --tail 50
        exit 1
    fi
done
```

#### 健康檢查重試

```bash
# 10 次重試，每次間隔 3 秒
for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/health/$TARGET_COLOR")
    
    if [ "$HEALTH_CHECK" = "200" ] || [ "$HEALTH_CHECK" = "304" ]; then
        # 成功
        break
    else
        # 重試
        sleep $HEALTH_CHECK_INTERVAL
    fi
done
```

#### Nginx 切換驗證

```bash
# 切換後驗證 Nginx 健康狀態
NGINX_CHECK=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$NGINX_PORT/")

if [ "$NGINX_CHECK" != "200" ] && [ "$NGINX_CHECK" != "304" ]; then
    # 自動回滾
    cp "nginx/nginx.$CURRENT_COLOR.conf" nginx/nginx.conf
    docker compose restart nginx
    exit 1
fi
```

### 3. 部署後驗證

#### 使用 status.sh

```bash
./scripts/status.sh
```

輸出範例：

```
📊 Blog Application Status
==========================

🎯 Active Environment: blue
💤 Standby Environment: green

🐳 Container Status:
NAME                    STATUS              PORTS
blog-nginx             Up 10 minutes       0.0.0.0:9101->80/tcp
blog-frontend-blue     Up 10 minutes       80/tcp
blog-frontend-green    Up 15 minutes       80/tcp
blog-backend           Up 20 minutes       0.0.0.0:9201->80/tcp
blog-db                Up 20 minutes       0.0.0.0:9301->5432/tcp

🏥 Health Checks:
   Blue:    HTTP 200
   Green:   HTTP 200
   Backend: HTTP 200
```

#### 手動驗證

```bash
# 檢查前端（透過 Nginx）
curl http://localhost:9101/

# 檢查 API
curl http://localhost:9101/api/

# 檢查後端直連
curl http://localhost:9201/

# 檢查健康端點
curl http://localhost:9101/health/blue
curl http://localhost:9101/health/green
curl http://localhost:9101/health/backend

# 查看容器日誌
docker compose logs -f frontend-blue
docker compose logs -f frontend-green
docker compose logs -f backend
docker compose logs -f nginx
```

---

## 故障排除

### 常見問題

#### 1. 健康檢查失敗（HTTP 000）

**可能原因：**
- Nginx 容器未運行
- 端口配置錯誤
- 網路連通性問題

**排查步驟：**

```bash
# 1. 檢查容器狀態
docker ps -a | grep blog

# 2. 檢查 Nginx 日誌
docker logs blog-nginx

# 3. 檢查目標容器日誌
docker logs blog-frontend-blue
docker logs blog-frontend-green

# 4. 檢查端口是否正確
cat .env | grep NGINX_PORT

# 5. 測試容器內部連通性
docker exec blog-nginx curl http://frontend-blue:3000
docker exec blog-nginx curl http://frontend-green:3000

# 6. 檢查 Nginx 配置
docker exec blog-nginx cat /etc/nginx/nginx.conf
```

#### 2. 容器啟動失敗

**可能原因：**
- Dockerfile 錯誤
- 依賴安裝失敗
- 端口衝突

**排查步驟：**

```bash
# 1. 查看完整日誌
docker logs blog-frontend-blue --tail 100

# 2. 檢查容器狀態
docker inspect blog-frontend-blue

# 3. 重新建置（不使用快取）
docker compose build --no-cache frontend-blue

# 4. 檢查端口衝突
lsof -i :9101
lsof -i :9201
lsof -i :9301
```

#### 3. 資料庫連接失敗

**可能原因：**
- 資料庫未就緒
- 連線資訊錯誤
- 網路問題

**排查步驟：**

```bash
# 1. 檢查資料庫健康狀態
docker ps | grep blog-db

# 2. 測試資料庫連線
docker exec blog-db pg_isready -U blog_user -d blog

# 3. 檢查資料庫日誌
docker logs blog-db

# 4. 從 backend 測試連線
docker exec blog-backend php spark db:check
```

### 錯誤訊息對照表

| 錯誤訊息 | 原因 | 解決方法 |
|---------|------|---------|
| `Docker is not running` | Docker 服務未啟動 | `sudo systemctl start docker` |
| `nginx/nginx.conf not found` | Nginx 配置檔遺失 | 複製 `nginx.blue.conf` 或 `nginx.green.conf` |
| `Container failed to start (Status: exited)` | 容器啟動失敗 | 檢查容器日誌 `docker logs` |
| `Health check failed (HTTP 000)` | 網路連通性問題 | 檢查容器和 Nginx 狀態 |
| `Port XXX is in use` | 端口被佔用 | 修改 `.env` 或終止佔用進程 |

---

## 回滾策略

### 1. 快速回滾（推薦）

使用 `rollback.sh` 立即切換到上一個環境：

```bash
./scripts/rollback.sh
```

### 2. 手動切換

使用 `switch.sh` 手動指定環境：

```bash
# 切換到 blue
./scripts/switch.sh blue

# 切換到 green
./scripts/switch.sh green

# 切換到另一個環境（自動判斷）
./scripts/switch.sh
```

### 3. 緊急回滾（Nginx 層級）

如果腳本無法執行：

```bash
# 1. 手動還原 Nginx 配置
cp nginx/nginx.blue.conf nginx/nginx.conf

# 2. 重啟 Nginx
docker compose restart nginx

# 3. 驗證
curl http://localhost:9101/
```

### 4. 資料庫回滾

```bash
# 查看遷移狀態
./scripts/migrate.sh status

# 回滾最後一個遷移
./scripts/migrate.sh rollback

# 查看回滾後的狀態
./scripts/migrate.sh status
```

---

## 最佳實踐

### 1. 部署前

- ✅ 執行 `pre-deploy-check.sh`
- ✅ 確認當前環境穩定
- ✅ 備份資料庫（production）
- ✅ 通知團隊成員

### 2. 部署中

- ✅ 監控部署日誌
- ✅ 驗證每個階段結果
- ✅ 準備好回滾方案

### 3. 部署後

- ✅ 執行 `status.sh` 檢查
- ✅ 手動測試關鍵功能
- ✅ 監控應用效能
- ✅ 保留舊環境一段時間（blue-green 優勢）

### 4. 監控

建議設定以下監控：

```bash
# 定期健康檢查（crontab）
*/5 * * * * /path/to/blog/scripts/status.sh >> /var/log/blog-status.log 2>&1

# 容器狀態監控
docker events --filter 'type=container' --filter 'event=die'

# 日誌監控
docker compose logs -f --tail=100
```

---

## CI/CD 整合建議

### Gitea Actions 範例

創建 `.gitea/workflows/deploy.yml`：

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Deploy to Production Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /path/to/blog
            git pull origin main
            ./scripts/pre-deploy-check.sh
            ./scripts/deploy.sh
```

---

## 腳本使用快速參考

```bash
# 開發環境
./scripts/start.sh              # 首次啟動或完整重啟
./scripts/stop.sh               # 停止所有服務
./scripts/status.sh             # 查看狀態

# 部署
./scripts/pre-deploy-check.sh   # 部署前檢查
./scripts/deploy.sh             # 執行藍綠部署
./scripts/rollback.sh           # 快速回滾
./scripts/switch.sh [color]     # 手動切換環境

# 資料庫
./scripts/migrate.sh            # 執行遷移
./scripts/migrate.sh status     # 遷移狀態
./scripts/migrate.sh rollback   # 回滾遷移

# 管理
./scripts/create-admin.sh       # 建立管理員
```

---

## 支援與協助

如遇問題，請依序檢查：

1. 執行 `./scripts/pre-deploy-check.sh`
2. 查看容器日誌 `docker compose logs`
3. 檢查 [故障排除](#故障排除) 章節
4. 聯繫技術團隊
