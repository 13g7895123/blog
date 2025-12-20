<template>
  <div class="animate-pulse space-y-3">
    <!-- 骨架屏卡片 -->
    <div
      v-for="i in count"
      :key="i"
      class="bg-gray-200 dark:bg-gray-800 rounded-lg h-40 p-4 space-y-3"
    >
      <div class="h-6 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
      <div class="space-y-2">
        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded" />
        <div class="h-4 bg-gray-300 dark:bg-gray-700 rounded w-5/6" />
      </div>
      <div class="flex gap-2 pt-2">
        <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-16" />
        <div class="h-5 bg-gray-300 dark:bg-gray-700 rounded-full w-16" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  count?: number
}

withDefaults(defineProps<Props>(), {
  count: 6
})
</script>

<style scoped>
/* 骨架屏動畫 */
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
