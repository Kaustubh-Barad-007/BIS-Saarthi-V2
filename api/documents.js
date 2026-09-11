// api/documents.js — Knowledge Base Documents with Neon DB
import { getDb, initDb } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({ documents: [] })
  }

  await initDb(sql)

  try {
    if (req.method === 'GET') {
      const rows = await sql
        SELECT id, title, category, version, size, status, chunks, uploaded_at as "uploaded"
        FROM knowledge_docs
        ORDER BY uploaded_at DESC
      
      return res.status(200).json({ documents: rows })
    }

    if (req.method === 'POST') {
      const { title, category = 'Standard', version = '1.0', size = 500000, status = 'published', chunks = 10 } = req.body || {}
      if (!title) return res.status(400).json({ error: 'Title required' })
      const [newRow] = await sql
        INSERT INTO knowledge_docs (title, category, version, size, status, chunks)
        VALUES (, , , , , )
        RETURNING id, title, category, version, size, status, chunks, uploaded_at as "uploaded"
      
      return res.status(201).json({ document: newRow })
    }

    if (req.method === 'DELETE') {
      const id = req.query?.id || req.body?.id
      if (!id) return res.status(400).json({ error: 'ID required' })
      await sqlDELETE FROM knowledge_docs WHERE id = 
      return res.status(200).json({ message: 'Document deleted' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Documents API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
