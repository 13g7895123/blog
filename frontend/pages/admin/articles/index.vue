<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800 dark:text-white">文章管理</h2>
      <NuxtLink to="/admin/articles/new"
        class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
        + 新增文章
      </NuxtLink>
    </div>

    <!-- 文章列表 -->
    <DataTable :data="articles" :columns="columns" :loading="loading" :search-keys="['title']" :page-size="15"
      search-placeholder="搜尋文章標題..." empty-text="目前沒有文章" @refresh="loadData">
      <!-- 標題欄位 -->
      <template #cell-title="{ row }">
        <div>
          <div class="text-sm font-medium text-gray-900 dark:text-white">{{ row.title }}</div>
          <div v-if="row.excerpt" class="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs mt-0.5">
            {{ row.excerpt }}
          </div>
        </div>
      </template>

      <!-- 標籤欄位 -->
      <template #cell-tags="{ row }">
        <div class="flex flex-wrap gap-1">
          <span v-for="tag in row.tags" :key="tag.id"
            class="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
            {{ tag.name }}
          </span>
          <span v-if="!row.tags?.length" class="text-gray-400 text-sm">-</span>
        </div>
      </template>

      <!-- 建立時間欄位 -->
      <template #cell-createdAt="{ value }">
        <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {{ formatDate(value) }}
        </span>
      </template>

      <!-- 操作欄位 -->
      <template #cell-actions="{ row }">
        <div class="flex justify-end gap-3">
          <NuxtLink :to="`/admin/articles/edit/${row.id}`"
            class="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
            編輯
          </NuxtLink>
          <button @click="confirmDelete(row.id)"
            class="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors">
            刪除
          </button>
        </div>
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

const { getArticleSummaries, deleteArticle } = usePost()
const articles = ref<any[]>([])
const loading = ref(true)

// DataTable 欄位定義
const columns: Column[] = [
  { key: 'title', label: '標題', sortable: true },
  { key: 'tags', label: '標籤', hideOnMobile: true },
  { key: 'createdAt', label: '發布時間', sortable: true, hideOnMobile: true },
  { key: 'actions', label: '操作', align: 'right', width: '120px' }
]

const loadData = async () => {
  loading.value = true
  try {
    articles.value = await getArticleSummaries()
  } finally {
    loading.value = false
  }
}

const confirmDelete = async (id: string) => {
  if (confirm('確定要刪除這篇文章嗎？此操作無法復原。')) {
    try {
      await deleteArticle(id)
      await loadData()
    } catch (e) {
      alert('刪除失敗')
    }
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(() => {
  loadData()
})
</script>
