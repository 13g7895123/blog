<template>
    <div class="data-table-container">
        <!-- 工具列 -->
        <div class="data-table-toolbar">
            <!-- 搜尋框 -->
            <div class="search-box">
                <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                </svg>
                <input v-model="searchQuery" type="text" :placeholder="searchPlaceholder" class="search-input"
                    @input="handleSearch" />
                <button v-if="searchQuery" @click="clearSearch" class="clear-btn">
                    <svg viewBox="0 0 24 24" fill="currentColor">
                        <path
                            d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                </button>
            </div>

            <!-- 右側按鈕 -->
            <div class="toolbar-actions">
                <slot name="actions" />
                <button @click="handleRefresh" class="refresh-btn" :disabled="loading" title="重新整理">
                    <svg :class="{ 'animate-spin': loading }" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        stroke-width="2">
                        <path d="M23 4v6h-6M1 20v-6h6" />
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                    </svg>
                </button>
            </div>
        </div>

        <!-- 表格 -->
        <div class="table-wrapper">
            <table class="data-table">
                <thead>
                    <tr>
                        <th v-for="col in columns" :key="col.key" :class="[
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                            col.hideOnMobile ? 'hidden sm:table-cell' : '',
                            col.sortable ? 'sortable' : ''
                        ]" :style="col.width ? { width: col.width } : {}" @click="col.sortable ? handleSort(col.key) : null">
                            {{ col.label }}
                            <span v-if="col.sortable && sortKey === col.key" class="sort-indicator">
                                {{ sortOrder === 'asc' ? '↑' : '↓' }}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <!-- 載入中 -->
                    <tr v-if="loading">
                        <td :colspan="columns.length" class="empty-cell">
                            <div class="loading-spinner"></div>
                            <span>載入中...</span>
                        </td>
                    </tr>
                    <!-- 無資料 -->
                    <tr v-else-if="paginatedData.length === 0">
                        <td :colspan="columns.length" class="empty-cell">
                            {{ emptyText }}
                        </td>
                    </tr>
                    <!-- 資料列 -->
                    <tr v-else v-for="(row, index) in paginatedData" :key="getRowKey(row, index)">
                        <td v-for="col in columns" :key="col.key" :class="[
                            col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                            col.hideOnMobile ? 'hidden sm:table-cell' : ''
                        ]">
                            <slot :name="`cell-${col.key}`" :row="row" :value="getNestedValue(row, col.key)"
                                :index="index">
                                {{ formatCellValue(getNestedValue(row, col.key), col) }}
                            </slot>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- 分頁 -->
        <div v-if="totalPages > 1" class="pagination">
            <div class="pagination-info">
                顯示 {{ startIndex + 1 }} - {{ endIndex }} 筆，共 {{ filteredData.length }} 筆
            </div>
            <div class="pagination-controls">
                <button @click="goToPage(1)" :disabled="currentPage === 1" class="page-btn" title="第一頁">
                    ««
                </button>
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" class="page-btn" title="上一頁">
                    «
                </button>

                <template v-for="page in visiblePages" :key="page">
                    <span v-if="page === '...'" class="page-ellipsis">...</span>
                    <button v-else @click="goToPage(page as number)"
                        :class="['page-btn', { active: currentPage === page }]">
                        {{ page }}
                    </button>
                </template>

                <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages" class="page-btn"
                    title="下一頁">
                    »
                </button>
                <button @click="goToPage(totalPages)" :disabled="currentPage === totalPages" class="page-btn"
                    title="最後一頁">
                    »»
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

export interface Column {
    key: string
    label: string
    sortable?: boolean
    align?: 'left' | 'center' | 'right'
    width?: string
    hideOnMobile?: boolean
    format?: (value: any, row: any) => string
}

interface Props {
    data: any[]
    columns: Column[]
    loading?: boolean
    rowKey?: string
    pageSize?: number
    searchPlaceholder?: string
    emptyText?: string
    searchKeys?: string[]
}

