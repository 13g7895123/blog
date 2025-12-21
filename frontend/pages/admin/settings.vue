<template>
    <div class="w-full py-8 px-4">
        <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">網站設定</h1>

        <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <form @submit.prevent="handleSubmit">
                <!-- 網站標題 -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">網站標題</label>
                    <input v-model="form.blog_title" type="text" required
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- 網站描述 -->
                <div class="mb-6">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">網站描述 (副標題)</label>
                    <input v-model="form.blog_description" type="text" required
                        class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500">
                </div>

                <div class="flex justify-end">
                    <button type="submit" :disabled="saving"
                        class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50">
                        {{ saving ? '儲存中...' : '儲存設定' }}
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
    layout: 'admin'
})

// 使用 Nuxt 自動導入
declare const useApi: any
declare const definePageMeta: any

const { getSettings, updateSettings } = useApi()

const form = ref({
    blog_title: '',
    blog_description: ''
})
const saving = ref(false)

// 載入設定
const loadSettings = async () => {
    try {
        const { data } = await getSettings()
        if (data.value) {
            form.value = {
                blog_title: data.value.blog_title || '部落格',
                blog_description: data.value.blog_description || '探索最新的文章和想法'
            }
        }
    } catch (e) {
        console.error('載入設定失敗', e)
    }
}

// 儲存設定
const handleSubmit = async () => {
    saving.value = true
    try {
        await updateSettings(form.value)
        alert('設定已儲存')
    } catch (e) {
        console.error(e)
        alert('儲存失敗')
    } finally {
        saving.value = false
    }
}

onMounted(() => {
    loadSettings()
})
</script>
