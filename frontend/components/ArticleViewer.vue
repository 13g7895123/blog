<template>
  <article class="prose prose-lg dark:prose-invert max-w-4xl mx-auto">
    <!-- 文章標題和元數據 -->
    <header class="not-prose mb-8 pb-8 border-b border-gray-200 dark:border-gray-800">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        {{ article.title }}
      </h1>

      <!-- 元數據 -->
      <div class="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400 flex-wrap">
        <!-- 建立日期 -->
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <time :datetime="article.createdAt">
            {{ formatDate(article.createdAt) }}
          </time>
        </div>

        <!-- 最後更新日期 -->
        <div v-if="article.updatedAt !== article.createdAt" class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          編輯於 {{ formatDate(article.updatedAt) }}
        </div>

        <!-- 文字計數 -->
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          約 {{ wordCount }} 字
        </div>
      </div>

      <!-- 標籤 -->
      <div v-if="tags && tags.length > 0" class="mt-6 flex gap-2 flex-wrap">
        <NuxtLink v-for="tag in tags" :key="tag.id" :to="`/tags/${tag.slug}`"
          class="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition">
          # {{ tag.name }}
        </NuxtLink>
      </div>
    </header>

    <!-- 文章內容 -->
    <div class="prose-content" v-html="renderedContent" />

    <!-- 文章操作按鈕 -->
    <footer class="not-prose mt-12 pt-8 border-t border-gray-200 dark:border-gray-800 flex justify-end">
      <NuxtLink to="/"
        class="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-900 dark:text-white font-medium rounded-lg transition">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
        回到列表
      </NuxtLink>
    </footer>

    <ConfirmDialog :is-open="showDeleteConfirm" title="確認刪除文章？" :message="`您確定要刪除「${article.title}」嗎？此操作無法復原。`"
      confirm-text="刪除" cancel-text="取消" :is-dangerous="true" :is-loading="isDeleting" @confirm="handleDelete"
      @cancel="showDeleteConfirm = false" />

    <!-- 留言區 -->
    <CommentSection :article-id="article.id" />
  </article>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Article } from '~/types/article'
import type { Tag } from '~/types/tag'

interface Props {
  article: Article
  tags?: Tag[]
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => []
})

// 狀態
const renderedContent = ref<string>('')
const showDeleteConfirm = ref(false)
const isDeleting = ref(false)

// 使用 Nuxt 自動導入
declare const renderMarkdown: any
declare const usePost: any
declare const navigateTo: any

/**
 * 計算文字數量
 */
const wordCount = computed(() => {
  return Math.ceil(props.article.content.split(/\s+/).length)
})

/**
 * 格式化日期
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
 * 渲染 Markdown 內容
 */
const renderContent = async () => {
  try {
    const { renderMarkdown: renderMd } = await import('~/utils/markdown')
    renderedContent.value = await renderMd(props.article.content)
  } catch (error) {
    console.error('渲染 Markdown 失敗:', error)
    // 降級處理：顯示純文字
    renderedContent.value = `<p>${props.article.content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`
  }
}

/**
 * 刪除文章
 */
const handleDelete = async () => {
  isDeleting.value = true
  try {
    const post = usePost()
    await post.deleteArticle(props.article.id)

    // 延遲後導向回首頁
    setTimeout(() => {
      navigateTo('/')
    }, 500)
  } catch (error) {
    console.error('刪除文章失敗:', error)
    alert(`刪除失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
  } finally {
    isDeleting.value = false
    showDeleteConfirm.value = false
  }
}

// 生命週期
onMounted(() => {
  renderContent()
})
</script>

<style scoped>
/* Prose 樣式 */
/* Prose 樣式 - 使用 :deep() 穿透 v-html 內容 */
:deep(.prose) {
  @apply text-gray-900 dark:text-gray-100;
}

:deep(.prose h1),
:deep(.prose h2),
:deep(.prose h3),
:deep(.prose h4),
:deep(.prose h5),
:deep(.prose h6) {
  @apply text-gray-900 dark:text-white font-bold scroll-mt-20;
}

:deep(.prose a) {
  @apply text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300;
}

/* 程式碼區塊樣式調整：淺背景灰底字 */
:deep(.prose code) {
  @apply bg-gray-100 dark:bg-gray-200 px-1.5 py-0.5 rounded text-sm text-gray-900 dark:text-gray-900 font-mono;
}

:deep(.prose pre) {
  @apply bg-gray-100 dark:bg-gray-200 p-4 rounded-lg overflow-x-auto my-4;
}

:deep(.prose pre code) {
  @apply bg-transparent p-0 text-gray-900 dark:text-gray-900 text-sm;
}

:deep(.prose blockquote) {
  @apply border-l-4 border-blue-500 pl-4 py-1 my-4 italic text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-r;
}

:deep(.prose table) {
  @apply w-full border-collapse my-4;
}

:deep(.prose th),
:deep(.prose td) {
  @apply border border-gray-300 dark:border-gray-700 p-2 text-gray-900 dark:text-gray-100;
}

:deep(.prose th) {
  @apply bg-gray-100 dark:bg-gray-800 font-semibold;
}

:deep(.prose-content > *:first-child) {
  @apply mt-0;
}

/* 為了讓 Tailwind Typography 的預設樣式不干擾，我們可以強制指定顏色 */
:deep(.prose strong) {
  @apply text-gray-900 dark:text-white;
}

:deep(.prose ul),
:deep(.prose ol) {
  @apply my-4 pl-6;
}

:deep(.prose li) {
  @apply my-1;
}

.prose-content {
  @apply prose prose-lg dark:prose-invert max-w-none;
}
</style>
