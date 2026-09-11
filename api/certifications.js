// api/certifications.js — Certifications CRUD with Neon DB
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
    return res.status(200).json({ certifications: [] })
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
      let rows
      if (user && user.role === 'manufacturer') {
        rows = await sql
          SELECT id, product, standard, category, lab, status, applied, updated, validity
          FROM certifications
          WHERE user_email =  OR user_id = 
          ORDER BY applied DESC
        
      } else {
        rows = await sql
          SELECT id, product, standard, category, lab, status, applied, updated, validity
          FROM certifications
          ORDER BY applied DESC
        
      }
      return res.status(200).json({ certifications: rows })
    }

    if (req.method === 'POST') {
      const { id, product, standard, category, lab } = req.body || {}
      if (!product || !standard) {
        return res.status(400).json({ error: 'Product and standard are required' })
      }
      const certId = id || CM/L-
      const [newRow] = await sql
        INSERT INTO certifications (id, user_id, user_email, product, standard, category, lab, status, validity)
        VALUES (, , , , , , , 'pending', 'Under Review')
        RETURNING *
      

      try {
        await sql
          INSERT INTO audit_logs (user_id, user_email, action, resource)
          VALUES (, , 'APPLY', )
        
      } catch (_) {}

      return res.status(201).json({ certification: newRow })
    }

    if (req.method === 'PUT') {
      const { id, status, validity } = req.body || {}
      if (!id) return res.status(400).json({ error: 'ID required' })
      const [updated] = await sql
        UPDATE certifications 
        SET status = COALESCE(, status), 
            validity = COALESCE(, validity),
            updated = NOW()
        WHERE id = 
        RETURNING *
      
      return res.status(200).json({ certification: updated })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Certifications API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
