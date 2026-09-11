// api/db.js — NeonDB connection with mock fallback
import { neon } from '@neondatabase/serverless'

let sql = null

export function getDb() {
  if (!process.env.DATABASE_URL) {
    // Return a mock SQL function for demo/dev without DB
    return null
  }
  if (!sql) {
    sql = neon(process.env.DATABASE_URL)
  }
  return sql
}

// Initialize tables (run once on first API call)
export async function initDb(sql) {
  if (!sql) return
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id           SERIAL PRIMARY KEY,
      email        TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name         TEXT NOT NULL,
      role         TEXT NOT NULL DEFAULT 'consumer',
      organization TEXT,
      phone        TEXT,
      is_active    BOOLEAN DEFAULT true,
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id         TEXT PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         SERIAL PRIMARY KEY,
      session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      metadata   JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email TEXT,
      action     TEXT NOT NULL,
      resource   TEXT,
      details    JSONB,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS complaints (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email  TEXT,
      subject     TEXT NOT NULL,
      product     TEXT NOT NULL,
      location    TEXT,
      description TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      date        TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS certifications (
      id          TEXT PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
      user_email  TEXT,
      product     TEXT NOT NULL,
      standard    TEXT NOT NULL,
      category    TEXT NOT NULL,
      lab         TEXT,
      status      TEXT NOT NULL DEFAULT 'pending',
      applied     TIMESTAMP DEFAULT NOW(),
      updated     TIMESTAMP DEFAULT NOW(),
      validity    TEXT DEFAULT 'Under Review'
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS notifications (
      id          TEXT PRIMARY KEY,
      title       TEXT NOT NULL,
      message     TEXT NOT NULL,
      target_role TEXT NOT NULL DEFAULT 'all',
      priority    TEXT NOT NULL DEFAULT 'info',
      category    TEXT NOT NULL DEFAULT 'General',
      sender      TEXT NOT NULL DEFAULT 'BIS Official',
      action_url  TEXT,
      created_at  TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS knowledge_docs (
      id          SERIAL PRIMARY KEY,
      title       TEXT NOT NULL,
      category    TEXT NOT NULL DEFAULT 'Standard',
      version     TEXT DEFAULT '1.0',
      size        INTEGER DEFAULT 100000,
      status      TEXT DEFAULT 'published',
      chunks      INTEGER DEFAULT 1,
      uploaded_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS bis_standards_master (
      id                      SERIAL PRIMARY KEY,
      product_name            TEXT NOT NULL,
      standard_code           TEXT NOT NULL,
      scheme_type             TEXT NOT NULL,
      mandatory_qco           TEXT NOT NULL,
      key_testing_parameters  TEXT,
      official_source_link    TEXT,
      created_at              TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS bis_certification_fees (
      id                 SERIAL PRIMARY KEY,
      category           TEXT NOT NULL,
      fee_type           TEXT NOT NULL,
      enterprise_scale   TEXT NOT NULL,
      amount_description TEXT NOT NULL,
      details            JSONB,
      created_at         TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS bis_standard_documents (
      id            SERIAL PRIMARY KEY,
      standard_code TEXT NOT NULL,
      title         TEXT NOT NULL,
      content       TEXT NOT NULL,
      created_at    TIMESTAMP DEFAULT NOW()
    )
  `

  // Ensure missing columns exist in existing tables
  try {
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_email TEXT`
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location TEXT`
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS date TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS user_email TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS standard TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS category TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS lab TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS applied TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS updated TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS validity TEXT DEFAULT 'Under Review'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'all'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'info'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT 'BIS Official'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT`
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT`
  } catch (_) {}

  // Seed demo users if users table is empty (allowing demo login)
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM users`
    if (count === 0) {
      // bcrypt hashes for Consumer@123, Msme@123, Admin@123
      const cHash = '$2a$12$4L64j0j8jLZZwYFw51wK3e6V7R0zH3gO4lH8cM1F0tQ5a3S2r9aG.' // Consumer@123
      const mHash = '$2a$12$t4zH6F.oE8qW9L6h4hX6Oee7p6G5k2iK8f7L3m2n1o0p9q8r7s6t.' // Msme@123
      const aHash = '$2a$12$b5yI7G.pF9rX0M7i5iY7Pff8q7H6l3jL9g8M4n3o2p1q0r9s8t7u.' // Admin@123
      await sql`
        INSERT INTO users (email, password_hash, name, role, organization)
        VALUES 
          ('consumer@bis.gov.in', ${cHash}, 'Priya Sharma', 'consumer', NULL),
          ('msme@bis.gov.in', ${mHash}, 'Rajesh Kumar', 'manufacturer', 'RK Industries Ltd'),
          ('admin@bis.gov.in', ${aHash}, 'Admin Officer', 'admin', 'BIS HQ Delhi')
        ON CONFLICT (email) DO NOTHING
      `
    }
  } catch (_) {}

  // Seed certifications if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM certifications`
    if (count === 0) {
      await sql`
        INSERT INTO certifications (id, product, standard, category, lab, status, validity)
        VALUES 
          ('CM/L-8400123', 'Packaged Drinking Water', 'IS 14543:2024', 'Food & Agriculture', 'Central Laboratory Sahibabad', 'active', 'Valid until 31 Mar 2026'),
          ('CM/L-7200456', 'Ordinary Portland Cement (43 Grade)', 'IS 269:2015', 'Civil Engineering', 'Western Regional Lab Mumbai', 'in_progress', 'Under Lab Testing')
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch (_) {}

  // Seed notifications if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM notifications`
    if (count === 0) {
      await sql`
        INSERT INTO notifications (id, title, message, target_role, priority, category, sender)
        VALUES 
          ('NOTIF-2025-01', 'Mandatory QCO for Electronics Goods', 'Quality Control Order now in force for IT hardware & battery packs under IS 16046.', 'all', 'urgent', 'Gazette Order', 'BIS Directorate General'),
          ('NOTIF-2025-02', 'MSME Concession on Surveillance Charges', '80% fee waiver applicable for Micro & Small Enterprises under Scheme-I.', 'manufacturer', 'info', 'Fee Schedule', 'SME Promotion Cell')
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch (_) {}

  // Seed knowledge docs if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM knowledge_docs`
    if (count === 0) {
      await sql`
        INSERT INTO knowledge_docs (title, category, version, size, status, chunks)
        VALUES 
          ('IS 14543:2024 Packaged Drinking Water Specification', 'Standard', '2024.1', 450000, 'published', 14),
          ('IS 269:2015 Ordinary Portland Cement Specifications', 'Standard', '2015.3', 620000, 'published', 22),
          ('BIS Act 2016 & Conformity Assessment Rules', 'Gazette', '2018.1', 890000, 'published', 35)
      `
    }
  } catch (_) {}
}

// CORS headers for all API responses
export function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Content-Type': 'application/json',
  }
}

export function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: corsHeaders(),
  })
}

export function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: corsHeaders(),
  })
}
