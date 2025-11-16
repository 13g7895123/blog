import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    tooling: true,
    stylistic: {
      semi: false,
      quotes: 'single',
      indent: 2,
      commaDangle: 'never'
    }
  }
}).append({
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-multiple-template-root': 'off'
  }
})
