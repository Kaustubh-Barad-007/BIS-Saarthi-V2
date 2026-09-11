// src/store/settingsStore.js — Comprehensive User & Bhashini Settings Store
import { create } from 'zustand'
import useThemeStore from './themeStore'

const STORAGE_KEY = 'bis_settings_v2'

const DEFAULT_SETTINGS = {
  // Appearance
  theme: 'system',
  fontScale: 'standard', // 'compact', 'standard', 'comfortable'
  reduceMotion: false,

  // Language & Bhashini AI Voice
  preferredLanguage: 'en',
  bhashiniVoice: 'female', // 'female', 'male'
  speechRate: 1.0,         // 0.75 to 1.5
  speechPitch: 1.0,        // 0.8 to 1.4
  autoTranslateVoiceToEnglish: true,
  autoReadResponses: false, // Auto-TTS for AI responses

  // Notifications & Sound
  soundEffects: true,
  desktopNotifications: false,
  emailAlerts: true,
  complianceAlerts: true,

  // Security & AI RAG
  twoFactorEnabled: false,
  sessionTimeoutMinutes: 60,
  maskedKey: '138c••••••••••026',
  ragApiKey: typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SllMX21rSkdfY01lS3E2SnhTOXdrWlFQaTBZcGkzeE81dG9WalZmY3hoNkE=') : '',
}

const loadSavedSettings = () => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch (e) {
    console.error('Failed to parse settings:', e)
    return DEFAULT_SETTINGS
  }
}

const saveSettings = (state) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to persist settings:', e)
  }
}

export const useSettingsStore = create((set, get) => {
  const initial = loadSavedSettings()

  return {
    ...initial,
    isTestingVoice: false,

    // Theme update
    setThemeMode: (mode) => {
      set({ theme: mode })
      saveSettings(get())

      // Apply to documentElement
      const isDark =
        mode === 'dark' ||
        (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      useThemeStore.setState({ theme: isDark ? 'dark' : 'light' })
    },

    // Font Scale
    setFontScale: (scale) => {
      set({ fontScale: scale })
      saveSettings(get())
      document.documentElement.setAttribute('data-font-scale', scale)
    },

    // Motion
    setReduceMotion: (reduce) => {
      set({ reduceMotion: reduce })
      saveSettings(get())
    },

    // Language & Voice
    setPreferredLanguage: (lang, syncChat = true) => {
      set({ preferredLanguage: lang })
      saveSettings(get())
      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang
      }
      if (syncChat && typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('bis-lang-change', { detail: lang }))
      }
    },

    setBhashiniVoice: (gender) => {
      set({ bhashiniVoice: gender })
      saveSettings(get())
    },

    setSpeechRate: (rate) => {
      set({ speechRate: rate })
      saveSettings(get())
    },

    setSpeechPitch: (pitch) => {
      set({ speechPitch: pitch })
      saveSettings(get())
    },

    toggleAutoTranslateVoice: () => {
      set((s) => {
        const next = !s.autoTranslateVoiceToEnglish
        saveSettings({ ...s, autoTranslateVoiceToEnglish: next })
        return { autoTranslateVoiceToEnglish: next }
      })
    },

    toggleAutoReadResponses: () => {
      set((s) => {
        const next = !s.autoReadResponses
        saveSettings({ ...s, autoReadResponses: next })
        return { autoReadResponses: next }
      })
    },

    // Audio & Notifications
    toggleSoundEffects: () => {
      set((s) => {
        const next = !s.soundEffects
        saveSettings({ ...s, soundEffects: next })
        return { soundEffects: next }
      })
    },

    toggleDesktopNotifications: async () => {
      const current = get().desktopNotifications
      if (!current && 'Notification' in window) {
        const permission = await Notification.requestPermission()
        if (permission === 'granted') {
          set({ desktopNotifications: true })
          saveSettings(get())
          return true
        }
        return false
      }
      set({ desktopNotifications: !current })
      saveSettings(get())
      return !current
    },

    toggleEmailAlerts: () => {
      set((s) => {
        const next = !s.emailAlerts
        saveSettings({ ...s, emailAlerts: next })
        return { emailAlerts: next }
      })
    },

    toggleTwoFactor: () => {
      set((s) => {
        const next = !s.twoFactorEnabled
        saveSettings({ ...s, twoFactorEnabled: next })
        return { twoFactorEnabled: next }
      })
    },

    setRagApiKey: (key) => {
      set({ ragApiKey: key })
      saveSettings(get())
    },

    // Play synthesized sound effect
    playSound: (type = 'send') => {
      if (!get().soundEffects || typeof window === 'undefined') return
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)

        if (type === 'send') {
          osc.type = 'sine'
          osc.frequency.setValueAtTime(540, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(840, ctx.currentTime + 0.08)
          gain.gain.setValueAtTime(0.12, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.12)
          osc.start()
          osc.stop(ctx.currentTime + 0.12)
        } else if (type === 'receive') {
          osc.type = 'triangle'
          osc.frequency.setValueAtTime(440, ctx.currentTime)
          osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15)
          gain.gain.setValueAtTime(0.15, ctx.currentTime)
          gain.gain.linearRampToValueAtTime(0.01, ctx.currentTime + 0.2)
          osc.start()
          osc.stop(ctx.currentTime + 0.2)
        }
      } catch (_) {
        // AudioContext not allowed or not available
      }
    },

    // Reset all settings to factory default
    resetSettings: () => {
      set(DEFAULT_SETTINGS)
      saveSettings(DEFAULT_SETTINGS)
    },
  }
})

// Cross-tab sync and cross-store language synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('bis-lang-change', (e) => {
    if (e.detail && useSettingsStore.getState().preferredLanguage !== e.detail) {
      useSettingsStore.setState({ preferredLanguage: e.detail })
      const current = loadSavedSettings()
      saveSettings({ ...current, preferredLanguage: e.detail })
    }
  })
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        useSettingsStore.setState(JSON.parse(e.newValue))
      } catch (_) {}
    }
  })
}

export default useSettingsStore
