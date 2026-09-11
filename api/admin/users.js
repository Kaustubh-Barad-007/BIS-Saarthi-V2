// api/admin/users.js — Admin user management
import jwt from 'jsonwebtoken'
import { getDb, initDb } from '../_lib/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-dev-secret-2024'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
  if (req.method === 'OPTIONS') return res.status(200).end()

  // Auth check
  const token = req.headers['authorization']?.slice(7)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  let adminUser
  try {
    adminUser = jwt.verify(token, JWT_SECRET)
    if (adminUser.role !== 'admin') throw new Error('Not admin')
  } catch (_) {
    return res.status(403).json({ error: 'Admin access required' })
  }

  const sql = getDb()
  if (sql) {
    try {
      await initDb(sql)
    } catch (_) {}
  }

  try {
    if (req.method === 'GET') {
      if (sql) {
        const users = await sql`SELECT id, name, email, role, organization, is_active, created_at FROM users ORDER BY created_at DESC`
        return res.status(200).json({ users: users || [] })
      }
      return res.status(200).json({ users: [] })
    }

    if (req.method === 'PUT') {
      const { id, is_active, role } = req.body || {}
      if (sql) {
        const [user] = await sql`UPDATE users SET is_active=${is_active}, role=${role} WHERE id=${id} RETURNING id, name, email, role, is_active`
        return res.status(200).json({ user })
      }
      return res.status(200).json({ message: 'User updated' })
    }

    if (req.method === 'DELETE') {
      const userId = req.query?.id || req.body?.id
      if (sql) {
        await sql`DELETE FROM users WHERE id=${userId}`
      }
      return res.status(200).json({ message: 'User deleted' })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Admin users error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
