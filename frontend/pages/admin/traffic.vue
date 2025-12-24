<template>
    <div>
        <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800 dark:text-white">流量記錄</h2>
        </div>

        <!-- 篩選器 -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-6">
            <div class="flex flex-wrap gap-4 items-center">
                <label class="flex items-center gap-2">
                    <span class="text-sm text-gray-600 dark:text-gray-400">文章篩選：</span>
                    <select v-model="selectedArticle" @change="loadLogs"
                        class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 text-sm">
                        <option value="">全部文章</option>
                        <option v-for="article in articles" :key="article.id" :value="article.id">
                            {{ article.title }}
                        </option>
                    </select>
                </label>
                <span class="text-sm text-gray-500 dark:text-gray-400">
                    共 {{ logs.length }} 筆記錄
                </span>
            </div>
        </div>

        <!-- 流量記錄表格 -->
        <DataTable :data="logs" :columns="columns" :loading="loading" :page-size="20"
            :search-keys="['article_title', 'ip_address']" search-placeholder="搜尋文章或 IP..." empty-text="尚無瀏覽記錄"
            row-key="id" @refresh="loadLogs">
            <!-- 文章欄位 -->
            <template #cell-article_title="{ value }">
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ value || '(已刪除)' }}
                </span>
            </template>

            <!-- IP 欄位 -->
            <template #cell-ip_address="{ value }">
                <code
                    class="text-sm font-mono text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
          {{ value }}
        </code>
            </template>

            <!-- User Agent 欄位 -->
            <template #cell-user_agent="{ value }">
                <span class="text-sm text-gray-500 dark:text-gray-400 block max-w-xs truncate" :title="value">
                    {{ value }}
                </span>
            </template>

            <!-- 時間欄位 -->
            <template #cell-viewed_at="{ value }">
                <span class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                    {{ formatDate(value) }}
                </span>
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

interface ViewLog {
    id: number
    article_id: string
    article_title: string
    ip_address: string
    user_agent: string
    viewed_at: string
}

interface Article {
    id: string
    title: string
}

const logs = ref<ViewLog[]>([])
const articles = ref<Article[]>([])
const selectedArticle = ref('')
const loading = ref(true)

// DataTable 欄位定義
const columns: Column[] = [
    { key: 'article_title', label: '文章', sortable: true },
    { key: 'ip_address', label: 'IP 位址', sortable: true },
    { key: 'user_agent', label: 'User Agent', hideOnMobile: true },
    { key: 'viewed_at', label: '時間', sortable: true }
]

// 載入文章列表
const loadArticles = async () => {
    try {
        const data = await $fetch<Article[]>('/api/articles')
        articles.value = data
    } catch (e) {
        console.error('載入文章列表失敗', e)
    }
}

// 載入瀏覽記錄
const loadLogs = async () => {
    loading.value = true
    try {
        const params = new URLSearchParams()
        if (selectedArticle.value) {
            params.set('article_id', selectedArticle.value)
        }
        params.set('limit', '500')

        const data = await $fetch<ViewLog[]>(`/api/views/logs?${params.toString()}`)
        logs.value = data
    } catch (e) {
        console.error('載入流量記錄失敗', e)
    } finally {
        loading.value = false
    }
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    })
}

onMounted(() => {
    loadArticles()
    loadLogs()
})
</script>
