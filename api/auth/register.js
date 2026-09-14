// api/auth/register.js — Registration endpoint
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, JWT_SECRET } from '../_lib/db.js'

// In-memory store for demo (when no DB)
const memUsers = []
let nextId = 100

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, name, role, organization, phone } = req.body || {}
  const password = req.body?.password || 'User@123'

  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' })
  }

  const validRoles = ['consumer', 'manufacturer', 'admin']
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }

  try {
    const sql = getDb()
    const passwordHash = await bcrypt.hash(password, 12)

    if (sql) {
      // Check duplicate
      const [existing] = await sql`SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1`
      if (existing) {
        return res.status(409).json({ error: 'Email is already registered' })
      }

      const [user] = await sql`
        INSERT INTO users (email, password_hash, name, role, organization, phone)
        VALUES (${email.toLowerCase()}, ${passwordHash}, ${name}, ${role}, ${organization || null}, ${phone || null})
        RETURNING id, email, name, role, organization, phone
      `

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' })
      return res.status(201).json({ token, user })
    }

    // In-memory fallback
    const exists = memUsers.find((u) => u.email === email.toLowerCase())
    if (exists) {
      return res.status(409).json({ error: 'Email is already registered' })
    }

    const user = {
      id: nextId++,
      email:        email.toLowerCase(),
      name,
      role,
      organization: organization || null,
      phone:        phone || null,
      password_hash: passwordHash,
      is_active:    true,
    }
    memUsers.push(user)

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, JWT_SECRET, { expiresIn: '7d' })

    const { password_hash: _, ...safeUser } = user
    return res.status(201).json({ token, user: safeUser })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Registration failed. Please try again.' })
  }
}
