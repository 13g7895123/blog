<template>
  <article class="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden">
    <div class="p-8">
      <!-- 標題 -->
      <NuxtLink :to="`/posts/${article.id}`">
        <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          {{ article.title }}
        </h2>
      </NuxtLink>

      <!-- 元信息：日期和標籤 -->
      <div class="flex flex-wrap items-center gap-4 mb-6 text-sm">
        <!-- 發布日期 -->
        <div class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <time :datetime="article.createdAt">{{ formatDate(article.createdAt) }}</time>
        </div>

        <!-- 分類標籤 -->
        <div v-if="article.tags && article.tags.length > 0" class="flex items-center gap-2">
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          <div class="flex gap-2 flex-wrap">
            <NuxtLink
              v-for="tag in article.tags"
              :key="tag.id"
              :to="`/tags/${tag.slug}`"
              class="inline-flex items-center px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
              @click.stop
            >
              {{ tag.name }}
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- 文章摘要 -->
      <div class="prose dark:prose-invert max-w-none mb-6">
        <p class="text-gray-700 dark:text-gray-300 text-base leading-relaxed line-clamp-4">
          {{ article.excerpt }}
        </p>
      </div>

      <!-- 繼續閱讀按鈕 -->
      <div class="flex items-center justify-between pt-6 border-t border-gray-100 dark:border-gray-800">
        <NuxtLink
          :to="`/posts/${article.id}`"
          class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors group"
        >
          <span>繼續閱讀</span>
          <svg class="w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </NuxtLink>

        <!-- 閱讀時間估計（可選） -->
        <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{{ estimateReadTime(article.excerpt) }} 分鐘閱讀</span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { ArticleSummary } from '~/types/article'

interface Props {
  article: ArticleSummary
}

defineProps<Props>()

/**
 * 格式化日期為易讀格式
 */
const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  } catch {
    return '未知日期'
  }
}

/**
 * 估算閱讀時間（基於中文約 300-400 字/分鐘）
 */
const estimateReadTime = (text: string): number => {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
  const words = text.split(/\s+/).length
  const totalChars = chineseChars + words
  const minutes = Math.max(1, Math.ceil(totalChars / 350))
  return minutes
}
</script>

<style scoped>
/* 限制摘要行數 */
.line-clamp-4 {
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
