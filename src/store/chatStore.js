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

const loadSavedSessions = () => []

const loadSavedActiveSessionId = () => null

function persistSessions() {
  // Pure ephemeral mode: Zero chat data or queries stored in localStorage or cache
  if (typeof window !== 'undefined') {
    try {
      // Clean up any lingering chat session storage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('bis_chat_sessions') || key.startsWith('bis_active_session')) {
          localStorage.removeItem(key)
        }
      })
    } catch (_) {}
  }
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

// Intelligently detect if user requested a specific language in the query text
export function detectRequestedLanguage(queryText, fallbackLang = 'en') {
  if (!queryText || typeof queryText !== 'string') return fallbackLang || 'en'
  const text = queryText.trim()

  if (/\b(?:in\s+hindi|hindi\s+mein|hindi\s+me|reply\s+in\s+hindi|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+hindi|explain\s+in\s+hindi|answer\s+in\s+hindi|respond\s+in\s+hindi|tell\s+(?:me\s+)?in\s+hindi|translate\s+(?:to|in)\s+hindi|provide\s+in\s+hindi|hindi\s+please|in\s+hindhi)\b/i.test(text)) return 'hi'
  if (/\b(?:in\s+marathi|marathi\s+madhe|reply\s+in\s+marathi|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+marathi|explain\s+in\s+marathi|answer\s+in\s+marathi|respond\s+in\s+marathi|tell\s+(?:me\s+)?in\s+marathi|translate\s+(?:to|in)\s+marathi|provide\s+in\s+marathi|marathi\s+please)\b/i.test(text)) return 'mr'
  if (/\b(?:in\s+tamil|reply\s+in\s+tamil|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+tamil|explain\s+in\s+tamil|answer\s+in\s+tamil|respond\s+in\s+tamil|tell\s+(?:me\s+)?in\s+tamil|translate\s+(?:to|in)\s+tamil|provide\s+in\s+tamil|tamil\s+please)\b/i.test(text)) return 'ta'
  if (/\b(?:in\s+telugu|reply\s+in\s+telugu|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+telugu|explain\s+in\s+telugu|answer\s+in\s+telugu|respond\s+in\s+telugu|tell\s+(?:me\s+)?in\s+telugu|translate\s+(?:to|in)\s+telugu|provide\s+in\s+telugu|telugu\s+please)\b/i.test(text)) return 'te'
  if (/\b(?:in\s+bengali|in\s+bangla|reply\s+in\s+bengali|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+bengali|explain\s+in\s+bengali|answer\s+in\s+bengali|respond\s+in\s+bengali|tell\s+(?:me\s+)?in\s+bengali|translate\s+(?:to|in)\s+bengali|provide\s+in\s+bengali|bengali\s+please)\b/i.test(text)) return 'bn'
  if (/\b(?:in\s+gujarati|reply\s+in\s+gujarati|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+gujarati|explain\s+in\s+gujarati|answer\s+in\s+gujarati|respond\s+in\s+gujarati|tell\s+(?:me\s+)?in\s+gujarati|translate\s+(?:to|in)\s+gujarati|provide\s+in\s+gujarati|gujarati\s+please)\b/i.test(text)) return 'gu'
  if (/\b(?:in\s+kannada|reply\s+in\s+kannada|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+kannada|explain\s+in\s+kannada|answer\s+in\s+kannada|respond\s+in\s+kannada|tell\s+(?:me\s+)?in\s+kannada|translate\s+(?:to|in)\s+kannada|provide\s+in\s+kannada|kannada\s+please)\b/i.test(text)) return 'kn'
  if (/\b(?:in\s+malayalam|reply\s+in\s+malayalam|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+malayalam|explain\s+in\s+malayalam|answer\s+in\s+malayalam|respond\s+in\s+malayalam|tell\s+(?:me\s+)?in\s+malayalam|translate\s+(?:to|in)\s+malayalam|provide\s+in\s+malayalam|malayalam\s+please)\b/i.test(text)) return 'ml'
  if (/\b(?:in\s+punjabi|reply\s+in\s+punjabi|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+punjabi|explain\s+in\s+punjabi|answer\s+in\s+punjabi|respond\s+in\s+punjabi|tell\s+(?:me\s+)?in\s+punjabi|translate\s+(?:to|in)\s+punjabi|provide\s+in\s+punjabi|punjabi\s+please)\b/i.test(text)) return 'pa'
  if (/\b(?:in\s+odia|in\s+oriya|reply\s+in\s+odia|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+odia|explain\s+in\s+odia|answer\s+in\s+odia|respond\s+in\s+odia|tell\s+(?:me\s+)?in\s+odia|translate\s+(?:to|in)\s+odia|provide\s+in\s+odia|odia\s+please)\b/i.test(text)) return 'or'
  if (/\b(?:in\s+english|reply\s+in\s+english|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+english|explain\s+in\s+english|answer\s+in\s+english|respond\s+in\s+english|english\s+please)\b/i.test(text)) return 'en'

  if (/हिंदी\s*(?:में|मे)?|हिन्दी\s*(?:में|मे)?/i.test(text)) return 'hi'
  if (/मराठी\s*(?:मध्ये|त|तच)?/i.test(text)) return 'mr'
  if (/தமிழில்|தமிழ்/i.test(text)) return 'ta'
  if (/తెలుగులో|తెలుగు/i.test(text)) return 'te'
  if (/বাংলায়|বাংলা/i.test(text)) return 'bn'
  if (/ગુજરાતીમાં|ગુજરાતી/i.test(text)) return 'gu'
  if (/ಕನ್ನಡದಲ್ಲಿ|ಕನ್ನಡ/i.test(text)) return 'kn'
  if (/മലയാളത്തിൽ|മലയാളം/i.test(text)) return 'ml'
  if (/ਪੰਜਾਬੀ\s*(?:ਵਿੱਚ)?|ਪੰਜਾਬੀ/i.test(text)) return 'pa'
  if (/ଓଡ଼ିଆରେ|ଓଡ଼ିଆ/i.test(text)) return 'or'

  if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'
  if (/[\u0C00-\u0C7F]/.test(text)) return 'te'
  if (/[\u0980-\u09FF]/.test(text)) return 'bn'
  if (/[\u0A80-\u0AFF]/.test(text)) return 'gu'
  if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'
  if (/[\u0D00-\u0D7F]/.test(text)) return 'ml'
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa'
  if (/[\u0B00-\u0B7F]/.test(text)) return 'or'
  if (/[\u0900-\u097F]/.test(text)) {
    if (/(?:आहे|आहेत|करा|करावे|सांगा|मध्ये|माहिती|तक्रार|नोंदणी|नियम|कशी|कसा|काय|दागिन|सोन्या|पाहिजे)/i.test(text)) {
      return 'mr'
    }
    return 'hi'
  }

  return fallbackLang || 'en'
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

  // Sync user state when user logs in, switches accounts, or logs out
  syncWithUser: async (user) => {
    const targetUser = user || getActiveUserFromStorage()
    const { currentUserId, currentRole, isStreaming } = get()

    if (isStreaming) return
    if (currentUserId === (targetUser?.id || null) && currentRole === (targetUser?.role || 'consumer')) {
      return
    }

    set({
      currentUserId: targetUser?.id || null,
      currentUserRole: targetUser?.role || 'consumer',
      currentRole: targetUser?.role || 'consumer',
    })
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
      let apiRes = null

      try {
        const ragApiKey = getStoredRagApiKey()
        // Extract up to 8 turns of preceding conversation history
        const currentMsgs = get().messages || []
        const previousMessages = currentMsgs.slice(0, -1)
        const chatHistory = previousMessages.slice(-8).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (m.content?.text || m.content?.original || ''),
        }))
        const effectiveLang = detectRequestedLanguage(content, selectedLanguage)
        const englishPrompt = await ensureEnglishQuery(content, effectiveLang)

        apiRes = await chatApi.query({
          sessionId,
          content,
          englishQuery: englishPrompt,
          originalQuery: content,
          chatHistory,
          language: effectiveLang,
          mode: readingMode,
          role,
          manufacturerProfile,
          ragApiKey,
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.sources || apiRes.citations || []
          canVerify = apiRes.canVerify ?? (citations.length > 0)
          apiLatency = apiRes.latency || ''
          if (Array.isArray(apiRes.followUps)) followUps = apiRes.followUps
        } else {
          aiContent = '### 📋 BIS Saarthi Guidance\n\nPlease specify an Indian Standard code or product category to view statutory specifications, testing parameters, and recognized laboratories.'
        }
      } catch (err) {
        aiContent = `### ⚠️ API Connection Error\n\n**Error:** ${err.message || 'Unknown network error'}\n\nUnable to retrieve records from the connected BIS database. Please try again.`
      }

      // Sync UI language if a regional language was requested
      if (apiRes?.language && apiRes.language !== selectedLanguage && apiRes.language !== 'en') {
        set({ selectedLanguage: apiRes.language })
        try { localStorage.setItem('bis_selected_lang', apiRes.language) } catch (_) {}
      }

      const top5Sources = (citations || []).slice(0, 5).map(resolveDetailedCitation).filter(Boolean)

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        sources:   top5Sources,
        citations: top5Sources,
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
      let apiRes = null

      try {
        const previousMessages = trimmedMessages.slice(0, -1)
        const chatHistory = previousMessages.slice(-8).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (m.content?.text || m.content?.original || ''),
        }))

        const effectiveLang = detectRequestedLanguage(lastUserMsg.content, selectedLanguage)
        const englishPrompt = await ensureEnglishQuery(lastUserMsg.content, effectiveLang)

        apiRes = await chatApi.query({
          sessionId: currentSessionId,
          content: lastUserMsg.content,
          englishQuery: englishPrompt,
          originalQuery: lastUserMsg.content,
          chatHistory,
          language: effectiveLang,
          mode: readingMode,
          role: currentRole,
          manufacturerProfile,
          ragApiKey: getStoredRagApiKey(),
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.sources || apiRes.citations || []
          canVerify = apiRes.canVerify ?? (citations.length > 0)
          apiLatency = apiRes.latency || ''
          if (Array.isArray(apiRes.followUps)) followUps = apiRes.followUps
        } else {
          aiContent = '### 📋 BIS Saarthi Guidance\n\nPlease specify an Indian Standard code or product category to view statutory specifications, testing parameters, and recognized laboratories.'
        }
      } catch (err) {
        aiContent = `### ⚠️ API Connection Error\n\n**Error:** ${err.message || 'Unknown network error'}\n\nUnable to retrieve records from the connected BIS database. Please try again.`
      }

      // Sync UI language if a regional language was requested
      if (apiRes?.language && apiRes.language !== selectedLanguage && apiRes.language !== 'en') {
        set({ selectedLanguage: apiRes.language })
        try { localStorage.setItem('bis_selected_lang', apiRes.language) } catch (_) {}
      }

      const top5Sources = (citations || []).slice(0, 5).map(resolveDetailedCitation).filter(Boolean)

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        sources:   top5Sources,
        citations: top5Sources,
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
      let apiRes = null

      try {
        const previousMessages = messages.slice(0, targetIdx)
        const chatHistory = previousMessages.slice(-8).map((m) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : (m.content?.text || m.content?.original || ''),
        }))

        const effectiveLang = detectRequestedLanguage(newContent, selectedLanguage)
        const englishPrompt = await ensureEnglishQuery(newContent, effectiveLang)

        apiRes = await chatApi.query({
          sessionId: currentSessionId,
          content: newContent,
          englishQuery: englishPrompt,
          originalQuery: newContent,
          chatHistory,
          language: effectiveLang,
          mode: readingMode,
          role: currentRole,
          manufacturerProfile,
          ragApiKey: getStoredRagApiKey(),
        })
        if (apiRes?.content) {
          aiContent = apiRes.content
          citations = apiRes.sources || apiRes.citations || []
          canVerify = apiRes.canVerify ?? (citations.length > 0)
          apiLatency = apiRes.latency || ''
          if (Array.isArray(apiRes.followUps)) followUps = apiRes.followUps
        } else {
          aiContent = '### 📋 BIS Saarthi Guidance\n\nPlease specify an Indian Standard code or product category to view statutory specifications, testing parameters, and recognized laboratories.'
        }
      } catch (err) {
        aiContent = `### ⚠️ API Connection Error\n\n**Error:** ${err.message || 'Unknown network error'}\n\nUnable to retrieve records from the connected BIS database. Please try again.`
      }

      // Sync UI language if a regional language was requested
      if (apiRes?.language && apiRes.language !== selectedLanguage && apiRes.language !== 'en') {
        set({ selectedLanguage: apiRes.language })
        try { localStorage.setItem('bis_selected_lang', apiRes.language) } catch (_) {}
      }

      const top5Sources = (citations || []).slice(0, 5).map(resolveDetailedCitation).filter(Boolean)

      const aiMessage = {
        id:        genId('msg'),
        role:      'assistant',
        content:   aiContent,
        sources:   top5Sources,
        citations: top5Sources,
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
