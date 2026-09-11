// api/notifications.js — Notifications CRUD with Neon DB
import jwt from 'jsonwebtoken'
import { getDb, initDb } from './_lib/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-dev-secret-2024'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({ notifications: [] })
  }

  await initDb(sql)

  let user = null
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      user = jwt.verify(authHeader.slice(7), JWT_SECRET)
    } catch (_) {}
  }

  try {
    if (req.method === 'GET') {
      const userRole = user?.role || 'consumer'
      const rows = await sql
        SELECT id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl", created_at as "created"
        FROM notifications
        WHERE target_role = 'all' OR target_role = 
        ORDER BY created_at DESC
        LIMIT 20
      
      return res.status(200).json({ notifications: rows })
    }

    if (req.method === 'POST') {
      const { title, message, targetRole = 'all', priority = 'info', category = 'Gazette', sender = 'BIS Directorate', actionUrl = '' } = req.body || {}
      if (!title || !message) {
        return res.status(400).json({ error: 'Title and message are required' })
      }
      const notifId = NOTIF-
      const [newRow] = await sql
        INSERT INTO notifications (id, title, message, target_role, priority, category, sender, action_url)
        VALUES (, , , , , , , )
        RETURNING id, title, message, target_role as "targetRole", priority, category, sender, action_url as "actionUrl", created_at as "created"
      
      return res.status(201).json({ notification: newRow })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Notifications API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
