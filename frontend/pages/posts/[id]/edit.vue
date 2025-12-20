<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 py-8 px-4 sm:px-6 lg:px-8">
    <div class="max-w-4xl mx-auto">
      <!-- 返回按鈕 -->
      <div class="mb-8">
        <NuxtLink
          :to="`/posts/${id}`"
          class="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          回到文章
        </NuxtLink>

        <!-- 加載狀態 -->
        <div v-if="isLoading && !initialData" class="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          載入中...
        </div>

        <!-- 錯誤訊息 -->
        <div v-else-if="loadError" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p class="text-sm text-red-800 dark:text-red-200">
            <span class="font-medium">錯誤：</span>{{ loadError }}
          </p>
          <NuxtLink
            to="/"
            class="mt-2 inline-block text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
          >
            回到首頁 →
          </NuxtLink>
        </div>

        <!-- 標題 -->
        <h1 v-else class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
          編輯文章
        </h1>
      </div>

      <!-- 編輯器 -->
      <ArticleEditor
        v-if="initialData"
        :article-id="id"
        :initial-data="initialData"
        :is-loading="isSaving"
        :tags="tags"
        :show-tag-input="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />

      <!-- 儲存錯誤提示 -->
      <div v-if="saveError" class="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <div class="flex-1">
            <p class="text-sm font-medium text-red-800 dark:text-red-200">
              儲存失敗
            </p>
            <p class="mt-1 text-sm text-red-700 dark:text-red-300">
              {{ saveError }}
            </p>
          </div>
          <button
            @click="saveError = ''"
            class="text-red-400 hover:text-red-600 dark:hover:text-red-300"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 成功訊息 -->
      <div v-if="successMessage" class="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
        <p class="text-sm text-green-800 dark:text-green-200">
          {{ successMessage }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { UpdateArticleInput } from '~/types/article'
import type { Tag } from '~/types/tag'

definePageMeta({
  layout: 'default'
})

// 使用 Nuxt 自動導入（這些類型會在運行時注入）
declare const useRoute: any
declare const navigateTo: any
declare const usePost: any
declare const useTag: any
declare const definePageMeta: any

const route = useRoute()

// 狀態
const id = String(route.params.id)
const isLoading = ref(true)
const isSaving = ref(false)
const loadError = ref('')
const saveError = ref('')
const successMessage = ref('')

const initialData = ref<{
  title: string
  content: string
  tagIds?: string[]
} | null>(null)

const tags = ref<Tag[]>([])

// 取得 composables
const post = usePost()
const tag = useTag()
const { getArticle, updateArticle } = post
const { fetchTags } = tag

// 提交表單
const handleSubmit = async (data: UpdateArticleInput) => {
  isSaving.value = true
  saveError.value = ''
  try {
    await updateArticle(id, data)
    successMessage.value = '文章已成功更新！正在導向...'

    // 延遲 1 秒後導向回文章頁面
    setTimeout(() => {
      navigateTo(`/posts/${id}`)
    }, 1000)
  } catch (error) {
    console.error('更新文章失敗:', error)

    // 提供友善的錯誤訊息
    if (error instanceof Error) {
      if (error.message.includes('quota') || error.message.includes('Quota')) {
        saveError.value = '儲存空間不足，無法更新文章。請刪除一些文章後重試。'
      } else if (error.message.includes('驗證') || error.message.includes('validation')) {
        saveError.value = `驗證失敗：${error.message}`
      } else if (error.message.includes('不存在')) {
        saveError.value = '文章已被刪除，無法更新。'
      } else {
        saveError.value = `更新文章失敗：${error.message}`
      }
    } else {
      saveError.value = '更新文章失敗，請檢查您的輸入並重試。'
    }
  } finally {
    isSaving.value = false
  }
}

const handleCancel = () => {
  const confirmed = confirm('確定要放棄編輯嗎？所有未儲存的內容將會遺失。')
  if (confirmed) {
    navigateTo(`/posts/${id}`)
  }
}

// 生命週期
onMounted(async () => {
  try {
    // 平行載入文章和標籤
    const [article, allTags] = await Promise.all([
      getArticle(id),
      fetchTags()
    ])

    if (article) {
      initialData.value = {
        title: article.title,
        content: article.content,
        tagIds: article.tagIds
      }
      tags.value = allTags
    } else {
      loadError.value = '找不到該文章'
    }
  } catch (error) {
    console.error('載入文章失敗:', error)
    loadError.value = error instanceof Error ? error.message : '載入文章失敗，請重試'
  } finally {
    isLoading.value = false
  }
})
</script>
