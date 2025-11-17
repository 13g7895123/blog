<template>
  <aside class="w-64 bg-gray-50 dark:bg-gray-900 h-full">
    <div class="p-6 space-y-6 sticky top-16">
      <!-- 標題 -->
      <div>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">
          標籤分類
        </h2>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          篩選文章內容
        </p>
      </div>

      <!-- 標籤列表 -->
      <div v-if="isLoading" class="space-y-3">
        <div v-for="i in 3" :key="i" class="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
      </div>

      <div v-else-if="tags.length > 0" class="space-y-2 max-h-96 overflow-y-auto">
        <NuxtLink
          v-for="item in tags"
          :key="item.tag.id"
          :to="`/tags/${item.tag.slug}`"
          :class="[
            'flex items-center justify-between px-3 py-2 rounded-lg transition',
            isActiveTag(item.tag.slug)
              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
          ]"
        >
          <span class="font-medium text-sm truncate">
            {{ item.tag.name }}
          </span>
          <span :class="[
            'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold',
            isActiveTag(item.tag.slug)
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          ]">
            {{ item.count }}
          </span>
        </NuxtLink>
      </div>

      <!-- 空狀態 -->
      <div v-else class="text-center py-8">
        <div class="text-gray-400 dark:text-gray-600 mb-2">
          <svg class="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </div>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          尚無標籤
        </p>
      </div>

      <!-- 錯誤狀態 -->
      <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
        <p class="text-xs text-red-700 dark:text-red-300">
          {{ error }}
        </p>
      </div>

      <!-- 所有文章按鈕 -->
      <div class="pt-4 border-t border-gray-200 dark:border-gray-800">
        <NuxtLink
          to="/"
          :class="[
            'flex items-center justify-center px-3 py-2 rounded-lg transition font-medium text-sm',
            !activeTagSlug
              ? 'bg-blue-600 dark:bg-blue-700 text-white'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
          ]"
        >
          所有文章
        </NuxtLink>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import type { TagWithCount } from '~/types/tag'

interface Props {
  activeTagSlug?: string
}

const props = withDefaults(defineProps<Props>(), {
  activeTagSlug: undefined
})

// 狀態
const tags = ref<TagWithCount[]>([])
const isLoading = ref(true)
const error = ref('')

// 使用 Nuxt 自動導入
declare const useTag: any
declare const useRoute: any

const tag = useTag()
const { getActiveTagsWithCount } = tag

// 計算屬性
const activeTagSlug = computed(() => props.activeTagSlug)

/**
 * 檢查標籤是否為當前活躍標籤
 */
const isActiveTag = (slug: string): boolean => {
  return slug === activeTagSlug.value
}

/**
 * 載入標籤
 */
const loadTags = async () => {
  try {
    isLoading.value = true
    error.value = ''
    const loadedTags = await getActiveTagsWithCount()
    tags.value = loadedTags.sort((a: TagWithCount, b: TagWithCount) => {
      // 按文章數量排序（降序）
      if (b.count !== a.count) {
        return b.count - a.count
      }
      // 再按名稱排序
      return a.tag.name.localeCompare(b.tag.name, 'zh-CN')
    })
  } catch (err) {
    error.value = err instanceof Error ? err.message : '載入標籤失敗'
    tags.value = []
  } finally {
    isLoading.value = false
  }
}

// 監聽 activeTagSlug 變化
watch(() => props.activeTagSlug, () => {
  // 重新載入以更新計數
  loadTags()
}, { immediate: true })

// 生命週期
onMounted(() => {
  loadTags()
})
</script>

<style scoped>
/* 滾動樣式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 3px;
}

.dark ::-webkit-scrollbar-thumb {
  background: #4b5563;
}
</style>
