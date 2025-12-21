<template>
  <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition hover:shadow-xl">
    <div class="flex items-center justify-between mb-4">
      <div class="w-12 h-12 flex items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 text-blue-600 dark:text-blue-400">
        <slot name="icon" />
      </div>
      <span v-if="trend" :class="[
        'text-xs font-bold px-2 py-1 rounded-full',
        trend > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      ]">
        {{ trend > 0 ? '+' : '' }}{{ trend }}%
      </span>
    </div>
    <h3 class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ title }}</h3>
    <div class="mt-2 flex items-baseline gap-2">
      <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ value }}</span>
      <span v-if="unit" class="text-sm text-gray-500">{{ unit }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  value: number | string
  unit?: string
  trend?: number
}>()
</script>
