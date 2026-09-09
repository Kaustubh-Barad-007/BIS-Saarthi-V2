// api/user/settings.js — User Settings Persistence Endpoint
import jwt from 'jsonwebtoken'
import { getDb } from '../_lib/db.js'

const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-dev-secret-2024'

// In-memory fallback settings store for demo & serverless instances
let inMemorySettings = {
  theme: 'system',
  fontScale: 'standard',
  animations: true,
  preferredLanguage: 'en',
  bhashiniVoice: 'female',
  speechRate: 1.0,
  speechPitch: 1.0,
  autoTranslateVoiceToEnglish: true,
  autoReadResponses: false,
  soundEffects: true,
  desktopNotifications: false,
  emailAlerts: true,
  twoFactorEnabled: false,
  updatedAt: new Date().toISOString(),
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const authHeader = req.headers['authorization']
  let userEmail = 'user@bis.gov.in'
  if (authHeader?.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET)
      userEmail = decoded.email || userEmail
    } catch (_) {
      // Allow fallback in demo mode
    }
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      settings: inMemorySettings,
      userEmail,
    })
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const updates = req.body || {}
    inMemorySettings = {
      ...inMemorySettings,
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    return res.status(200).json({
      message: 'Settings successfully updated',
      settings: inMemorySettings,
      userEmail,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
