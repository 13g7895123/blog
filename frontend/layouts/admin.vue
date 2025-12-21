<template>
  <div class="min-h-screen bg-slate-50 dark:bg-gray-950 flex transition-colors duration-200">
    <!-- Sidebar -->
    <aside 
      class="fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-gray-800 transition-transform duration-300 transform md:translate-x-0"
      :class="isSidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <!-- Brand -->
      <div class="h-20 flex items-center px-8 border-b border-gray-100 dark:border-gray-800">
        <h1 class="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
          Blog Admin
        </h1>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 px-4 py-6 space-y-2">
        <NuxtLink
          to="/admin"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          active-class="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium shadow-sm"
          :class="route.path === '/admin' ? '' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          儀表板
        </NuxtLink>

        <NuxtLink
          to="/admin/articles"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          active-class="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium shadow-sm"
          :class="route.path.startsWith('/admin/articles') ? '' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          文章管理
        </NuxtLink>

        <NuxtLink
          to="/admin/tags"
          class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200"
          active-class="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 font-medium shadow-sm"
          :class="route.path.startsWith('/admin/tags') ? '' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
          標籤管理
        </NuxtLink>
      </nav>

      <!-- Logout -->
      <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-gray-800">
        <button
          @click="handleLogout"
          class="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          登出
        </button>
      </div>
    </aside>

    <!-- Content Area -->
    <div class="flex-1 flex flex-col min-w-0 md:pl-64 transition-all duration-300">
      <!-- Header -->
      <header class="h-20 flex items-center justify-between px-6 lg:px-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 dark:border-gray-800">
        <button 
          @click="isSidebarOpen = !isSidebarOpen"
          class="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div class="flex items-center gap-4 ml-auto">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              A
            </div>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 p-6 lg:p-10 overflow-x-hidden">
        <slot />
      </main>
    </div>

    <!-- Mobile Overlay -->
    <div 
      v-if="isSidebarOpen"
      @click="isSidebarOpen = false"
      class="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden transition-opacity"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const { logout } = useAuth()
const isSidebarOpen = ref(false)

const handleLogout = async () => {
  await logout()
}
</script>
