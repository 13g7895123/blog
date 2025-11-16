<template>
  <div class="space-y-6">
    <!-- 標籤標題區 -->
    <div v-if="!isLoading && currentTag" class="space-y-2">
      <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
        {{ currentTag.name }}
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400">
        找到 <span class="font-semibold text-blue-600 dark:text-blue-400">{{ articles.length }}</span> 篇文章
      </p>
    </div>

    <!-- 載入狀態 -->
    <div v-if="isLoading" class="space-y-4">
      <div class="h-8 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      <div class="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      <div class="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>
    </div>

    <!-- 錯誤狀態 -->
    <div v-else-if="error" class="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
      <p class="text-red-700 dark:text-red-300 mb-4">
        {{ error }}
      </p>
      <button
        @click="loadTag"
        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        重試
      </button>
    </div>

    <!-- 文章列表 -->
    <div v-else>
      <ArticleList
        v-if="articles.length > 0"
        :articles="articles"
      />

      <!-- 空狀態 -->
      <div v-else class="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-600 dark:text-gray-400 text-lg mb-2">
          此標籤下尚無文章
        </p>
        <p class="text-gray-500 dark:text-gray-500 text-sm mb-4">
          嘗試選擇其他標籤或建立新文章
        </p>
        <NuxtLink
          to="/"
          class="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          回到首頁
        </NuxtLink>
      </div>
    </div>

    <!-- 背景裝飾 -->
    <div class="fixed -z-10 top-0 right-0 -mr-40 -mt-40 w-80 h-80 bg-blue-100 dark:bg-blue-900/20 rounded-full blur-3xl opacity-30" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { ArticleSummary } from '~/types/article'
import type { Tag } from '~/types/tag'

// 狀態
const articles = ref<ArticleSummary[]>([])
const currentTag = ref<Tag | null>(null)
const isLoading = ref(true)
const error = ref('')

// 使用 Nuxt 自動導入
declare const useRoute: any
declare const usePost: any
declare const useTag: any

const route = useRoute()
const post = usePost()
const tag = useTag()

const { getArticlesByTag, getArticleSummaries } = post
const { getTagBySlug } = tag

/**
 * 載入標籤及其文章
 */
const loadTag = async () => {
  try {
    isLoading.value = true
    error.value = ''

    const slug = route.params.slug as string
    if (!slug) {
      error.value = '標籤不存在'
      return
    }

    // 並行載入標籤資訊和文章
    const [tagData, allArticles] = await Promise.all([
      getTagBySlug(slug),
      getArticleSummaries()
    ])

    if (!tagData) {
      error.value = '標籤不存在'
      return
    }

    currentTag.value = tagData
    
    // 篩選出包含該標籤的文章
    articles.value = allArticles
      .filter((article: ArticleSummary) => 
        article.tags.some((t: any) => t.id === tagData.id)
      )
      .sort((a: ArticleSummary, b: ArticleSummary) => {
        // 按建立時間排序（最新優先）
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入失敗'
    currentTag.value = null
    articles.value = []
  } finally {
    isLoading.value = false
  }
}

// 生命週期
onMounted(() => {
  loadTag()
})
</script>

<style scoped>
/* 頁面特定樣式 */
</style>
