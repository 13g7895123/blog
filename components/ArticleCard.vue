<template>
  <NuxtLink
    :to="`/posts/${article.id}`"
    class="group block bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-blue-400 dark:hover:border-blue-600 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
  >
    <!-- 卡片內容 -->
    <article class="p-6">
      <!-- 標題 -->
      <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
        {{ article.title }}
      </h3>

      <!-- 摘要 -->
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
        {{ article.excerpt }}
      </p>

      <!-- 底部信息 -->
      <div class="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-800">
        <!-- 建立時間 -->
        <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {{ formatDate(article.createdAt) }}
        </div>

        <!-- 標籤 -->
        <div v-if="article.tags && article.tags.length > 0" class="flex gap-2 flex-wrap justify-end">
          <span
            v-for="tag in article.tags.slice(0, 2)"
            :key="tag.id"
            class="inline-block px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded"
          >
            {{ tag.name }}
          </span>
          <span v-if="article.tags.length > 2" class="inline-block px-2 py-1 text-xs text-gray-600 dark:text-gray-400">
            +{{ article.tags.length - 2 }}
          </span>
        </div>
      </div>
    </article>
  </NuxtLink>
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
      month: '2-digit',
      day: '2-digit'
    })
  } catch {
    return '未知日期'
  }
}
</script>

<style scoped>
/* 限制標題和摘要行數 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
