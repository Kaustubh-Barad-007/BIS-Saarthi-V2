// api/health.js — DB status and table inspection
import { getDb, initDb } from './_lib/db.js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const sql = getDb()
  if (!sql) {
    return res.status(200).json({ status: 'no_db_url', hasDb: false })
  }

  try {
    await initDb(sql)

    const tables = await sql
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
    

    const counts = {}
    for (const t of tables) {
      try {
        const [{ count }] = await sqlSELECT count(*)::int as count FROM 
        counts[t.table_name] = count
      } catch (e) {
        counts[t.table_name] = 'error'
      }
    }

    return res.status(200).json({
      status: 'connected',
      hasDb: true,
      tables: counts,
    })
  } catch (err) {
    return res.status(500).json({ status: 'db_error', error: err.message })
  }
}
