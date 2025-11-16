// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/tailwindcss', '@nuxt/eslint'],

  // TypeScript 設定
  typescript: {
    strict: true,
    typeCheck: true
  },

  // Tailwind CSS 設定
  tailwindcss: {
    cssPath: '~/assets/css/tailwind.css',
    configPath: 'tailwind.config.ts',
    exposeConfig: false,
    viewer: true
  },

  // App 設定
  app: {
    head: {
      title: '部落格文章管理系統',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '使用 Nuxt 3 建立的部落格文章管理系統' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },

  // Runtime 設定
  runtimeConfig: {
    public: {
      useApiBackend: false // MVP 使用 localStorage
    }
  },

  // 開發伺服器設定
  devServer: {
    port: 3000
  },

  // ESLint 設定
  eslint: {
    config: {
      stylistic: true
    }
  },

  // Vite 設定
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: '@use "~/assets/styles/variables.scss" as *;'
        }
      }
    }
  }
})
