import { ref } from 'vue'
import { getStorageUsage, shouldWarnStorage } from '~/utils/storage'

/**
 * useStorageMonitor composable
 * 
 * 監控 localStorage 使用率，達到閾值時顯示警告
 * 
 * @returns 監控相關的狀態和方法
 */
export function useStorageMonitor() {
  const usage = ref(0) // 使用百分比
  const shouldWarn = ref(false) // 是否應顯示警告
  const warningThreshold = ref(80) // 警告閾值（百分比）

  /**
   * 更新儲存使用率
   */
  function updateUsage() {
    const { used, total, percentage } = getStorageUsage()

    usage.value = Math.round(percentage)
    shouldWarn.value = shouldWarnStorage(warningThreshold.value)

    return {
      used,
      total,
      percentage,
      shouldWarn: shouldWarn.value
    }
  }

  /**
   * 取得儲存使用詳細資訊
   */
  function getUsageDetails() {
    const { used, total, percentage } = getStorageUsage()

    return {
      used,
      total,
      percentage: Math.round(percentage),
      usedMB: (used / (1024 * 1024)).toFixed(2),
      totalMB: (total / (1024 * 1024)).toFixed(2),
      availableMB: ((total - used) / (1024 * 1024)).toFixed(2)
    }
  }

  /**
   * 設定警告閾值
   */
  function setWarningThreshold(threshold: number) {
    if (threshold < 0 || threshold > 100) {
      console.error('閾值必須在 0-100 之間')
      return
    }
    warningThreshold.value = threshold
    updateUsage() // 重新檢查
  }

  // 初始化時更新一次
  updateUsage()

  return {
    usage,
    shouldWarn,
    warningThreshold,
    updateUsage,
    getUsageDetails,
    setWarningThreshold
  }
}
