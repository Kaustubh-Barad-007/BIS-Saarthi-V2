import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  Send, Paperclip, Mic, RefreshCw, Copy, ThumbsUp, ThumbsDown,
  Download, Bookmark, Map, FlaskConical, Award, MessageSquare,
  AlertTriangle, CheckCircle2, X, ChevronDown, ChevronRight, Plus, Trash2, Globe,
  Maximize2, Minimize2, Volume2, VolumeX, Edit2, Edit3, Check,
  Search, Sparkles, RotateCcw, Square, SlidersHorizontal, ExternalLink,
  Printer, FileText, HelpCircle, Type, Building2, BookOpen, ShieldCheck, Scale, FileBadge,
  PanelLeftOpen, PanelLeftClose, History, Key, Eye, EyeOff, Loader2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { resolveDetailedCitation, STANDARDS_REGISTRY } from '@/lib/standardsReferences'
import { toast } from 'sonner'
import useChatStore from '@/store/chatStore'
import useAuthStore from '@/store/authStore'
import useSettingsStore from '@/store/settingsStore'
import { cn, formatDateTime, truncate } from '@/lib/utils'
import { CHAT_OUTPUT_OPTIONS, LANGUAGES } from '@/lib/constants'
import { useTranslation } from '@/lib/i18n'
import LoadingSpinner from '@/components/common/LoadingSpinner'

