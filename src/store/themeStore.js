import { create } from 'zustand'

const getInitialTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('bis-theme')
    if (saved === 'dark' || saved === 'light') return saved
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark'
    }
  }
  return 'light'
}

const applyThemeToDOM = (theme) => {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('bis-theme', theme)
  }
}

export const useThemeStore = create((set, get) => {
  const initialTheme = getInitialTheme()
  applyThemeToDOM(initialTheme)

  return {
    theme: initialTheme,
    isDark: initialTheme === 'dark',
    toggleTheme: () => {
      const nextTheme = get().theme === 'dark' ? 'light' : 'dark'
      applyThemeToDOM(nextTheme)
      set({ theme: nextTheme, isDark: nextTheme === 'dark' })
    },
    setTheme: (theme) => {
      applyThemeToDOM(theme)
      set({ theme, isDark: theme === 'dark' })
    },
  }
})

export default useThemeStore
