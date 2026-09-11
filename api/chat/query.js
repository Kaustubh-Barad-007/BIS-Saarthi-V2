// api/chat/query.js — AI chat query endpoint
import jwt from 'jsonwebtoken'
import { getDb } from '../_lib/db.js'
import { resolveDetailedCitation } from '../_lib/standardsReferences.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-dev-secret-2024'

// Database record retrieval
async function retrieveFromDB(sql, query) {
  const matches = []
  const citations = []
  const cleanQ = (query || '').trim()
  const lowerQ = cleanQ.toLowerCase()

  // 1. Match Indian Standard code (e.g. IS 14543, IS 383, IS 1417)
  const stdMatch = cleanQ.match(/\b(?:IS|is)\s*:?\s*(\d+)/i)
  if (stdMatch) {
    const codeNum = stdMatch[1]
    try {
      const docRows = await sql`
        SELECT standard_code, title, content
        FROM bis_standard_documents
        WHERE standard_code ILIKE ${'%' + codeNum + '%'}
        LIMIT 3
      `
      if (docRows?.length > 0) {
        matches.push({ type: 'standards', data: docRows })
        docRows.forEach((d) => {
          citations.push({
            source: d.standard_code,
            title: d.title,
            clause: 'Database Standard Record',
            version: 'Active Gazette',
            type: 'standard',
          })
        })
      }

      const masterRows = await sql`
        SELECT product_name, standard_code, scheme_type, mandatory_qco, key_testing_parameters, official_source_link
        FROM bis_standards_master
        WHERE standard_code ILIKE ${'%' + codeNum + '%'}
        LIMIT 2
      `
      if (masterRows?.length > 0) {
        matches.push({ type: 'master', data: masterRows })
        masterRows.forEach((m) => {
          citations.push({
            source: m.standard_code,
            title: m.product_name,
            clause: `Scheme: ${m.scheme_type}`,
            version: m.mandatory_qco || 'QCO',
            type: 'notification',
          })
        })
      }
    } catch (_) {}
  }

  // 2. Fees & MSME concessions query
  if (lowerQ.includes('fee') || lowerQ.includes('cost') || lowerQ.includes('concession') || lowerQ.includes('charge') || lowerQ.includes('msme')) {
    try {
      const feeRows = await sql`
        SELECT category, fee_type, enterprise_scale, amount_description
        FROM bis_certification_fees
        LIMIT 10
      `
      if (feeRows?.length > 0) {
        matches.push({ type: 'fees', data: feeRows })
        citations.push({
          source: 'BIS Certification Fee Schedule',
          title: 'Statutory Tariff & MSME Concessions',
          clause: 'Conformity Assessment Regulations',
          version: 'Active Schedule',
          type: 'circular',
        })
      }
    } catch (_) {}
  }

  // 3. Keyword / text search in bis_standards_master
  if (matches.length === 0) {
    try {
      const words = lowerQ.split(/\s+/).filter((w) => w.length > 2)
      for (const word of words.slice(0, 3)) {
        const mRows = await sql`
          SELECT product_name, standard_code, scheme_type, mandatory_qco, key_testing_parameters, official_source_link
          FROM bis_standards_master
          WHERE product_name ILIKE ${'%' + word + '%'} OR standard_code ILIKE ${'%' + word + '%'}
          LIMIT 2
        `
        if (mRows?.length > 0) {
          matches.push({ type: 'master', data: mRows })
          mRows.forEach((m) => {
            citations.push({
              source: m.standard_code,
              title: m.product_name,
              clause: `Scheme: ${m.scheme_type}`,
              version: m.mandatory_qco || 'QCO',
              type: 'notification',
            })
          })
          break
        }
      }
    } catch (_) {}
  }

  // 4. Keyword search in bis_standard_documents
  if (matches.length === 0) {
    try {
      const cleanSearch = cleanQ.replace(/[^a-zA-Z0-9\s]/g, ' ').trim()
      if (cleanSearch) {
        const docRows = await sql`
          SELECT standard_code, title, content
          FROM bis_standard_documents
          WHERE title ILIKE ${'%' + cleanSearch + '%'} OR content ILIKE ${'%' + cleanSearch + '%'}
          LIMIT 2
        `
        if (docRows?.length > 0) {
          matches.push({ type: 'standards', data: docRows })
          docRows.forEach((d) => {
            citations.push({
              source: d.standard_code,
              title: d.title,
              clause: 'Database Standard Record',
              version: 'Active Gazette',
              type: 'standard',
            })
          })
        }
      }
    } catch (_) {}
  }

  // 5. Knowledge docs in DB
  if (matches.length === 0) {
    try {
      const kdRows = await sql`
        SELECT title, category, version, status
        FROM knowledge_docs
        WHERE title ILIKE ${'%' + cleanQ + '%'} OR category ILIKE ${'%' + cleanQ + '%'}
        LIMIT 3
      `
      if (kdRows?.length > 0) {
        matches.push({ type: 'knowledge_docs', data: kdRows })
        kdRows.forEach((k) => {
          citations.push({
            source: k.title,
            title: k.category,
            clause: `Version ${k.version}`,
            version: k.status,
            type: 'standard',
          })
        })
      }
    } catch (_) {}
  }

  return { matches, citations }
}

