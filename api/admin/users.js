// api/admin/users.js — Admin user management
import jwt from 'jsonwebtoken'
import { getDb, initDb, JWT_SECRET } from '../_lib/db.js'

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

    if (req.method === 'POST') {
      const { name, email, role = 'consumer', org = '', organization = '', status = 'active' } = req.body || {}
      if (!name || !email) return res.status(400).json({ error: 'Name and email are required' })
      const defaultHash = '$2a$12$4L64j0j8jLZZwYFw51wK3e6V7R0zH3gO4lH8cM1F0tQ5a3S2r9aG.'
      const userOrg = org || organization || null
      const isActive = status === 'active' || status === true
      if (sql) {
        const [newUser] = await sql`
          INSERT INTO users (name, email, role, organization, password_hash, is_active, created_at)
          VALUES (${name}, ${email}, ${role}, ${userOrg}, ${defaultHash}, ${isActive}, NOW())
          RETURNING id, name, email, role, organization, is_active, created_at
        `
        return res.status(201).json({ user: newUser })
      }
      return res.status(201).json({ user: { id: Date.now(), name, email, role, organization: userOrg, is_active: isActive } })
    }

    if (req.method === 'PUT') {
      const { id, name, is_active, status, role, org, organization } = req.body || {}
      const userOrg = org || organization
      const activeVal = is_active !== undefined ? is_active : (status !== undefined ? (status === 'active') : undefined)
      if (sql) {
        const [user] = await sql`
          UPDATE users 
          SET name = COALESCE(${name}, name),
              role = COALESCE(${role}, role),
              organization = COALESCE(${userOrg}, organization),
              is_active = COALESCE(${activeVal}, is_active)
          WHERE id=${id} 
          RETURNING id, name, email, role, organization, is_active
        `
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
