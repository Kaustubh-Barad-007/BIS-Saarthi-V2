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

const getActiveUserFromStorage = () => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('bis_user')
    if (raw) return JSON.parse(raw)
  } catch (_) {}
  return null
}

const getUserStorageKeys = (user = null) => {
  const u = user || getActiveUserFromStorage()
  if (u?.id) {
    const role = u.role || 'consumer'
    return {
      sessionsKey: `bis_chat_sessions_u${u.id}_${role}`,
      activeKey: `bis_active_session_u${u.id}_${role}`,
    }
  }
  return {
    sessionsKey: 'bis_chat_sessions_guest',
    activeKey: 'bis_active_session_guest',
  }
}

const loadSavedSessions = (user = null) => {
  if (typeof window === 'undefined') return []
  try {
    const { sessionsKey } = getUserStorageKeys(user)
    const raw = localStorage.getItem(sessionsKey)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        return parsed.map((s) => ({
          ...s,
          messages: (s.messages || []).map((m) => ({
            ...m,
            citations: (m.citations || []).map(resolveDetailedCitation).filter(Boolean),
          })),
        }))
      }
    }
  } catch (_) {}
  return []
}

const loadSavedActiveSessionId = (sessions, user = null) => {
  if (typeof window === 'undefined') return null
  try {
    const { activeKey } = getUserStorageKeys(user)
    const active = localStorage.getItem(activeKey)
    if (active && sessions.some((s) => s.id === active)) return active
  } catch (_) {}
  return sessions[0]?.id || null
}

function persistSessions(sessions, activeId, user = null) {
  if (typeof window === 'undefined') return
  try {
    const { sessionsKey, activeKey } = getUserStorageKeys(user)
    // Sanitize sessions: store ONLY lean chat history, timestamps, and minimal citation tags.
    // No raw bulky document dumps, schemas, or heavy payloads are stored.
    const leanSessions = (sessions || []).map((s) => ({
      id: s.id,
      title: s.title,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
      messages: (s.messages || []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        citations: (m.citations || []).map((c) => ({
          source: c.source,
          title: c.title,
          clause: c.clause,
        })),
        followUps: m.followUps || [],
      })),
    }))

    localStorage.setItem(sessionsKey, JSON.stringify(leanSessions))
    if (activeId) {
      localStorage.setItem(activeKey, activeId)
    } else {
      localStorage.removeItem(activeKey)
    }
  } catch (_) {}
}

const DEFAULT_FALLBACK_GEMINI_KEY = typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SllMX21rSkdfY01lS3E2SnhTOXdrWlFQaTBZcGkzeE81dG9WalZmY3hoNkE=') : ''

// External RAG API Key used strictly for data extraction
function getStoredRagApiKey() {
  if (typeof window === 'undefined') return ''
  try {
    const saved = localStorage.getItem('bis_settings_v2')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.ragApiKey) return parsed.ragApiKey
    }
  } catch (_) {}
  return localStorage.getItem('bis_rag_api_key') || ''
}

// Helper to guarantee the query sent to the RAG database is in English for 100% accurate BIS standard retrieval
export async function ensureEnglishQuery(text, selectedLang = 'en') {
  if (!text || typeof text !== 'string') return ''
  const trimmed = text.trim()
  const hasNonAscii = /[^\u0000-\u007F]/.test(trimmed)
  // If purely ASCII and already English, return as-is
  if (!hasNonAscii && (!selectedLang || selectedLang === 'en')) {
    return trimmed
  }
  try {
    const res = await fetch('/api/bhashini/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: trimmed,
        sourceLanguage: selectedLang !== 'en' ? selectedLang : 'auto',
        targetLanguage: 'en',
      }),
    })
    if (res.ok) {
      const data = await res.json()
      if (data.translatedText && data.translatedText.trim()) {
        return data.translatedText.trim()
      }
    }
  } catch (e) {
    console.warn('Query translation error:', e)
  }
  return trimmed
}