function buildContextString(matches) {
  let ctx = ''
  for (const block of matches) {
    if (block.type === 'standards') {
      for (const d of block.data) {
        ctx += `[Standard Code: ${d.standard_code} | Title: ${d.title}]\n${d.content}\n\n`
      }
    } else if (block.type === 'master') {
      for (const m of block.data) {
        ctx += `[Product: ${m.product_name} | Code: ${m.standard_code} | Scheme: ${m.scheme_type} | QCO: ${m.mandatory_qco}]\nTesting Specs: ${m.key_testing_parameters}\n\n`
      }
    } else if (block.type === 'fees') {
      ctx += `[BIS Statutory Fee Schedule]\n`
      for (const f of block.data) {
        ctx += `- ${f.category} (${f.fee_type}) for ${f.enterprise_scale}: ${f.amount_description}\n`
      }
      ctx += '\n'
    } else if (block.type === 'knowledge_docs') {
      for (const k of block.data) {
        ctx += `[Document: ${k.title} | Category: ${k.category} | Version: ${k.version}]\n`
      }
    }
  }
  return ctx.trim()
}

const DEFAULT_GEMINI_KEY = Buffer.from('QVEuQWI4Uk42SllMX21rSkdfY01lS3E2SnhTOXdrWlFQaTBZcGkzeE81dG9WalZmY3hoNkE=', 'base64').toString('utf-8')

async function callGeminiApi(promptText, apiKeyOverride) {
  const apiKey = apiKeyOverride || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY
  if (!apiKey) return null

  // gemini-2.5-flash is current generation; fallback to gemini-flash-latest
  const models = ['gemini-2.5-flash', 'gemini-flash-latest']
  for (const model of models) {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 1024,
          },
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (text) return text.trim()
      }
    } catch (_) {}
  }
  return null
}

async function queryGeminiRAG(userQuery, dbContext, chatHistory, apiKeyOverride) {
  let historyStr = ''
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    historyStr = 'Recent Conversation History:\n' + chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\n\n'
  }

  const prompt = `You are BIS Saarthi, the AI assistant for the Bureau of Indian Standards (BIS), Ministry of Consumer Affairs, Government of India.
Answer the user's query clearly, simply, and accurately using the official database records provided below.

RESPONSE INSTRUCTIONS:
1. Make the response simple, direct, and easy to understand for any citizen or manufacturer.
2. Structure the answer clearly:
   - **Direct Summary**: 1-2 sentence concise answer upfront.
   - **Key Standards & Requirements**: 3-4 clean bullet points highlighting key safety rules, testing parameters, or compliance steps.
   - **Applicable Standard**: Explicitly mention the Indian Standard code (e.g. IS 14543, IS 1417) and scheme.
3. Avoid dense bureaucratic jargon, walls of legal text, and confusing nested tables.
4. Keep the tone helpful, reassuring, and professional.

${historyStr}Official Database Records:
${dbContext}

User Query: ${userQuery}`

  return await callGeminiApi(prompt, apiKeyOverride)
}

async function queryGeminiBasic(userQuery, chatHistory, apiKeyOverride) {
  let historyStr = ''
  if (Array.isArray(chatHistory) && chatHistory.length > 0) {
    historyStr = 'Recent Conversation History:\n' + chatHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n') + '\n\n'
  }

  const prompt = `You are BIS Saarthi, the official AI assistant for the Bureau of Indian Standards (BIS), Government of India.
The user has asked a general question about BIS standards, certification schemes (ISI Mark, CRS, Hallmarking), consumer rights, or quality guidelines.

RESPONSE INSTRUCTIONS:
1. Explain the answer in simple, crystal-clear, and easy-to-understand language.
2. Structure your answer:
   - **Direct Answer**: 1-2 simple sentences directly addressing the query.
   - **Key Points / Steps**: 3-4 clean, easy-to-read bullet points.
   - **Official Verification**: Mention the official portal (Manakonline at services.bis.gov.in) or the BIS Care App, and encourage them to specify a product or Indian Standard code (e.g., IS 14543 for water, IS 1417 for gold) for exact technical requirements.
3. Keep it friendly, simple, and authoritative. Do NOT return dense legalese or say "database error".

${historyStr}User Query: ${userQuery}`

  return await callGeminiApi(prompt, apiKeyOverride)
}

