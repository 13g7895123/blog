<template>
  <div class="space-y-4">
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
    <div v-else class="grid gap-4">
      <ArticleCard
        v-for="article in articles"
        :key="article.id"
        :article="article"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ArticleSummary } from '~/types/article'

interface Props {
  articles: ArticleSummary[]
}

defineProps<Props>()
</script>

<style scoped>
/* 網格布局 */
.grid {
  @apply gap-4;
}

@media (min-width: 768px) {
  .grid {
    @apply grid-cols-2;
  }
}

@media (min-width: 1024px) {
  .grid {
    @apply grid-cols-3;
  }
}
</style>