const props = withDefaults(defineProps<Props>(), {
    loading: false,
    rowKey: 'id',
    pageSize: 10,
    searchPlaceholder: '搜尋...',
    emptyText: '無資料',
    searchKeys: () => []
})

const emit = defineEmits<{
    refresh: []
    search: [query: string]
}>()

// 狀態
const searchQuery = ref('')
const currentPage = ref(1)
const sortKey = ref('')
const sortOrder = ref<'asc' | 'desc'>('asc')

// 取得列的 key
const getRowKey = (row: any, index: number) => {
    return row[props.rowKey] ?? index
}

// 取得巢狀值
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc?.[part], obj)
}

// 格式化儲存格值
const formatCellValue = (value: any, col: Column) => {
    if (col.format) {
        return col.format(value, {})
    }
    if (value === null || value === undefined) return '-'
    if (typeof value === 'boolean') return value ? '是' : '否'
    return value
}

// 過濾後的資料
const filteredData = computed(() => {
    let result = [...props.data]

    // 搜尋過濾
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        const keys = props.searchKeys.length > 0
            ? props.searchKeys
            : props.columns.map(c => c.key)

        result = result.filter(row => {
            return keys.some(key => {
                const value = getNestedValue(row, key)
                if (value === null || value === undefined) return false
                return String(value).toLowerCase().includes(query)
            })
        })
    }

    // 排序
    if (sortKey.value) {
        result.sort((a, b) => {
            const aVal = getNestedValue(a, sortKey.value)
            const bVal = getNestedValue(b, sortKey.value)

            if (aVal === bVal) return 0
            if (aVal === null || aVal === undefined) return 1
            if (bVal === null || bVal === undefined) return -1

            const comparison = aVal < bVal ? -1 : 1
            return sortOrder.value === 'asc' ? comparison : -comparison
        })
    }

    return result
})

// 分頁計算
const totalPages = computed(() => Math.ceil(filteredData.value.length / props.pageSize))
const startIndex = computed(() => (currentPage.value - 1) * props.pageSize)
const endIndex = computed(() => Math.min(startIndex.value + props.pageSize, filteredData.value.length))
const paginatedData = computed(() => filteredData.value.slice(startIndex.value, endIndex.value))

// 可見的頁碼
const visiblePages = computed(() => {
    const pages: (number | string)[] = []
    const total = totalPages.value
    const current = currentPage.value

    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i)
    } else {
        pages.push(1)
        if (current > 3) pages.push('...')

        const start = Math.max(2, current - 1)
        const end = Math.min(total - 1, current + 1)

        for (let i = start; i <= end; i++) pages.push(i)

        if (current < total - 2) pages.push('...')
        pages.push(total)
    }

    return pages
})

// 處理搜尋
const handleSearch = () => {
    currentPage.value = 1
    emit('search', searchQuery.value)
}

const clearSearch = () => {
    searchQuery.value = ''
    currentPage.value = 1
    emit('search', '')
}

// 處理重新整理
const handleRefresh = () => {
    emit('refresh')
}

// 處理排序
const handleSort = (key: string) => {
    if (sortKey.value === key) {
        sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = key
        sortOrder.value = 'asc'
    }
}

// 跳轉頁面
const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page
    }
}

// 當資料變更時重置頁碼
watch(() => props.data, () => {
    if (currentPage.value > totalPages.value) {
        currentPage.value = Math.max(1, totalPages.value)
    }
})
</script>

<style scoped>
.data-table-container {
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e5e7eb;
    overflow: hidden;
}

.dark .data-table-container {
    background: #1f2937;
    border-color: #374151;
}

/* 工具列 */
.data-table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e5e7eb;
    gap: 1rem;
    flex-wrap: wrap;
}

.dark .data-table-toolbar {
    border-color: #374151;
}

.search-box {
    position: relative;
    display: flex;
    align-items: center;
    flex: 1;
    max-width: 300px;
}

