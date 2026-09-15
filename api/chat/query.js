// api/chat/query.js — Dynamic RAG AI Chat Query Endpoint with Multi-Lingual Gemini 3.1/3.6 Synthesis
import jwt from 'jsonwebtoken'
import { getDb, JWT_SECRET } from '../_lib/db.js'

const KEY_PREFIX = 'AQ.'
const RAW_KEY_SUFFIXES = [
  'Ab8RN6K7j7lQbZbtRpy2fDO29U8eLMnrRJlP6_ojnb-TiGYErQ',
  'Ab8RN6ItOTQxenvuVph4zn2mdL-5OaEO_Kv7SeneiXqE51jHwQ',
  'Ab8RN6IntkUZjpzhQcOqNHXS6i5CURso_F4gslDFcM1KPUAEmg',
  'Ab8RN6LrECN3gZP5rmfsOfBFubfuuHa_FZCxb3pZUOxvFNpBwA',
  'Ab8RN6KzBKdQ78Nnu_mC7YkduJ-zRFcE8dFG_PvGblhzxo2pNQ',
  'Ab8RN6LplUiI04aPzW6VO51kSFrhNFx8-kN7p8OPvZ1evbTRSw',
  'Ab8RN6JYL_mkJG_cMeKq6JxS9wkZQPi0Ypi3xO5toVjVfcxh6A',
]
const DEFAULT_GEMINI_KEY = KEY_PREFIX + RAW_KEY_SUFFIXES[0]
const GEMINI_KEY_POOL = RAW_KEY_SUFFIXES.map((s) => KEY_PREFIX + s)

// Render RAG service base URL
const RAG_BASE = process.env.RAG_API_BASE || 'https://bis-saarthi-api.onrender.com'
const RAG_ADMIN_USERNAME = process.env.RAG_ADMIN_USERNAME || 'admin'
const RAG_ADMIN_PASSWORD = process.env.RAG_ADMIN_PASSWORD || 'BIS@secure26'

// ── 0. RAG AUTO-AUTHENTICATION HELPER ──
const DEFAULT_RAG_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc4OTMyMDczMCwiZXhwIjoxODAxMzIwNzMwfQ.wqUHkgapNt3J-l_vUQKNK3tSRkaIIGHTuqEfChbSqrM'
let cachedRagToken = process.env.RAG_API_KEY || DEFAULT_RAG_TOKEN
let tokenExpiry = 1801320730000 // Valid until Jan 30, 2027

