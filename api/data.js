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

  await initDb(sql)

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
        const rows = await sql
          SELECT id, subject, product, location, description, status, date
          FROM complaints
          ORDER BY date DESC
        
        return res.status(200).json({ complaints: rows })
      }
      if (req.method === 'POST') {
        const { id, subject, product, location, description } = req.body || {}
        if (!subject || !product) return res.status(400).json({ error: 'Subject and product are required' })
        const compId = id || COMP-
        const [newRow] = await sql
          INSERT INTO complaints (id, user_id, user_email, subject, product, location, description, status)
          VALUES (, , , , , , , 'pending')
          RETURNING *
        
        return res.status(201).json({ complaint: newRow })
      }
      if (req.method === 'PUT') {
        const { id, status } = req.body || {}
        const [updated] = await sqlUPDATE complaints SET status =  WHERE id =  RETURNING *
        return res.status(200).json({ complaint: updated })
      }
    }

    // 2. Certifications
    if (type === 'certifications') {
      if (req.method === 'GET') {
        const rows = await sql
          SELECT id, product, standard, category, lab, status, applied, updated, validity
          FROM certifications
          ORDER BY applied DESC
        
        return res.status(200).json({ certifications: rows })
      }
      if (req.method === 'POST') {
        const { id, product, standard, category, lab } = req.body || {}
        const certId = id || CM/L-
        const [newRow] = await sql
          INSERT INTO certifications (id, user_id, user_email, product, standard, category, lab, status, validity)
          VALUES (, , , , , , , 'pending', 'Under Review')
          RETURNING *
        
        return res.status(201).json({ certification: newRow })
      }
      if (req.method === 'PUT') {
        const { id, status } = req.body || {}
        const [updated] = await sqlUPDATE certifications SET status = , updated = NOW() WHERE id =  RETURNING *
        return res.status(200).json({ certification: updated })
      }
    }

    // 3. Notifications
    if (type === 'notifications') {
      if (req.method === 'GET') {
        const rows = await sql
          SELECT id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl", created_at as "created"
          FROM notifications
          ORDER BY created_at DESC
          LIMIT 20
        
        return res.status(200).json({ notifications: rows })
      }
      if (req.method === 'POST') {
        const { title, message, targetRole = 'all', priority = 'info', category = 'Gazette', sender = 'BIS Directorate', actionUrl = '' } = req.body || {}
        const notifId = NOTIF-
        const [newRow] = await sql
          INSERT INTO notifications (id, title, message, target_role, priority, category, sender, action_url)
          VALUES (, , , , , , , )
          RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl", created_at as "created"
        
        return res.status(201).json({ notification: newRow })
      }
    }

    // 4. Documents
    if (type === 'documents') {
      if (req.method === 'GET') {
        const rows = await sql
          SELECT id, title, category, version, size, status, chunks, uploaded_at as "uploaded"
          FROM knowledge_docs
          ORDER BY uploaded_at DESC
        
        return res.status(200).json({ documents: rows })
      }
      if (req.method === 'POST') {
        const { title, category = 'Standard', version = '1.0', size = 500000, status = 'published', chunks = 10 } = req.body || {}
        const [newRow] = await sql
          INSERT INTO knowledge_docs (title, category, version, size, status, chunks)
          VALUES (, , , , , )
          RETURNING id, title, category, version, size, status, chunks, uploaded_at as "uploaded"
        
        return res.status(201).json({ document: newRow })
      }
      if (req.method === 'DELETE') {
        const id = req.query?.id || req.body?.id
        await sqlDELETE FROM knowledge_docs WHERE id = 
        return res.status(200).json({ message: 'Deleted' })
      }
    }

    // 5. Audit logs
    if (type === 'audit-logs') {
      if (req.method === 'GET') {
        const rows = await sql
          SELECT id, COALESCE(user_email, 'system@bis.gov.in') as "user", action, resource, COALESCE(ip_address, '10.0.0.1') as "ip", created_at as "time"
          FROM audit_logs
          ORDER BY created_at DESC
          LIMIT 100
        
        return res.status(200).json({ logs: rows })
      }
      if (req.method === 'POST') {
        const { user: userEmail = 'system@bis.gov.in', action = 'ACTION', resource = '', ip = '10.0.0.1' } = req.body || {}
        const [newRow] = await sql
          INSERT INTO audit_logs (user_email, action, resource, ip_address)
          VALUES (, , , )
          RETURNING id, user_email as "user", action, resource, ip_address as "ip", created_at as "time"
        
        return res.status(201).json({ log: newRow })
      }
    }

    // 6. Standards search
    if (type === 'standards') {
      let rows = []
      if (search) {
        rows = await sql
          SELECT standard_code as id, title, 'Standard' as category, 2023 as year, 'current' as status, content as scope
          FROM bis_standard_documents
          WHERE standard_code ILIKE  OR title ILIKE 
          LIMIT 50
        
      } else {
        rows = await sql
          SELECT standard_code as id, title, 'Standard' as category, 2023 as year, 'current' as status, content as scope
          FROM bis_standard_documents
          ORDER BY id ASC
          LIMIT 50
        
      }
      if (rows.length === 0 && search) {
        rows = await sql
          SELECT standard_code as id, product_name as title, scheme_type as category, 2023 as year, 'current' as status, key_testing_parameters as scope
          FROM bis_standards_master
          WHERE standard_code ILIKE  OR product_name ILIKE 
          LIMIT 50
        
      }
      return res.status(200).json({ standards: rows })
    }

    return res.status(400).json({ error: 'Invalid data type requested' })
  } catch (err) {
    console.error('Data API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
