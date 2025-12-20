<template>
  <div class="space-y-6">
    <!-- 空狀態 -->
    <div v-if="articles.length === 0" class="py-12 text-center">
      <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        尚無文章
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-6">
        目前還沒有任何文章。開始撰寫您的第一篇文章吧！
      </p>
      <NuxtLink
        to="/posts/new"
        class="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
      >
        撰寫新文章
      </NuxtLink>
    </div>

    <!-- 文章列表 -->
    <div v-else class="space-y-6">
      <div class="space-y-6">
        <ArticleCard
          v-for="article in paginatedArticles"
          :key="article.id"
          :article="article"
        />
      </div>

      <!-- 分頁按鈕 -->
      <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 pt-8">
        <button
          @click="previousPage"
          :disabled="currentPage === 1"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition"
        >
          上一頁
        </button>

        <div class="flex items-center gap-1">
          <button
            v-for="page in pageNumbers"
            :key="page"
            @click="goToPage(page)"
            :class="[
              'px-3 py-2 rounded-lg transition font-medium',
              currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'
            ]"
          >
            {{ page }}
          </button>
        </div>

        <button
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-white rounded-lg transition"
        >
          下一頁
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ArticleSummary } from '~/types/article'

interface Props {
  articles: ArticleSummary[]
  itemsPerPage?: number
}

const props = withDefaults(defineProps<Props>(), {
  itemsPerPage: 10
})

// 分頁狀態
const currentPage = ref(1)

/**
 * 計算總頁數
 */
const totalPages = computed(() => {
  return Math.max(1, Math.ceil(props.articles.length / props.itemsPerPage))
})

/**
 * 計算當前頁的文章
 */
const paginatedArticles = computed(() => {
  const start = (currentPage.value - 1) * props.itemsPerPage
  const end = start + props.itemsPerPage
  return props.articles.slice(start, end)
})

/**
 * 計算頁碼按鈕
 */
const pageNumbers = computed(() => {
  const pages = []
  const maxButtons = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxButtons / 2))
  let end = Math.min(totalPages.value, start + maxButtons - 1)

  // 調整起始位置，確保始終顯示 maxButtons 個按鈕（如果有足夠的頁面）
  if (end - start + 1 < maxButtons) {
    start = Math.max(1, end - maxButtons + 1)
  }

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  return pages
})

/**
 * 前往上一頁
 */
const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    scrollToTop()
  }
}

/**
 * 前往下一頁
 */
const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    scrollToTop()
  }
}

/**
 * 跳轉到指定頁面
 */
const goToPage = (page: number) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    scrollToTop()
  }
}

/**
 * 滾動到頂部
 */
const scrollToTop = () => {
  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, 100)
}
</script>

<style scoped>
/* 頁面樣式 */
</style>