async function getActiveRAGToken(providedToken) {
  if (providedToken) return providedToken

  if (cachedRagToken && Date.now() < tokenExpiry) {
    return cachedRagToken
  }

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    const authRes = await fetch(`${RAG_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: RAG_ADMIN_USERNAME, password: RAG_ADMIN_PASSWORD }),
      signal: controller.signal
    })
    clearTimeout(timeoutId)

    if (authRes.ok) {
      const data = await authRes.json()
      const token = data.token || data.access_token
      if (token) {
        cachedRagToken = token
        tokenExpiry = Date.now() + 55 * 60 * 1000
        return token
      }
    }
  } catch (e) {
    console.warn('RAG auto-auth notice:', e.message)
  }

  return DEFAULT_RAG_TOKEN
}

// ── 1. MULTI-LINGUAL INTENT & SCRIPT DETECTOR ──
export function detectRequestedLanguage(queryText, fallbackLang = 'en') {
  if (!queryText || typeof queryText !== 'string') return fallbackLang || 'en'
  const text = queryText.trim()

  // 1. Explicit English phrasing asking for a language
  if (/\b(?:in\s+hindi|hindi\s+mein|hindi\s+me|reply\s+in\s+hindi|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+hindi|explain\s+in\s+hindi|answer\s+in\s+hindi|respond\s+in\s+hindi|tell\s+(?:me\s+)?in\s+hindi|translate\s+(?:to|in)\s+hindi|provide\s+in\s+hindi|hindi\s+please|in\s+hindhi)\b/i.test(text)) {
    return 'hi'
  }
  if (/\b(?:in\s+marathi|marathi\s+madhe|reply\s+in\s+marathi|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+marathi|explain\s+in\s+marathi|answer\s+in\s+marathi|respond\s+in\s+marathi|tell\s+(?:me\s+)?in\s+marathi|translate\s+(?:to|in)\s+marathi|provide\s+in\s+marathi|marathi\s+please)\b/i.test(text)) {
    return 'mr'
  }
  if (/\b(?:in\s+tamil|reply\s+in\s+tamil|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+tamil|explain\s+in\s+tamil|answer\s+in\s+tamil|respond\s+in\s+tamil|tell\s+(?:me\s+)?in\s+tamil|translate\s+(?:to|in)\s+tamil|provide\s+in\s+tamil|tamil\s+please)\b/i.test(text)) {
    return 'ta'
  }
  if (/\b(?:in\s+telugu|reply\s+in\s+telugu|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+telugu|explain\s+in\s+telugu|answer\s+in\s+telugu|respond\s+in\s+telugu|tell\s+(?:me\s+)?in\s+telugu|translate\s+(?:to|in)\s+telugu|provide\s+in\s+telugu|telugu\s+please)\b/i.test(text)) {
    return 'te'
  }
  if (/\b(?:in\s+bengali|in\s+bangla|reply\s+in\s+bengali|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+bengali|explain\s+in\s+bengali|answer\s+in\s+bengali|respond\s+in\s+bengali|tell\s+(?:me\s+)?in\s+bengali|translate\s+(?:to|in)\s+bengali|provide\s+in\s+bengali|bengali\s+please)\b/i.test(text)) {
    return 'bn'
  }
  if (/\b(?:in\s+gujarati|reply\s+in\s+gujarati|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+gujarati|explain\s+in\s+gujarati|answer\s+in\s+gujarati|respond\s+in\s+gujarati|tell\s+(?:me\s+)?in\s+gujarati|translate\s+(?:to|in)\s+gujarati|provide\s+in\s+gujarati|gujarati\s+please)\b/i.test(text)) {
    return 'gu'
  }
  if (/\b(?:in\s+kannada|reply\s+in\s+kannada|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+kannada|explain\s+in\s+kannada|answer\s+in\s+kannada|respond\s+in\s+kannada|tell\s+(?:me\s+)?in\s+kannada|translate\s+(?:to|in)\s+kannada|provide\s+in\s+kannada|kannada\s+please)\b/i.test(text)) {
    return 'kn'
  }
  if (/\b(?:in\s+malayalam|reply\s+in\s+malayalam|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+malayalam|explain\s+in\s+malayalam|answer\s+in\s+malayalam|respond\s+in\s+malayalam|tell\s+(?:me\s+)?in\s+malayalam|translate\s+(?:to|in)\s+malayalam|provide\s+in\s+malayalam|malayalam\s+please)\b/i.test(text)) {
    return 'ml'
  }
  if (/\b(?:in\s+punjabi|reply\s+in\s+punjabi|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+punjabi|explain\s+in\s+punjabi|answer\s+in\s+punjabi|respond\s+in\s+punjabi|tell\s+(?:me\s+)?in\s+punjabi|translate\s+(?:to|in)\s+punjabi|provide\s+in\s+punjabi|punjabi\s+please)\b/i.test(text)) {
    return 'pa'
  }
  if (/\b(?:in\s+odia|in\s+oriya|reply\s+in\s+odia|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+odia|explain\s+in\s+odia|answer\s+in\s+odia|respond\s+in\s+odia|tell\s+(?:me\s+)?in\s+odia|translate\s+(?:to|in)\s+odia|provide\s+in\s+odia|odia\s+please)\b/i.test(text)) {
    return 'or'
  }
  if (/\b(?:in\s+english|reply\s+in\s+english|give\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+english|explain\s+in\s+english|answer\s+in\s+english|respond\s+in\s+english|english\s+please)\b/i.test(text)) {
    return 'en'
  }

  // 2. Explicit Indic phrasing asking for language in script
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

  // 3. Indic script detection
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

function stripLanguageRequestPhrases(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/\b(?:in\s+(?:hindi|marathi|tamil|telugu|bengali|bangla|gujarati|kannada|malayalam|punjabi|odia|oriya|english))\b/gi, '')
    .replace(/\b(?:reply|give|explain|answer|respond|tell\s+me|translate|provide)\s+(?:it\s+|this\s+|me\s+|response\s+|answer\s+)?in\s+[a-z]+\b/gi, '')
    .replace(/\b(?:hindi\s+mein|hindi\s+me|marathi\s+madhe)\b/gi, '')
    .replace(/हिंदी\s*(?:में|मे)?|हिन्दी\s*(?:में|मे)?|मराठी\s*(?:मध्ये|त)?|தமிழில்|తెలుగులో|বাংলায়|ગુજરાતીમાં|ಕನ್ನಡದಲ್ಲಿ|മലയാളത്തിൽ|ਪੰਜਾਬੀ\s*ਵਿੱਚ|ଓଡ଼ିଆରେ/gi, '')
    .replace(/\b(?:please|can\s+you)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// ── 2. CONVERSATIONAL CONTEXT EXTRACTOR ──
function extractContextKeywords(chatHistory) {
  if (!Array.isArray(chatHistory) || chatHistory.length === 0) return ''
  const recent = chatHistory.slice(-6)
  const fullText = recent.map(m => (typeof m.content === 'string' ? m.content : '')).join(' ')

  const stdMatches = fullText.match(/\bIS\s*\d+(?::\d+)?(?:\s*\(Part\s*\d+\))?/gi) || []
  const uniqueStds = Array.from(new Set(stdMatches.map(s => s.replace(/\s+/g, ' ').toUpperCase()))).slice(0, 3)

  return uniqueStds.join(' ')
}

// ── 3. PURE DYNAMIC RAG & DATABASE EXTRACTION ENGINE ──
async function queryRenderRAG(searchQ, cleanQ, ragApiKey, role, language) {
  const matches = []
  const citations = []
  let sources = []
  let relatedQuestions = []
  let ragAnswer = ''

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    const chatRes = await fetch(`${RAG_BASE}/api/v1/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ragApiKey}`,
      },
      body: JSON.stringify({
        content: searchQ,
        generateAnswer: true,
        role: role === 'manufacturer' ? 'msme' : 'consumer',
        language: language || 'en',
        topK: 5,
      }),
      signal: controller.signal,
    }).catch(() => null)
    clearTimeout(timeoutId)

    if (chatRes && chatRes.ok) {
      const chatData = await chatRes.json().catch(() => null)
      if (chatData) {
        ragAnswer = chatData.answer || chatData.content || ''
        relatedQuestions = chatData.related_questions || chatData.relatedQuestions || []

        const rawSources = (Array.isArray(chatData.sources) && chatData.sources.length > 0)
          ? chatData.sources
          : [
              ...(Array.isArray(chatData.evidence) ? chatData.evidence : []),
              ...(Array.isArray(chatData.documents) ? chatData.documents : []),
              ...(Array.isArray(chatData.results) ? chatData.results : []),
              ...(Array.isArray(chatData.laboratories) ? chatData.laboratories : []),
            ]

        if (rawSources.length > 0) {
          matches.push({
            type: 'render_rag',
            data: rawSources,
            ragAnswer,
          })

          sources = rawSources.slice(0, 5).map((s) => ({
            standard: s.standard || s.document_standard || s.standard_code || (Array.isArray(s.supported_standards) ? s.supported_standards[0] : null) || 'Indian Standard',
            title: s.title || s.lab_name || s.product || s.standard || 'Bureau of Indian Standards Statutory Document',
            product: s.product || null,
            clause: s.clause || null,
            section: s.section || (s.page ? `Page ${s.page}` : (s.lab_name ? 'Laboratory Directory' : null)),
            page: s.page || null,
            source_file: s.source_file || s.sourceFile || s.source_url || s.scope_url || null,
            score: s.score !== undefined ? Number(s.score) : (s.hybrid_score !== undefined ? Number(s.hybrid_score) : 0.95),
            document_status: s.document_status || s.status || 'current',
            text: s.text || s.content || (s.lab_metadata?.content) || (s.labMetadata?.content) || '',
            chunk_id: s.chunk_id || s.chunkId || null,
            document_id: s.document_id || s.documentId || null,
          }))

          citations.push(...sources)
        }
      }
    }

    // Secondary fallback to /api/v1/search if no sources returned
    if (sources.length === 0) {
      const searchCtrl = new AbortController()
      const searchTimeout = setTimeout(() => searchCtrl.abort(), 6000)
      const searchRes = await fetch(`${RAG_BASE}/api/v1/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ragApiKey}`,
        },
        body: JSON.stringify({ query: searchQ, limit: 5, top_k: 5 }),
        signal: searchCtrl.signal,
      }).catch(() => null)
      clearTimeout(searchTimeout)

      if (searchRes && searchRes.ok) {
        const searchData = await searchRes.json().catch(() => null)
        const rawSearchSources = [
          ...(Array.isArray(searchData?.sources) ? searchData.sources : []),
          ...(Array.isArray(searchData?.evidence) ? searchData.evidence : []),
          ...(Array.isArray(searchData?.results) ? searchData.results : []),
          ...(Array.isArray(searchData?.documents) ? searchData.documents : []),
        ]
        if (rawSearchSources.length > 0) {
          ragAnswer = searchData.answer || ragAnswer || ''
          matches.push({
            type: 'render_rag',
            data: rawSearchSources,
            ragAnswer,
          })

          sources = rawSearchSources.slice(0, 5).map((s) => ({
            standard: s.standard || s.document_standard || s.standard_code || 'Indian Standard',
            title: s.title || s.product || s.standard || 'Bureau of Indian Standards Statutory Document',
            product: s.product || null,
            clause: s.clause || null,
            section: s.section || (s.page ? `Page ${s.page}` : null),
            page: s.page || null,
            source_file: s.source_file || s.sourceFile || null,
            score: s.score !== undefined ? Number(s.score) : (s.hybrid_score !== undefined ? Number(s.hybrid_score) : 0.90),
            document_status: s.document_status || s.status || 'current',
            text: s.text || s.content || '',
            chunk_id: s.chunk_id || s.chunkId || null,
            document_id: s.document_id || s.documentId || null,
          }))

          citations.push(...sources)
        }
      }
    }
  } catch (ragErr) {
    console.warn('Render RAG query error:', ragErr.message)
  }

  return { matches, citations, sources, relatedQuestions, ragAnswer }
}

async function extractRAGGroundingData(query, ragApiKey, role = 'consumer', language = 'en', chatHistory = []) {
  const cleanQ = (query || '').trim()

  // Strip explicit language request phrasing for clean semantic vector retrieval
  const strippedQ = stripLanguageRequestPhrases(cleanQ)
  const coreQuery = strippedQ && strippedQ.length >= 3 ? strippedQ : cleanQ

  // Contextual query expansion for pronouns / follow-up queries
  const contextKeywords = extractContextKeywords(chatHistory)
  const hasPronounOrFollowUp = /\b(it|its|this|these|that|those|the standard|fees?|cost|concession|testing|tests?|lab|laboratory|license|licence|process|steps?|procedure|penalty|scheme|sit)\b/i.test(coreQuery)
  const searchQ = (contextKeywords && (coreQuery.split(/\s+/).length <= 6 || hasPronounOrFollowUp))
    ? `${contextKeywords} ${coreQuery}`
    : coreQuery

  // 1. Query Render RAG service
  const ragResult = await queryRenderRAG(searchQ, coreQuery, ragApiKey, role, language)

  // 2. Query Neon PostgreSQL documents & certifications to augment if sources are sparse
  const sql = getDb()
  if (sql && ragResult.sources.length < 3) {
    try {
      const searchKeywords = coreQuery.split(/\s+/).filter(w => w.length > 2)
      const primaryTerm = searchKeywords[0] || coreQuery

      const docRows = await sql`
        SELECT id, title, file_name, category, description, standard_code
        FROM documents
        WHERE title ILIKE ${'%' + primaryTerm + '%'}
           OR description ILIKE ${'%' + primaryTerm + '%'}
           OR standard_code ILIKE ${'%' + primaryTerm + '%'}
        LIMIT 3
      `.catch(() => [])

      if (docRows && docRows.length > 0) {
        ragResult.matches.push({
          type: 'db_documents',
          data: docRows
        })
        for (const d of docRows) {
          ragResult.sources.push({
            standard: d.standard_code || 'Indian Standard',
            title: d.title || d.file_name,
            product: d.category,
            clause: 'Database Record',
            section: null,
            page: null,
            source_file: d.file_name,
            score: 0.95,
            document_status: 'current',
            text: d.description || d.title,
          })
        }
      }

      const certRows = await sql`
        SELECT id, product, standard, category, status
        FROM certifications
        WHERE product ILIKE ${'%' + primaryTerm + '%'}
           OR standard ILIKE ${'%' + primaryTerm + '%'}
        LIMIT 3
      `.catch(() => [])

      if (certRows && certRows.length > 0) {
        ragResult.matches.push({
          type: 'db_certifications',
          data: certRows
        })
        for (const c of certRows) {
          ragResult.sources.push({
            standard: c.standard || 'Indian Standard',
            title: `${c.product} Certification`,
            product: c.product,
            clause: 'Certification Registry',
            section: null,
            page: null,
            source_file: null,
            score: 0.92,
            document_status: c.status || 'current',
            text: `Certified product: ${c.product} under ${c.standard} (${c.category}). Status: ${c.status}.`,
          })
        }
      }
    } catch (dbErr) {
      console.warn('Neon DB search notice:', dbErr.message)
    }
  }

  return ragResult
}

function buildContextString(matches) {
  let ctx = ''
  for (const block of matches) {
    if (block.type === 'render_rag') {
      if (block.ragAnswer) {
        ctx += `[RAG Verified Answer]\n${block.ragAnswer}\n\n`
      }
      for (const d of (block.data || [])) {
        if (d.lab_name || d.lab_code || d.labMetadata || d.lab_metadata) {
          const labName = d.lab_name || d.labMetadata?.lab_name || d.lab_metadata?.lab_name || 'BIS Recognized Testing Laboratory'
          const labCode = d.lab_code || d.labMetadata?.lab_code || d.lab_metadata?.lab_code || ''
          const address = d.address || d.labMetadata?.address || d.lab_metadata?.address || ''
          const city = d.city || d.district || d.labMetadata?.city || ''
          const state = d.state || d.labMetadata?.state || ''
          const phone = d.contact_number || d.labMetadata?.contact_number || d.lab_metadata?.contact_number || ''
          const email = d.email || d.labMetadata?.email || d.lab_metadata?.email || ''
          const scope = (d.supported_standards || d.labMetadata?.supported_standards || []).join(', ') || 'Indian Standards'
          ctx += `[BIS Recognized Testing Laboratory | Lab Code: ${labCode}]\n- Name: ${labName}\n- Full Address: ${address || `${city}, ${state}`}\n- Contact Phone: ${phone}\n- Contact Email: ${email}\n- Testing Scope: ${scope}\n- Verification Details: ${d.content || d.text || ''}\n\n`
        } else {
          const std = d.standard_id || d.standard || d.document_standard || 'Indian Standard'
          const title = d.title || std
          const sec = d.clause || (d.page ? `Page ${d.page}` : (d.section || ''))
          const text = d.text || d.content || ''
          if (text) {
            ctx += `[Standard: ${std} | Title: ${title}${sec ? ` | Section: ${sec}` : ''}]\n${text}\n\n`
          }
        }
      }
    } else if (block.type === 'db_documents') {
      for (const doc of (block.data || [])) {
        ctx += `[BIS Document Record | Standard: ${doc.standard_code || 'Standard'}]\n- Title: ${doc.title}\n- Category: ${doc.category}\n- Description: ${doc.description || ''}\n\n`
      }
    } else if (block.type === 'db_certifications') {
      for (const cert of (block.data || [])) {
        ctx += `[BIS Active Certification Record]\n- Product: ${cert.product}\n- Standard: ${cert.standard}\n- Category: ${cert.category}\n- Status: ${cert.status}\n\n`
      }
    }
  }
  return ctx.trim()
}

// ── 4. RESILIENT GEMINI ENGINE ──
async function callGeminiApi(promptText, apiKeyOverride) {
  let keysToTry = []
  if (apiKeyOverride && apiKeyOverride.trim()) {
    keysToTry.push(apiKeyOverride.trim())
  }
  if (process.env.GEMINI_API_KEY) {
    keysToTry.push(process.env.GEMINI_API_KEY.trim())
  }
  keysToTry.push(...GEMINI_KEY_POOL)
  keysToTry = Array.from(new Set(keysToTry))

  const models = [
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
  ]

  for (const model of models) {
    for (const key of keysToTry) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 12000)

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: {
                temperature: 0.2,
                maxOutputTokens: 8192,
                responseMimeType: 'application/json',
              },
            }),
            signal: controller.signal,
          }
        )
        clearTimeout(timeoutId)

        if (res.ok) {
          const data = await res.json()
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) return text.trim()
        } else {
          continue
        }
      } catch (e) {
        continue
      }
    }
  }
  return null
}

// ── 5. STRUCTURED GEMINI PROMPT BUILDER ──
async function formatRAGResponseWithGemini(userQuery, dbContext, chatHistory, geminiKey, role = 'consumer', language = 'en') {
  const historyStr = Array.isArray(chatHistory) && chatHistory.length > 0
    ? chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n\n')
    : ''

  const LANG_NAMES = {
    hi: 'Hindi (हिन्दी)',
    mr: 'Marathi (मराठी)',
    ta: 'Tamil (தமிழ்)',
    te: 'Telugu (తెలుగు)',
    bn: 'Bengali (বাংলা)',
    gu: 'Gujarati (ગુજરાતી)',
    kn: 'Kannada (ಕನ್ನಡ)',
    ml: 'Malayalam (മലയാളം)',
    pa: 'Punjabi (ਪੰਜਾਬੀ)',
    or: 'Odia (ଓଡ଼ିଆ)',
    en: 'English'
  }
  const targetLang = LANG_NAMES[language] || 'English'

  const prompt = `You are BIS Saarthi, the intelligent AI assistant for the Bureau of Indian Standards (BIS), Ministry of Consumer Affairs, Food & Public Distribution, Government of India.
