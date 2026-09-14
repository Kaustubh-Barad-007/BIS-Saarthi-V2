// api/data.js — Unified Database Data Dispatcher (Complaints, Certs, Docs, Notifs, Logs, Standards)
import jwt from 'jsonwebtoken'
import { getDb, initDb, JWT_SECRET } from './_lib/db.js'

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
          SELECT id, user_id as "userId", user_email as "userEmail", subject, product,
                 location, description, status, remarks, date, updated
          FROM complaints
          ORDER BY date DESC
        `
        return res.status(200).json({ complaints: rows || [] })
      }
      if (req.method === 'POST') {
        const { id, subject: rawSubject, product, location = 'New Delhi', description = '', details = '', status = 'pending', userEmail: bodyEmail } = req.body || {}
        const subject = rawSubject || (product ? `Issue with ${product}` : '')
        const finalDesc = description || details || ''
        if (!subject || !product) return res.status(400).json({ error: 'Subject and product are required' })
        const compId = id || `COMP-${Date.now().toString().slice(-6)}`
        const userId = user?.id ? parseInt(user.id, 10) : null
        const userEmail = bodyEmail || user?.email || 'consumer@bis.gov.in'
        const [newRow] = await sql`
          INSERT INTO complaints (id, user_id, user_email, subject, product, location, description, status, remarks, date, updated)
          VALUES (${compId}, ${userId}, ${userEmail}, ${subject}, ${product}, ${location}, ${finalDesc}, ${status}, '', NOW(), NOW())
          RETURNING id, user_id as "userId", user_email as "userEmail", subject, product,
                    location, description, status, remarks, date, updated
        `
        await sql`
          INSERT INTO audit_logs (user_email, action, resource, ip_address, created_at)
          VALUES (${userEmail}, 'COMPLAINT_FILED', ${'Complaint ' + compId + ' registered for ' + product}, '127.0.0.1', NOW())
        `.catch(() => {})

        return res.status(201).json({ complaint: newRow })
      }
      if (req.method === 'PUT') {
        const { id, status, remarks } = req.body || {}
        if (!id) return res.status(400).json({ error: 'Complaint ID is required' })
        const [updated] = await sql`
          UPDATE complaints 
          SET status = COALESCE(${status}, status),
              remarks = COALESCE(${remarks}, remarks),
              updated = NOW()
          WHERE id = ${id} 
          RETURNING id, user_id as "userId", user_email as "userEmail", subject, product,
                    location, description, status, remarks, date, updated
        `
        const userEmail = user?.email || 'admin@bis.gov.in'
        await sql`
          INSERT INTO audit_logs (user_email, action, resource, ip_address, created_at)
          VALUES (${userEmail}, 'COMPLAINT_STATUS_UPDATED', ${'Complaint ' + id + ' marked as ' + status}, '127.0.0.1', NOW())
        `.catch(() => {})

        return res.status(200).json({ complaint: updated })
      }
      if (req.method === 'DELETE') {
        const compId = req.query?.id || req.body?.id
        if (!compId) return res.status(400).json({ error: 'Complaint ID is required' })
        await sql`DELETE FROM complaints WHERE id = ${compId}`
        return res.status(200).json({ success: true, deletedId: compId })
      }
    }

    // 2. Certifications
    if (type === 'certifications') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, user_id as "userId", user_email as "userEmail", product, standard,
                 category, lab, status, remarks, validity, applied, updated
          FROM certifications
          ORDER BY applied DESC
        `
        return res.status(200).json({ certifications: rows || [] })
      }
      if (req.method === 'POST') {
        const { id, product, standard, category = 'ISI Mark', lab = 'Central Lab Sahibabad', status = 'pending', validity = 'Under Review', userEmail: bodyEmail } = req.body || {}
        if (!product || !standard) return res.status(400).json({ error: 'Product and standard are required' })
        const certId = id || `CM/L-${Math.floor(1000000 + Math.random() * 9000000)}`
        const userId = user?.id ? parseInt(user.id, 10) : null
        const userEmail = bodyEmail || user?.email || 'msme@bis.gov.in'
        const [newRow] = await sql`
          INSERT INTO certifications (id, user_id, user_email, product, standard, category, lab, status, remarks, validity, applied, updated)
          VALUES (${certId}, ${userId}, ${userEmail}, ${product}, ${standard}, ${category}, ${lab}, ${status}, '', ${validity}, NOW(), NOW())
          RETURNING id, user_id as "userId", user_email as "userEmail", product, standard,
                    category, lab, status, remarks, validity, applied, updated
        `
        await sql`
          INSERT INTO audit_logs (user_email, action, resource, ip_address, created_at)
          VALUES (${userEmail}, 'CERTIFICATION_APPLIED', ${'Application ' + certId + ' submitted for ' + product}, '127.0.0.1', NOW())
        `.catch(() => {})

        return res.status(201).json({ certification: newRow })
      }
      if (req.method === 'PUT') {
        const { id, status, remarks, validity } = req.body || {}
        if (!id) return res.status(400).json({ error: 'Certification ID is required' })
        const [updated] = await sql`
          UPDATE certifications 
          SET status = COALESCE(${status}, status),
              remarks = COALESCE(${remarks}, remarks),
              validity = COALESCE(${validity}, validity),
              updated = NOW()
          WHERE id = ${id} 
          RETURNING id, user_id as "userId", user_email as "userEmail", product, standard,
                    category, lab, status, remarks, validity, applied, updated
        `
        const userEmail = user?.email || 'admin@bis.gov.in'
        await sql`
          INSERT INTO audit_logs (user_email, action, resource, ip_address, created_at)
          VALUES (${userEmail}, 'CERTIFICATION_STATUS_UPDATED', ${'Certification ' + id + ' marked as ' + status}, '127.0.0.1', NOW())
        `.catch(() => {})

        return res.status(200).json({ certification: updated })
      }
      if (req.method === 'DELETE') {
        const certId = req.query?.id || req.body?.id
        if (!certId) return res.status(400).json({ error: 'Certification ID is required' })
        await sql`DELETE FROM certifications WHERE id = ${certId}`
        return res.status(200).json({ success: true, deletedId: certId })
      }
    }

    // 3. Notifications
    if (type === 'notifications') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl",
                 COALESCE(read_by, '{}') as "readBy", created_at as "created"
          FROM notifications
          ORDER BY created_at DESC
          LIMIT 50
        `
        return res.status(200).json({ notifications: rows || [] })
      }
      if (req.method === 'POST') {
        const { id, title, message, targetRole = 'all', priority = 'info', category = 'Gazette Circular', sender = 'BIS Central Directorate', actionUrl = '' } = req.body || {}
        if (!title || !message) return res.status(400).json({ error: 'Title and message are required' })
        const notifId = id || `NOTIF-${Date.now().toString().slice(-6)}`
        const [newRow] = await sql`
          INSERT INTO notifications (id, title, message, target_role, priority, category, sender, action_url, read_by, created_at)
          VALUES (${notifId}, ${title}, ${message}, ${targetRole}, ${priority}, ${category}, ${sender}, ${actionUrl}, '{}', NOW())
          RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl",
                    COALESCE(read_by, '{}') as "readBy", created_at as "created"
        `
        return res.status(201).json({ notification: newRow })
      }
      if (req.method === 'PUT') {
        const { id, readBy, userEmail, title, message, priority, category } = req.body || {}
        if (!id) return res.status(400).json({ error: 'Notification ID is required' })

        let updated
        if (Array.isArray(readBy)) {
          [updated] = await sql`
            UPDATE notifications
            SET read_by = ${readBy}
            WHERE id = ${id}
            RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl",
                      COALESCE(read_by, '{}') as "readBy", created_at as "created"
          `
        } else if (userEmail) {
          [updated] = await sql`
            UPDATE notifications
            SET read_by = array_append(ARRAY_REMOVE(COALESCE(read_by, '{}'), ${userEmail}), ${userEmail})
            WHERE id = ${id}
            RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl",
                      COALESCE(read_by, '{}') as "readBy", created_at as "created"
          `
        } else {
          [updated] = await sql`
            UPDATE notifications
            SET title = COALESCE(${title}, title),
                message = COALESCE(${message}, message),
                priority = COALESCE(${priority}, priority),
                category = COALESCE(${category}, category)
            WHERE id = ${id}
            RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl",
                      COALESCE(read_by, '{}') as "readBy", created_at as "created"
          `
        }
        return res.status(200).json({ notification: updated })
      }
      if (req.method === 'DELETE') {
        const notifId = req.query?.id || req.body?.id
        if (!notifId) return res.status(400).json({ error: 'Notification ID is required' })
        await sql`DELETE FROM notifications WHERE id = ${notifId}`
        return res.status(200).json({ success: true, deletedId: notifId })
      }
    }

    // 4. Documents endpoints (PDFs, Standard Dossiers, Lab Reports, Evidence Images)
    if (type === 'documents' || type === 'manufacturer-documents') {
      if (req.method === 'GET') {
        let rows = []
        if (type === 'manufacturer-documents') {
          rows = await sql`
            SELECT id, title, file_name as "fileName", file_name as "name", file_type as "fileType", file_size as "fileSize", file_size as "size",
                   category, role_access as "roleAccess", uploader_email as "uploaderEmail",
                   description, description as "reviewNotes", data_base64 as "dataBase64", standard_code as "standardCode",
                   COALESCE(status, 'review') as "status", created_at as "createdAt", created_at as "uploaded"
            FROM documents
            WHERE role_access IN ('all', 'manufacturer')
            ORDER BY created_at DESC
          `
        } else {
          rows = await sql`
            SELECT id, title, file_name as "fileName", file_name as "name", file_type as "fileType", file_size as "fileSize", file_size as "size",
                   category, role_access as "roleAccess", uploader_email as "uploaderEmail",
                   description, description as "reviewNotes", data_base64 as "dataBase64", standard_code as "standardCode",
                   COALESCE(status, 'review') as "status", created_at as "createdAt", created_at as "uploaded"
            FROM documents
            ORDER BY created_at DESC
          `
        }
        return res.status(200).json({ documents: rows || [] })
      }

      if (req.method === 'POST') {
        const {
          id,
          title: rawTitle,
          name: rawName,
          fileName: rawFileName,
          fileType = 'application/pdf',
          fileSize: rawSize,
          size: rawNumSize,
          category = 'standard',
          roleAccess: rawRole,
          uploaderEmail: rawEmail,
          description: rawDesc,
          reviewNotes: rawNotes,
          dataBase64 = '',
          standardCode = '',
          status = 'review'
        } = req.body || {}

        const title = rawTitle || rawName || rawFileName || 'Untitled Document'
        const fileName = rawFileName || rawName || rawTitle || `${title.replace(/[^a-z0-9]/gi, '_')}.pdf`
        const fileSize = rawSize || rawNumSize || 524288
        const description = rawDesc || rawNotes || ''
        const roleAccess = rawRole || (type === 'manufacturer-documents' ? 'manufacturer' : 'all')
        const docId = id || `DOC-${Date.now().toString().slice(-6)}`
        const uploaderEmail = rawEmail || user?.email || (type === 'manufacturer-documents' ? 'msme@bis.gov.in' : 'admin@bis.gov.in')

        const [newDoc] = await sql`
          INSERT INTO documents (
            id, title, file_name, file_type, file_size, category, role_access,
            uploader_email, description, data_base64, standard_code, status, created_at
          )
          VALUES (
            ${docId}, ${title}, ${fileName}, ${fileType}, ${fileSize}, ${category}, ${roleAccess},
            ${uploaderEmail}, ${description}, ${dataBase64}, ${standardCode}, ${status}, NOW()
          )
          RETURNING id, title, file_name as "fileName", file_name as "name", file_type as "fileType", file_size as "fileSize", file_size as "size",
                    category, role_access as "roleAccess", uploader_email as "uploaderEmail",
                    description, description as "reviewNotes", data_base64 as "dataBase64", standard_code as "standardCode",
                    COALESCE(status, 'review') as "status", created_at as "createdAt", created_at as "uploaded"
        `
        return res.status(201).json({ document: newDoc })
      }

      if (req.method === 'PUT') {
        const { id, status, title, description, reviewNotes } = req.body || {}
        if (!id) return res.status(400).json({ error: 'Document ID is required' })
        const finalDesc = description || reviewNotes
        const [updated] = await sql`
          UPDATE documents
          SET status = COALESCE(${status}, status),
              title = COALESCE(${title}, title),
              description = COALESCE(${finalDesc}, description)
          WHERE id = ${id}
          RETURNING id, title, file_name as "fileName", file_name as "name", file_type as "fileType", file_size as "fileSize", file_size as "size",
                    category, role_access as "roleAccess", uploader_email as "uploaderEmail",
                    description, description as "reviewNotes", data_base64 as "dataBase64", standard_code as "standardCode",
                    COALESCE(status, 'review') as "status", created_at as "createdAt", created_at as "uploaded"
        `
        return res.status(200).json({ document: updated })
      }

      if (req.method === 'DELETE') {
        const docId = req.query?.id || req.body?.id
        if (!docId) return res.status(400).json({ error: 'Document ID is required' })
        await sql`DELETE FROM documents WHERE id = ${docId}`
        return res.status(200).json({ success: true, deletedId: docId })
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

    // 6. Standards search (served dynamically from DB & RAG only — zero static data)
    if (type === 'standards') {
      let list = []

      // 1. Query Neon DB documents table
      try {
        const docRows = await sql`
          SELECT DISTINCT COALESCE(standard_code, title) as id, title, category, description as scope
          FROM documents
          WHERE standard_code IS NOT NULL OR category = 'standard'
        `.catch(() => [])
        for (const d of docRows) {
          list.push({
            id: d.id,
            title: d.title,
            category: d.category || 'Standard',
            year: 2024,
            status: 'current',
            scope: d.scope || d.title,
          })
        }
      } catch (_) {}

      // 2. Query Neon DB certifications table
      try {
        const certRows = await sql`
          SELECT DISTINCT standard as id, product as title, category
          FROM certifications
        `.catch(() => [])
        for (const c of certRows) {
          if (!list.some(item => item.id === c.id)) {
            list.push({
              id: c.id,
              title: c.title,
              category: c.category || 'Certification',
              year: 2024,
              status: 'current',
              scope: `Active BIS Certification Standard for ${c.title}`,
            })
          }
        }
      } catch (_) {}

      // 3. Query live Render RAG search dynamically (zero static data)
      const searchQuery = search && search.trim() ? search.trim().toLowerCase() : (list.length < 8 ? 'Indian Standard' : '')
      if (searchQuery) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 2500)
          const ragRes = await fetch(`${process.env.RAG_API_BASE || 'https://bis-saarthi-api.onrender.com'}/api/v1/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: searchQuery, limit: 20 }),
            signal: controller.signal
          }).catch(() => null)
          clearTimeout(timeoutId)

          if (ragRes && ragRes.ok) {
            const ragData = await ragRes.json().catch(() => null)
            const evidence = ragData?.evidence || ragData?.results || []
            for (const ev of evidence) {
              const stdId = ev.standard_id || ev.standard || ev.document_standard
              if (stdId && !list.some(item => item.id === stdId)) {
                list.push({
                  id: stdId,
                  title: ev.title || stdId,
                  category: ev.product || 'Standard',
                  year: 2024,
                  status: 'current',
                  scope: (ev.text || '').slice(0, 180),
                })
              }
            }
          }
        } catch (_) {}

        if (search && search.trim()) {
          const q = search.trim().toLowerCase()
          list = list.filter((s) => s.id.toLowerCase().includes(q) || s.title.toLowerCase().includes(q) || s.scope.toLowerCase().includes(q))
        }
      }

      return res.status(200).json({ standards: list.slice(0, 50) })
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

    // 8. Live Database Analytics & KPI Metrics
    if (type === 'analytics' || type === 'admin-stats') {
      const [
        userRows,
        complaintRows,
        certRows,
        docRows,
        logRows,
        queryRows
      ] = await Promise.all([
        sql`SELECT role, count(*)::int as count FROM users GROUP BY role`.catch(() => []),
        sql`SELECT status, count(*)::int as count FROM complaints GROUP BY status`.catch(() => []),
        sql`SELECT status, count(*)::int as count FROM certifications GROUP BY status`.catch(() => []),
        sql`SELECT category, count(*)::int as count FROM documents GROUP BY category`.catch(() => []),
        sql`SELECT count(*)::int as count FROM audit_logs`.catch(() => [{ count: 0 }]),
        sql`SELECT count(*)::int as count FROM chat_messages WHERE role = 'user'`.catch(() => [{ count: 0 }]),
      ])

      const totalUsers = (userRows || []).reduce((sum, r) => sum + (r.count || 0), 0)
      const totalComplaints = (complaintRows || []).reduce((sum, r) => sum + (r.count || 0), 0)
      const totalCertifications = (certRows || []).reduce((sum, r) => sum + (r.count || 0), 0)
      const totalDocuments = (docRows || []).reduce((sum, r) => sum + (r.count || 0), 0)
      const totalAuditLogs = logRows[0]?.count || 0
      const totalQueries = queryRows[0]?.count || 0

      const roleBreakdown = {
        consumer: userRows.find(r => r.role === 'consumer')?.count || 0,
        manufacturer: userRows.find(r => r.role === 'manufacturer')?.count || 0,
        admin: userRows.find(r => r.role === 'admin')?.count || 0,
      }

      const complaintsByStatus = {}
      for (const r of (complaintRows || [])) complaintsByStatus[r.status] = r.count

      const certsByStatus = {}
      for (const r of (certRows || [])) certsByStatus[r.status] = r.count

      return res.status(200).json({
        success: true,
        realtime: true,
        timestamp: new Date().toISOString(),
        metrics: {
          totalUsers,
          roleBreakdown,
          totalComplaints,
          complaintsByStatus,
          totalCertifications,
          certsByStatus,
          totalDocuments,
          totalAuditLogs,
          totalQueries,
        }
      })
    }

    // 9. Users Management API
    if (type === 'users') {
      if (req.method === 'GET') {
        const rows = await sql`
          SELECT id, name, email, role, organization as "org", is_active as "status", created_at as "created"
          FROM users
          ORDER BY created_at DESC
        `
        const mappedUsers = (rows || []).map(u => ({
          ...u,
          status: u.status ? 'active' : 'inactive'
        }))
        return res.status(200).json({ users: mappedUsers })
      }
      if (req.method === 'POST') {
        const { name, email, role = 'consumer', org = '-', status = 'active' } = req.body || {}
        if (!name || !email) return res.status(400).json({ error: 'Name and email are required' })
        const defaultHash = '$2a$12$4L64j0j8jLZZwYFw51wK3e6V7R0zH3gO4lH8cM1F0tQ5a3S2r9aG.'
        const isActive = status === 'active'
        const [newUser] = await sql`
          INSERT INTO users (name, email, role, organization, password_hash, is_active, created_at)
          VALUES (${name}, ${email}, ${role}, ${org}, ${defaultHash}, ${isActive}, NOW())
          RETURNING id, name, email, role, organization as "org", is_active as "status", created_at as "created"
        `
        const formatted = { ...newUser, status: newUser.status ? 'active' : 'inactive' }
        return res.status(201).json({ user: formatted })
      }
      if (req.method === 'PUT') {
        const { id, name, role, org, status } = req.body || {}
        if (!id) return res.status(400).json({ error: 'User ID is required' })
        const isActive = status !== undefined ? (status === 'active' || status === true) : undefined
        const [updated] = await sql`
          UPDATE users
          SET name = COALESCE(${name}, name),
              role = COALESCE(${role}, role),
              organization = COALESCE(${org}, organization),
              is_active = COALESCE(${isActive}, is_active)
          WHERE id = ${id}
          RETURNING id, name, email, role, organization as "org", is_active as "status", created_at as "created"
        `
        const formatted = updated ? { ...updated, status: updated.status ? 'active' : 'inactive' } : null
        return res.status(200).json({ user: formatted })
      }
      if (req.method === 'DELETE') {
        const userId = req.query?.id || req.body?.id
        if (!userId) return res.status(400).json({ error: 'User ID is required' })
        await sql`DELETE FROM users WHERE id = ${userId}`
        return res.status(200).json({ success: true, deletedId: userId })
      }
    }

    return res.status(400).json({ error: 'Invalid data type requested' })
  } catch (err) {
    console.error('Data API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
