// api/data.js — Unified Database Data Dispatcher (Complaints, Certs, Docs, Notifs, Logs, Standards)
import jwt from 'jsonwebtoken'
import { getDb, initDb } from './_lib/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-dev-secret-2024'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({
      status: 'no_db',
      complaints: [],
      certifications: [],
      notifications: [],
      documents: [],
      logs: [],
      standards: []
    })
  }

  try {
    await initDb(sql)
  } catch (initErr) {
    console.warn('initDb warning:', initErr.message)
  }

  let user = null
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      user = jwt.verify(authHeader.slice(7), JWT_SECRET)
    } catch (_) {}
  }

  const { type = '', search = '' } = req.query || {}

  try {
    // 1. Complaints
    if (type === 'complaints') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, subject, product, location, description, status, date
          FROM complaints
          ORDER BY date DESC
        `
        return res.status(200).json({ complaints: rows || [] })
      }
      if (req.method === 'POST') {
        const { id, subject, product, location = 'New Delhi', description = '' } = req.body || {}
        if (!subject || !product) return res.status(400).json({ error: 'Subject and product are required' })
        const compId = id || `COMP-${Date.now().toString().slice(-6)}`
        const userId = user?.id || null
        const userEmail = user?.email || 'consumer@bis.gov.in'
        const [newRow] = await sql`
          INSERT INTO complaints (id, user_id, user_email, subject, product, location, description, status)
          VALUES (${compId}, ${userId}, ${userEmail}, ${subject}, ${product}, ${location}, ${description}, 'pending')
          RETURNING *
        `
        return res.status(201).json({ complaint: newRow })
      }
      if (req.method === 'PUT') {
        const { id, status } = req.body || {}
        const [updated] = await sql`UPDATE complaints SET status = ${status} WHERE id = ${id} RETURNING *`
        return res.status(200).json({ complaint: updated })
      }
    }

    // 2. Certifications
    if (type === 'certifications') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, product, standard, category, lab, status, applied, updated, validity
          FROM certifications
          ORDER BY applied DESC
        `
        return res.status(200).json({ certifications: rows || [] })
      }
      if (req.method === 'POST') {
        const { id, product, standard, category = 'ISI Mark', lab = 'Central Lab Sahibabad' } = req.body || {}
        const certId = id || `CM/L-${Math.floor(1000000 + Math.random() * 9000000)}`
        const userId = user?.id || null
        const userEmail = user?.email || 'msme@bis.gov.in'
        const [newRow] = await sql`
          INSERT INTO certifications (id, user_id, user_email, product, standard, category, lab, status, validity)
          VALUES (${certId}, ${userId}, ${userEmail}, ${product}, ${standard}, ${category}, ${lab}, 'pending', 'Under Review')
          RETURNING *
        `
        return res.status(201).json({ certification: newRow })
      }
      if (req.method === 'PUT') {
        const { id, status } = req.body || {}
        const [updated] = await sql`UPDATE certifications SET status = ${status}, updated = NOW() WHERE id = ${id} RETURNING *`
        return res.status(200).json({ certification: updated })
      }
    }

    // 3. Notifications
    if (type === 'notifications') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl", created_at as "created"
          FROM notifications
          ORDER BY created_at DESC
          LIMIT 20
        `
        return res.status(200).json({ notifications: rows || [] })
      }
      if (req.method === 'POST') {
        const { title, message, targetRole = 'all', priority = 'info', category = 'Gazette', sender = 'BIS Directorate', actionUrl = '' } = req.body || {}
        const notifId = `NOTIF-${Date.now().toString().slice(-6)}`
        const [newRow] = await sql`
          INSERT INTO notifications (id, title, message, target_role, priority, category, sender, action_url)
          VALUES (${notifId}, ${title}, ${message}, ${targetRole}, ${priority}, ${category}, ${sender}, ${actionUrl})
          RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl", created_at as "created"
        `
        return res.status(201).json({ notification: newRow })
      }
    }

    // 4. Documents
    if (type === 'documents') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, title, category, version, size, status, chunks, uploaded_at as "uploaded"
          FROM knowledge_docs
          ORDER BY uploaded_at DESC
        `
        return res.status(200).json({ documents: rows || [] })
      }
      if (req.method === 'POST') {
        const { title, category = 'Standard', version = '1.0', size = 500000, status = 'published', chunks = 10 } = req.body || {}
        const [newRow] = await sql`
          INSERT INTO knowledge_docs (title, category, version, size, status, chunks)
          VALUES (${title}, ${category}, ${version}, ${size}, ${status}, ${chunks})
          RETURNING id, title, category, version, size, status, chunks, uploaded_at as "uploaded"
        `
        return res.status(201).json({ document: newRow })
      }
      if (req.method === 'DELETE') {
        const id = req.query?.id || req.body?.id
        await sql`DELETE FROM knowledge_docs WHERE id = ${id}`
        return res.status(200).json({ message: 'Deleted' })
      }
    }

    // 5. Audit logs
    if (type === 'audit-logs') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, COALESCE(user_email, 'system@bis.gov.in') as "user", action, resource, COALESCE(ip_address, '10.0.0.1') as "ip", created_at as "time"
          FROM audit_logs
          ORDER BY created_at DESC
          LIMIT 100
        `
        return res.status(200).json({ logs: rows || [] })
      }
      if (req.method === 'POST') {
        const { user: userEmail = 'system@bis.gov.in', action = 'ACTION', resource = '', ip = '10.0.0.1' } = req.body || {}
        const [newRow] = await sql`
          INSERT INTO audit_logs (user_email, action, resource, ip_address)
          VALUES (${userEmail}, ${action}, ${resource}, ${ip})
          RETURNING id, user_email as "user", action, resource, ip_address as "ip", created_at as "time"
        `
        return res.status(201).json({ log: newRow })
      }
    }

    // 6. Standards search
    if (type === 'standards') {
      let rows = []
      if (search && search.trim()) {
        const term = `%${search.trim()}%`
        try {
          rows = await sql`
            SELECT standard_code as id, title, 'Standard' as category, 2023 as year, 'current' as status, content as scope
            FROM bis_standard_documents
            WHERE standard_code ILIKE ${term} OR title ILIKE ${term}
            LIMIT 50
          `
        } catch (_) {}

        if (!rows || rows.length === 0) {
          try {
            rows = await sql`
              SELECT standard_code as id, product_name as title, scheme_type as category, 2023 as year, 'current' as status, key_testing_parameters as scope
              FROM bis_standards_master
              WHERE standard_code ILIKE ${term} OR product_name ILIKE ${term}
              LIMIT 50
            `
          } catch (_) {}
        }
      } else {
        try {
          rows = await sql`
            SELECT standard_code as id, title, 'Standard' as category, 2023 as year, 'current' as status, content as scope
            FROM bis_standard_documents
            ORDER BY id ASC
            LIMIT 50
          `
        } catch (_) {}
      }
      return res.status(200).json({ standards: rows || [] })
    }

    // 7. Chat Sessions & Messages (RBAC & User Sign-in Scoped)
    if (type === 'chat_sessions') {
      if (!user) {
        return res.status(200).json({ sessions: [] })
      }
      const numericUserId = parseInt(user.id, 10)
      if (isNaN(numericUserId)) {
        return res.status(200).json({ sessions: [] })
      }

      if (req.method === 'GET') {
        let rows = []
        if (user.role === 'admin' && req.query?.all === 'true') {
          // Admin RBAC: can inspect all user sessions with user details
          rows = await sql`
            SELECT s.id, s.user_id as "userId", u.name as "userName", u.email as "userEmail", u.role as "userRole",
                   s.title, s.created_at as "createdAt", s.updated_at as "updatedAt"
            FROM chat_sessions s
            LEFT JOIN users u ON u.id = s.user_id
            ORDER BY s.updated_at DESC
            LIMIT 100
          `
        } else {
          // Strict User Sign-in RBAC: users only ever retrieve their own sessions
          rows = await sql`
            SELECT s.id, s.user_id as "userId", s.title, s.created_at as "createdAt", s.updated_at as "updatedAt"
            FROM chat_sessions s
            WHERE s.user_id = ${numericUserId}
            ORDER BY s.updated_at DESC
            LIMIT 50
          `
        }

        // For each session, fetch its messages
        const sessionsWithMessages = await Promise.all(
          (rows || []).map(async (sess) => {
            const msgs = await sql`
              SELECT id, role, content, metadata, created_at as "timestamp"
              FROM chat_messages
              WHERE session_id = ${sess.id}
              ORDER BY created_at ASC
            `
            return {
              id: sess.id,
              title: sess.title,
              createdAt: sess.createdAt,
              updatedAt: sess.updatedAt,
              messages: (msgs || []).map((m) => ({
                id: `msg-${m.id}`,
                role: m.role,
                content: m.content,
                citations: m.metadata?.citations || [],
                timestamp: m.timestamp,
              })),
            }
          })
        )

        return res.status(200).json({ sessions: sessionsWithMessages })
      }

      if (req.method === 'DELETE') {
        const sessId = req.query?.sessionId || req.body?.sessionId
        if (!sessId) return res.status(400).json({ error: 'Session ID is required' })

        if (user.role === 'admin') {
          await sql`DELETE FROM chat_sessions WHERE id = ${sessId}`
        } else {
          await sql`DELETE FROM chat_sessions WHERE id = ${sessId} AND user_id = ${numericUserId}`
        }
        return res.status(200).json({ success: true })
      }
    }

    return res.status(400).json({ error: 'Invalid data type requested' })
  } catch (err) {
    console.error('Data API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
