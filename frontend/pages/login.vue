<template>
  <div class="login-page">
    <!-- 背景動畫 -->
    <div class="bg-gradient"></div>
    <div class="bg-pattern"></div>

    <!-- 登入卡片 -->
    <div class="login-card">
      <!-- Logo/標題 -->
      <div class="login-header">
        <div class="logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <h1>後台管理</h1>
        <p>請登入以繼續</p>
      </div>

      <!-- 登入表單 -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="input-group">
          <label for="email">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </label>
          <input id="email" v-model="input.email" type="email" placeholder="電子郵件" required autocomplete="email" />
        </div>

        <div class="input-group">
          <label for="password">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </label>
          <input id="password" v-model="input.password" type="password" placeholder="密碼" required
            autocomplete="current-password" />
        </div>

        <!-- 錯誤訊息 -->
        <Transition name="fade">
          <div v-if="error" class="error-message">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            {{ error }}
          </div>
        </Transition>

        <!-- 登入按鈕 -->
        <button type="submit" class="login-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>登入</span>
        </button>
      </form>

      <!-- 底部 -->
      <div class="login-footer">
        <a href="/">← 返回首頁</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useAuth } from '~/composables/useAuth'

definePageMeta({
  layout: false
})

const { login, loading, error } = useAuth()

const input = reactive({
  email: '',
  password: ''
})

const handleLogin = async () => {
  const success = await login(input)
  if (success) {
    navigateTo('/admin')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  position: relative;
  overflow: hidden;
  background: #0f172a;
}

/* 背景動畫 */
.bg-gradient {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 80%, rgba(236, 72, 153, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(14, 165, 233, 0.1) 0%, transparent 60%);
  animation: pulse 8s ease-in-out infinite;
}

.bg-pattern {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 40px 40px;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

/* 登入卡片 */
.login-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  padding: 2.5rem;
  background: rgba(30, 41, 59, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.05) inset;
}

/* Header */
.login-header {
  text-align: center;
  margin-bottom: 2rem;
}

.logo {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  padding: 0.875rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border-radius: 1rem;
  color: white;
}

.logo svg {
  width: 100%;
  height: 100%;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.login-header h1 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #f8fafc;
  margin: 0 0 0.5rem;
  letter-spacing: -0.025em;
}

.login-header p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

/* 表單 */
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
}

.input-group:focus-within {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

.input-group label {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  color: #64748b;
  flex-shrink: 0;
}

.input-group label svg {
  width: 20px;
  height: 20px;
}

.input-group input {
  flex: 1;
  height: 48px;
  padding: 0 1rem 0 0;
  background: transparent;
  border: none;
  color: #f8fafc;
  font-size: 0.9375rem;
  outline: none;
}

.input-group input::placeholder {
  color: #64748b;
}

/* 錯誤訊息 */
.error-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 0.75rem;
  color: #fca5a5;
  font-size: 0.875rem;
}

.error-message svg {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

/* 登入按鈕 */
.login-btn {
  height: 48px;
  margin-top: 0.5rem;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  border-radius: 0.75rem;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 10px 20px -5px rgba(99, 102, 241, 0.4);
}

.login-btn:active:not(:disabled) {
  transform: translateY(0);
}

.login-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* Spinner */
.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Footer */
.login-footer {
  margin-top: 1.5rem;
  text-align: center;
}

.login-footer a {
  color: #94a3b8;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.2s ease;
}

.login-footer a:hover {
  color: #f8fafc;
}

/* 動畫 */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
