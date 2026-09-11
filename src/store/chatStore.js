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

const useChatStore = create((set, get) => ({
  sessions:        [],
  currentSessionId:null,
  messages:        [],
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
    set((s) => ({
      sessions:         [session, ...s.sessions],
      currentSessionId: sessionId,
      messages:         [],
    }))
    return sessionId
  },

  // Switch session
  switchSession: (sessionId) => {
    const session = get().sessions.find((s) => s.id === sessionId)
    if (!session) return
    set({ currentSessionId: sessionId, messages: session.messages || [] })
  },

  // Rename an existing session
  renameSession: (sessionId, newTitle) => {
    if (!newTitle?.trim()) return
    set((s) => ({
      sessions: s.sessions.map((sess) =>
        sess.id === sessionId ? { ...sess, title: newTitle.trim() } : sess
      ),
    }))
  },

  // Clear messages inside current active session
  clearCurrentMessages: () => {
    const { currentSessionId, sessions } = get()
    if (!currentSessionId) return
    set({
      messages: [],
      sessions: sessions.map((s) =>
        s.id === currentSessionId ? { ...s, messages: [] } : s
      ),
    })
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
        const apiRes = await chatApi.query({
          sessionId,
          content,
          language: selectedLanguage,
          mode: readingMode,
          role,
          manufacturerProfile,
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
    } catch (err) {
      set({ isStreaming: false, error: err.message })
    }
  },

  // Delete session
  deleteSession: (sessionId) => {
    set((s) => {
      const sessions = s.sessions.filter((x) => x.id !== sessionId)
      const currentSessionId = s.currentSessionId === sessionId
        ? sessions[0]?.id || null
        : s.currentSessionId
      return {
        sessions,
        currentSessionId,
        messages: currentSessionId === sessionId ? (sessions[0]?.messages || []) : s.messages,
      }
    })
  },

  // Language
  setLanguage: (lang, syncSettings = true) => {
    set({ selectedLanguage: lang })
    if (syncSettings) {
      import('./settingsStore')
        .then(({ default: useSettingsStore }) => {
          if (useSettingsStore?.getState()?.preferredLanguage !== lang) {
            useSettingsStore.getState().setPreferredLanguage(lang, false)
          }
        })
        .catch(() => {})
    }
  },

  // File upload
  addFile:    (file)  => set((s) => ({ uploadedFiles: [...s.uploadedFiles, file] })),
  removeFile: (index) => set((s) => ({
    uploadedFiles: s.uploadedFiles.filter((_, i) => i !== index)
  })),
  clearFiles: ()      => set({ uploadedFiles: [] }),

  clearError: () => set({ error: null }),
  clearChat:  () => set({ messages: [], currentSessionId: null }),
}))

export default useChatStore