.search-icon {
    position: absolute;
    left: 0.75rem;
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
    pointer-events: none;
}

.search-input {
    width: 100%;
    padding: 0.5rem 2rem 0.5rem 2.25rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 0.875rem;
    background: white;
    color: #111827;
    transition: all 0.2s;
}

.dark .search-input {
    background: #374151;
    border-color: #4b5563;
    color: #f9fafb;
}

.search-input:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.clear-btn {
    position: absolute;
    right: 0.5rem;
    padding: 0.25rem;
    color: #9ca3af;
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 0.25rem;
}

.clear-btn:hover {
    color: #6b7280;
    background: #f3f4f6;
}

.dark .clear-btn:hover {
    background: #4b5563;
    color: #d1d5db;
}

.clear-btn svg {
    width: 1rem;
    height: 1rem;
}

.toolbar-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
}

.refresh-btn {
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    background: white;
    color: #6b7280;
    cursor: pointer;
    transition: all 0.2s;
}

.dark .refresh-btn {
    background: #374151;
    border-color: #4b5563;
    color: #9ca3af;
}

.refresh-btn:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
}

.dark .refresh-btn:hover:not(:disabled) {
    background: #4b5563;
    color: #f9fafb;
}

.refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.refresh-btn svg {
    width: 1.25rem;
    height: 1.25rem;
}

/* 表格 */
.table-wrapper {
    overflow-x: auto;
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    padding: 0.75rem 1rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6b7280;
    background: #f9fafb;
    border-bottom: 1px solid #e5e7eb;
    white-space: nowrap;
}

.dark .data-table th {
    background: #374151;
    color: #9ca3af;
    border-color: #4b5563;
}

.data-table th.sortable {
    cursor: pointer;
    user-select: none;
}

.data-table th.sortable:hover {
    background: #f3f4f6;
}

.dark .data-table th.sortable:hover {
    background: #4b5563;
}

.sort-indicator {
    margin-left: 0.25rem;
    color: #6366f1;
}

.data-table td {
    padding: 0.875rem 1rem;
    font-size: 0.875rem;
    color: #374151;
    border-bottom: 1px solid #e5e7eb;
    vertical-align: middle;
}

.dark .data-table td {
    color: #d1d5db;
    border-color: #374151;
}

.data-table tbody tr:hover {
    background: #f9fafb;
}

.dark .data-table tbody tr:hover {
    background: rgba(55, 65, 81, 0.5);
}

.empty-cell {
    text-align: center;
    padding: 3rem 1rem !important;
    color: #9ca3af;
}

.empty-cell .loading-spinner {
    width: 1.5rem;
    height: 1.5rem;
    border: 2px solid #e5e7eb;
    border-top-color: #6366f1;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 0.5rem;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

/* 分頁 */
.pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e5e7eb;
    flex-wrap: wrap;
    gap: 0.75rem;
}

.dark .pagination {
    border-color: #374151;
}

.pagination-info {
    font-size: 0.875rem;
    color: #6b7280;
}

.dark .pagination-info {
    color: #9ca3af;
}

.pagination-controls {
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

.page-btn {
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    background: white;
    color: #374151;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.15s;
}

.dark .page-btn {
    background: #374151;
    border-color: #4b5563;
    color: #d1d5db;
}

.page-btn:hover:not(:disabled) {
    background: #f3f4f6;
    border-color: #9ca3af;
}

.dark .page-btn:hover:not(:disabled) {
    background: #4b5563;
}

.page-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.page-btn.active {
    background: #6366f1;
    border-color: #6366f1;
    color: white;
}

.page-ellipsis {
    padding: 0 0.5rem;
    color: #9ca3af;
}

/* 響應式 */
@media (max-width: 640px) {
    .data-table-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .search-box {
        max-width: none;
    }

    .toolbar-actions {
        justify-content: flex-end;
    }

    .pagination {
        flex-direction: column;
        text-align: center;
    }
}
</style>
