// api/audit-logs.js — Audit logs from Neon DB
import { getDb, initDb } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({ logs: [] })
  }

  await initDb(sql)

  try {
    if (req.method === 'GET') {
      const rows = await sql
        SELECT id, COALESCE(user_email, 'system@bis.gov.in') as "user", action, resource, COALESCE(ip_address, '10.0.0.1') as "ip", created_at as "time"
        FROM audit_logs
        ORDER BY created_at DESC
        LIMIT 100
      
      return res.status(200).json({ logs: rows })
    }

    if (req.method === 'POST') {
      const { user = 'system@bis.gov.in', action = 'ACTION', resource = '', ip = '10.0.0.1', details = null } = req.body || {}
      const [newRow] = await sql
        INSERT INTO audit_logs (user_email, action, resource, ip_address, details)
        VALUES (, , , , ::jsonb)
        RETURNING id, user_email as "user", action, resource, ip_address as "ip", created_at as "time"
      
      return res.status(201).json({ log: newRow })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Audit logs API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
