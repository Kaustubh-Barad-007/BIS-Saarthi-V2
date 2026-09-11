import { create } from 'zustand'
import { chatApi } from '@/lib/api'
import { genId, sleep } from '@/lib/utils'
import { resolveDetailedCitation } from '@/lib/standardsReferences'

export const DEFAULT_MANUFACTURER_PROFILE = {
  companyName: '',
  productName: '',
  productCategory: 'Food & Agriculture Products',
  isStandard: '',
  scale: 'small', // 'micro' | 'small' | 'medium' | 'large'
  udyamNumber: '',
  factoryLocation: '',
  testingLabFacility: 'bis-recognized', // 'in-house' | 'bis-recognized' | 'none'
  targetScheme: 'Scheme-I ISI Mark',
  isProfileComplete: false,
}

const loadManufacturerProfile = () => {
  if (typeof window === 'undefined') return DEFAULT_MANUFACTURER_PROFILE
  try {
    const raw = localStorage.getItem('bis_manufacturer_profile')
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return DEFAULT_MANUFACTURER_PROFILE
}

const SESSIONS_STORAGE_KEY = 'bis_chat_sessions_v2'
const ACTIVE_SESSION_STORAGE_KEY = 'bis_active_session_v2'

const loadSavedSessions = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed
    }
  } catch (_) {}
  return []
}

const loadSavedActiveSessionId = (sessions) => {
  if (typeof window === 'undefined') return null
  try {
    const active = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY)
    if (active && sessions.some(s => s.id === active)) return active
  } catch (_) {}
  return sessions[0]?.id || null
}

const persistSessions = (sessions, activeId) => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
    if (activeId) {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, activeId)
    } else {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY)
    }
  } catch (_) {}
}

const DEFAULT_FALLBACK_RAG_KEY = typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SllMX21rSkdfY01lS3E2SnhTOXdrWlFQaTBZcGkzeE81dG9WalZmY3hoNkE=') : ''

const getStoredRagApiKey = () => {
  if (typeof window === 'undefined') return DEFAULT_FALLBACK_RAG_KEY
  try {
    const saved = localStorage.getItem('bis_settings_v2')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.ragApiKey) return parsed.ragApiKey
    }
  } catch (_) {}
  return DEFAULT_FALLBACK_RAG_KEY
}

// Helper to determine contextual follow-up question chips
const getSuggestedFollowUps = (content, readingMode, manufacturerProfile = null, role = 'consumer') => {
  if (manufacturerProfile?.isProfileComplete) {
    const std = manufacturerProfile.isStandard || 'this standard'
    const scale = manufacturerProfile.scale || 'MSME'
    return [
      `What is the exact Scheme of Testing (SIT) for ${std}?`,
      `How do I claim the 50% ${scale.toUpperCase()} marking fee concession?`,
      `Which testing laboratories are nearest to ${manufacturerProfile.factoryLocation || 'my factory'}?`,
    ]
  }

  if (role === 'manufacturer') {
    return [
      'What are the Scheme-I fee concessions for MSMEs?',
      'What documents are required to apply on Manakonline?',
      'How does the BIS factory inspection and lab testing work?',
    ]
  }

  const lower = content.toLowerCase()
  if (lower.includes('hallmark') || lower.includes('gold') || lower.includes('jewel') || lower.includes('huid')) {
    return [
      'How do I verify a 6-digit HUID in the BIS Care App?',
      'What are the penalties for selling unhallmarked gold?',
      'Where is the nearest Assaying & Hallmarking Centre (AHC)?',
    ]
  }
  if (lower.includes('isi') || lower.includes('certif') || lower.includes('scheme') || lower.includes('license')) {
    return [
      'What is the step-by-step ISI Mark application process?',
      'What are the application & renewal fees under Scheme-I?',
      'Which testing laboratories are accredited for this category?',
    ]
  }
  if (lower.includes('qco') || lower.includes('order') || lower.includes('mandatory')) {
    return [
      'Which electrical and electronic goods fall under mandatory QCO?',
      'Can MSMEs obtain fee concessions or exemptions?',
      'What is the penalty for importing goods without BIS certification?',
    ]
  }
  if (lower.includes('complaint') || lower.includes('substandard') || lower.includes('fake') || lower.includes('fraud')) {
    return [
      'How do I track an existing BIS consumer complaint?',
      'What proof or invoice is needed to file a substandard goods report?',
      'How to report fraudulent ISI marking on consumer electronics?',
    ]
  }
  if (readingMode === 'technical') {
    return [
      'What are the exact test parameters and sampling protocols?',
      'List all current amendments and reaffirmed versions.',
      'Show factory quality audit requirements as per Scheme-I.',
    ]
  }
  return [
    'What documents are required for BIS license registration?',
    'How long does the certification process typically take?',
    'How do I verify an ISI license number online?',
  ]
}

