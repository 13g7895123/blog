<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">標籤管理</h2>
    </div>

    <!-- 新增標籤表單 -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-6 mb-6">
      <h3 class="text-lg font-medium text-gray-800 dark:text-white mb-4">新增標籤</h3>
      <form @submit.prevent="handleCreate" class="flex gap-4">
        <input v-model="newTagName" type="text" placeholder="輸入標籤名稱" required
          class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white" />
        <button type="submit" :disabled="creating"
          class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors">
          {{ creating ? '新增中...' : '新增' }}
        </button>
      </form>
    </div>

    <!-- 標籤列表 -->
    <DataTable :data="tags" :columns="columns" :loading="loading" :search-keys="['name', 'slug']"
      search-placeholder="搜尋標籤..." empty-text="目前沒有標籤" @refresh="loadTags">
      <!-- 名稱欄位 -->
      <template #cell-name="{ value }">
        <span
          class="px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
          {{ value }}
        </span>
      </template>

      <!-- Slug 欄位 -->
      <template #cell-slug="{ value }">
        <code class="text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {{ value }}
        </code>
      </template>

      <!-- 文章數欄位 -->
      <template #cell-count="{ value }">
        <span :class="value > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
          {{ value }} 篇
        </span>
      </template>

      <!-- 操作欄位 -->
      <template #cell-actions="{ row }">
        <button @click="confirmDelete(row)" :disabled="row.count > 0" :title="row.count > 0 ? '有文章使用此標籤，無法刪除' : '刪除標籤'"
          class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          刪除
        </button>
      </template>
    </DataTable>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DataTable from '~/components/admin/DataTable.vue'
import type { Column } from '~/components/admin/DataTable.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})

const { createTag, deleteTag, getTagsWithCount } = useTag()

const loading = ref(true)
const creating = ref(false)
const newTagName = ref('')
const tags = ref<any[]>([])

// DataTable 欄位定義
const columns: Column[] = [
  { key: 'name', label: '名稱', sortable: true },
  { key: 'slug', label: 'Slug', sortable: true },
  { key: 'count', label: '文章數', sortable: true, hideOnMobile: true },
  { key: 'actions', label: '操作', align: 'right' }
]

const loadTags = async () => {
  loading.value = true
  try {
    const data = await getTagsWithCount()
    // 轉換 API 格式：{ tag: {...}, count } => { ...tag, count }
    tags.value = data.map((item: any) => ({
      id: item.tag?.id || item.id,
      name: item.tag?.name || item.name,
      slug: item.tag?.slug || item.slug,
      count: item.count ?? 0
    }))
  } finally {
    loading.value = false
  }
}

const handleCreate = async () => {
  if (!newTagName.value.trim()) return

  creating.value = true
  try {
    await createTag({ name: newTagName.value.trim() })
    newTagName.value = ''
    await loadTags()
  } catch (e) {
    alert('新增失敗: ' + (e instanceof Error ? e.message : '未知錯誤'))
  } finally {
    creating.value = false
  }
}

const confirmDelete = async (tag: any) => {
  if (tag.count > 0) {
    alert('此標籤仍有文章使用，無法刪除')
    return
  }

  if (confirm(`確定要刪除標籤「${tag.name}」嗎？`)) {
    try {
      await deleteTag(tag.id)
      await loadTags()
    } catch (e) {
      alert('刪除失敗')
    }
  }
}

onMounted(() => {
  loadTags()
})
</script>
