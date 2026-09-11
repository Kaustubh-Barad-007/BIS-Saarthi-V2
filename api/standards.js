// api/standards.js — Indian Standards registry from Neon DB
import { getDb, initDb } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({ standards: [] })
  }

  await initDb(sql)

  const { search = '', category = '' } = req.query || {}

  try {
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

    // Also check master index
    if (rows.length === 0 && search) {
      const masterRows = await sql
        SELECT standard_code as id, product_name as title, scheme_type as category, 2023 as year, 'current' as status, key_testing_parameters as scope
        FROM bis_standards_master
        WHERE standard_code ILIKE  OR product_name ILIKE 
        LIMIT 50
      
      rows = masterRows
    }

    return res.status(200).json({ standards: rows })
  } catch (err) {
    console.error('Standards API error:', err)
    return res.status(500).json({ error: err.message })
  }
}