// Helper to translate text into the selected Indian language via Bhashini NMT proxy
export const translateToTargetLanguage = async (text, targetLang) => {
  if (!targetLang || targetLang === 'en' || !text) return text
  try {
    const res = await fetch('/api/bhashini/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        sourceLanguage: 'en',
        targetLanguage: targetLang,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.translatedText || text
    }
  } catch (_) {}
  return text
}

// Database-Driven System: Static mock responses have been permanently removed.

const initialSessions = loadSavedSessions()
const initialActiveSessionId = loadSavedActiveSessionId(initialSessions)
const initialMessages = initialActiveSessionId
  ? (initialSessions.find((s) => s.id === initialActiveSessionId)?.messages || [])
  : []

const useChatStore = create((set, get) => ({
  sessions:        initialSessions,
  currentSessionId:initialActiveSessionId,
  messages:        initialMessages,
  isLoading:       false,
  isStreaming:      false,
  error:           null,
  selectedLanguage:'en',
  uploadedFiles:   [],

  // Manufacturer Intake Profile & Continuous Context
  currentRole:     'consumer',
  setRole: (role) => set({ currentRole: role }),
  manufacturerProfile: loadManufacturerProfile(),

  setManufacturerProfile: (profile) => {
    const updated = { ...profile, isProfileComplete: true }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('bis_manufacturer_profile', JSON.stringify(updated))
      } catch (_) {}
    }
    set({ manufacturerProfile: updated })
  },

  resetManufacturerProfile: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('bis_manufacturer_profile')
      } catch (_) {}
    }
    set({ manufacturerProfile: DEFAULT_MANUFACTURER_PROFILE })
  },

  // Professional Chatbot Options
  readingMode:     'citizen', // 'citizen' | 'technical'
  chatFontSize:    'md',      // 'sm' | 'md' | 'lg' | 'xl'

  setReadingMode: (mode) => set({ readingMode: mode }),
  setChatFontSize: (size) => set({ chatFontSize: size }),

  // Create or get current session
  startSession: async (initialTitle = 'New Conversation') => {
    const sessionId = genId('session')
    const session = {
      id:        sessionId,
      title:     initialTitle,
      createdAt: new Date().toISOString(),
      messages:  [],
    }
    const nextSessions = [session, ...get().sessions]
    set({
      sessions:         nextSessions,
      currentSessionId: sessionId,
      messages:         [],
    })
    persistSessions(nextSessions, sessionId)
    return sessionId
  },

  // Switch session
  switchSession: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return
    set({ currentSessionId: sessionId, messages: session.messages || [] })
    persistSessions(get().sessions, sessionId)
  },

  // Rename an existing session
  renameSession: (sessionId, newTitle) => {
    if (!newTitle?.trim()) return
    const nextSessions = get().sessions.map((sess) =>
      sess.id === sessionId ? { ...sess, title: newTitle.trim() } : sess
    )
    set({ sessions: nextSessions })
    persistSessions(nextSessions, get().currentSessionId)
  },

  // Clear messages inside current active session
  clearCurrentMessages: () => {
    const { currentSessionId, sessions } = get()
    if (!currentSessionId) return
    const nextSessions = sessions.map((s) =>
      s.id === currentSessionId ? { ...s, messages: [] } : s
    )
    set({
      messages: [],
      sessions: nextSessions,
    })
    persistSessions(nextSessions, currentSessionId)
  },

  // Clear all conversation history
  clearAllHistory: () => {
    set({ sessions: [], messages: [], currentSessionId: null })
    persistSessions([], null)
  },

  // Stop active streaming/generation
  stopStreaming: () => {
    set({ isStreaming: false })
  },

  // Send a message (with mock AI response)
  sendMessage: async (content, options = {}) => {
    const { currentSessionId, sessions, readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
    const role = options.role || currentRole || 'consumer'
    let sessionId = currentSessionId

    // Auto-start session if none
    if (!sessionId) {
      sessionId = await get().startSession()
    }

    const userMessage = {
      id:        genId('msg'),
      role:      'user',
      content,
      timestamp: new Date().toISOString(),
      files:     options.files || [],
    }

    // Add user message
    set((s) => ({ messages: [...s.messages, userMessage], isStreaming: true, error: null }))

    try {
      // Simulate API call delay
      await sleep(800)

      // Check if user stopped streaming during the wait
      if (!get().isStreaming) return

      let aiContent = ''
      let citations = []
      let canVerify = false

      try {
        const ragApiKey = getStoredRagApiKey()
        const apiRes = await chatApi.query({
          sessionId,
          content,
          language: selectedLanguage,
          mode: readingMode,
          role,
          manufacturerProfile,
          ragApiKey,
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.citations || []
          canVerify = apiRes.canVerify ?? (citations.length > 0)
        } else {
          aiContent = '### ⚠️ No Database Response\n\nThe Bureau of Indian Standards database did not return any records for this query.'
        }
      } catch (err) {
        aiContent = '### ⚠️ Database Connection Error\n\nUnable to retrieve records from the connected BIS database. Please check connection and try again.'
      }

      // Contextual follow-up suggestions
      let followUps = getSuggestedFollowUps(content, readingMode, manufacturerProfile, role)

      // If active language is not English, translate AI response & follow-up chips so output is strictly in that language
      if (selectedLanguage && selectedLanguage !== 'en') {
        aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
        try {
          const translatedChips = await Promise.all(
            followUps.map((chip) => translateToTargetLanguage(chip, selectedLanguage))
          )
          if (translatedChips?.length) {
            followUps = translatedChips
          }
        } catch (_) {}
      }

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        citations: (citations || []).map(resolveDetailedCitation).filter(Boolean),
        canVerify,
        followUps,
        readingMode,
        timestamp: new Date().toISOString(),
      }

      // Update session title from first message if it's "New Conversation"
      const updatedSessions = get().sessions.map((s) => {
        if (s.id === sessionId) {
          const isDefaultTitle = s.title === 'New Conversation' || !s.title
          return {
            ...s,
            title: isDefaultTitle ? content.slice(0, 45).trim() : s.title,
            messages: [...(s.messages || []), userMessage, aiMessage],
          }
        }
        return s
      })

      set((s) => ({
        messages:   [...s.messages, aiMessage],
        isStreaming: false,
        sessions:   updatedSessions,
      }))
      persistSessions(updatedSessions, sessionId)
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Regenerate the last assistant response
  regenerateLastResponse: async () => {
    const { messages } = get()
    if (messages.length === 0) return

    // Find the last user message
    let lastUserMsg = null
    let cutIndex = -1
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'user') {
        lastUserMsg = messages[i]
        cutIndex = i
        break
      }
    }

    if (!lastUserMsg) return

    // Keep messages up to the user message
    const trimmedMessages = messages.slice(0, cutIndex + 1)
    set({ messages: trimmedMessages, isStreaming: true, error: null })

    try {
      await sleep(750)
      if (!get().isStreaming) return

      const { readingMode, selectedLanguage, manufacturerProfile, currentRole, currentSessionId } = get()
      let aiContent = ''
      let citations = []
      let canVerify = false

      try {
        const apiRes = await chatApi.query({
          sessionId: currentSessionId,
          content: lastUserMsg.content,
          language: selectedLanguage,
          mode: readingMode,
          role: currentRole,
          manufacturerProfile,
          ragApiKey: getStoredRagApiKey(),
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.citations || []
          canVerify = apiRes.canVerify ?? (citations.length > 0)
        } else {
          aiContent = '### ⚠️ No Database Response\n\nThe Bureau of Indian Standards database did not return any records for this query.'
        }
      } catch (err) {
        aiContent = '### ⚠️ Database Connection Error\n\nUnable to retrieve records from the connected BIS database.'
      }

      let followUps = getSuggestedFollowUps(lastUserMsg.content, readingMode, manufacturerProfile, currentRole)

      if (selectedLanguage && selectedLanguage !== 'en') {
        aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
        try {
          const translatedChips = await Promise.all(
            followUps.map((chip) => translateToTargetLanguage(chip, selectedLanguage))
          )
          if (translatedChips?.length) {
            followUps = translatedChips
          }
        } catch (_) {}
      }

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        citations: (citations || []).map(resolveDetailedCitation).filter(Boolean),
        canVerify,
        followUps,
        readingMode,
        timestamp: new Date().toISOString(),
      }

      const { sessions } = get()
      const updatedSessions = sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...trimmedMessages, aiMessage] }
          : s
      )

      set({
        messages:   [...trimmedMessages, aiMessage],
        isStreaming: false,
        sessions:   updatedSessions,
      })
      persistSessions(updatedSessions, currentSessionId)
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Edit an existing user message and regenerate response from there
  editAndResendMessage: async (messageId, newContent) => {
    const { messages, readingMode } = get()
    const targetIdx = messages.findIndex((m) => m.id === messageId)
    if (targetIdx === -1) return

    // Replace target message content
    const updatedUserMsg = {
      ...messages[targetIdx],
      content:   newContent,
      timestamp: new Date().toISOString(),
    }

    // Keep messages before the edited message, plus the edited message
    const newHistory = [...messages.slice(0, targetIdx), updatedUserMsg]
    set({ messages: newHistory, isStreaming: true, error: null })

    try {
      await sleep(800)
      if (!get().isStreaming) return

      const { readingMode, selectedLanguage, manufacturerProfile, currentRole, currentSessionId } = get()
      let aiContent = ''
      let citations = []
      let canVerify = false

      try {
        const apiRes = await chatApi.query({
          sessionId: currentSessionId,
          content: newContent,
          language: selectedLanguage,
          mode: readingMode,
          role: currentRole,
          manufacturerProfile,
          ragApiKey: getStoredRagApiKey(),
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.citations || []
          canVerify = apiRes.canVerify ?? (citations.length > 0)
        } else {
          aiContent = '### ⚠️ No Database Response\n\nThe Bureau of Indian Standards database did not return any records for this query.'
        }
      } catch (err) {
        aiContent = '### ⚠️ Database Connection Error\n\nUnable to retrieve records from the connected BIS database.'
      }

      let followUps = getSuggestedFollowUps(newContent, readingMode, manufacturerProfile, currentRole)

      if (selectedLanguage && selectedLanguage !== 'en') {
        aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
        try {
          const translatedChips = await Promise.all(
            followUps.map((chip) => translateToTargetLanguage(chip, selectedLanguage))
          )
          if (translatedChips?.length) {
            followUps = translatedChips
          }
        } catch (_) {}
      }

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        citations: (citations || []).map(resolveDetailedCitation).filter(Boolean),
        canVerify,
        followUps,
        readingMode,
        timestamp: new Date().toISOString(),
      }

      const { sessions } = get()
      const updatedSessions = sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...newHistory, aiMessage] }
          : s
      )

      set({
        messages:   [...newHistory, aiMessage],
        isStreaming: false,
        sessions:   updatedSessions,
      })
      persistSessions(updatedSessions, currentSessionId)
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Delete session
  deleteSession: (sessionId) => {
    const { sessions, currentSessionId } = get()
    const updatedSessions = sessions.filter((x) => x.id !== sessionId)
    const nextCurrentSessionId = currentSessionId === sessionId
      ? updatedSessions[0]?.id || null
      : currentSessionId
    const nextMessages = nextCurrentSessionId
      ? (updatedSessions.find(s => s.id === nextCurrentSessionId)?.messages || [])
      : []

    set({
      sessions: updatedSessions,
      currentSessionId: nextCurrentSessionId,
      messages: nextMessages,
    })
    persistSessions(updatedSessions, nextCurrentSessionId)
  },

  // Language
  setLanguage: (lang, syncSettings = true) => {
    set({ selectedLanguage: lang })
    if (syncSettings && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('bis-lang-change', { detail: lang }))
    }
  },

  // File upload
  addFile:    (file)  => set((s) => ({ uploadedFiles: [...s.uploadedFiles, file] })),
  removeFile: (index) => set((s) => ({
    uploadedFiles: s.uploadedFiles.filter((_, i) => i !== index)
  })),
  clearFiles: ()      => set({ uploadedFiles: [] }),

  clearError: () => set({ error: null }),
  clearChat:  () => {
    set({ messages: [], currentSessionId: null })
    persistSessions(get().sessions, null)
  },
}))

// Cross-store language synchronization
if (typeof window !== 'undefined') {
  window.addEventListener('bis-lang-change', (e) => {
    if (e.detail && useChatStore.getState().selectedLanguage !== e.detail) {
      useChatStore.setState({ selectedLanguage: e.detail })
    }
  })
}

export default useChatStore