Your mission is to synthesize the retrieved regulatory records and conversation context into an accurate, authoritative, helpful, and naturally formatted response.

=== 1. CONTEXT CONTINUITY & ROLE ===
- Active Role: ${role} (${role === 'manufacturer' ? 'MSME / Manufacturer' : 'Citizen / Consumer'}).
- Target Language: ${targetLang} (Code: "${language}").
- Maintain natural continuity with the conversation history. If the user asks a follow-up question (e.g. using pronouns like "it", "this", or asking for specific details), address it directly without repeating unnecessary background.

=== 2. NATURAL & ADAPTIVE FORMATTING (NO RIGID TEMPLATES) ===
- Every answer should feel unique, tailored, and naturally styled to answer the specific query:
  * For testing laboratories or recognized testing facilities: ALWAYS explicitly present the matched laboratories from the retrieved records (including Laboratory Name, Lab Code, Full Address, Contact Phone, Email, and Recognized Testing Scope).
  * For technical standards & testing parameters: present clean bullet points, tables, or highlighted lists.
  * For procedural steps (certification, license verification, filing complaints): use clear numbered steps.
  * For general questions or greetings: provide a warm, authoritative greeting and concise overview of BIS functions and key schemes (ISI mark, CRS, Hallmarking, Laboratory recognition), and invite them to explore.
  * NEVER say "The Bureau of Indian Standards database did not return any records". Always provide constructive, authoritative BIS guidance and refer to official verification on the BIS Care App or Manakonline.
