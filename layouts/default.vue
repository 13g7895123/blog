<template>
  <div class="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
    <!-- 頂部導航欄（滿版） -->
    <header class="w-full border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-40">
      <nav class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <!-- Logo / Home -->
        <NuxtLink to="/" class="flex items-center gap-2 hover:opacity-80 transition">
          <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17.25S6.5 28 12 28s10-4.745 10-10.75S17.5 6.253 12 6.253z" />
          </svg>
          <span class="text-lg font-bold text-gray-900 dark:text-white">部落格</span>
        </NuxtLink>

        <!-- 右側按鈕組 -->
        <div class="flex items-center gap-3">
          <!-- 新增文章按鈕 -->
          <NuxtLink
            to="/posts/new"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition"
          >
            新增文章
          </NuxtLink>

          <!-- 暗色模式切換 -->
          <button
            @click="toggleDarkMode"
            class="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
            :title="isDark ? '切換為淺色模式' : '切換為暗色模式'"
          >
            <svg
              v-if="isDark"
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
            <svg
              v-else
              class="w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.536l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.828-2.828l.707.707a1 1 0 11-1.414 1.414l-.707-.707a1 1 0 111.414-1.414zM13 11a1 1 0 110 2h-1a1 1 0 110-2h1zm4-4a1 1 0 110 2v1a1 1 0 11-2 0v-1a1 1 0 012-1z" clip-rule="evenodd" />
            </svg>
          </button>

          <!-- 行動版側邊欄按鈕 -->
          <button
            @click="showMobileSidebar = !showMobileSidebar"
            class="lg:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          </button>
        </div>
      </nav>
    </header>

    <!-- 主要內容區 -->
    <div class="flex-1 overflow-auto">
      <!-- 行動版側邊欄 -->
      <div
        v-if="showMobileSidebar"
        class="lg:hidden border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900"
      >
        <div class="px-4 py-4 space-y-3 max-h-64 overflow-y-auto">
          <NuxtLink
            to="/"
            @click="showMobileSidebar = false"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            所有文章
          </NuxtLink>
          <div
            v-for="item in mobileTags"
            :key="item.tag.id"
            class="flex items-center justify-between px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition cursor-pointer"
            @click="navigateToTag(item.tag.slug)"
          >
            <span class="text-sm">{{ item.tag.name }}</span>
            <span class="text-xs bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-full">
              {{ item.count }}
            </span>
          </div>
        </div>
      </div>

      <!-- 頁面內容容器 (1280px 限制) -->
      <div class="w-full py-8">
        <div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <!-- 左右佈局：主內容 + 側邊欄 -->
          <div class="flex gap-8">
            <!-- 主內容區 -->
            <main class="flex-1 min-w-0">
              <slot />
            </main>

            <!-- 側邊欄 (桌面版 - 右側) -->
            <aside class="hidden lg:block w-64 flex-shrink-0">
              <div class="sticky top-20">
                <TagSidebar :active-tag-slug="activeTagSlug" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TagWithCount } from '~/types/tag'

// 狀態
const isDark = ref(false)
const showMobileSidebar = ref(false)
const mobileTags = ref<TagWithCount[]>([])

// 使用 Nuxt 自動導入
declare const useTag: any
declare const useRoute: any
declare const navigateTo: any

const route = useRoute()
const tag = useTag()
const { getActiveTagsWithCount } = tag

/**
 * 計算當前活躍的標籤 slug
 */
const activeTagSlug = computed(() => {
  if (route.path.startsWith('/tags/')) {
    return route.params.slug as string
  }
  return undefined
})

/**
 * 切換暗色模式
 */
const toggleDarkMode = () => {
  if (typeof window === 'undefined') return
  
  isDark.value = !isDark.value
  const html = document.documentElement
  
  if (isDark.value) {
    html.classList.add('dark')
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', 'dark')
    }
  } else {
    html.classList.remove('dark')
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', 'light')
    }
  }
}

/**
 * 導航到標籤頁面
 */
const navigateToTag = async (slug: string) => {
  showMobileSidebar.value = false
  await navigateTo(`/tags/${slug}`)
}

/**
 * 載入行動版標籤
 */
const loadMobileTags = async () => {
  try {
    const tags = await getActiveTagsWithCount()
    mobileTags.value = tags.sort((a: TagWithCount, b: TagWithCount) => {
      if (b.count !== a.count) {
        return b.count - a.count
      }
      return a.tag.name.localeCompare(b.tag.name, 'zh-CN')
    })
  } catch (err) {
    mobileTags.value = []
  }
}

/**
 * 初始化暗色模式
 */
const initDarkMode = () => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return
  
  const theme = localStorage.getItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  isDark.value = theme === 'dark' || (theme !== 'light' && prefersDark)
  
  const html = document.documentElement
  if (isDark.value) {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

// 生命週期
onMounted(() => {
  // 初始化暗色模式
  initDarkMode()

  // 載入行動版標籤
  loadMobileTags()

  // 添加鍵盤快捷鍵
  document.addEventListener('keydown', handleKeyboardShortcuts)
})

/**
 * 處理鍵盤快捷鍵
 */
const handleKeyboardShortcuts = (event: KeyboardEvent) => {
  // Ctrl/Cmd + K: 切換暗色模式
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    toggleDarkMode()
  }

  // Ctrl/Cmd + N: 新增文章
  if ((event.ctrlKey || event.metaKey) && event.key === 'n') {
    event.preventDefault()
    navigateTo('/posts/new')
  }

  // Escape: 關閉行動版側邊欄
  if (event.key === 'Escape' && showMobileSidebar.value) {
    showMobileSidebar.value = false
  }
}
</script>

<style scoped>
/* 佈局樣式 */
:deep(.prose) {
  @apply max-w-none;
}
</style>