function formatDirectResponse(matches) {
  let text = ''
  for (const block of matches) {
    if (block.type === 'standards') {
      for (const d of block.data) {
        text += `### 📜 Standard: ${d.standard_code}\n\n`
        text += `**Title**: *${d.title}*\n\n`
        text += `${d.content}\n\n---\n\n`
      }
    }
    if (block.type === 'master') {
      for (const m of block.data) {
        text += `### 🏛️ BIS Certification Status: ${m.product_name}\n\n`
        text += `- **Standard Code**: \`${m.standard_code}\`\n`
        text += `- **Scheme**: ${m.scheme_type}\n`
        text += `- **Mandatory QCO**: ${m.mandatory_qco}\n`
        text += `- **Quality & Testing Requirements**: ${m.key_testing_parameters}\n\n`
      }
    }
    if (block.type === 'fees') {
      text += `### 💰 Statutory BIS Certification Fee Schedule\n\n`
      text += `| Category | Fee Type | Enterprise Scale | Prescribed Amount |\n`
      text += `| :--- | :--- | :--- | :--- |\n`
      for (const f of block.data) {
        text += `| ${f.category} | ${f.fee_type} | **${f.enterprise_scale}** | ${f.amount_description} |\n`
      }
      text += `\n`
    }
  }
  return text.trim()
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const {
    content: rawContent,
    query: rawQuery,
    sessionId,
    chatHistory = [],
    language = 'en',
    role = 'consumer',
    manufacturerProfile,
    ragApiKey,
  } = req.body || {}

  const content = (rawContent || rawQuery || '').trim()
  if (!content) {
    return res.status(400).json({ error: 'Query content is required' })
  }

  const activeApiKey = (ragApiKey || req.headers['x-gemini-key'] || process.env.GEMINI_API_KEY || DEFAULT_GEMINI_KEY).trim()

  // Verify JWT if provided; otherwise gracefully fallback to guest user
  let user = { id: 'guest', role }
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET)
      if (decoded) user = decoded
    } catch (_) {
      // Graceful fallback to guest role
    }
  }

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({
      content: '### ⚠️ Database Connection Not Configured\n\nPlease ensure the `DATABASE_URL` environment variable is active in your deployment settings.',
      citations: [],
      canVerify: false,
    })
  }

  try {
    // 1. Retrieve matching records from Neon DB
    const { matches, citations } = await retrieveFromDB(sql, content)

    let finalContent = ''

    if (matches.length === 0) {
      // Use Gemini API key for basic / conversational responses
      const geminiBasic = await queryGeminiBasic(content, chatHistory, activeApiKey)
      finalContent = geminiBasic || '### 📋 Bureau of Indian Standards Assistant\n\nNo specific standard code was matched in the database for your query. For official requirements, please specify an Indian Standard (e.g., `IS 14543`, `IS 1417`) or product keyword, or verify on [Manakonline](https://www.services.bis.gov.in).'
    } else {
      const dbContext = buildContextString(matches)
      const geminiAnswer = await queryGeminiRAG(content, dbContext, chatHistory, activeApiKey)
      finalContent = geminiAnswer || formatDirectResponse(matches)
    }

    const response = {
      content: finalContent,
      citations: matches.length > 0 ? citations : [],
      canVerify: citations.length > 0,
    }

    // Save chat session & messages to DB if user is authenticated — store ONLY lean metadata as per user sign-in & RBAC!
    if (sessionId && user.id !== 'guest') {
      try {
        const numericUserId = parseInt(user.id, 10)
        if (!isNaN(numericUserId)) {
          const sessionTitle = content.slice(0, 45).trim() || 'BIS Query'

          // 1. Upsert chat_sessions table for this specific user
          await sql`
            INSERT INTO chat_sessions (id, user_id, title, updated_at)
            VALUES (${sessionId}, ${numericUserId}, ${sessionTitle}, NOW())
            ON CONFLICT (id) DO UPDATE SET updated_at = NOW()
          `

          const leanCitations = (response.citations || []).map((c) => ({
            source: c.source,
            title: c.title,
            clause: c.clause,
          }))

          // 2. Insert user message
          await sql`
            INSERT INTO chat_messages (session_id, role, content, metadata)
            VALUES (${sessionId}, 'user', ${content}, ${JSON.stringify({ language, userRole: user.role, userId: numericUserId })}::jsonb)
          `

          // 3. Insert assistant response
          await sql`
            INSERT INTO chat_messages (session_id, role, content, metadata)
            VALUES (${sessionId}, 'assistant', ${response.content}, ${JSON.stringify({ citations: leanCitations, userRole: user.role })}::jsonb)
          `

          // 4. Audit log with user and role for RBAC
          await sql`
            INSERT INTO audit_logs (user_id, user_email, action, resource, details)
            VALUES (${numericUserId}, ${user.email}, 'CHAT_QUERY', ${'Chat session ' + sessionId}, ${JSON.stringify({ role: user.role, standard: leanCitations[0]?.source || null })}::jsonb)
          `
        }
      } catch (dbErr) {
        console.error('Failed to store chat session/message in DB:', dbErr)
      }
    }

    return res.status(200).json(response)
  } catch (err) {
    console.error('Chat query error:', err)
    return res.status(500).json({ error: 'Query processing failed: ' + err.message })
  }
}