// Phonetically normalize acronyms and units for clean speech pronunciation in Indian accents
function normalizeTextForSpeech(text, lang = 'en') {
  let s = (text || '')
    .replace(/[*#_`>~]/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\|[ -:|]+\|/g, '')
    .replace(/\|/g, ', ')

  if (lang === 'hi') {
    s = s
      .replace(/\bIS\s*(\d+)/gi, 'आई एस $1')
      .replace(/\bBIS\b/gi, 'भारतीय मानक ब्यूरो')
      .replace(/\bHUID\b/gi, 'एच यू आई डी')
      .replace(/\bISI\b/gi, 'आई एस आई')
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये')
      .replace(/%/g, ' प्रतिशत')
  } else if (lang === 'mr') {
    s = s
      .replace(/\bIS\s*(\d+)/gi, 'आय एस $1')
      .replace(/\bBIS\b/gi, 'भारतीय मानक ब्युरो')
      .replace(/\bHUID\b/gi, 'एच यू आय डी')
      .replace(/\bISI\b/gi, 'आय एस आय')
      .replace(/₹\s*([0-9,]+)/g, '$1 रुपये')
      .replace(/%/g, ' टक्के')
  } else {
    // English & generic
    s = s
      .replace(/\bIS\s*(\d+)/gi, 'Indian Standard $1')
      .replace(/\bHUID\b/gi, 'H-U-I-D')
      .replace(/\bISI\b/gi, 'I-S-I')
      .replace(/₹\s*([0-9,]+)/g, '$1 Rupees')
      .replace(/%/g, ' percent')
  }
  return s
}

// ── Message Bubble ──────────────────────────────────────
function MessageBubble({
  message,
  isLatestAssistant,
  onRegenerate,
  onEditUserPrompt,
  onOpenCitation,
  onOpenSourcesSidebar,
  onOpenFeedback,
  onSelectFollowUp,
  speakingMsgId,
  onToggleTTS,
  fontSizeClass,
  translatedContent,
  isSourcesOpen,
}) {
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const [bookmarked, setBookmarked] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editPrompt, setEditPrompt] = useState(message.content)
  const [showOriginal, setShowOriginal] = useState(false)
  const isUser = message.role === 'user'
  const { t } = useTranslation()

  const copyContent = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const handleFeedbackThumb = (type) => {
    if (type === 'down') {
      onOpenFeedback(message)
      return
    }
    if (feedback === 'up') {
      setFeedback(null)
    } else {
      setFeedback('up')
      toast.success('Thank you for rating this answer as helpful!')
    }
  }

  const handleBookmark = () => {
    setBookmarked(!bookmarked)
    toast.success(!bookmarked ? 'Answer saved to bookmarks' : 'Removed from bookmarks')
  }

  const handleSaveEdit = () => {
    if (!editPrompt.trim()) return
    setIsEditing(false)
    onEditUserPrompt(message.id, editPrompt.trim())
  }

  const isSpeaking = speakingMsgId === message.id

  return (
    <div className={cn('flex gap-3 group', isUser ? 'justify-end chat-message-user' : 'justify-start chat-message-ai')}>
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-gray-200 dark:border-dark-border shadow-xs shrink-0 mt-1 p-0.5 flex items-center justify-center">
          <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
        </div>
      )}

      <div className={cn('max-w-[85%] sm:max-w-[75%]', isUser ? 'items-end' : 'items-start')} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        
        {/* Inline User Prompt Editing Mode */}
        {isUser && isEditing ? (
          <div className="w-full min-w-[280px] sm:min-w-[380px] bg-white dark:bg-dark-bg-card border border-bis-navy/40 dark:border-blue-500/40 rounded-gov-xl p-3 shadow-card animate-fade-in">
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="w-full text-sm bg-gray-50 dark:bg-dark-bg p-2 rounded border border-gray-200 dark:border-dark-border outline-none resize-none text-gray-800 dark:text-dark-text"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={() => {
                  setEditPrompt(message.content)
                  setIsEditing(false)
                }}
                className="px-2.5 py-1 text-xs text-gray-600 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-secondary rounded"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-3 py-1 text-xs bg-bis-navy text-white rounded hover:bg-bis-navy-dark font-medium shadow-xs"
              >
                Save & Resubmit
              </button>
            </div>
          </div>
        ) : (
          /* Normal Message Bubble */
          <div className={cn(
            'px-4 py-3 rounded-gov-xl leading-relaxed transition-all',
            fontSizeClass,
            isUser
              ? 'bg-bis-navy text-white rounded-tr-none'
              : 'bg-white dark:bg-dark-bg-card border border-gray-100 dark:border-dark-border text-gray-800 dark:text-dark-text rounded-tl-none shadow-card'
          )}>
            {isUser ? (
              <div className="flex items-start justify-between gap-3">
                <p className="whitespace-pre-wrap">{message.content}</p>
                <button
                  onClick={() => setIsEditing(true)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-white/70 hover:text-white rounded hover:bg-white/10 shrink-0"
                  title="Edit prompt"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="ai-response">
                {translatedContent && (
                  <div className="mb-2 flex items-center justify-between text-[11px] bg-blue-50/80 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-gov border border-blue-200/80 dark:border-blue-800/40">
                    <span className="flex items-center gap-1.5 font-medium">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>Translated via Bhashini AI (MeitY)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowOriginal(!showOriginal)}
                      className="hover:underline text-[10px] font-bold text-bis-navy dark:text-blue-300 ml-2"
                    >
                      {showOriginal ? 'View Translation' : 'View Original (English)'}
                    </button>
                  </div>
                )}
                <ReactMarkdown>{showOriginal ? message.content : (translatedContent || message.content)}</ReactMarkdown>
              </div>
            )}

            {/* Uploaded files attachment */}
            {message.files?.length > 0 && (
              <div className="mt-2 space-y-1">
                {message.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-xs text-blue-300 bg-white/10 px-2 py-1 rounded">
                    <Paperclip className="w-3 h-3" /> {f.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {/* Cannot verify banner */}
        {!isUser && message.canVerify === false && (
          <div className="w-full mt-1 flex items-start gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-gov text-xs text-red-700 dark:text-red-400">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <span className="font-semibold">{t('cannot_verify_title', 'Cannot Verify')}</span> — {t('cannot_verify_desc', 'No direct BIS source match found. Try rephrasing your query or contact the BIS helpdesk.')}
            </div>
          </div>
        )}

        {/* Output actions (AI only) */}
        {!isUser && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-wrap">
            {/* Audio Read-Aloud / TTS button */}
            <button
              onClick={() => onToggleTTS(showOriginal ? message.content : (translatedContent || message.content), message.id)}
              className={cn(
                'p-1.5 rounded transition-all flex items-center gap-1 text-xs',
                isSpeaking
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 animate-pulse'
                  : 'text-gray-400 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-secondary'
              )}
              title={isSpeaking ? t('read_aloud', 'Stop read-aloud') : t('read_aloud', 'Read aloud via Bhashini Voice')}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="text-[10px] font-medium text-blue-600 dark:text-blue-400">{t('bhashini_speaking', 'Bhashini Speaking...')}</span>
                </>
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
            </button>

            {/* Copy button */}
            <button
              onClick={copyContent}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              title={t('copy_answer', 'Copy answer')}
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400 dark:text-dark-text-muted" />}
            </button>

            {/* Thumbs Up button */}
            <button
              onClick={() => handleFeedbackThumb('up')}
              className={cn(
                'p-1.5 rounded transition-colors',
                feedback === 'up'
                  ? 'text-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'text-gray-400 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-secondary'
              )}
              title={t('helpful', 'Helpful response')}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            {/* Thumbs Down button */}
            <button
              onClick={() => handleFeedbackThumb('down')}
              className="p-1.5 rounded text-gray-400 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-secondary hover:text-red-500 transition-colors"
              title={t('report_issue', 'Report issue with response')}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>

            {/* Bookmark button */}
            <button
              onClick={handleBookmark}
              className={cn(
                'p-1.5 rounded transition-colors',
                bookmarked
                  ? 'text-amber-500 fill-amber-500 bg-amber-50 dark:bg-amber-900/20'
                  : 'text-gray-400 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-secondary'
              )}
              title={bookmarked ? t('save_answer', 'Bookmarked') : t('save_answer', 'Save answer')}
            >
              <Bookmark className={cn("w-3.5 h-3.5", bookmarked && "fill-current")} />
            </button>

            {/* View Sources in Right Sidebar (hidden when sidebar is open) */}
            {!isSourcesOpen && message.citations?.length > 0 && (
              <button
                type="button"
                onClick={() => onOpenSourcesSidebar?.(message.citations[0])}
                className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 text-bis-navy dark:text-blue-400 transition-colors flex items-center gap-1 text-[11px] font-semibold border border-transparent hover:border-blue-200 dark:hover:border-blue-800/60"
                title="View cited standards in Right Sources Sidebar"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sources ({message.citations.length})</span>
              </button>
            )}

            {/* Regenerate button (latest assistant message only) */}
            {isLatestAssistant && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded text-gray-400 dark:text-dark-text-muted hover:bg-gray-100 dark:hover:bg-dark-bg-secondary hover:text-bis-navy dark:hover:text-blue-400 transition-colors flex items-center gap-1 text-[11px]"
                title={t('regenerate', 'Regenerate this response')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('regenerate', 'Regenerate')}</span>
              </button>
            )}
          </div>
        )}

        {/* Dynamic Contextual Follow-Up Suggestions (Smart Chips) */}
        {!isUser && isLatestAssistant && message.followUps?.length > 0 && (
          <div className="w-full mt-2 pt-2 border-t border-gray-100 dark:border-dark-border/60 animate-fade-in">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-dark-text-muted mb-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('suggested_follow_ups', 'Suggested follow-up questions:')}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {message.followUps.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => onSelectFollowUp(chip)}
                  className="text-left text-xs px-2.5 py-1.5 rounded-gov bg-gray-100/90 hover:bg-bis-light-bg dark:bg-dark-bg-secondary dark:hover:bg-blue-900/20 text-gray-700 hover:text-bis-navy dark:text-dark-text dark:hover:text-blue-300 border border-gray-200/80 dark:border-dark-border transition-all text-[11px] leading-snug"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Timestamp */}
        <span className="text-xs text-gray-400 dark:text-dark-text-muted px-1 mt-0.5">
          {formatDateTime(message.timestamp)}
        </span>
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-8 h-8 rounded-full bg-bis-saffron flex items-center justify-center text-white text-xs font-bold shrink-0 mt-1">
          {useAuthStore.getState().user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
    </div>
  )
}

// ── Chat Typing Indicator ────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 items-start animate-fade-in">
      <div className="w-8 h-8 rounded-full overflow-hidden bg-white border border-gray-200 dark:border-dark-border shadow-xs shrink-0 p-0.5 flex items-center justify-center">
        <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
      </div>
      <div className="bg-white dark:bg-dark-bg-card border border-gray-100 dark:border-dark-border rounded-gov-xl rounded-tl-none px-4 py-3 shadow-card">
        <div className="flex gap-1.5 items-center h-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-bis-navy/50 dark:bg-blue-400/50 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Quick Prompts ────────────────────────────────────────
const QUICK_PROMPTS = {
  consumer:     ['What is hallmarking of gold?', 'How to verify ISI mark on a product?', 'File a complaint about substandard goods'],
  manufacturer: ['What are the steps for ISI Mark certification?', 'List BIS recognized labs for electronic products', 'QCO requirements for my product category'],
  admin:        ['Show recent user queries', 'Knowledge base coverage gaps', 'Audit log summary for this week'],
}

const getLocalizedQuickPrompts = (role, lang) => {
  if (lang === 'hi') {
    if (role === 'manufacturer') {
      return [
        'आईएसआई मार्क प्रमाणन के चरण क्या हैं?',
        'इलेक्ट्रॉनिक उत्पादों के लिए बीआईएस मान्यता प्राप्त प्रयोगशालाएं',
        'मेरी उत्पाद श्रेणी के लिए क्यूसीओ आवश्यकताएं'
      ]
    }
    if (role === 'admin') {
      return [
        'हाल के नागरिक प्रश्न दिखाएं',
        'ज्ञानकोश कवरेज अंतराल',
        'इस सप्ताह का ऑडिट लॉग सारांश'
      ]
    }
    return [
      'सोने की हॉलमार्किंग क्या है?',
      'उत्पाद पर आईएसआई मार्क का सत्यापन कैसे करें?',
      'मानकहीन सामान की शिकायत कैसे दर्ज करें?'
    ]
  }
  if (lang === 'mr') {
    if (role === 'manufacturer') {
      return [
        'आयएसआय मार्क प्रमाणपत्राच्या पायऱ्या काय आहेत?',
        'इलेक्ट्रॉनिक उत्पादनांसाठी बीआयएस मान्यताप्राप्त प्रयोगशाळा',
        'माझ्या उत्पादन श्रेणीसाठी क्यूसीओ आवश्यकता'
      ]
    }
    if (role === 'admin') {
      return [
        'नुकतेच आलेले नागरिक प्रश्न दाखवा',
        'ज्ञानकोश कव्हरेज अंतर',
        'या आठवड्याचा ऑडिट लॉग सारांश'
      ]
    }
    return [
      'सोने हॉलमार्किंग म्हणजे काय?',
      'उत्पादनावरील आयएसआय मार्क कसा तपासावा?',
      'असुरक्षित किंवा निकृष्ट वस्तूंबद्दल तक्रार कशी करावी?'
    ]
  }
  return QUICK_PROMPTS[role] || QUICK_PROMPTS.consumer
}

// ── Main Chat Interface Component ────────────────────────
export default function ChatInterface({ role = 'consumer' }) {
  const {
    sessions, currentSessionId, messages, isStreaming,
    sendMessage, startSession, switchSession, deleteSession,
    setLanguage, selectedLanguage, addFile, uploadedFiles, removeFile, clearFiles,
    renameSession, clearCurrentMessages, readingMode, setReadingMode,
    chatFontSize, setChatFontSize, stopStreaming, regenerateLastResponse,
    editAndResendMessage,
    manufacturerProfile, setManufacturerProfile, resetManufacturerProfile,
    setRole,
  } = useChatStore()

  const { user } = useAuthStore()
  const settings = useSettingsStore()
  const { t } = useTranslation()

  // Local UI states
  const [input, setInput]                           = useState('')
  const [showSidebar, setShowSidebar]               = useState(false)
  const [showLang, setShowLang]                     = useState(false)
  const [showExportMenu, setShowExportMenu]         = useState(false)
  const [showFontMenu, setShowFontMenu]             = useState(false)
  const [isFullscreen, setIsFullscreen]             = useState(false)
  const [isListening, setIsListening]               = useState(false)
  const [speakingMsgId, setSpeakingMsgId]           = useState(null)
  const [searchQuery, setSearchQuery]               = useState('')
  const [translations, setTranslations]             = useState({})
  const [audioPlayer, setAudioPlayer]               = useState(null)
  const [gatewayDismissed, setGatewayDismissed]     = useState(false)
  
  // Set current role in chat store
  useEffect(() => {
    if (setRole) setRole(role)
  }, [role, setRole])
  
  // Manufacturer Profile & Continuous Context State
  const [showProfileModal, setShowProfileModal]     = useState(false)
  const [profileFormData, setProfileFormData]       = useState({
    companyName: manufacturerProfile?.companyName || '',
    productName: manufacturerProfile?.productName || '',
    productCategory: manufacturerProfile?.productCategory || 'Food & Agriculture Products',
    isStandard: manufacturerProfile?.isStandard || '',
    scale: manufacturerProfile?.scale || 'small',
    udyamNumber: manufacturerProfile?.udyamNumber || '',
    factoryLocation: manufacturerProfile?.factoryLocation || '',
    testingLabFacility: manufacturerProfile?.testingLabFacility || 'in-house',
    targetScheme: manufacturerProfile?.targetScheme || 'Scheme-I ISI Mark',
  })

  // Synchronize profileFormData when manufacturerProfile updates
  useEffect(() => {
    if (manufacturerProfile) {
      setProfileFormData({
        companyName: manufacturerProfile.companyName || '',
        productName: manufacturerProfile.productName || '',
        productCategory: manufacturerProfile.productCategory || 'Food & Agriculture Products',
        isStandard: manufacturerProfile.isStandard || '',
        scale: manufacturerProfile.scale || 'small',
        udyamNumber: manufacturerProfile.udyamNumber || '',
        factoryLocation: manufacturerProfile.factoryLocation || '',
        testingLabFacility: manufacturerProfile.testingLabFacility || 'in-house',
        targetScheme: manufacturerProfile.targetScheme || 'Scheme-I ISI Mark',
      })
    }
  }, [manufacturerProfile])

  const handleFillSampleProfile = () => {
    setProfileFormData({
      companyName: 'Apex Polymers Pvt. Ltd.',
      productName: 'Packaged Drinking Water',
      productCategory: 'Food & Agriculture Products',
      isStandard: 'IS 14543:2016',
      scale: 'small',
      udyamNumber: 'UDYAM-MH-12-0049281',
      factoryLocation: 'Pune, Maharashtra',
      testingLabFacility: 'in-house',
      targetScheme: 'Scheme-I ISI Mark',
    })
    toast.success('Sample MSME details prefilled! Click Save to activate.')
  }

  const handleSaveProfile = (e) => {
    if (e) e.preventDefault()
    if (!profileFormData.companyName.trim() || !profileFormData.productName.trim() || !profileFormData.isStandard.trim()) {
      toast.error('Please enter Company Name, Product Name, and IS Standard.')
      return
    }
    setManufacturerProfile(profileFormData)
    setShowProfileModal(false)
    toast.success(`Factory profile for "${profileFormData.companyName}" locked in! Continuous context is now active.`)
  }

  // Modals
  const [sessionToDelete, setSessionToDelete]       = useState(null)
  const [showClearConfirm, setShowClearConfirm]     = useState(false)
  const [inspectCitation, setInspectCitation]       = useState(null)
  const [feedbackMessage, setFeedbackMessage]       = useState(null)
  const [feedbackReason, setFeedbackReason]         = useState('')
  const [showShortcuts, setShowShortcuts]           = useState(false)

  // RAG API Key Modal State
  const DEFAULT_RAG_KEY = typeof atob !== 'undefined' ? atob('QVEuQWI4Uk42SllMX21rSkdfY01lS3E2SnhTOXdrWlFQaTBZcGkzeE81dG9WalZmY3hoNkE=') : ''
  const [showRagKeyModal, setShowRagKeyModal] = useState(false)
  const [ragKeyInput, setRagKeyInput]         = useState(settings.ragApiKey || DEFAULT_RAG_KEY)
  const [isTestingRagKey, setIsTestingRagKey] = useState(false)
  const [showKeyPassword, setShowKeyPassword] = useState(false)

  useEffect(() => {
    if (settings.ragApiKey) {
      setRagKeyInput(settings.ragApiKey)
    }
  }, [settings.ragApiKey])

  const handleSaveRagKey = () => {
    if (!ragKeyInput.trim()) {
      toast.error('Please enter a valid Gemini API key')
      return
    }
    settings.setRagApiKey(ragKeyInput.trim())
    setShowRagKeyModal(false)
    toast.success('RAG Gemini API Key saved and active!')
  }

  const handleResetRagKey = () => {
    setRagKeyInput(DEFAULT_RAG_KEY)
    settings.setRagApiKey(DEFAULT_RAG_KEY)
    toast.info('Reset to default Gemini RAG API key')
  }

  const handleTestRagKey = async () => {
    if (!ragKeyInput.trim()) {
      toast.error('Please enter an API key to test')
      return
    }
    setIsTestingRagKey(true)
    try {
      const res = await fetch('/api/chat/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Test connection: What is BIS ISI mark?',
          ragApiKey: ragKeyInput.trim(),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success('API Key validated! Gemini response received successfully.')
      } else {
        toast.error(`Verification failed: ${data.message || 'Invalid key or quota exceeded'}`)
      }
    } catch (err) {
      toast.error(`Connection failed: ${err.message}`)
    } finally {
      setIsTestingRagKey(false)
    }
  }

  // Right Sources & Regulatory References Sidebar State
  const [showSourcesSidebar, setShowSourcesSidebar]       = useState(false)
  const [sourcesSearchQuery, setSourcesSearchQuery]       = useState('')
  const [sourcesActiveTab, setSourcesActiveTab]           = useState('cited') // 'cited' | 'directory'
  const [highlightedSourceKey, setHighlightedSourceKey]   = useState(null)

  // Unique citations extracted across current conversation (newest first)
  const conversationCitations = useMemo(() => {
    const list = []
    const seen = new Set()
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      if (msg.role === 'assistant' && msg.citations && msg.citations.length > 0) {
        for (const rawCite of msg.citations) {
          const resolved = resolveDetailedCitation(rawCite)
          if (!resolved) continue
          const key = (resolved.source || '').toLowerCase().trim()
          if (!seen.has(key)) {
            seen.add(key)
            list.push({
              ...resolved,
              messageId: msg.id,
              timestamp: msg.timestamp,
            })
          }
        }
      }
    }
    return list
  }, [messages])

  // Catalog of standards from STANDARDS_REGISTRY
  const standardsDirectory = useMemo(() => {
    return Object.values(STANDARDS_REGISTRY).map(entry => resolveDetailedCitation(entry))
  }, [])

  // Filtered citations based on sourcesSearchQuery
  const filteredCitedCitations = useMemo(() => {
    if (!sourcesSearchQuery.trim()) return conversationCitations
    const q = sourcesSearchQuery.toLowerCase()
    return conversationCitations.filter(c =>
      c.source?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.clause?.toLowerCase().includes(q) ||
      c.committee?.toLowerCase().includes(q) ||
      c.actReference?.toLowerCase().includes(q)
    )
  }, [conversationCitations, sourcesSearchQuery])

  const filteredDirectory = useMemo(() => {
    if (!sourcesSearchQuery.trim()) return standardsDirectory
    const q = sourcesSearchQuery.toLowerCase()
    return standardsDirectory.filter(c =>
      c.source?.toLowerCase().includes(q) ||
      c.title?.toLowerCase().includes(q) ||
      c.clause?.toLowerCase().includes(q) ||
      c.committee?.toLowerCase().includes(q) ||
      c.actReference?.toLowerCase().includes(q)
    )
  }, [standardsDirectory, sourcesSearchQuery])

  const handleOpenSourcesSidebar = (cite) => {
    setShowSourcesSidebar(true)
    setSourcesActiveTab('cited')
    if (cite?.source) {
      setHighlightedSourceKey(cite.source)
      setTimeout(() => {
        const el = document.getElementById(`sidebar-cite-${cite.source}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    }
  }

  // Automatically display supporting RAG document in the right sidebar when AI response arrives with citations
  useEffect(() => {
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg.role === 'assistant' && lastMsg.citations?.length > 0) {
        setShowSourcesSidebar(true)
        setSourcesActiveTab('cited')
        if (lastMsg.citations[0]?.source) {
          setHighlightedSourceKey(lastMsg.citations[0].source)
        }
      }
    }
  }, [messages])
  
  // Inline rename state in sidebar
  const [editingSessionId, setEditingSessionId]     = useState(null)
  const [renameTitleInput, setRenameTitleInput]     = useState('')

  const recognitionRef  = useRef(null)
  const fileInputRef    = useRef(null)
  const messagesEndRef  = useRef(null)
  const textareaRef     = useRef(null)
  const chatContainerRef = useRef(null)

  // ── Drag-to-Resize State & Handlers for Left & Right Sidebars ──
  const [leftSidebarWidth, setLeftSidebarWidth]   = useState(280)
  const [rightSidebarWidth, setRightSidebarWidth] = useState(380)
  const [isDraggingLeft, setIsDraggingLeft]       = useState(false)
  const [isDraggingRight, setIsDraggingRight]     = useState(false)

  const startDraggingLeft = useCallback((e) => {
    e.preventDefault()
    setIsDraggingLeft(true)
  }, [])

  const startDraggingRight = useCallback((e) => {
    e.preventDefault()
    setIsDraggingRight(true)
  }, [])

  useEffect(() => {
    if (!isDraggingLeft && !isDraggingRight) return

    const handleMouseMove = (e) => {
      if (!chatContainerRef.current) return
      const rect = chatContainerRef.current.getBoundingClientRect()

      if (isDraggingLeft) {
        const newWidth = Math.min(Math.max(200, e.clientX - rect.left), Math.min(520, window.innerWidth * 0.45))
        setLeftSidebarWidth(Math.round(newWidth))
      } else if (isDraggingRight) {
        const newWidth = Math.min(Math.max(280, rect.right - e.clientX), Math.min(650, window.innerWidth * 0.5))
        setRightSidebarWidth(Math.round(newWidth))
      }
    }

    const handleMouseUp = () => {
      setIsDraggingLeft(false)
      setIsDraggingRight(false)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isDraggingLeft, isDraggingRight])

  // Cleanup speech synthesis, audio player & recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
      if (audioPlayer) {
        audioPlayer.pause()
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [audioPlayer])

  // Translate assistant messages when language is changed via Bhashini NMT
  useEffect(() => {
    if (selectedLanguage === 'en') return
    const assistantMessages = messages.filter((m) => m.role === 'assistant')
    assistantMessages.forEach(async (msg) => {
      if (translations[msg.id]?.[selectedLanguage]) return
      try {
        const res = await fetch('/api/bhashini/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: msg.content,
            sourceLanguage: 'en',
            targetLanguage: selectedLanguage,
          }),
        })
        const data = await res.json()
        if (data.translatedText) {
          setTranslations((prev) => ({
            ...prev,
            [msg.id]: {
              ...(prev[msg.id] || {}),
              [selectedLanguage]: data.translatedText,
            },
          }))
        }
      } catch (err) {
        console.warn('Bhashini translation notice:', err)
      }
    })
  }, [selectedLanguage, messages])

  // Font size class mapping
  const fontSizeMap = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  }
  const currentFontSizeClass = fontSizeMap[chatFontSize] || 'text-sm'

  // Bhashini Text-To-Speech (Read Aloud) handler
  const toggleTTS = async (text, messageId) => {
    if (speakingMsgId === messageId) {
      if (audioPlayer) {
        audioPlayer.pause()
        setAudioPlayer(null)
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
      setSpeakingMsgId(null)
      return
    }

    if (audioPlayer) {
      audioPlayer.pause()
      setAudioPlayer(null)
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }

    setSpeakingMsgId(messageId)

    const cleanText = text
      .replace(/[*#_`>~]/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\|[ -:|]+\|/g, '')
      .replace(/\|/g, ', ')

    const phoneticText = normalizeTextForSpeech(cleanText, selectedLanguage)

    try {
      const resp = await fetch('/api/bhashini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: phoneticText,
          language: selectedLanguage,
          gender: settings.bhashiniVoice || 'female',
        }),
      })
      const data = await resp.json()

      if (data.audioContent) {
        const audio = new Audio(`data:audio/${data.audioFormat || 'wav'};base64,${data.audioContent}`)
        audio.playbackRate = settings.speechRate || 1.0
        setAudioPlayer(audio)
        audio.onended = () => {
          setSpeakingMsgId(null)
          setAudioPlayer(null)
        }
        audio.onerror = () => {
          setSpeakingMsgId(null)
          setAudioPlayer(null)
        }
        await audio.play()
        return
      }
    } catch (e) {
      console.warn('Bhashini TTS fallback:', e)
    }

    // High-fidelity Indian Speech Synthesis Fallback with Native Indian Voice Selection
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phoneticText)
      const langObj = LANGUAGES.find((l) => l.code === selectedLanguage)
      const targetVoiceLang = (langObj?.voiceLang || 'en-IN').toLowerCase()
      const shortLang = (selectedLanguage || 'en').toLowerCase()

      utterance.lang = langObj?.voiceLang || 'en-IN'
      utterance.rate = settings.speechRate || 1.0
      utterance.pitch = settings.speechPitch || 1.0

      // Match native Indian voice for flawless pronunciation
      const voices = window.speechSynthesis.getVoices()
      if (voices && voices.length > 0) {
        let matchedVoice = voices.find((v) => {
          const vLang = v.lang.toLowerCase().replace('_', '-')
          return vLang === targetVoiceLang
        })
        if (!matchedVoice) {
          matchedVoice = voices.find((v) => v.lang.toLowerCase().startsWith(shortLang))
        }
        if (!matchedVoice && shortLang === 'en') {
          matchedVoice = voices.find((v) => v.lang.toLowerCase().includes('in') && v.lang.toLowerCase().startsWith('en'))
        }
        if (matchedVoice) {
          utterance.voice = matchedVoice
        }
      }

      utterance.onend = () => setSpeakingMsgId(null)
      utterance.onerror = () => setSpeakingMsgId(null)
      window.speechSynthesis.speak(utterance)
    } else {
      setSpeakingMsgId(null)
      toast.error('Audio playback is not supported in this browser')
    }
  }

  // Voice dictation & cross-lingual Speech-to-English translation via Bhashini
  const toggleVoiceInput = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice dictation is not supported in this browser')
      return
    }

    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognitionRef.current = recognition

    const langObj = LANGUAGES.find((l) => l.code === selectedLanguage)
    recognition.lang = langObj?.voiceLang || 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => {
      setIsListening(true)
      toast.info(`Listening in ${langObj?.label || 'Hindi'}... Speak into microphone`)
    }

    recognition.onresult = async (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript
      if (transcript) {
        if (settings.autoTranslateVoiceToEnglish && selectedLanguage !== 'en') {
          toast.info(`Captured: "${transcript}". Translating to English via Bhashini...`)
          try {
            const resp = await fetch('/api/bhashini/asr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transcript,
                sourceLanguage: selectedLanguage,
                targetLanguage: 'en',
              }),
            })
            const data = await resp.json()
            const englishText = data.translatedText || transcript
            setInput((prev) => (prev ? `${prev} ${englishText}` : englishText))
            toast.success(`Voice translated to English: "${englishText}"`)
          } catch (err) {
            setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
            toast.success('Voice captured!')
          }
        } else {
          setInput((prev) => (prev ? `${prev} ${transcript}` : transcript))
          toast.success('Voice captured!')
        }
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        toast.error('Microphone permission denied. Please allow microphone access.')
      } else if (event.error !== 'no-speech') {
        toast.error(`Voice error: ${event.error}`)
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    try {
      recognition.start()
    } catch (err) {
      console.error(err)
      setIsListening(false)
    }
  }

  // ESC key to exit fullscreen immersive mode or close active popups
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (inspectCitation) setInspectCitation(null)
        else if (feedbackMessage) setFeedbackMessage(null)
        else if (showClearConfirm) setShowClearConfirm(false)
        else if (sessionToDelete) setSessionToDelete(null)
        else if (showShortcuts) setShowShortcuts(false)
        else if (isFullscreen) setIsFullscreen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen, inspectCitation, feedbackMessage, showClearConfirm, sessionToDelete, showShortcuts])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isStreaming])

  // Send message
  const handleSend = async () => {
    const text = input.trim()
    if (!text && uploadedFiles.length === 0) return
    setGatewayDismissed(true)
    settings.playSound('send')
    setInput('')
    await sendMessage(text, { files: uploadedFiles, role })
    clearFiles()
    settings.playSound('receive')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e) => {
    Array.from(e.target.files || []).forEach((file) => addFile(file))
    e.target.value = ''
  }

  // Export handlers
  const handleExport = (format) => {
    setShowExportMenu(false)
    if (messages.length === 0) {
      toast.info('No messages to export')
      return
    }

    const sessionObj = sessions.find((s) => s.id === currentSessionId)
    const title = sessionObj?.title || 'BIS-Saarthi-Transcript'
    const dateStr = new Date().toISOString().split('T')[0]

    if (format === 'markdown') {
      let md = `# ${title}\n`
      md += `*Exported from BIS Saarthi AI on ${new Date().toLocaleString()}*\n`
      md += `*Language: ${selectedLanguage.toUpperCase()}*\n\n---\n\n`
      messages.forEach((m) => {
        const roleName = m.role === 'user' ? 'User' : 'BIS Saarthi AI'
        md += `### ${roleName} (${new Date(m.timestamp).toLocaleTimeString()})\n\n${m.content}\n\n`
        if (m.citations?.length) {
          md += `**Citations:**\n`
          m.citations.forEach((c) => {
            md += `- ${c.source}, ${c.clause || ''} (${c.version || ''})\n`
          })
          md += `\n`
        }
      })
      const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.md`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Transcript exported as Markdown (.md)')
    } else if (format === 'text') {
      let txt = `${title}\nExported from BIS Saarthi AI on ${new Date().toLocaleString()}\n\n========================================\n\n`
      messages.forEach((m) => {
        const roleName = m.role === 'user' ? 'USER' : 'BIS SAARTHI AI'
        txt += `[${roleName}] - ${new Date(m.timestamp).toLocaleTimeString()}\n`
        txt += `${m.content}\n\n`
      })
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${dateStr}.txt`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Transcript exported as Plain Text (.txt)')
    } else if (format === 'print') {
      window.print()
    }
  }

  // Save inline rename
  const handleSaveRename = (sessionId) => {
    if (renameTitleInput.trim()) {
      renameSession(sessionId, renameTitleInput.trim())
      toast.success('Conversation renamed')
    }
    setEditingSessionId(null)
    setRenameTitleInput('')
  }

  // Filtered session list
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const quickPrompts = (role === 'manufacturer' && manufacturerProfile?.isProfileComplete)
    ? [
        `What are the Scheme-I fee concessions for ${manufacturerProfile.companyName}?`,
        `Show mandatory SIT testing equipment required for ${manufacturerProfile.isStandard}`,
        `Which NABL laboratories nearest to ${manufacturerProfile.factoryLocation} test ${manufacturerProfile.productName}?`,
      ]
    : getLocalizedQuickPrompts(role, selectedLanguage)

  // Identify index of last assistant message
  let lastAssistantIdx = -1
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'assistant') {
      lastAssistantIdx = i
      break
    }
  }

  return (
    <div
      ref={chatContainerRef}
      className={cn(
        'flex bg-slate-50 dark:bg-dark-bg transition-all duration-200 overflow-hidden relative',
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-screen rounded-none shadow-2xl border-0'
          : 'h-[calc(100dvh-125px)] md:h-[calc(100vh-80px)] rounded-gov-xl shadow-gov border border-gray-200 dark:border-dark-border'
      )}
    >

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border gap-2 flex-wrap sm:flex-nowrap">
          {/* Left: New Chat & Title */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => startSession()}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 dark:bg-dark-bg-card dark:border-dark-border dark:text-dark-text transition-all text-xs font-semibold shadow-2xs cursor-pointer"
              title="Start New Conversation"
            >
              <Plus className="w-3.5 h-3.5 text-gov-navy dark:text-blue-400 shrink-0" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-dark-text">{t('chat_header_title', 'BIS Saarthi AI')}</h2>
                {isFullscreen && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-medium">
                    {t('immersive_mode', 'Immersive Mode')}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-dark-text-muted">
                {t('chat_header_sub', 'Official Knowledge Layer')} · {messages.length} messages
              </p>
            </div>
          </div>

          {/* Right: Controls (Sources, Language, Font Size, Export, Clear, Fullscreen) */}
          <div className="flex items-center gap-1.5 flex-wrap">

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-dark-border rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary text-gray-600 dark:text-dark-text-muted transition-colors"
                title={t('export_label', 'Export conversation transcript')}
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{t('export_label', 'Export')}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </button>
              {showExportMenu && (
                <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-dark-bg-card rounded-gov shadow-gov-md border border-gray-100 dark:border-dark-border z-20 py-1">
                  <button
                    onClick={() => handleExport('text')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-bg-secondary flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-gray-500" /> {t('export_text', 'Export Plain Text (.txt)')}
                  </button>
                  <button
                    onClick={() => handleExport('print')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-bg-secondary flex items-center gap-2 border-t border-gray-100 dark:border-dark-border"
                  >
                    <Printer className="w-3.5 h-3.5 text-purple-500" /> {t('export_print', 'Print / Save as PDF')}
                  </button>
                </div>
              )}
            </div>

            {/* Clear Current Chat Messages */}
            <button
              onClick={() => setShowClearConfirm(true)}
              disabled={messages.length === 0}
              className="p-1.5 rounded border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-secondary disabled:opacity-40 text-gray-500 dark:text-dark-text-muted transition-colors"
              title={t('clear_chat_tooltip', 'Clear current messages')}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setShowLang(!showLang)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-dark-border rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors text-gray-600 dark:text-dark-text-muted"
                title="Select language"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{LANGUAGES.find(l => l.code === selectedLanguage)?.native || 'EN'}</span>
              </button>
              {showLang && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-dark-bg-card rounded-gov shadow-gov-md border border-gray-100 dark:border-dark-border z-20 py-1">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLang(false) }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors',
                        selectedLanguage === lang.code && 'text-bis-navy font-semibold'
                      )}
                    >
                      {lang.label} — {lang.native}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Immersive Mode Toggle (Desktop only) */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={cn(
                'hidden md:flex items-center gap-1 text-xs px-2 py-1.5 border rounded-gov transition-colors',
                isFullscreen
                  ? 'bg-bis-navy text-white border-bis-navy dark:bg-blue-600 dark:border-blue-600 shadow-xs'
                  : 'border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-secondary text-gray-700 dark:text-dark-text'
              )}
              title={isFullscreen ? "Exit Immersive Mode (Esc)" : "Full Screen Immersive Mode"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden lg:inline text-[11px]">Full</span>
                </>
              )}
            </button>

            {/* RAG API Key Setup */}
            <button
              type="button"
              onClick={() => setShowRagKeyModal(true)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-amber-300 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/30 rounded-gov hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-900 dark:text-amber-300 transition-all shadow-2xs cursor-pointer font-semibold"
              title="Configure Gemini RAG API Key"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="hidden sm:inline text-[11px]">RAG Key</span>
            </button>

            {/* Sources & References Sidebar Toggle (disappears when open) */}
            {!showSourcesSidebar && (
              <button
                type="button"
                onClick={() => setShowSourcesSidebar(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border rounded-gov transition-all shadow-xs border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-bg-secondary text-gray-700 dark:text-dark-text cursor-pointer"
                title="Show Sources & References Sidebar"
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span className="hidden sm:inline text-[11px]">Sources</span>
                {conversationCitations.length > 0 && (
                  <span className="bg-bis-navy dark:bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {conversationCitations.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Active Manufacturer Context Bar ── */}
        {role === 'manufacturer' && manufacturerProfile?.isProfileComplete && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border-b border-amber-200/80 dark:border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs animate-fade-in gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{manufacturerProfile.companyName}</span>
              </div>
              <span className="text-amber-300 dark:text-amber-700 hidden sm:inline">•</span>
              <span className="text-[11px] bg-white dark:bg-dark-bg px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/80 font-mono text-gray-800 dark:text-dark-text font-semibold">
                {manufacturerProfile.productName} ({manufacturerProfile.isStandard})
              </span>
              <span className="text-[11px] bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-300 px-2 py-0.5 rounded font-medium border border-green-200 dark:border-green-800">
                {(manufacturerProfile.scale || 'MSME').toUpperCase()} MSME (50% Concession)
              </span>
              <span className="text-gray-600 dark:text-dark-text-muted text-[11px] hidden md:inline">
                📍 {manufacturerProfile.factoryLocation}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setProfileFormData({ ...manufacturerProfile })
                  setShowProfileModal(true)
                }}
                className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white px-2.5 py-1 bg-white/70 dark:bg-dark-bg/70 hover:bg-white dark:hover:bg-dark-bg rounded border border-amber-200 dark:border-amber-800/80 transition-colors flex items-center gap-1"
                title="Update enterprise details & context"
              >
                <Edit3 className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>Update Profile Context</span>
              </button>
            </div>
          </div>
        )}

        {/* ── Optional Manufacturer Context Setup Bar (when profile incomplete) ── */}
        {role === 'manufacturer' && !manufacturerProfile?.isProfileComplete && (
          <div className="bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-800/60 px-4 py-2 flex items-center justify-between text-xs animate-fade-in gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Personalize enterprise context for automatic 50% MSME fee calculations &amp; local lab checks.</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleFillSampleProfile}
                className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-950 dark:hover:text-white px-2.5 py-1 bg-white dark:bg-dark-bg rounded border border-amber-300 dark:border-amber-800 transition-colors flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>1-Click Sample MSME</span>
              </button>
              <button
                type="button"
                onClick={() => setShowProfileModal(true)}
                className="btn-saffron text-[11px] py-1 px-3 flex items-center gap-1 shadow-xs"
              >
                <Edit3 className="w-3 h-3" />
                <span>Setup Company Profile</span>
              </button>
            </div>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && !isStreaming && (
            role === 'manufacturer' && !manufacturerProfile?.isProfileComplete && !gatewayDismissed ? (
              <div className="w-full max-w-2xl mx-auto bg-white dark:bg-dark-bg-card border border-amber-200 dark:border-amber-800/80 rounded-gov-xl p-6 shadow-gov-md animate-slide-up text-left my-auto">
                <div className="flex items-start justify-between border-b border-gray-100 dark:border-dark-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-gov bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 dark:text-dark-text font-heading">
                        Manufacturer Compliance Gateway & Context Setup
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-0.5">
                        Please provide your manufacturing profile so BIS Saarthi can personalize all standard clauses, SIT testing requirements, and 50% MSME marking fee benefits for all your questions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleFillSampleProfile}
                      className="px-2.5 py-1 rounded bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 text-amber-800 dark:text-amber-300 text-[11px] font-semibold border border-amber-300 dark:border-amber-800 transition-colors shrink-0 flex items-center gap-1"
                      title="Quick-fill sample MSME data"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>1-Click Sample MSME</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setGatewayDismissed(true)}
                      className="px-2.5 py-1 rounded bg-gray-100 dark:bg-dark-bg-secondary hover:bg-gray-200 dark:hover:bg-dark-border text-gray-700 dark:text-dark-text text-[11px] font-semibold border border-gray-300 dark:border-dark-border transition-colors shrink-0"
                      title="Chat directly without filling profile"
                    >
                      Chat Directly &rarr;
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                  <div className="grid sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Company / Enterprise Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.companyName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, companyName: e.target.value })}
                        placeholder="e.g., Apex Polymers Pvt. Ltd."
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Manufacturing Product *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.productName}
                        onChange={(e) => setProfileFormData({ ...profileFormData, productName: e.target.value })}
                        placeholder="e.g., Packaged Drinking Water, LED Bulb"
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Applicable Indian Standard (IS Code) *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.isStandard}
                        onChange={(e) => setProfileFormData({ ...profileFormData, isStandard: e.target.value })}
                        placeholder="e.g., IS 14543:2016, IS 16102, IS 302"
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Industry / Product Category
                      </label>
                      <select
                        value={profileFormData.productCategory}
                        onChange={(e) => setProfileFormData({ ...profileFormData, productCategory: e.target.value })}
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500"
                      >
                        <option value="Food & Agriculture Products">Food & Agriculture (Drinking Water, Milk, etc.)</option>
                        <option value="Electrical & Electronics">Electrical & Electronics (Appliances, Cables, LED)</option>
                        <option value="Mechanical & Automotive">Mechanical & Automotive (Helmets, Valves, Pumps)</option>
                        <option value="Chemical & Petrochemical">Chemical & Petrochemical (Pipes, Paints, Polymers)</option>
                        <option value="Civil Engineering & Construction">Civil & Construction (Cement, Steel, Glass)</option>
                        <option value="Medical Devices">Medical Devices & Diagnostics</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        MSME Enterprise Scale (Determines Concessions)
                      </label>
                      <select
                        value={profileFormData.scale}
                        onChange={(e) => setProfileFormData({ ...profileFormData, scale: e.target.value })}
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500 font-medium"
                      >
                        <option value="micro">Micro Enterprise (&lt; ₹1 Cr / ₹5 Cr) — 50% Concession</option>
                        <option value="small">Small Enterprise (&lt; ₹10 Cr / ₹50 Cr) — 50% Concession</option>
                        <option value="medium">Medium Enterprise (&lt; ₹50 Cr / ₹250 Cr)</option>
                        <option value="large">Large / Non-MSME Enterprise</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Udyam Registration Number
                      </label>
                      <input
                        type="text"
                        value={profileFormData.udyamNumber}
                        onChange={(e) => setProfileFormData({ ...profileFormData, udyamNumber: e.target.value })}
                        placeholder="e.g., UDYAM-MH-12-0049281"
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Factory / Plant Location *
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFormData.factoryLocation}
                        onChange={(e) => setProfileFormData({ ...profileFormData, factoryLocation: e.target.value })}
                        placeholder="e.g., MIDC Bhosari, Pune, Maharashtra"
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">
                        Testing Readiness & Scheme
                      </label>
                      <select
                        value={profileFormData.testingLabFacility}
                        onChange={(e) => setProfileFormData({ ...profileFormData, testingLabFacility: e.target.value })}
                        className="w-full p-2.5 rounded bg-gray-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text outline-none focus:border-bis-navy dark:focus:border-blue-500"
                      >
                        <option value="in-house">In-House Quality Control Lab Setup</option>
                        <option value="bis-recognized">Using BIS-Recognized / NABL Partner Lab</option>
                        <option value="none">Need Assistance with SIT Testing Setup</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between gap-3 flex-wrap">
                    <span className="text-[11px] text-green-700 dark:text-green-400 font-medium">
                      ✓ Continuous context applied to all standard queries, fees, and audit roadmaps
                    </span>
                    <button
                      type="submit"
                      className="btn-saffron text-xs py-2 px-5 shadow-xs font-semibold flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Activate AI Context</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center gap-6 py-8 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-white border border-gray-200 dark:border-dark-border shadow-md p-3 flex items-center justify-center">
                  <img src="/bis-logo.svg" alt="BIS" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-dark-text font-heading">{t('preview_title', 'BIS Saarthi AI Assistant')}</h3>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted mt-1 max-w-md">
                    {t('preview_a', 'Official AI assistant for Indian Standards, ISI certifications, gold hallmarking, lab testing, and consumer quality guidelines.')}
                  </p>
                  <div className="mt-2 inline-flex items-center gap-2 text-[11px] text-gray-400 dark:text-dark-text-muted bg-gray-100 dark:bg-dark-bg-secondary px-2.5 py-1 rounded-full">
                    <span>Current Mode:</span>
                    <strong className="text-bis-navy dark:text-blue-300">
                      {readingMode === 'technical' ? t('technical_mode', 'Technical') : t('citizen_mode', 'Citizen')}
                    </strong>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-2 w-full max-w-xl">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                      className="text-left text-xs px-3 py-2.5 border border-gray-200 dark:border-dark-border rounded-gov-lg hover:bg-bis-light-bg dark:hover:bg-dark-bg text-gray-600 dark:text-dark-text-muted hover:text-bis-navy dark:hover:text-blue-300 transition-all hover:border-bis-navy/40 dark:hover:border-blue-500/40"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )
          )}

          {/* Message List */}
          {messages.map((msg, idx) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isLatestAssistant={idx === lastAssistantIdx}
              onRegenerate={() => regenerateLastResponse()}
              onEditUserPrompt={(msgId, newContent) => editAndResendMessage(msgId, newContent)}
              onOpenCitation={(cite) => setInspectCitation(cite)}
              onOpenSourcesSidebar={(cite) => handleOpenSourcesSidebar(cite)}
              onOpenFeedback={(m) => setFeedbackMessage(m)}
              onSelectFollowUp={(chip) => { setGatewayDismissed(true); sendMessage(chip, { role }) }}
              speakingMsgId={speakingMsgId}
              onToggleTTS={toggleTTS}
              fontSizeClass={currentFontSizeClass}
              translatedContent={translations[msg.id]?.[selectedLanguage]}
              isSourcesOpen={showSourcesSidebar}
            />
          ))}

          {/* Typing indicator */}
          {isStreaming && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Uploaded files preview */}
        {uploadedFiles.length > 0 && (
          <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/10 border-t border-blue-100 dark:border-blue-900/30 flex flex-wrap gap-2">
            {uploadedFiles.map((file, i) => (
              <div key={i} className="flex items-center gap-1.5 text-xs bg-white dark:bg-dark-bg-card px-2 py-1 rounded border border-gray-200 dark:border-dark-border">
                <Paperclip className="w-3 h-3 text-gray-400 dark:text-dark-text-muted" />
                <span className="max-w-[120px] truncate text-gray-700 dark:text-dark-text">{file.name}</span>
                <button onClick={() => removeFile(i)} className="text-gray-400 dark:text-dark-text-muted hover:text-red-500 transition-colors">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bhashini Multilingual Banner */}
        {selectedLanguage !== 'en' && (
          <div className="px-4 py-1.5 bg-blue-50/70 dark:bg-blue-950/30 border-t border-blue-200/60 dark:border-blue-900/40 flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-1.5 font-medium text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Bhashini Multilingual AI Active: <strong>{LANGUAGES.find(l => l.code === selectedLanguage)?.label} ({LANGUAGES.find(l => l.code === selectedLanguage)?.native})</strong></span>
            </div>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 hidden sm:inline">
              Voice mic translates to English automatically
            </span>
          </div>
        )}

        {/* Input Area */}
        <div className="px-4 py-3 bg-white dark:bg-dark-bg-card border-t border-gray-200 dark:border-dark-border">
          <div className="flex items-end gap-2 bg-gray-50 dark:bg-dark-bg-secondary border border-gray-200 dark:border-dark-border rounded-gov-xl px-3 py-2">
            {/* File upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-gray-400 dark:text-dark-text-muted hover:text-bis-navy dark:hover:text-blue-400 transition-colors shrink-0 mb-1"
              title="Attach PDF or document"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt" multiple onChange={handleFileChange} className="hidden" />

            {/* Text input */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder={t('input_placeholder', 'Ask about BIS standards, certifications, hallmarking...')}
              className="flex-1 bg-transparent text-sm text-gray-800 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted resize-none outline-none py-1 max-h-32"
              style={{ minHeight: '36px' }}
            />

            {/* Voice input */}
            <button
              onClick={toggleVoiceInput}
              className={cn(
                "p-1.5 rounded transition-all shrink-0 mb-1",
                isListening
                  ? "text-red-500 bg-red-100 dark:bg-red-900/40 animate-pulse"
                  : "text-gray-400 dark:text-dark-text-muted hover:text-bis-navy dark:hover:text-blue-400"
              )}
              title={isListening ? "Stop listening" : "Voice dictation"}
            >
              <Mic className={cn("w-4 h-4", isListening && "animate-bounce text-red-600")} />
            </button>

            {/* Stop Generation OR Send Button */}
            {isStreaming ? (
              <button
                onClick={() => stopStreaming()}
                className="p-2 rounded-gov bg-red-600 text-white shrink-0 mb-1 hover:bg-red-700 transition-all flex items-center justify-center shadow-xs"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-white" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim() && uploadedFiles.length === 0}
                className={cn(
                  'p-2 rounded-gov bg-bis-navy text-white shrink-0 mb-1 transition-all shadow-xs',
                  (!input.trim() && uploadedFiles.length === 0)
                    ? 'opacity-40 cursor-not-allowed'
                    : 'hover:bg-bis-navy-dark active:scale-95'
                )}
                title="Send query (Enter)"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Footer stats & Character counter */}
          <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-dark-text-muted mt-1.5 px-1">
            <div className="flex items-center gap-2">
              <span>BIS Saarthi AI Guidance</span>
              <span>·</span>
              <button
                onClick={() => setShowShortcuts(true)}
                className="hover:text-bis-navy dark:hover:text-blue-300 transition-colors inline-flex items-center gap-0.5"
              >
                <HelpCircle className="w-3 h-3" /> Shortcuts
              </button>
            </div>
            <span>{input.length} / 2000</span>
          </div>
        </div>
      </div>

      {/* ── Mobile Backdrop for Right Sources Sidebar ── */}
      {showSourcesSidebar && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden animate-fade-in backdrop-blur-2xs"
          onClick={() => setShowSourcesSidebar(false)}
        />
      )}

      {/* ── Right Sources & Regulatory References Sidebar (Resizable) ── */}
      <div
        style={showSourcesSidebar && typeof window !== 'undefined' && window.innerWidth >= 768 ? { width: `${rightSidebarWidth}px` } : undefined}
        className={cn(
          'flex flex-col bg-white dark:bg-dark-bg-card border-l border-gray-200 dark:border-dark-border shrink-0 z-40 relative',
          isDraggingRight ? 'transition-none select-none' : 'transition-[width] duration-300',
          showSourcesSidebar
            ? 'max-md:fixed max-md:top-0 max-md:right-0 max-md:w-[92vw] max-md:max-w-sm max-md:h-full max-md:shadow-2xl'
            : 'w-0 overflow-hidden border-l-0'
        )}
      >
        {/* Resize Handle for Right Sidebar (Desktop) */}
        {showSourcesSidebar && (
          <div
            onMouseDown={startDraggingRight}
            className={cn(
              'hidden md:flex absolute top-0 left-0 w-2 h-full cursor-col-resize z-50 items-center justify-center group select-none transition-colors -ml-1',
              isDraggingRight ? 'bg-blue-600' : 'hover:bg-blue-500/60'
            )}
            title="Drag to resize sources & references panel"
          >
            <div className="w-0.5 h-8 bg-gray-400/70 dark:bg-dark-border rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        {/* Sidebar Header */}
        <div className="p-3.5 border-b border-gray-100 dark:border-dark-border flex items-center justify-between bg-slate-50/80 dark:bg-dark-bg/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-100/90 dark:bg-blue-900/40 text-bis-navy dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/60 dark:border-blue-800/40">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading truncate">
                  Sources & References
                </h3>
                {conversationCitations.length > 0 && (
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50">
                    {conversationCitations.length} Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-dark-text-muted truncate">
                Official Indian Standards & Acts
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowSourcesSidebar(false)}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-dark-border transition-colors shrink-0"
            title="Close Sources Sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Tabs */}
        <div className="p-2.5 border-b border-gray-100 dark:border-dark-border bg-white dark:bg-dark-bg-card space-y-2">
          {/* Instant Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={sourcesSearchQuery}
              onChange={(e) => setSourcesSearchQuery(e.target.value)}
              placeholder="Search standards, clauses, acts..."
              className="w-full pl-8 pr-7 py-1.5 text-sm bg-slate-50 dark:bg-dark-bg border border-gray-200 dark:border-dark-border rounded-gov focus:outline-none focus:border-bis-navy dark:focus:border-blue-400 text-gray-800 dark:text-dark-text placeholder:text-gray-400"
            />
            {sourcesSearchQuery && (
              <button
                type="button"
                onClick={() => setSourcesSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Dual Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-dark-bg p-0.5 rounded-gov text-[11px]">
            <button
              type="button"
              onClick={() => setSourcesActiveTab('cited')}
              className={cn(
                'flex-1 py-1 rounded font-medium transition-all text-center',
                sourcesActiveTab === 'cited'
                  ? 'bg-white dark:bg-dark-bg-card text-bis-navy dark:text-blue-300 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-800'
              )}
            >
              Cited in Chat ({conversationCitations.length})
            </button>
            <button
              type="button"
              onClick={() => setSourcesActiveTab('directory')}
              className={cn(
                'flex-1 py-1 rounded font-medium transition-all text-center',
                sourcesActiveTab === 'directory'
                  ? 'bg-white dark:bg-dark-bg-card text-bis-navy dark:text-blue-300 shadow-xs font-bold'
                  : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-800'
              )}
            >
              BIS Directory ({Object.keys(STANDARDS_REGISTRY).length})
            </button>
          </div>
        </div>

        {/* Scrollable Sources Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {sourcesActiveTab === 'cited' ? (
            filteredCitedCitations.length === 0 ? (
              <div className="text-center py-8 px-3 space-y-3">
                <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-500 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-100 dark:border-blue-900/40">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    {sourcesSearchQuery ? 'No matching references' : 'No sources cited yet'}
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-dark-text-muted mt-1 leading-relaxed">
                    {sourcesSearchQuery
                      ? 'Try another search term like "IS 1417", "water", "hallmark", or "gold".'
                      : 'Ask a question about BIS standards, hallmarking, testing procedures, or certification to see verified statutory citations appear here in real time.'}
                  </p>
                </div>

                {!sourcesSearchQuery && (
                  <div className="pt-2 border-t border-gray-100 dark:border-dark-border space-y-1.5 text-left">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-muted">
                      Suggested Regulatory Queries:
                    </span>
                    {[
                      'What are the mandatory gold hallmarking standards (IS 1417)?',
                      'Show test parameters for packaged drinking water under IS 14543',
                      'What are helmet safety requirements under IS 4151?',
                    ].map((sampleQuery, qIdx) => (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => {
                          setGatewayDismissed(true)
                          sendMessage(sampleQuery, { role })
                        }}
                        className="w-full text-left p-2 rounded-gov bg-gray-50 hover:bg-blue-50 dark:bg-dark-bg dark:hover:bg-blue-950/40 text-[11px] text-gray-700 dark:text-gray-300 border border-gray-200/70 dark:border-dark-border transition-colors leading-snug"
                      >
                        {sampleQuery} &rarr;
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              filteredCitedCitations.map((cite, i) => {
                const isHighlighted = highlightedSourceKey && (cite.source?.toLowerCase().includes(highlightedSourceKey.toLowerCase()) || highlightedSourceKey.toLowerCase().includes(cite.source?.toLowerCase()))
                return (
                  <div
                    key={i}
                    id={`sidebar-cite-${cite.source}`}
                    className={cn(
                      'p-3 rounded-gov-lg border bg-slate-50/70 dark:bg-dark-bg-secondary/70 transition-all shadow-xs space-y-2',
                      isHighlighted
                        ? 'border-bis-navy dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/60 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-dark-border hover:border-blue-300 dark:hover:border-blue-600/70'
                    )}
                  >
                    {/* Badge & Code Row */}
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <span className={cn(
                        'text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border',
                        cite.type === 'standard'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : cite.type === 'legislation'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : cite.type === 'order'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      )}>
                        {cite.type === 'standard' ? 'Indian Standard' : cite.type === 'legislation' ? 'Act' : cite.type === 'order' ? 'QCO' : 'BIS Reference'}
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        Active
                      </span>
                    </div>

                    {/* Standard Code & Title */}
                    <div>
                      <div className={cn("font-extrabold text-gray-900 dark:text-white font-mono", currentFontSizeClass)}>
                        {cite.source}
                      </div>
                      <h4 className={cn("font-bold text-gray-800 dark:text-gray-100 leading-snug mt-1", currentFontSizeClass)}>
                        {cite.title}
                      </h4>
                    </div>

                    {/* Meta Badges */}
                    <div className="space-y-1.5 text-xs text-gray-600 dark:text-dark-text-muted">
                      {cite.clause && (
                        <div className="flex items-center gap-1.5">
                          <FileBadge className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          <span className="font-semibold text-blue-700 dark:text-blue-300 truncate">
                            {cite.clause}
                          </span>
                        </div>
                      )}
                      {cite.actReference && (
                        <div className="flex items-center gap-1.5">
                          <Scale className="w-3.5 h-3.5 text-bis-navy dark:text-blue-400 shrink-0" />
                          <span className="truncate">{cite.actReference}</span>
                        </div>
                      )}
                      {cite.committee && (
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                          <span className="truncate">{cite.committee}</span>
                        </div>
                      )}
                    </div>

                    {/* Regulatory Summary */}
                    {cite.summary && (
                      <p className={cn("text-gray-600 dark:text-gray-300 leading-relaxed bg-white/80 dark:bg-dark-bg/60 p-2.5 rounded border border-slate-200/80 dark:border-dark-border/60", currentFontSizeClass)}>
                        {cite.summary}
                      </p>
                    )}

                    {/* Key Provisions */}
                    {cite.keyPoints && cite.keyPoints.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-gray-500 dark:text-dark-text-muted uppercase tracking-wider">
                          Key Provisions:
                        </span>
                        {cite.keyPoints.slice(0, 2).map((pt, pIdx) => (
                          <div key={pIdx} className={cn("flex items-start gap-1.5 text-gray-600 dark:text-gray-300", currentFontSizeClass)}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                            <span>{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Card Actions */}
                    <div className="pt-2 border-t border-slate-200/60 dark:border-dark-border/50 flex items-center justify-between gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInspectCitation(cite)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-bis-navy dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Inspect Dossier &rarr;</span>
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`${cite.source} — ${cite.title} (${cite.clause})`)
                            toast.success('Reference copied')
                          }}
                          className="p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded hover:bg-gray-100 dark:hover:bg-dark-border transition-colors"
                          title="Copy Reference"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        {cite.url && (
                          <a
                            href={cite.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                            title="Verify on BIS Portal"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )
          ) : (
            /* Directory Tab */
            filteredDirectory.length === 0 ? (
              <div className="text-center py-8 text-xs text-gray-500 dark:text-dark-text-muted">
                No standards match "{sourcesSearchQuery}"
              </div>
            ) : (
              filteredDirectory.map((std, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-gov border border-gray-200 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg-secondary/50 hover:border-blue-300 dark:hover:border-blue-600 transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={cn("font-mono font-bold text-bis-navy dark:text-blue-400", currentFontSizeClass)}>
                      {std.source}
                    </span>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                      Standard
                    </span>
                  </div>
                  <h5 className={cn("font-bold text-gray-800 dark:text-gray-100 leading-snug", currentFontSizeClass)}>
                    {std.title}
                  </h5>
                  <p className="text-xs text-gray-500 dark:text-dark-text-muted truncate">
                    {std.committee} · {std.clause}
                  </p>
                  <div className="pt-2 border-t border-gray-100 dark:border-dark-border flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setInspectCitation(std)}
                      className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Inspect Dossier</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setGatewayDismissed(true)
                        sendMessage(`Provide full technical requirements, testing methods, and conformity assessment details for ${std.source} (${std.title}).`, { role })
                      }}
                      className="text-xs font-semibold text-gray-600 dark:text-gray-300 hover:text-bis-navy dark:hover:text-blue-300 hover:underline"
                    >
                      Ask Saarthi &rarr;
                    </button>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Sidebar Footer */}
        <div className="p-2.5 border-t border-gray-100 dark:border-dark-border bg-slate-50/70 dark:bg-dark-bg/70 text-[10px] text-gray-500 dark:text-dark-text-muted flex items-center justify-between">
          <span className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>BIS Act, 2016 Mandated</span>
          </span>
          <a
            href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 font-semibold"
          >
            <span>Manakonline</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>

      {/* ── Citation Details Inspector Modal ── */}
      {inspectCitation && (() => {
        const cite = resolveDetailedCitation(inspectCitation)
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
            <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-dark-border flex items-start justify-between gap-3 bg-slate-50/80 dark:bg-dark-bg/80">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100/90 dark:bg-blue-900/40 text-bis-navy dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-200/70 dark:border-blue-800/60 mt-0.5">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={cn(
                        'text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border',
                        cite.type === 'standard'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                          : cite.type === 'legislation'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                          : cite.type === 'order'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      )}>
                        {cite.type === 'standard' ? 'Indian Standard' : cite.type === 'legislation' ? 'Act of Parliament' : cite.type === 'order' ? 'Quality Control Order' : cite.type === 'circular' ? 'Statutory Circular' : 'BIS Regulation'}
                      </span>
                      <span className="font-mono font-black text-sm text-gray-900 dark:text-white">
                        {cite.source}
                      </span>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white font-heading leading-snug">
                      {cite.title}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectCitation(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-dark-border transition-colors shrink-0"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
                {/* Status Bar */}
                <div className="flex items-center justify-between p-3 rounded-gov bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                        Enforcement & Conformity Status
                      </div>
                      <div className="text-xs font-semibold text-emerald-800 dark:text-emerald-400">
                        {cite.status}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/70 text-emerald-800 dark:text-emerald-200 font-extrabold uppercase">
                    Verified
                  </span>
                </div>

                {/* 2-column Metadata Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 rounded-gov bg-gray-50 dark:bg-dark-bg border border-gray-200/70 dark:border-dark-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-muted flex items-center gap-1">
                      <Scale className="w-3 h-3 text-bis-navy dark:text-blue-400" />
                      Legal Enabling Act
                    </span>
                    <p className="font-semibold text-gray-800 dark:text-dark-text text-[11px]">
                      {cite.actReference}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-gov bg-gray-50 dark:bg-dark-bg border border-gray-200/70 dark:border-dark-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-muted flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-bis-navy dark:text-blue-400" />
                      Sectional Committee
                    </span>
                    <p className="font-semibold text-gray-800 dark:text-dark-text text-[11px]">
                      {cite.committee}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-gov bg-gray-50 dark:bg-dark-bg border border-gray-200/70 dark:border-dark-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-muted flex items-center gap-1">
                      <FileBadge className="w-3 h-3 text-bis-navy dark:text-blue-400" />
                      Clause / Section Reference
                    </span>
                    <p className="font-bold text-blue-700 dark:text-blue-300 text-[11px]">
                      {cite.clause}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-gov bg-gray-50 dark:bg-dark-bg border border-gray-200/70 dark:border-dark-border space-y-1">
                    <span className="text-[10px] uppercase font-bold text-gray-400 dark:text-dark-text-muted flex items-center gap-1">
                      <BookOpen className="w-3 h-3 text-bis-navy dark:text-blue-400" />
                      Edition / Amendment
                    </span>
                    <p className="font-semibold text-gray-800 dark:text-dark-text text-[11px]">
                      {cite.version}
                    </p>
                  </div>
                </div>

                {/* Scope & Mandate Summary */}
                <div className="space-y-1.5">
                  <h4 className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    Statutory Scope & Legal Mandate
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-200 leading-relaxed bg-slate-50 dark:bg-dark-bg/80 p-3 rounded-gov border border-slate-200/80 dark:border-dark-border">
                    {cite.summary}
                  </p>
                </div>

                {/* Key Provisions */}
                {cite.keyPoints && cite.keyPoints.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Key Technical & Compliance Mandates
                    </h4>
                    <div className="space-y-1.5">
                      {cite.keyPoints.map((pt, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-start gap-2 p-2 rounded-gov bg-gray-50/80 dark:bg-dark-bg/60 border border-gray-100 dark:border-dark-border/60 text-gray-700 dark:text-gray-200"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-xs leading-relaxed">{pt}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authority Signature Note */}
                <div className="text-[11px] text-gray-500 dark:text-dark-text-muted italic flex items-center gap-1.5 pt-1">
                  <span>Issuing Authority:</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-300">{cite.authority}</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-gray-100 dark:border-dark-border flex flex-wrap items-center justify-between gap-2 bg-gray-50/70 dark:bg-dark-bg/60">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`${cite.source} — ${cite.title} | ${cite.clause} | ${cite.actReference}`);
                    toast.success('Full standard reference copied to clipboard');
                  }}
                  className="px-3 py-1.5 rounded-gov bg-white dark:bg-dark-bg text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-dark-border text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Full Reference</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectCitation(null)}
                    className="btn-gov-outline text-xs py-1.5 px-3"
                  >
                    Close
                  </button>
                  {cite.url && (
                    <a
                      href={cite.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gov text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Verify on {cite.portalName || 'BIS Portal'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Thumbs Down Feedback Reason Modal ── */}
      {feedbackMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <ThumbsDown className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Help Improve BIS Saarthi
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-dark-text-muted">
                  What was wrong with this response?
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {[
                'Inaccurate standard clause citation',
                'Outdated amendment or circular',
                'Incomplete or unclear steps',
                'Not relevant to my specific query',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setFeedbackReason(reason)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-gov border text-xs transition-colors',
                    feedbackReason === reason
                      ? 'border-bis-navy bg-blue-50/50 dark:bg-blue-900/20 text-bis-navy dark:text-blue-300 font-medium'
                      : 'border-gray-200 dark:border-dark-border text-gray-700 dark:text-dark-text hover:bg-gray-50'
                  )}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setFeedbackMessage(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  toast.success('Thank you! Your feedback has been queued for knowledge base review.')
                  setFeedbackMessage(null)
                  setFeedbackReason('')
                }}
                className="btn-gov text-xs py-1.5 px-3"
              >
                Submit Feedback
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Clear Messages Confirmation Dialog ── */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Clear Current Messages?
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  Reset chat session
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              This will clear all messages in this conversation. Your conversation entry will be preserved.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearCurrentMessages()
                  setShowClearConfirm(false)
                  toast.success('Chat history cleared')
                }}
                className="btn-gov bg-amber-600 hover:bg-amber-700 text-xs py-1.5 px-3"
              >
                Clear Messages
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Conversation Confirmation Dialog ── */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Delete Conversation?
                </h3>
                <p className="text-xs text-gray-500 dark:text-dark-text-muted">
                  Cannot be undone
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-600 dark:text-dark-text-muted mb-5 leading-relaxed">
              Are you sure you want to delete <strong className="text-gray-900 dark:text-white">&ldquo;{sessionToDelete.title}&rdquo;</strong>? All messages in this chat session will be permanently cleared.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSession(sessionToDelete.id)
                  setSessionToDelete(null)
                  toast.success('Conversation deleted')
                }}
                className="btn-gov bg-red-600 hover:bg-red-700 text-xs py-1.5 px-3"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Keyboard Shortcuts Helper Modal ── */}
      {showShortcuts && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-sm w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border mb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-bis-navy dark:text-blue-400" />
                <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                  Keyboard Shortcuts
                </h3>
              </div>
              <button onClick={() => setShowShortcuts(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 dark:text-dark-text">Send message</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-dark-bg rounded border text-[11px] font-mono">Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 dark:text-dark-text">New line</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-dark-bg rounded border text-[11px] font-mono">Shift + Enter</kbd>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-600 dark:text-dark-text">Exit Fullscreen / Close Modal</span>
                <kbd className="px-2 py-0.5 bg-gray-100 dark:bg-dark-bg rounded border text-[11px] font-mono">Esc</kbd>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-dark-border flex justify-end">
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                className="btn-gov text-xs py-1.5 px-3"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Manufacturer Profile Modal ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-xl w-full p-6 animate-scale-in flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-dark-border pb-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-gov bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                    Update Manufacturer Context
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-dark-text-muted">
                    Changes will immediately personalize upcoming answers & calculations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowProfileModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs overflow-y-auto pr-1">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={profileFormData.companyName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, companyName: e.target.value })}
                    className="input-gov text-xs"
                    placeholder="e.g. Apex Polymers Pvt. Ltd."
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">Product *</label>
                  <input
                    type="text"
                    required
                    value={profileFormData.productName}
                    onChange={(e) => setProfileFormData({ ...profileFormData, productName: e.target.value })}
                    className="input-gov text-xs"
                    placeholder="e.g. Packaged Drinking Water"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">Standard (IS Code) *</label>
                  <input
                    type="text"
                    required
                    value={profileFormData.isStandard}
                    onChange={(e) => setProfileFormData({ ...profileFormData, isStandard: e.target.value })}
                    className="input-gov text-xs font-mono"
                    placeholder="e.g. IS 14543:2016"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">MSME Scale</label>
                  <select
                    value={profileFormData.scale}
                    onChange={(e) => setProfileFormData({ ...profileFormData, scale: e.target.value })}
                    className="input-gov text-xs"
                  >
                    <option value="micro">Micro (&lt; ₹5 Cr turnover) — 50% Concession</option>
                    <option value="small">Small (&lt; ₹50 Cr turnover) — 50% Concession</option>
                    <option value="medium">Medium (&lt; ₹250 Cr turnover)</option>
                    <option value="large">Large / Non-MSME</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">Udyam Number</label>
                  <input
                    type="text"
                    value={profileFormData.udyamNumber}
                    onChange={(e) => setProfileFormData({ ...profileFormData, udyamNumber: e.target.value })}
                    className="input-gov text-xs font-mono"
                    placeholder="UDYAM-XX-00-0000000"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-dark-text mb-1">Factory Location *</label>
                  <input
                    type="text"
                    required
                    value={profileFormData.factoryLocation}
                    onChange={(e) => setProfileFormData({ ...profileFormData, factoryLocation: e.target.value })}
                    className="input-gov text-xs"
                    placeholder="City, State"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-gray-100 dark:border-dark-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    resetManufacturerProfile()
                    setShowProfileModal(false)
                    toast.success('Manufacturer context reset to default.')
                  }}
                  className="text-xs text-red-600 hover:underline"
                >
                  Reset Profile
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowProfileModal(false)}
                    className="btn-gov-outline text-xs py-1.5 px-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-saffron text-xs py-1.5 px-4 font-semibold"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Gemini RAG API Key Modal ── */}
      {showRagKeyModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in"
          onClick={() => setShowRagKeyModal(false)}
        >
          <div
            className="bg-white dark:bg-dark-bg-card rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-dark-border overflow-hidden animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 p-4 border-b border-amber-200/80 dark:border-amber-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                    Gemini RAG API Key Setup
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold">
                      Live AI
                    </span>
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-dark-text-muted">
                    Powers real-time BIS standard retrieval and verified responses
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowRagKeyModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-dark-text p-1 rounded-md transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 rounded-lg p-3 text-xs text-blue-900 dark:text-blue-200 flex gap-2.5 items-start">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">Factual Standards Grounding</p>
                  <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                    This key connects BIS Saarthi to Google Gemini 1.5/2.0 to index, cite, and cross-reference official Indian Standards (IS), QCO orders, and laboratory test matrices without hallucination.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-dark-text mb-1.5">
                  Google Gemini API Key
                </label>
                <div className="relative">
                  <input
                    type={showKeyPassword ? 'text' : 'password'}
                    value={ragKeyInput}
                    onChange={(e) => setRagKeyInput(e.target.value)}
                    placeholder="AQ... or AIzaSy..."
                    className="w-full text-xs font-mono px-3 py-2 pr-10 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-bg focus:ring-2 focus:ring-amber-500 focus:outline-none dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyPassword(!showKeyPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-dark-text p-1 cursor-pointer"
                    title={showKeyPassword ? 'Hide key' : 'Show key'}
                  >
                    {showKeyPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5 text-[11px] text-gray-500 dark:text-dark-text-muted">
                  <span>Default preloaded key is active.</span>
                  <button
                    type="button"
                    onClick={handleResetRagKey}
                    className="text-amber-700 dark:text-amber-400 hover:underline font-medium cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>

              {/* Status indicator */}
              <div className="rounded-lg bg-gray-50 dark:bg-dark-bg-secondary p-3 border border-gray-100 dark:border-dark-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    ragKeyInput ? "bg-emerald-500 animate-pulse" : "bg-gray-400"
                  )} />
                  <span className="text-gray-700 dark:text-dark-text font-medium">
                    {ragKeyInput ? 'Key Configured & Active' : 'No Key Configured'}
                  </span>
                </div>
                <button
                  type="button"
                  disabled={isTestingRagKey || !ragKeyInput.trim()}
                  onClick={handleTestRagKey}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-bg-card hover:bg-gray-50 dark:hover:bg-dark-bg text-gray-700 dark:text-dark-text disabled:opacity-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isTestingRagKey ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-amber-600" />
                      <span>Testing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Test Connection</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 dark:bg-dark-bg-secondary border-t border-gray-100 dark:border-dark-border flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRagKeyModal(false)}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 dark:text-dark-text-muted hover:bg-gray-200/60 dark:hover:bg-dark-border rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRagKey}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-bis-navy hover:bg-bis-navy-dark dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg transition-colors shadow-xs cursor-pointer"
              >
                Save & Apply Key
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
