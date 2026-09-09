import React, { useEffect, useRef, useState } from 'react'
import {
  Send, Paperclip, Mic, RefreshCw, Copy, ThumbsUp, ThumbsDown,
  Download, Bookmark, Map, FlaskConical, Award, MessageSquare,
  AlertTriangle, CheckCircle2, X, ChevronDown, Plus, Trash2, Globe,
  Maximize2, Minimize2, Volume2, VolumeX, Edit2, Edit3, Check,
  Search, Sparkles, RotateCcw, Square, SlidersHorizontal, ExternalLink,
  Printer, FileText, HelpCircle, Type, Building2
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
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
  onOpenFeedback,
  onSelectFollowUp,
  speakingMsgId,
  onToggleTTS,
  fontSizeClass,
  translatedContent,
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
                {message.readingMode && (
                  <div className="mb-2 flex items-center gap-1.5">
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider",
                      message.readingMode === 'technical'
                        ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                        : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    )}>
                      {message.readingMode === 'technical' ? 'Technical Clauses' : 'Citizen Brief'}
                    </span>
                  </div>
                )}
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

        {/* Citations */}
        {!isUser && message.citations?.length > 0 && (
          <div className="w-full mt-1 space-y-1">
            {message.citations.map((cite, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onOpenCitation(cite)}
                className={cn(
                  'w-full text-left flex items-start justify-between gap-2 px-3 py-2 rounded-gov text-xs border transition-all hover:shadow-xs group/cite',
                  cite.type === 'standard'
                    ? 'bg-blue-50/90 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 hover:bg-blue-100/70'
                    : 'bg-green-50/90 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 hover:bg-green-100/70'
                )}
                title="Click to view full standard details & BIS clauses"
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-semibold underline underline-offset-2 decoration-blue-400">{cite.source}</span>
                    {cite.clause && <>, {cite.clause}</>}
                    {cite.version && <span className="opacity-70 ml-1">({cite.version})</span>}
                  </div>
                </div>
                <ExternalLink className="w-3 h-3 opacity-0 group-hover/cite:opacity-100 transition-opacity mt-0.5 shrink-0" />
              </button>
            ))}
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
  const [showSidebar, setShowSidebar]               = useState(true)
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
  
  // Inline rename state in sidebar
  const [editingSessionId, setEditingSessionId]     = useState(null)
  const [renameTitleInput, setRenameTitleInput]     = useState('')

  const recognitionRef  = useRef(null)
  const fileInputRef    = useRef(null)
  const messagesEndRef  = useRef(null)
  const textareaRef     = useRef(null)

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
      md += `*Language: ${selectedLanguage.toUpperCase()} | Reading Mode: ${readingMode.toUpperCase()}*\n\n---\n\n`
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
    <div className={cn(
      'flex bg-slate-50 dark:bg-dark-bg transition-all duration-200 overflow-hidden relative',
      isFullscreen
        ? 'fixed inset-0 z-50 w-screen h-screen rounded-none shadow-2xl border-0'
        : 'h-[calc(100vh-80px)] rounded-gov-xl shadow-gov border border-gray-200 dark:border-dark-border'
    )}>

      {/* ── Session Sidebar ── */}
      <div className={cn(
        'flex flex-col bg-white dark:bg-dark-bg-card border-r border-gray-200 dark:border-dark-border transition-all duration-300',
        showSidebar ? 'w-64' : 'w-0 overflow-hidden'
      )}>
        {/* Sidebar Header & New Chat */}
        <div className="p-3 border-b border-gray-100 dark:border-dark-border space-y-2">
          <button
            onClick={() => startSession()}
            className="btn-gov w-full text-xs py-2 flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> {t('new_conversation', 'New Conversation')}
          </button>

          {/* Search sessions input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-dark-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search_conversations', 'Search conversations...')}
              className="w-full bg-gray-50 dark:bg-dark-bg pl-8 pr-2.5 py-1.5 text-xs rounded-gov border border-gray-200 dark:border-dark-border outline-none text-gray-800 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredSessions.length === 0 ? (
            <p className="text-xs text-center text-gray-400 dark:text-dark-text-muted py-8">
              {searchQuery ? 'No matching conversations' : t('no_conversations', 'No conversations yet')}
            </p>
          ) : (
            filteredSessions.map((session) => {
              const isSelected = session.id === currentSessionId
              const isRenaming = editingSessionId === session.id

              return (
                <div
                  key={session.id}
                  className={cn(
                    'group flex items-center gap-1.5 px-2.5 py-2 rounded-gov cursor-pointer transition-colors relative text-xs',
                    isSelected
                      ? 'bg-bis-light-bg dark:bg-blue-900/20 text-bis-navy dark:text-blue-300 font-medium'
                      : 'hover:bg-gray-50 dark:hover:bg-dark-bg-secondary text-gray-700 dark:text-dark-text'
                  )}
                  onClick={() => !isRenaming && switchSession(session.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 shrink-0 opacity-70" />

                  {isRenaming ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameTitleInput}
                        onChange={(e) => setRenameTitleInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(session.id)
                          if (e.key === 'Escape') setEditingSessionId(null)
                        }}
                        autoFocus
                        className="w-full bg-white dark:bg-dark-bg px-1.5 py-0.5 border border-bis-navy rounded text-xs outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(session.id)}
                        className="p-1 hover:text-green-600 text-gray-500"
                        title="Save title"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setEditingSessionId(null)}
                        className="p-1 hover:text-gray-700 text-gray-400"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span className="truncate flex-1" title={session.title}>
                        {session.title}
                      </span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSessionId(session.id)
                            setRenameTitleInput(session.title)
                          }}
                          className="p-1 hover:text-bis-navy dark:hover:text-blue-400 text-gray-400 transition-colors"
                          title="Rename conversation"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSessionToDelete(session)
                          }}
                          className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                          title="Delete conversation"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Chat Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-dark-bg-card border-b border-gray-200 dark:border-dark-border gap-2 flex-wrap sm:flex-nowrap">
          {/* Left: Sidebar toggle, Title, Reading Mode Badge */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-dark-bg-secondary transition-colors"
              title="Toggle sidebar"
            >
              <MessageSquare className="w-4 h-4 text-gray-500 dark:text-dark-text-muted" />
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

          {/* Right: Controls (Reading Mode, Font Size, Export, Clear, Lang, Fullscreen) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            
            {/* Reading Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-dark-bg p-0.5 rounded-gov border border-gray-200 dark:border-dark-border text-xs">
              <button
                type="button"
                onClick={() => {
                  setReadingMode('citizen')
                  toast.success('Switched to Citizen Brief mode (concise guidance)')
                }}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all',
                  readingMode === 'citizen'
                    ? 'bg-white dark:bg-dark-bg-card text-bis-navy dark:text-blue-300 shadow-xs'
                    : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-800'
                )}
                title={t('citizen_mode_tooltip', 'Concise, plain language answers for citizens')}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{t('citizen_mode', 'Citizen')}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setReadingMode('technical')
                  toast.success('Switched to Technical Clauses mode (detailed regulatory breakdown)')
                }}
                className={cn(
                  'px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition-all',
                  readingMode === 'technical'
                    ? 'bg-white dark:bg-dark-bg-card text-purple-700 dark:text-purple-300 shadow-xs'
                    : 'text-gray-500 dark:text-dark-text-muted hover:text-gray-800'
                )}
                title={t('technical_mode_tooltip', 'Clause-level standard specifications and test procedures')}
              >
                <FlaskConical className="w-3.5 h-3.5 text-purple-500" />
                <span>{t('technical_mode', 'Technical')}</span>
              </button>
            </div>

            {/* Font Size Accessibility Selector */}
            <div className="relative">
              <button
                onClick={() => setShowFontMenu(!showFontMenu)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 border border-gray-200 dark:border-dark-border rounded-gov hover:bg-gray-50 dark:hover:bg-dark-bg-secondary text-gray-600 dark:text-dark-text-muted transition-colors"
                title="Adjust in-chat text size for accessibility"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="uppercase text-[10px] font-semibold">{chatFontSize}</span>
              </button>
              {showFontMenu && (
                <div className="absolute right-0 top-full mt-1 w-28 bg-white dark:bg-dark-bg-card rounded-gov shadow-gov-md border border-gray-100 dark:border-dark-border z-20 py-1">
                  {[
                    { id: 'sm', label: 'Small (12px)' },
                    { id: 'md', label: 'Default (14px)' },
                    { id: 'lg', label: 'Large (16px)' },
                    { id: 'xl', label: 'Extra (18px)' },
                  ].map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => {
                        setChatFontSize(sz.id)
                        setShowFontMenu(false)
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-bg-secondary transition-colors',
                        chatFontSize === sz.id && 'text-bis-navy font-semibold bg-blue-50/50 dark:bg-blue-900/20'
                      )}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

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
                    onClick={() => handleExport('markdown')}
                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50 dark:hover:bg-dark-bg-secondary flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500" /> {t('export_markdown', 'Export Markdown (.md)')}
                  </button>
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

            {/* Fullscreen Immersive Mode Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1.5 border rounded-gov transition-colors',
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
              onOpenFeedback={(m) => setFeedbackMessage(m)}
              onSelectFollowUp={(chip) => { setGatewayDismissed(true); sendMessage(chip, { role }) }}
              speakingMsgId={speakingMsgId}
              onToggleTTS={toggleTTS}
              fontSizeClass={currentFontSizeClass}
              translatedContent={translations[msg.id]?.[selectedLanguage]}
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

      {/* ── Citation Details Inspector Modal ── */}
      {inspectCitation && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-dark-bg-card rounded-gov-xl border border-gray-200 dark:border-dark-border shadow-2xl max-w-md w-full p-6 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-dark-border">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white font-heading">
                    Official Standard Reference
                  </h3>
                  <p className="text-[11px] text-gray-400 dark:text-dark-text-muted">
                    Bureau of Indian Standards Knowledge Base
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectCitation(null)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="bg-gray-50 dark:bg-dark-bg p-3 rounded-gov space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-gray-500">Standard / Source:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{inspectCitation.source}</span>
                </div>
                {inspectCitation.clause && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Clause Reference:</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-400">{inspectCitation.clause}</span>
                  </div>
                )}
                {inspectCitation.version && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Edition / Amendment:</span>
                    <span className="text-gray-700 dark:text-dark-text">{inspectCitation.version}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Conformity Status:</span>
                  <span className="text-green-600 font-semibold">Active & Mandatory in India</span>
                </div>
              </div>

              <p className="text-gray-600 dark:text-dark-text leading-relaxed">
                This clause establishes mandatory requirements approved by the corresponding Sectional Committee of the Bureau of Indian Standards under the BIS Act, 2016.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-dark-border">
              <button
                type="button"
                onClick={() => setInspectCitation(null)}
                className="btn-gov-outline text-xs py-1.5 px-3"
              >
                Close
              </button>
              <a
                href="https://www.services.bis.gov.in/php/BIS_2.0/bisconnect/knowyourstandards/indian_standards/isdetails"
                target="_blank"
                rel="noreferrer"
                className="btn-gov text-xs py-1.5 px-3 flex items-center gap-1.5"
              >
                <span>BIS Standards Portal</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      )}

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

    </div>
  )
}
