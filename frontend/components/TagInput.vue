<template>
  <div class="space-y-3">
    <!-- 標籤輸入 -->
    <div>
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        標籤
      </label>
      <div class="relative">
        <input
          v-model="inputValue"
          type="text"
          placeholder="輸入標籤名稱..."
          class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          @input="onInput"
          @keydown.enter.prevent="addTag"
          @keydown.comma.prevent="addTag"
          @blur="closeDropdown"
        />

        <!-- 自動完成下拉菜單 -->
        <div
          v-if="showDropdown && filteredSuggestions.length > 0"
          class="absolute top-full mt-1 w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto"
        >
          <button
            v-for="tag in filteredSuggestions"
            :key="tag.id"
            type="button"
            @click="selectTag(tag)"
            class="w-full text-left px-4 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-900 dark:text-white transition"
          >
            {{ tag.name }}
          </button>

          <!-- 新建標籤選項 -->
          <button
            v-if="inputValue.trim() && !isTagNameExists(inputValue)"
            type="button"
            @click="createNewTag"
            class="w-full text-left px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition font-medium"
          >
            + 建立新標籤「{{ inputValue }}」
          </button>
        </div>
      </div>
      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
        輸入後按 Enter 或逗號新增，或從下方選擇
      </p>
    </div>

    <!-- 已選標籤 -->
    <div v-if="selectedTags.length > 0" class="space-y-2">
      <p class="text-sm font-medium text-gray-700 dark:text-gray-300">
        已選標籤 ({{ selectedTags.length }})
      </p>
      <div class="flex flex-wrap gap-2">
        <div
          v-for="tag in selectedTags"
          :key="tag.id"
          class="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
        >
          {{ tag.name }}
          <button
            type="button"
            @click="removeTag(tag.id)"
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- 所有可用標籤 -->
    <div v-if="availableTags.length > 0" class="space-y-2">
      <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
        或選擇現有標籤
      </p>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="tag in availableTags"
          :key="tag.id"
          type="button"
          @click="toggleTag(tag)"
          :class="[
            'px-3 py-1 rounded-full text-sm transition',
            selectedTagIds.includes(tag.id)
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          ]"
        >
          {{ tag.name }}
        </button>
      </div>
    </div>

    <!-- 驗證錯誤 -->
    <div v-if="error" class="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
      <p class="text-sm text-red-700 dark:text-red-300">
        {{ error }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { Tag, CreateTagInput } from '~/types/tag'

interface Props {
  tags?: Tag[]
  selectedTagIds?: string[]
}

interface Emits {
  (e: 'update:selectedTagIds', ids: string[]): void
}

const props = withDefaults(defineProps<Props>(), {
  tags: () => [],
  selectedTagIds: () => []
})

const emit = defineEmits<Emits>()

// 狀態
const inputValue = ref('')
const showDropdown = ref(false)
const error = ref('')
const selectedTags = ref<Tag[]>([])

// 使用 Nuxt 自動導入
declare const useTag: any

// 取得 composables
const tag = useTag()
const { createTag, fetchTags } = tag

onMounted(() => {
  // 初始化已選標籤
  const initialTags = props.tags.filter(t => props.selectedTagIds.includes(t.id))
  selectedTags.value = initialTags
})

/**
 * 計算篩選後的建議標籤
 */
const filteredSuggestions = computed(() => {
  if (!inputValue.value.trim()) {
    return props.tags.filter(t => !selectedTags.value.find(s => s.id === t.id))
  }

  const search = inputValue.value.toLowerCase()
  return props.tags
    .filter(t =>
      t.name.toLowerCase().includes(search) &&
      !selectedTags.value.find(s => s.id === t.id)
    )
    .slice(0, 5)
})

/**
 * 計算可用標籤（未被選中的）
 */
const availableTags = computed(() => {
  return props.tags.filter(t => !selectedTags.value.find(s => s.id === t.id))
})

/**
 * 計算已選標籤 IDs
 */
const selectedTagIds = computed(() => {
  return selectedTags.value.map(t => t.id)
})

/**
 * 檢查標籤名稱是否已存在
 */
const isTagNameExists = (name: string): boolean => {
  return props.tags.some(t => t.name.toLowerCase() === name.toLowerCase())
}

/**
 * 輸入事件
 */
const onInput = () => {
  error.value = ''
  showDropdown.value = true
}

/**
 * 新增標籤
 */
const addTag = async () => {
  if (!inputValue.value.trim()) return

  error.value = ''

  // 檢查是否已存在
  const existing = props.tags.find(t => t.name.toLowerCase() === inputValue.value.toLowerCase())
  if (existing) {
    selectTag(existing)
    return
  }

  // 驗證標籤名稱
  if (inputValue.value.length > 50) {
    error.value = '標籤名稱不可超過 50 字元'
    return
  }

  if (inputValue.value.length < 1) {
    error.value = '標籤名稱不可為空'
    return
  }

  // 建立新標籤
  try {
    const newTag = await createTag({ name: inputValue.value.trim() })
    selectedTags.value.push(newTag)
    inputValue.value = ''
    showDropdown.value = false
    emit('update:selectedTagIds', selectedTagIds.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '建立標籤失敗'
  }
}

/**
 * 建立新標籤
 */
const createNewTag = async () => {
  await addTag()
}

/**
 * 選擇標籤
 */
const selectTag = (tag: Tag) => {
  if (!selectedTags.value.find(t => t.id === tag.id)) {
    selectedTags.value.push(tag)
    emit('update:selectedTagIds', selectedTagIds.value)
  }
  inputValue.value = ''
  showDropdown.value = false
}

/**
 * 移除標籤
 */
const removeTag = (tagId: string) => {
  selectedTags.value = selectedTags.value.filter(t => t.id !== tagId)
  emit('update:selectedTagIds', selectedTagIds.value)
}

/**
 * 切換標籤選中狀態
 */
const toggleTag = (tag: Tag) => {
  if (selectedTags.value.find(t => t.id === tag.id)) {
    removeTag(tag.id)
  } else {
    selectTag(tag)
  }
}

/**
 * 關閉下拉菜單
 */
const closeDropdown = () => {
  setTimeout(() => {
    showDropdown.value = false
  }, 100)
}
</script>

<style scoped>
/* 下拉菜單滾動 */
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
