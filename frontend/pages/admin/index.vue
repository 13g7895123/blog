<template>
  <div class="space-y-8">
    <!-- Welcome Section -->
    <div>
      <h2 class="text-2xl font-bold text-slate-800 dark:text-white">
        Hello, Admin 👋
      </h2>
      <p class="text-slate-500 dark:text-slate-400 mt-1">
        這是您今天的網站概況總覽
      </p>
    </div>
    
    <!-- Stats Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        title="總文章數"
        :value="articleCount"
        unit="篇"
      >
        <template #icon>
          <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
        </template>
      </StatsCard>

      <StatsCard
        title="總標籤數"
        :value="tagCount"
        unit="個"
      >
        <template #icon>
          <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        </template>
      </StatsCard>

      <StatsCard
        title="今日瀏覽"
        :value="todayViews"
        unit="次"
        :trend="12"
      >
        <template #icon>
          <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </template>
      </StatsCard>

      <StatsCard
        title="總瀏覽數"
        :value="totalViews"
        unit="次"
      >
        <template #icon>
          <svg class="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </template>
      </StatsCard>
    </div>

    <!-- Charts & Tables Layout -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Left: Line Chart -->
      <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-6">流量趨勢</h3>
        <DailyViewsChart :daily-data="dailyViews" />
      </div>

      <!-- Right: Popular Articles -->
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6">
        <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-6">🔥 熱門文章 (7天內)</h3>
        <div v-if="loading" class="text-center py-4">載入中...</div>
        <div v-else-if="popularArticles.length === 0" class="text-gray-500 text-center py-4">尚無資料</div>
        <ul v-else class="space-y-4">
          <li v-for="(article, idx) in popularArticles" :key="article.id" class="flex items-start gap-4">
            <span class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-bold">
              {{ idx + 1 }}
            </span>
            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white truncate" :title="article.title">
                {{ article.title }}
              </h4>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ article.views }} 次瀏覽
              </p>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import StatsCard from '~/components/admin/StatsCard.vue'
import DailyViewsChart from '~/components/admin/DailyViewsChart.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['auth']
})

const { getArticleSummaries } = usePost()
const { fetchTags } = useTag()

const loading = ref(true)
const articleCount = ref(0)
const tagCount = ref(0)
const todayViews = ref(0)
const totalViews = ref(0)
const popularArticles = ref<any[]>([])
const dailyViews = ref<Record<string, number>>({})

onMounted(async () => {
  try {
    const [articles, tags, viewStats] = await Promise.all([
      getArticleSummaries(),
      fetchTags(),
      $fetch<any>('/api/views/stats').catch(() => ({ todayViews: 0, totalViews: 0, popularArticles: [], dailyViews: {} }))
    ])
    
    articleCount.value = articles.length
    tagCount.value = tags.length
    
    todayViews.value = viewStats.todayViews || 0
    totalViews.value = viewStats.totalViews || 0
    popularArticles.value = viewStats.popularArticles || []
    dailyViews.value = viewStats.dailyViews || {}
  } catch (e) {
    console.error('Failed to load dashboard data', e)
  } finally {
    loading.value = false
  }
})
</script>