// Helper to translate text into the selected Indian language via Bhashini NMT proxy
export async function translateToTargetLanguage(text, targetLang) {
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

const initialUser = getActiveUserFromStorage()
const initialSessions = loadSavedSessions(initialUser)
const initialActiveSessionId = loadSavedActiveSessionId(initialSessions, initialUser)
const initialMessages = initialActiveSessionId
  ? (initialSessions.find((s) => s.id === initialActiveSessionId)?.messages || [])
  : []

const getInitialLanguage = () => {
  if (typeof window === 'undefined') return 'en'
  try {
    const saved = localStorage.getItem('bis_settings_v2')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed?.preferredLanguage) return parsed.preferredLanguage
    }
  } catch (_) {}
  return 'en'
}

const useChatStore = create((set, get) => ({
  sessions:        initialSessions,
  currentSessionId:initialActiveSessionId,
  messages:        initialMessages,
  currentUserId:   initialUser?.id || null,
  currentUserRole: initialUser?.role || 'consumer',
  isLoading:       false,
  isStreaming:      false,
  error:           null,
  selectedLanguage:getInitialLanguage(),
  uploadedFiles:   [],

  // Sync sessions when user logs in, switches accounts, or logs out
  syncWithUser: async (user) => {
    const targetUser = user || getActiveUserFromStorage()
    const { currentUserId, currentRole, messages, isStreaming, sessions } = get()

    // Do NOT wipe active chat state if user and role have not changed or if a query is streaming
    if (isStreaming) return
    if (currentUserId === (targetUser?.id || null) && currentRole === (targetUser?.role || 'consumer') && (messages.length > 0 || sessions.length > 0)) {
      return
    }

    const localSessions = loadSavedSessions(targetUser)
    let activeId = loadSavedActiveSessionId(localSessions, targetUser) || localSessions[0]?.id || null

    set({
      currentUserId: targetUser?.id || null,
      currentUserRole: targetUser?.role || 'consumer',
      currentRole: targetUser?.role || 'consumer',
      sessions: localSessions,
      currentSessionId: activeId,
      messages: localSessions.find((s) => s.id === activeId)?.messages || [],
    })

    // If user is authenticated, sync with PostgreSQL NeonDB under proper RBAC
    if (targetUser?.id && targetUser.id !== 'guest') {
      try {
        const token = localStorage.getItem('bis_token')
        if (token) {
          const res = await fetch('/api/data?type=chat_sessions', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (Array.isArray(data.sessions)) {
              const dbSessions = data.sessions.map((s) => ({
                ...s,
                messages: (s.messages || []).map((m) => ({
                  ...m,
                  citations: (m.citations || []).map(resolveDetailedCitation).filter(Boolean),
                })),
              }))

              // Merge local + DB sessions (local takes precedence if matching id)
              const sessionMap = new Map()
              localSessions.forEach((s) => sessionMap.set(s.id, s))
              dbSessions.forEach((s) => {
                if (!sessionMap.has(s.id)) {
                  sessionMap.set(s.id, s)
                }
              })

              const merged = Array.from(sessionMap.values())
              const validActiveId = activeId && merged.some((s) => s.id === activeId)
                ? activeId
                : merged[0]?.id || null

              set({
                sessions: merged,
                currentSessionId: validActiveId,
                messages: merged.find((s) => s.id === validActiveId)?.messages || [],
              })
              persistSessions(merged, validActiveId, targetUser)
            }
          }
        }
      } catch (err) {
        console.warn('Chat DB sync error:', err.message)
      }
    }
  },

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

  // Send a message
  sendMessage: async (content, options = {}) => {
    const { currentSessionId, readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
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

    // Immediately commit userMessage to both messages and sessions, and persist synchronously
    const currentSessions = get().sessions
    const sessionExists = currentSessions.some((s) => s.id === sessionId)
    let updatedSessionsWithUser
    if (sessionExists) {
      updatedSessionsWithUser = currentSessions.map((s) => {
        if (s.id === sessionId) {
          const isDefaultTitle = s.title === 'New Conversation' || !s.title
          return {
            ...s,
            title: isDefaultTitle ? content.slice(0, 45).trim() : s.title,
            messages: [...(s.messages || []), userMessage],
          }
        }
        return s
      })
    } else {
      const newSession = {
        id: sessionId,
        title: content.slice(0, 45).trim() || 'New Conversation',
        createdAt: new Date().toISOString(),
        messages: [userMessage],
      }
      updatedSessionsWithUser = [newSession, ...currentSessions]
    }

    set((s) => ({
      messages: [...s.messages, userMessage],
      sessions: updatedSessionsWithUser,
      currentSessionId: sessionId,
      isStreaming: true,
      error: null,
    }))
    persistSessions(updatedSessionsWithUser, sessionId)

    try {
      if (!get().isStreaming) return

      let aiContent = ''
      let citations = []
      let canVerify = false
      let apiLatency = ''
      let followUps = []

      try {
        const ragApiKey = getStoredRagApiKey()
        // Extract up to 8 turns of preceding conversation history
        const currentMsgs = get().messages || []
        const previousMessages = currentMsgs.slice(0, -1)
        const chatHistory = previousMessages.slice(-8).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (m.content?.text || m.content?.original || ''),
        }))
        const englishPrompt = await ensureEnglishQuery(content, selectedLanguage)

        const apiRes = await chatApi.query({
          sessionId,
          content: englishPrompt,
          originalQuery: content,
          chatHistory,
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
          apiLatency = apiRes.latency || ''
          if (Array.isArray(apiRes.followUps)) followUps = apiRes.followUps
        } else {
          aiContent = '### ⚠️ No Database Response\n\nThe Bureau of Indian Standards database did not return any records for this query.'
        }
      } catch (err) {
        aiContent = `### ⚠️ API Connection Error\n\n**Error:** ${err.message || 'Unknown network error'}\n\nUnable to retrieve records from the connected BIS database. Please try again.`
      }

      // If backend returned English fallback but user selected an Indian language, translate it
      if (selectedLanguage && selectedLanguage !== 'en' && aiContent && !/[\u0900-\u0DFF]/.test(aiContent)) {
        try {
          aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
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
        latency: apiLatency,
      }

      // Append aiMessage to active session and persist
      const finalSessions = get().sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...(s.messages || []), aiMessage],
          }
        }
        return s
      })

      set((s) => ({
        messages:   [...s.messages, aiMessage],
        isStreaming: false,
        sessions:   finalSessions,
      }))
      persistSessions(finalSessions, sessionId)
    } catch (err) {
      const errorAiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   `### ⚠️ Service Notice\n\n**Error:** ${err.message || 'Unable to process query'}\n\nPlease try again.`,
        citations: [],
        canVerify: false,
        followUps: [],
        readingMode,
        timestamp: new Date().toISOString(),
      }
      const errSessions = get().sessions.map((s) => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...(s.messages || []), errorAiMessage],
          }
        }
        return s
      })
      set((s) => ({
        messages:   [...s.messages, errorAiMessage],
        isStreaming: false,
        sessions:   errSessions,
        error:      err.message,
      }))
      persistSessions(errSessions, sessionId)
    }
  },

  // Regenerate the last assistant response
  regenerateLastResponse: async () => {
    const { messages, currentSessionId } = get()
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
    const updatedSessions = get().sessions.map((s) =>
      s.id === currentSessionId ? { ...s, messages: trimmedMessages } : s
    )
    set({ messages: trimmedMessages, sessions: updatedSessions, isStreaming: true, error: null })
    persistSessions(updatedSessions, currentSessionId)

    try {
      if (!get().isStreaming) return

      const { readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
      let aiContent = ''
      let citations = []
      let canVerify = false
      let apiLatency = ''
      let followUps = []

      try {
        const previousMessages = trimmedMessages.slice(0, -1)
        const chatHistory = previousMessages.slice(-8).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (m.content?.text || m.content?.original || ''),
        }))

        const englishPrompt = await ensureEnglishQuery(lastUserMsg.content, selectedLanguage)

        const apiRes = await chatApi.query({
          sessionId: currentSessionId,
          content: englishPrompt,
          originalQuery: lastUserMsg.content,
          chatHistory,
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
          apiLatency = apiRes.latency || ''
          if (Array.isArray(apiRes.followUps)) followUps = apiRes.followUps
        } else {
          aiContent = '### ⚠️ No Database Response\n\nThe Bureau of Indian Standards database did not return any records for this query.'
        }
      } catch (err) {
        aiContent = `### ⚠️ API Connection Error\n\n**Error:** ${err.message || 'Unknown network error'}\n\nUnable to retrieve records from the connected BIS database. Please try again.`
      }

      if (selectedLanguage && selectedLanguage !== 'en' && aiContent && !/[\u0900-\u0DFF]/.test(aiContent)) {
        try {
          aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
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
        latency: apiLatency,
      }

      const finalSessions = get().sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...trimmedMessages, aiMessage] }
          : s
      )

      set({
        messages:   [...trimmedMessages, aiMessage],
        isStreaming: false,
        sessions:   finalSessions,
      })
      persistSessions(finalSessions, currentSessionId)
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Edit an existing user message and regenerate response from there
  editAndResendMessage: async (messageId, newContent) => {
    const { messages, currentSessionId } = get()
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
    const updatedSessions = get().sessions.map((s) =>
      s.id === currentSessionId ? { ...s, messages: newHistory } : s
    )
    set({ messages: newHistory, sessions: updatedSessions, isStreaming: true, error: null })
    persistSessions(updatedSessions, currentSessionId)

    try {
      if (!get().isStreaming) return

      const { readingMode, selectedLanguage, manufacturerProfile, currentRole } = get()
      let aiContent = ''
      let citations = []
      let canVerify = false
      let apiLatency = ''
      let followUps = []

      try {
        const previousMessages = messages.slice(0, targetIdx)
        const chatHistory = previousMessages.slice(-8).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (m.content?.text || m.content?.original || ''),
        }))

        const englishPrompt = await ensureEnglishQuery(newContent, selectedLanguage)

        const apiRes = await chatApi.query({
          sessionId: currentSessionId,
          content: englishPrompt,
          originalQuery: newContent,
          chatHistory,
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
          apiLatency = apiRes.latency || ''
          if (Array.isArray(apiRes.followUps)) followUps = apiRes.followUps
        } else {
          aiContent = '### ⚠️ No Database Response\n\nThe Bureau of Indian Standards database did not return any records for this query.'
        }
      } catch (err) {
        aiContent = `### ⚠️ API Connection Error\n\n**Error:** ${err.message || 'Unknown network error'}\n\nUnable to retrieve records from the connected BIS database. Please try again.`
      }

      if (selectedLanguage && selectedLanguage !== 'en' && aiContent && !/[\u0900-\u0DFF]/.test(aiContent)) {
        try {
          aiContent = await translateToTargetLanguage(aiContent, selectedLanguage)
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
        latency: apiLatency,
      }

      const finalSessions = get().sessions.map((s) =>
        s.id === currentSessionId
          ? { ...s, messages: [...newHistory, aiMessage] }
          : s
      )

      set({
        messages:   [...newHistory, aiMessage],
        isStreaming: false,
        sessions:   finalSessions,
      })
      persistSessions(finalSessions, currentSessionId)
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
    const activeUser = getActiveUserFromStorage()
    persistSessions(updatedSessions, nextCurrentSessionId, activeUser)

    // Delete in PostgreSQL DB if user is signed in
    if (activeUser?.id && activeUser.id !== 'guest') {
      try {
        const token = localStorage.getItem('bis_token')
        if (token) {
          fetch(`/api/data?type=chat_sessions&sessionId=${sessionId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {})
        }
      } catch (_) {}
    }
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
