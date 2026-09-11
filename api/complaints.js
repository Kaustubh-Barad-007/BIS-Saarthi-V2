// api/complaints.js — Complaints CRUD with Neon DB
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
    return res.status(200).json({ complaints: [] })
  }

  await initDb(sql)

  // Optional auth
  let user = null
  const authHeader = req.headers['authorization']
  if (authHeader?.startsWith('Bearer ')) {
    try {
      user = jwt.verify(authHeader.slice(7), JWT_SECRET)
    } catch (_) {}
  }

  try {
    if (req.method === 'GET') {
      let rows
      if (user && user.role !== 'admin') {
        rows = await sql
          SELECT id, subject, product, location, description, status, date
          FROM complaints
          WHERE user_email =  OR user_id = 
          ORDER BY date DESC
        
      } else {
        rows = await sql
          SELECT id, subject, product, location, description, status, date
          FROM complaints
          ORDER BY date DESC
        
      }
      return res.status(200).json({ complaints: rows })
    }

    if (req.method === 'POST') {
      const { id, subject, product, location, description } = req.body || {}
      if (!subject || !product) {
        return res.status(400).json({ error: 'Subject and product are required' })
      }
      const complaintId = id || COMP-
      const [newRow] = await sql
        INSERT INTO complaints (id, user_id, user_email, subject, product, location, description, status)
        VALUES (, , , , , , , 'in_progress')
        RETURNING *
      

      // Log audit
      try {
        await sql
          INSERT INTO audit_logs (user_id, user_email, action, resource)
          VALUES (, , 'COMPLAINT', )
        
      } catch (_) {}

      return res.status(201).json({ complaint: newRow })
    }

    if (req.method === 'PUT') {
      const { id, status } = req.body || {}
      if (!id || !status) {
        return res.status(400).json({ error: 'ID and status required' })
      }
      const [updated] = await sql
        UPDATE complaints SET status = 
        WHERE id = 
        RETURNING *
      
      return res.status(200).json({ complaint: updated })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Complaints API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
