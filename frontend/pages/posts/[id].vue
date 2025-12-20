<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- 返回按鈕 -->
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-8 transition"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        回到列表
      </NuxtLink>

      <!-- 加載狀態 -->
      <div v-if="isLoading" class="py-12 text-center">
        <svg class="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400">
          載入中...
        </p>
      </div>

      <!-- 錯誤狀態 -->
      <div v-else-if="error" class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex gap-4">
          <svg class="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div>
            <p class="font-medium text-red-800 dark:text-red-200">
              無法載入文章
            </p>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">
              {{ error }}
            </p>
            <button
              @click="loadArticle()"
              class="mt-3 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 underline"
            >
              重試
            </button>
          </div>
        </div>
      </div>

      <!-- 文章內容 -->
      <ArticleViewer
        v-else-if="article"
        :article="article"
        :tags="tags"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { Article } from '~/types/article'
import type { Tag } from '~/types/tag'

definePageMeta({
  layout: 'default'
})

// 使用 Nuxt 自動導入
declare const useRoute: any
declare const usePost: any
declare const useTag: any
declare const definePageMeta: any

const route = useRoute()

// 狀態
const isLoading = ref(true)
const error = ref<string | null>(null)
const article = ref<Article | null>(null)
const tags = ref<Tag[]>([])

// 取得 composables
const post = usePost()
const tag = useTag()
const { getArticle } = post
const { fetchTags, getTagById } = tag

/**
 * 載入文章和相關標籤
 */
const loadArticle = async () => {
  isLoading.value = true
  error.value = null

  try {
    const id = String(route.params.id)

    // 平行載入文章和所有標籤
    const [loadedArticle, allTags] = await Promise.all([
      getArticle(id),
      fetchTags()
    ])

    if (!loadedArticle) {
      throw new Error('找不到該文章')
    }

    article.value = loadedArticle

    // 篩選該文章的標籤
    const articleTags = loadedArticle.tagIds
      .map((tagId: string) => allTags.find((t: Tag) => t.id === tagId))
      .filter((t: Tag | undefined): t is Tag => t !== undefined)

    tags.value = articleTags
  } catch (err) {
    console.error('載入文章失敗:', err)
    error.value = err instanceof Error ? err.message : '無法載入文章'
  } finally {
    isLoading.value = false
  }
}

// 生命週期
onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
/* 頁面樣式 */
</style>
