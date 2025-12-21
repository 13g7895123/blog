<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <div class="w-full">
      <!-- 頁面標題區 -->
      <div class="mb-12">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              {{ blogTitle }}
            </h1>
            <p class="text-lg text-gray-600 dark:text-gray-400">
              {{ blogDescription }}
            </p>
          </div>
          <div></div>
        </div>

        <!-- 統計信息 -->
        <div v-if="!isLoading && summaries.length > 0" class="text-sm text-gray-500 dark:text-gray-400">
          共 {{ summaries.length }} 篇文章
        </div>
      </div>

      <!-- 加載狀態 -->
      <div v-if="isLoading" class="py-12">
        <div class="flex items-center justify-center gap-3">
          <svg class="w-8 h-8 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p class="text-gray-600 dark:text-gray-400">載入文章中...</p>
        </div>
      </div>

      <!-- 錯誤提示 -->
      <div v-else-if="error"
        class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor"
            viewBox="0 0 20 20">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
          <div>
            <p class="font-medium text-red-800 dark:text-red-200">
              載入失敗
            </p>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">
              {{ error }}
            </p>
            <button @click="retryLoad()"
              class="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline">
              重試
            </button>
          </div>
        </div>
      </div>

      <!-- 文章列表 -->
      <ArticleList v-else :articles="summaries" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { ArticleSummary } from '~/types/article'

// 使用 Nuxt 自動導入
declare const usePost: any
declare const useApi: any
declare const definePageMeta: any

definePageMeta({
  layout: 'default'
})

// 狀態
const isLoading = ref(true)
const error = ref<string | null>(null)
const summaries = ref<ArticleSummary[]>([])

const blogTitle = ref('部落格')
const blogDescription = ref('探索最新的文章和想法')

// 取得 composables
const post = usePost()
const { getSettings } = useApi()
const { fetchArticles: loadAllArticles, getArticleSummaries } = post

/**
 * 載入網站設定
 */
const loadSettings = async () => {
  try {
    const { data } = await getSettings()
    if (data.value) {
      if (data.value.blog_title) blogTitle.value = data.value.blog_title
      if (data.value.blog_description) blogDescription.value = data.value.blog_description
    }
  } catch (e) {
    console.error('載入設定失敗', e)
  }
}

/**
 * 載入文章列表
 */
const loadArticles = async () => {
  isLoading.value = true
  error.value = null

  try {
    // 平行載入設定與文章
    const [_, articles] = await Promise.all([
      loadSettings(),
      (async () => {
        await loadAllArticles()
        return await getArticleSummaries()
      })()
    ])

    summaries.value = articles
  } catch (err) {
    console.error('載入文章失敗:', err)
    error.value = err instanceof Error ? err.message : '無法載入文章列表'
  } finally {
    isLoading.value = false
  }
}

/**
 * 重新載入（供重試按鈕使用）
 */
const retryLoad = () => {
  loadArticles()
}

// 生命週期
onMounted(() => {
  loadArticles()
})
</script>

<style scoped>
/* 頁面樣式 */
</style>
