// api/auth/login.js — Login endpoint
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { getDb, errorResponse, jsonResponse, corsHeaders } from '../_lib/db.js'

// Demo users (hardcoded fallback when no DB)
const DEMO_USERS = [
  { id: 1, email: 'consumer@bis.gov.in', password: 'Consumer@123', name: 'Priya Sharma',   role: 'consumer',     organization: null,             phone: '9876543210', is_active: true },
  { id: 2, email: 'msme@bis.gov.in',     password: 'Msme@123',     name: 'Rajesh Kumar',   role: 'manufacturer', organization: 'RK Industries Ltd', phone: '9876543211', is_active: true },
  { id: 4, email: 'admin@bis.gov.in',    password: 'Admin@123',    name: 'Admin Officer',  role: 'admin',        organization: 'BIS HQ Delhi',      phone: '9876543213', is_active: true },
]

const JWT_SECRET  = process.env.JWT_SECRET  || 'bis-saarthi-dev-secret-2024'
const JWT_EXPIRES = process.env.JWT_EXPIRES_IN || '7d'

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  try {
    const sql = getDb()

    let user = null

    if (sql) {
      // Real DB lookup
      const [dbUser] = await sql`
        SELECT id, email, password_hash, name, role, organization, phone, is_active
        FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
      `

      if (dbUser) {
        const valid = await bcrypt.compare(password, dbUser.password_hash)
        if (!valid) {
          return res.status(401).json({ error: 'Invalid email or password' })
        }
        if (!dbUser.is_active) {
          return res.status(403).json({ error: 'Account is deactivated. Contact BIS admin.' })
        }
        user = dbUser
      }
    }

    // Fallback to demo users
    if (!user) {
      const demo = DEMO_USERS.find((u) => u.email === email.toLowerCase())
      if (!demo || demo.password !== password) {
        return res.status(401).json({ error: 'Invalid email or password' })
      }
      if (!demo.is_active) {
        return res.status(403).json({ error: 'Account deactivated' })
      }
      user = demo
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    )

    // Audit log (optional, best-effort)
    if (sql) {
      try {
        await sql`
          INSERT INTO audit_logs (user_id, action, resource, ip_address)
          VALUES (${user.id}, 'LOGIN', 'Portal access', ${req.headers['x-forwarded-for'] || 'unknown'})
        `
      } catch (_) {}
    }

    return res.status(200).json({
      token,
      user: {
        id:           user.id,
        email:        user.email,
        name:         user.name,
        role:         user.role,
        organization: user.organization,
        phone:        user.phone,
      },
    })
  } catch (err) {
    console.error('Login error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
