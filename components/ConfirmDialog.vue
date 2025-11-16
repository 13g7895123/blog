<template>
  <!-- 背景遮罩 -->
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="isOpen"
        class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50"
        @click.self="cancel"
      >
        <!-- 對話框 -->
        <Transition name="dialog">
          <div
            v-if="isOpen"
            class="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-sm w-full mx-4 overflow-hidden"
            role="alertdialog"
            aria-labelledby="dialog-title"
            aria-describedby="dialog-description"
          >
            <!-- 標題區 -->
            <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2
                id="dialog-title"
                class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-3"
              >
                <svg
                  class="w-5 h-5 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {{ title }}
              </h2>
            </div>

            <!-- 內容區 -->
            <div class="px-6 py-4">
              <p
                id="dialog-description"
                class="text-gray-700 dark:text-gray-300"
              >
                {{ message }}
              </p>
            </div>

            <!-- 按鈕區 -->
            <div class="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-800 flex gap-3 justify-end">
              <button
                @click="cancel"
                :disabled="isLoading"
                class="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 rounded-lg transition font-medium"
              >
                {{ cancelText }}
              </button>
              <button
                @click="confirm"
                :disabled="isLoading"
                :class="[
                  'px-4 py-2 rounded-lg transition font-medium flex items-center gap-2',
                  isDangerous
                    ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white'
                ]"
              >
                <svg
                  v-if="isLoading"
                  class="w-4 h-4 animate-spin"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue'

interface Props {
  isOpen: boolean
  title?: string
  message?: string
  confirmText?: string
  cancelText?: string
  isDangerous?: boolean
  isLoading?: boolean
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  title: '確認操作',
  message: '您確定要繼續嗎？',
  confirmText: '確認',
  cancelText: '取消',
  isDangerous: false,
  isLoading: false
})

const emit = defineEmits<Emits>()

/**
 * 確認
 */
const confirm = () => {
  emit('confirm')
}

/**
 * 取消
 */
const cancel = () => {
  emit('cancel')
}
</script>

<style scoped>
/* 動畫過渡 */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
