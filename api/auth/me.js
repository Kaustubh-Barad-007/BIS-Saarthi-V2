// api/auth/me.js — Get current user from JWT
import jwt from 'jsonwebtoken'
import { JWT_SECRET } from '../_lib/db.js'

const DEMO_USERS = {
  'consumer@bis.gov.in': { id: 1, email: 'consumer@bis.gov.in', name: 'Priya Sharma',   role: 'consumer',     organization: null             },
  'msme@bis.gov.in':     { id: 2, email: 'msme@bis.gov.in',     name: 'Rajesh Kumar',   role: 'manufacturer', organization: 'RK Industries Ltd' },
  'admin@bis.gov.in':    { id: 4, email: 'admin@bis.gov.in',    name: 'Admin Officer',  role: 'admin',        organization: 'BIS HQ Delhi'      },
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' })
  }

  const token = authHeader.slice(7)
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    const user = DEMO_USERS[payload.email] || {
      id:    payload.id,
      email: payload.email,
      name:  payload.name,
      role:  payload.role,
    }
    return res.status(200).json({ user })
  } catch (_) {
    return res.status(401).json({ error: 'Token invalid or expired' })
  }
}
