<template>
  <div class="article-editor">
    <form @submit.prevent="handleSubmit" class="space-y-6">
      <!-- 標題輸入 -->
      <div>
        <label for="title" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          標題
          <span class="text-red-600">*</span>
        </label>
        <div class="relative">
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="輸入文章標題..."
            class="w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent transition"
            :class="[
              errors.title 
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            ]"
            maxlength="200"
            @input="validateTitle"
            @blur="validateTitleField"
          />
          <span v-if="!errors.title && form.title.trim()" class="absolute right-3 top-3 text-green-600">
            ✓
          </span>
        </div>
        <div class="mt-1 flex justify-between">
          <p v-if="errors.title" class="text-sm text-red-600 dark:text-red-400">
            {{ errors.title }}
          </p>
          <p 
            :class="[
              'text-xs',
              form.title.length > 180 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            ]"
          >
            {{ form.title.length }} / 200
          </p>
        </div>
      </div>

      <!-- 內容輸入（Markdown） -->
      <div>
        <label for="content" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          內容（Markdown 格式）
          <span class="text-red-600">*</span>
        </label>
        <div class="relative">
          <textarea
            id="content"
            v-model="form.content"
            placeholder="輸入文章內容（支援 Markdown）&#10;&#10;# 一級標題&#10;## 二級標題&#10;**粗體** *斜體*"
            class="w-full h-96 px-4 py-2 border rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:border-transparent transition resize-none"
            :class="[
              errors.content 
                ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
                : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            ]"
            maxlength="50000"
            @input="validateContent"
            @blur="validateContentField"
          />
          <span v-if="!errors.content && form.content.trim()" class="absolute right-3 top-3 text-green-600">
            ✓
          </span>
        </div>
        <div class="mt-1 flex justify-between">
          <p v-if="errors.content" class="text-sm text-red-600 dark:text-red-400">
            {{ errors.content }}
          </p>
          <p 
            :class="[
              'text-xs',
              form.content.length > 45000 ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            ]"
          >
            {{ form.content.length }} / 50000
          </p>
        </div>
      </div>

      <!-- 標籤選擇 -->
      <div v-if="showTagInput">
        <TagInput
          :tags="props.tags"
          :selected-tag-ids="form.tagIds"
          @update:selected-tag-ids="updateSelectedTags"
        />
      </div>

      <!-- 錯誤提示 -->
      <div v-if="globalError" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p class="text-sm text-red-800 dark:text-red-200">
          <span class="font-medium">錯誤：</span>{{ globalError }}
        </p>
      </div>

      <!-- 按鈕組 -->
      <div class="flex gap-3 pt-4">
        <button
          type="submit"
          :disabled="isLoading || !isFormValid"
          class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
        >
          <svg
            v-if="isLoading"
            class="w-4 h-4 animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          {{ isLoading ? '儲存中...' : '儲存文章' }}
        </button>
        <button
          type="button"
          @click="handleCancel"
          :disabled="isLoading"
          class="px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition"
        >
          取消
        </button>
      </div>

      <!-- 提交統計 -->
      <p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
        標題 {{ form.title.length }}/200 字元 • 內容 {{ form.content.length }}/50000 字元
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { CreateArticleInput, UpdateArticleInput } from '~/types/article'
import type { Tag } from '~/types/tag'
import { validateArticle } from '~/utils/validation'

interface Props {
  articleId?: string
  initialData?: {
    title: string
    content: string
    tagIds?: string[]
  }
  tags?: Tag[]
  showTagInput?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'submit', data: CreateArticleInput | UpdateArticleInput): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  articleId: undefined,
  initialData: undefined,
  tags: () => [],
  showTagInput: false,
  isLoading: false
})

const emit = defineEmits<Emits>()

// 表單狀態
const form = ref({
  title: props.initialData?.title ?? '',
  content: props.initialData?.content ?? '',
  tagIds: props.initialData?.tagIds ?? [] as string[]
})

// 驗證錯誤
const errors = ref({
  title: '',
  content: ''
})

const globalError = ref('')

// 計算屬性
const isFormValid = computed(() => {
  return (
    form.value.title.trim().length > 0 &&
    form.value.content.trim().length > 0 &&
    !errors.value.title &&
    !errors.value.content
  )
})

// 驗證方法
const validateTitleField = () => {
  if (!form.value.title.trim()) {
    errors.value.title = '標題不可為空白'
  } else if (form.value.title.length < 1) {
    errors.value.title = '標題至少需要 1 個字元'
  } else if (form.value.title.length > 200) {
    errors.value.title = '標題長度不可超過 200 字元'
  } else {
    errors.value.title = ''
  }
}

const validateContentField = () => {
  if (!form.value.content.trim()) {
    errors.value.content = '內容不可為空白'
  } else if (form.value.content.length < 1) {
    errors.value.content = '內容至少需要 1 個字元'
  } else if (form.value.content.length > 50000) {
    errors.value.content = '內容長度不可超過 50000 字元'
  } else {
    errors.value.content = ''
  }
}

const validateTitle = () => {
  validateTitleField()
}

const validateContent = () => {
  validateContentField()
}

// 標籤管理
const removeTag = (tagId: string) => {
  form.value.tagIds = form.value.tagIds.filter(id => id !== tagId)
}

const getTagName = (tagId: string): string => {
  return props.tags.find(t => t.id === tagId)?.name ?? '未知標籤'
}

const updateSelectedTags = (tagIds: string[]) => {
  form.value.tagIds = tagIds
}

// 表單提交
const handleSubmit = async () => {
  // 驗證所有欄位
  validateTitleField()
  validateContentField()

  if (!isFormValid.value) {
    globalError.value = '請修正所有錯誤後重試'
    return
  }

  // 最終驗證
  const validation = validateArticle({
    title: form.value.title,
    content: form.value.content,
    tagIds: form.value.tagIds
  })

  if (!validation.valid) {
    globalError.value = validation.errors.join('; ')
    return
  }

  globalError.value = ''

  // 發送提交事件
  const submitData: CreateArticleInput | UpdateArticleInput = {
    title: form.value.title.trim(),
    content: form.value.content.trim(),
    tagIds: form.value.tagIds
  }

  emit('submit', submitData)
}

const handleCancel = () => {
  emit('cancel')
}

// 生命週期
onMounted(() => {
  // 初始驗證
  if (form.value.title) validateTitleField()
  if (form.value.content) validateContentField()
})
</script>

<style scoped>
.article-editor {
  @apply w-full max-w-4xl;
}

/* 深色模式支援 */
@media (prefers-color-scheme: dark) {
  input,
  textarea {
    @apply dark:bg-gray-900 dark:text-white dark:border-gray-600;
  }
}
</style>