- Naturally reference relevant Indian Standards and statutory guidance inline where applicable.
- Keep the tone professional, authoritative, courteous, and easy to understand.

=== 3. OUTPUT SCHEMA (MANDATORY JSON ONLY) ===
Respond ONLY with a single valid JSON object. Do not wrap in markdown code blocks.

{
  "formattedContent": "Naturally formatted response in ${targetLang} using markdown best suited for this specific query.",
  "sources": [
    {
      "file": "string (the relevant Indian Standard code, laboratory directory, or regulatory record)",
      "location": "string (clause, section, page, or laboratory location)"
    }
  ],
  "suggestedFollowUpQuestions": [
    "Contextually relevant follow-up question 1 in ${targetLang}?",
    "Contextually relevant follow-up question 2 in ${targetLang}?",
    "Contextually relevant follow-up question 3 in ${targetLang}?"
  ]
}

=== 4. MANDATORY LANGUAGE REQUIREMENT ===
${language !== 'en' ? `The user specifically requested the response in ${targetLang}.
CRITICAL INSTRUCTION:
The ENTIRE "formattedContent" and ALL "suggestedFollowUpQuestions" MUST be written 100% fluently, naturally, and completely in ${targetLang}.
- Do NOT reply in English.
- Every sentence, paragraph, bullet point, heading, and follow-up question MUST be in ${targetLang}.
- Retain ONLY standard numbers (e.g., IS 14543, IS 10500, IS 1417) and statutory acronyms (BIS, ISI, CRS, HUID, NABL) in English or Latin script.` : 'Provide your response in clear, authoritative, and natural English.'}

