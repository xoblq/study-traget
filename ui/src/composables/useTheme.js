/**
 * 主题管理 Composable
 * 管理黑夜/白天主题切换
 */

import { ref, watch, onMounted } from 'vue'

// 主题类型
const THEMES = {
  DARK: 'dark',
  LIGHT: 'light'
}

// 当前主题
const currentTheme = ref(THEMES.DARK)

/**
 * 主题管理 Hook
 */
export function useTheme() {
  // 切换主题
  function toggleTheme() {
    currentTheme.value = currentTheme.value === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK
  }

  // 设置主题
  function setTheme(theme) {
    currentTheme.value = theme
  }

  // 是否是暗黑主题
  const isDark = ref(currentTheme.value === THEMES.DARK)

  // 监听主题变化
  watch(currentTheme, (newTheme) => {
    isDark.value = newTheme === THEMES.DARK
    applyTheme(newTheme)
    saveTheme(newTheme)
  })

  // 应用主题
  function applyTheme(theme) {
    const root = document.documentElement
    
    // 添加过渡类名
    root.classList.add('theme-transitioning')
    
    // 切换主题类名
    if (theme === THEMES.DARK) {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
    
    // 移除过渡类名
    setTimeout(() => {
      root.classList.remove('theme-transitioning')
    }, 300)
  }

  // 保存主题到 localStorage
  function saveTheme(theme) {
    localStorage.setItem('chat-theme', theme)
  }

  // 从 localStorage 加载主题
  function loadTheme() {
    const saved = localStorage.getItem('chat-theme')
    if (saved && Object.values(THEMES).includes(saved)) {
      currentTheme.value = saved
    }
  }

  // 初始化
  onMounted(() => {
    loadTheme()
    applyTheme(currentTheme.value)
  })

  return {
    currentTheme,
    isDark,
    toggleTheme,
    setTheme,
    THEMES
  }
}
