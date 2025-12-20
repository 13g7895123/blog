<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- 頁面標題 -->
      <div class="mb-8">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          回到首頁
        </NuxtLink>
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          撰寫新文章
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          使用 Markdown 格式撰寫您的文章
        </p>
      </div>

      <!-- 錯誤提示 -->
      <div v-if="errorMessage" class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800 dark:text-red-200">
              發生錯誤
            </p>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              {{ errorMessage }}
            </p>
          </div>
          <button
            @click="errorMessage = ''"
            class="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 編輯器 -->
      <ArticleEditor
        :is-loading="isLoading"
        :tags="tags"
        :show-tag-input="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />

      <!-- 提示訊息 -->
      <div v-if="successMessage" class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <div class="flex items-center gap-2">
          <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          <p class="text-sm text-green-800 dark:text-green-200">
            {{ successMessage }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { CreateArticleInput } from '~/types/article'
import type { Tag } from '~/types/tag'

// 使用 Nuxt 自動導入（這些類型會在運行時注入）
declare const definePageMeta: any
declare const usePost: any
declare const useTag: any
declare const navigateTo: any

definePageMeta({
  layout: 'default'
})

// 狀態
const isLoading = ref(false)
const successMessage = ref('')
const errorMessage = ref('')
const tags = ref<Tag[]>([])

// 取得 composables
const post = usePost()
const tag = useTag()
const { createArticle } = post
const { fetchTags } = tag

// 提交表單
const handleSubmit = async (data: CreateArticleInput) => {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const article = await createArticle(data)
    successMessage.value = '文章已成功建立！正在導向...'

    // 延遲 1 秒後導向到文章頁面
    setTimeout(() => {
      navigateTo(`/posts/${article.id}`)
    }, 1000)
  } catch (error) {
    console.error('建立文章失敗:', error)

    // 提供友善的錯誤訊息
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('Quota')) {
        errorMessage.value = '儲存空間不足，無法新增文章。請刪除一些文章後重試。'
      } else if (error.message.includes('驗證') || error.message.includes('validation')) {
        errorMessage.value = `驗證失敗：${error.message}`
      } else {
        errorMessage.value = `建立文章失敗：${error.message}`
      }
    } else {
      errorMessage.value = '建立文章失敗，請檢查您的輸入並重試。'
    }
  } finally {
    isLoading.value = false
  }
}

const handleCancel = () => {
  const confirmed = confirm('確定要放棄編輯嗎？所有未儲存的內容將會遺失。')
  if (confirmed) {
    navigateTo('/')
  }
}

// 生命週期
onMounted(async () => {
  try {
    // 取得標籤列表
    const allTags = await fetchTags()
    tags.value = allTags
  } catch (error) {
    console.error('載入標籤失敗:', error)
    // 允許使用者繼續編輯，即使標籤載入失敗
  }
})
</script>

<style scoped>
/* 頁面特定樣式 */
</style>
