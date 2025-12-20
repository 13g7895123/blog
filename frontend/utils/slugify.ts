/**
 * 將文字轉換為 URL 友善的 slug
 * 
 * 規則：
 * - 轉換為小寫
 * - 空格和特殊字元轉為連字號
 * - 移除連續的連字號
 * - 移除首尾的連字號
 * - 保留中文字元（簡化版，完整版需使用 pinyin 套件）
 * 
 * @param text 原始文字
 * @returns URL 友善的 slug
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // 替換空格和底線為連字號
    .replace(/[\s_]+/g, '-')
    // 移除特殊字元（保留中文、英文、數字、連字號）
    .replace(/[^\w\-\u4e00-\u9fa5]/g, '')
    // 合併多個連字號
    .replace(/-+/g, '-')
    // 移除首尾連字號
    .replace(/^-+|-+$/g, '')
}

/**
 * 簡化版 slug 生成（保留中文）
 * MVP 階段使用此版本，未來可升級為完整拼音轉換
 */
export function slugifySimple(text: string): string {
  return slugify(text)
}