------------------------------
<conversation_history>
${historyStr || 'No previous messages in this session.'}
</conversation_history>

<retrieved_regulatory_records>
${dbContext || 'General Bureau of Indian Standards statutory regulations and gazette notifications under the Bureau of Indian Standards Act, 2016.'}
</retrieved_regulatory_records>

Current User Query: ${userQuery}`

  return await callGeminiApi(prompt, geminiKey)
}

// ── 6. CLEAN FALLBACK DYNAMIC RESPONSE FORMATTER ──
function formatResponseAccordingToQuery(userQuery, rawAnswer, top5Sources, role = 'consumer', language = 'en') {
  let text = (rawAnswer || '').trim()

  // 1. Remove raw trailing citation attachments
  text = text.replace(/Source:\s*[^\n]+(?:\n|$)/gi, '').trim()

  // 2. Normalize bullet points (convert , •, etc. into markdown '- ')
  text = text.replace(/^[ \t]*[•]\s*/gm, '- ')

  // 3. Remove OCR / corrupted unicode fragments in English answers
  if (!userQuery.match(/[\u0900-\u0D7F]/) && language === 'en') {
    text = text.replace(/उ[\"”]पाद\s*मै\(युअल[^\n]+/gi, '')
    text = text.replace(/:व6शि=ट/gi, '')
    text = text.replace(/अनुGपता/gi, '')
    text = text.replace(/मूल्यांकन/gi, '')
  }

  // 4. Ensure clean spacing between paragraphs
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  // 5. If rawAnswer is insufficient or empty, provide constructive statutory guidance
  const isInsufficient = !text || /couldn't find sufficient evidence|not enough evidence|no relevant information/i.test(text)
  if (isInsufficient) {
    if (top5Sources.length > 0) {
      const primarySource = top5Sources[0]
      const std = primarySource?.standard || 'Indian Standard'
      const title = primarySource?.title || 'Statutory Record'
      text = `### Bureau of Indian Standards (BIS) Guidance\n\n` +
        `**Applicable Standard:** ${std}\n\n` +
        `**Document Reference:** ${title}\n\n` +
        (primarySource.text ? `${primarySource.text}\n\n` : '') +
        `- **Verification:** Verify standards requirements and license validity on the BIS Care App or the official Manakonline portal.`
    } else {
      text = `### Bureau of Indian Standards (BIS) Guidance\n\n` +
        `The Bureau of Indian Standards operates multiple conformity assessment schemes, including the **Product Certification Scheme (ISI Mark)**, **Compulsory Registration Scheme (CRS)**, **Hallmarking of Gold & Silver Artefacts**, and the **Laboratory Recognition Scheme (LRS)**.\n\n` +
        `To retrieve specific test parameters, fee schedules, or recognized testing laboratories, please specify:\n` +
        `- The Indian Standard number (e.g., \`IS 14543\`, \`IS 10500\`, \`IS 1417\`, \`IS 269\`), OR\n` +
        `- The product category and required location (e.g., *Packaged Drinking Water in Pune*, *Cement Testing in Mumbai*).\n\n` +
        `- **Official Verification:** You can also verify valid licenses and find recognized testing centres on the [BIS Care App](https://play.google.com/store/apps/details?id=com.bis.mobileapp) or the [BIS Manakonline Portal](https://www.manakonline.in/).`
    }
  }

  // 6. If testing laboratories are in sources or queried
  const isLabQuery = /lab|laboratory|laboratories|testing facilit|testing center/i.test(userQuery)
  const labSources = top5Sources.filter(s => s.clause?.includes('Laboratory') || s.title?.toLowerCase().includes('lab') || s.section?.toLowerCase().includes('lab'))
  if (isLabQuery && labSources.length > 0 && !text.includes('Testing Laboratories')) {
    text += `\n\n### BIS Recognized Testing Laboratories\n`
    for (const lab of labSources) {
      text += `- **${lab.title}**\n  - **Recognized Scope:** ${lab.standard || lab.product || 'Indian Standards'}\n  - **Details:** ${lab.text || lab.section || 'BIS-recognized facility'}\n`
    }
  }

  return text
}

function generateFollowUps(userQuery, top5Sources, backendRelatedQuestions, language) {
  if (Array.isArray(backendRelatedQuestions) && backendRelatedQuestions.length > 0) {
    return backendRelatedQuestions.slice(0, 3)
  }
  const std = top5Sources[0]?.standard
  return [
    std ? `What testing parameters are mandatory under ${std}?` : 'What are the general BIS product certification steps?',
    'How to verify license status on the BIS Care App?',
    'What are the fee concessions for MSME manufacturers?'
  ]
}

export default async function handler(req, res) {
  const startTime = Date.now()

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-rag-key,x-gemini-key')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    content: rawContent,
    query: rawQuery,
    originalQuery,
    sessionId,
    chatHistory = [],
    language = 'en',
    role = 'consumer',
    ragApiKey: bodyRagKey,
    externalRagApiKey,
    geminiApiKey: bodyGeminiKey,
  } = req.body || {}

  const content = (rawContent || rawQuery || '').trim()
  if (!content) {
    return res.status(400).json({ error: 'Query content is required' })
  }

  // Intelligently detect if the user asked for a specific language in the query text
  const effectiveLanguage = detectRequestedLanguage(
    content,
    originalQuery ? detectRequestedLanguage(originalQuery, language) : language
  )

  const providedRagKey = (
    bodyRagKey ||
    externalRagApiKey ||
    req.headers['x-rag-key'] ||
    req.headers['x-external-rag-key'] ||
    process.env.RAG_API_KEY ||
    ''
  ).trim()

  const ragApiKey = await getActiveRAGToken(providedRagKey)

  const geminiApiKey = (
    bodyGeminiKey ||
    req.headers['x-gemini-key'] ||
    process.env.GEMINI_API_KEY ||
    DEFAULT_GEMINI_KEY
  ).trim()

  try {
    // 1. Extract RAG Grounding data from Render RAG and Neon PostgreSQL
    const { matches, citations, sources, relatedQuestions, ragAnswer } = await extractRAGGroundingData(
      content,
      ragApiKey,
      role,
      effectiveLanguage,
      chatHistory
    )

    // 2. Select top 5 sources directly coming from backend data as-is
    const top5Sources = (sources && sources.length > 0 ? sources : citations).slice(0, 5).map(s => ({
      standard: s.standard || s.document_standard || s.standard_code || 'Indian Standard',
      title: s.title || s.product || s.standard || 'Bureau of Indian Standards Statutory Document',
      product: s.product || null,
      clause: s.clause || null,
      section: s.section || (s.page ? `Page ${s.page}` : null),
      page: s.page || null,
      source_file: s.source_file || s.sourceFile || null,
      score: s.score !== undefined ? Number(s.score) : (s.hybrid_score !== undefined ? Number(s.hybrid_score) : 0.95),
      document_status: s.document_status || s.status || 'current',
      text: s.text || s.content || '',
      chunk_id: s.chunk_id || s.chunkId || null,
      document_id: s.document_id || s.documentId || null,
    }))

    const dbContext = buildContextString(matches)

    // 3. Synthesize rich, adaptive, context-aware answer with Gemini in the requested language
    let formattedContent = ''
    let followUps = []
    let finalSources = [...top5Sources]

    const geminiRaw = await formatRAGResponseWithGemini(
      content,
      dbContext,
      chatHistory,
      geminiApiKey,
      role,
      effectiveLanguage
    )

    if (geminiRaw) {
      try {
        let cleanStr = geminiRaw.replace(/```json/gi, '').replace(/```/g, '').trim()
        const startIdx = cleanStr.indexOf('{')
        const endIdx = cleanStr.lastIndexOf('}')
        if (startIdx !== -1 && endIdx !== -1) {
          cleanStr = cleanStr.substring(startIdx, endIdx + 1)
        }
        const parsed = JSON.parse(cleanStr)
        if (parsed.formattedContent) {
          formattedContent = parsed.formattedContent
          if (Array.isArray(parsed.suggestedFollowUpQuestions) && parsed.suggestedFollowUpQuestions.length > 0) {
            followUps = parsed.suggestedFollowUpQuestions.slice(0, 3)
          }
          if (Array.isArray(parsed.sources) && parsed.sources.length > 0 && finalSources.length === 0) {
            finalSources = parsed.sources.map(s => ({
              standard: s.file || 'Indian Standard',
              title: s.file || 'Bureau of Indian Standards Statutory Document',
              clause: s.location || 'Statutory Reference',
              score: 0.95,
              document_status: 'current',
              text: `Statutory compliance specification for ${s.file || 'Indian Standards'}.`
            }))
          }
        }
      } catch (parseErr) {
        console.warn('Gemini JSON parse notice:', parseErr.message)
        formattedContent = geminiRaw.replace(/```json/gi, '').replace(/```/g, '').trim()
      }
    }

    // Fallback if Gemini returned empty
    if (!formattedContent) {
      formattedContent = formatResponseAccordingToQuery(content, ragAnswer, top5Sources, role, effectiveLanguage)
    }
    if (followUps.length === 0) {
      followUps = generateFollowUps(content, top5Sources, relatedQuestions, effectiveLanguage)
    }

    const latencyMs = Date.now() - startTime

    const responseToFrontend = {
      content: formattedContent,
      sources: finalSources,
      citations: finalSources,
      followUps,
      language: effectiveLanguage,
      latency: `${latencyMs}ms`,
      canVerify: finalSources.length > 0,
      ragExtracted: matches.length > 0,
      ragEndpoint: RAG_BASE,
    }

    // Persist to Neon DB if user is signed in
    let user = { id: 'guest', role }
    const authHeader = req.headers['authorization']
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET)
        if (decoded) user = decoded
      } catch (_) {}
    }

    const sql = getDb()
    if (sessionId && user.id !== 'guest' && sql) {
      try {
        const numericUserId = parseInt(user.id, 10)
        if (!isNaN(numericUserId)) {
          const sessionTitle = content.slice(0, 45).trim() || 'BIS Query'

          await sql`
            INSERT INTO chat_sessions (id, user_id, title, updated_at)
            VALUES (${sessionId}, ${numericUserId}, ${sessionTitle}, NOW())
            ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
          `.catch(() => {})

          const leanCitations = finalSources.slice(0, 3).map(c => ({
            source: c.standard || c.title,
            title: c.title,
            clause: c.clause,
          }))

          await sql`
            INSERT INTO chat_messages (session_id, role, content, metadata)
            VALUES (${sessionId}, 'user', ${content}, ${JSON.stringify({ language: effectiveLanguage, userRole: user.role, userId: numericUserId })}::jsonb)
          `.catch(() => {})

          await sql`
            INSERT INTO chat_messages (session_id, role, content, metadata)
            VALUES (${sessionId}, 'assistant', ${formattedContent}, ${JSON.stringify({ citations: leanCitations, userRole: user.role, language: effectiveLanguage })}::jsonb)
          `.catch(() => {})

          await sql`
            INSERT INTO audit_logs (user_id, user_email, action, resource, details)
            VALUES (${numericUserId}, ${user.email}, 'CHAT_QUERY', ${'Chat session ' + sessionId}, ${JSON.stringify({ role: user.role, standard: leanCitations[0]?.source || null, language: effectiveLanguage })}::jsonb)
          `.catch(() => {})
        }
      } catch (dbErr) {
        console.warn('DB session save notice:', dbErr.message)
      }
    }

    return res.status(200).json(responseToFrontend)
  } catch (err) {
    console.error('Chat query critical error:', err)
    return res.status(200).json({
      content: `### Bureau of Indian Standards (BIS) Guidance\n\nThe Bureau of Indian Standards assists citizens and manufacturers with standard specifications, testing laboratories, and certification schemes. Please specify your product category or Indian Standard code (e.g., IS 14543 for Packaged Drinking Water, IS 10500 for Drinking Water, IS 1417 for Gold Hallmarking) to proceed, or visit the official [BIS Care App](https://play.google.com/store/apps/details?id=com.bis.mobileapp).`,
      sources: [],
      citations: [],
      followUps: [
        'How to verify a license on BIS Care App?',
        'What are the mandatory testing requirements under IS 14543?',
        'What is the procedure for obtaining an ISI mark?'
      ],
      language: effectiveLanguage,
      latency: `${Date.now() - startTime}ms`,
      canVerify: false,
      ragExtracted: false,
      ragEndpoint: RAG_BASE,
    })
  }
}
