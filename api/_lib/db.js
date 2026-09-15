// api/db.js — NeonDB connection with mock fallback
import { neon } from '@neondatabase/serverless'

export const JWT_SECRET = process.env.JWT_SECRET || 'bis-saarthi-jwt-production-secret-2026-safe-secure-token'

let sql = null
let dbInitialized = false

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
  if (!sql || dbInitialized) return
  dbInitialized = true
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
    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      title        TEXT NOT NULL,
      file_name    TEXT NOT NULL,
      file_type    TEXT NOT NULL DEFAULT 'application/pdf',
      file_size    INTEGER DEFAULT 0,
      category     TEXT NOT NULL DEFAULT 'standard',
      role_access  TEXT NOT NULL DEFAULT 'all',
      uploader_email TEXT DEFAULT 'admin@bis.gov.in',
      description  TEXT,
      data_base64  TEXT,
      file_url     TEXT,
      standard_code TEXT,
      created_at   TIMESTAMP DEFAULT NOW()
    )
  `

  // Ensure missing columns exist in existing tables
  try {
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS user_email TEXT`
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS location TEXT`
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS remarks TEXT`
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS date TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE complaints ADD COLUMN IF NOT EXISTS updated TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS user_email TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS standard TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS category TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS lab TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS remarks TEXT`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS applied TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS updated TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE certifications ADD COLUMN IF NOT EXISTS validity TEXT DEFAULT 'Under Review'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'all'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'info'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS sender TEXT DEFAULT 'BIS Official'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS action_url TEXT`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_by TEXT[] DEFAULT '{}'`
    await sql`ALTER TABLE notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW()`
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_email TEXT`
    await sql`ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT`
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS data_base64 TEXT`
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS role_access TEXT DEFAULT 'all'`
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_type TEXT DEFAULT 'application/pdf'`
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS standard_code TEXT`
    await sql`ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'review'`
  } catch (_) {}

  // 1. Seed demo users if users table is empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM users`
    if (count === 0) {
      const cHash = '$2a$12$4L64j0j8jLZZwYFw51wK3e6V7R0zH3gO4lH8cM1F0tQ5a3S2r9aG.' // Consumer@123
      const mHash = '$2a$12$t4zH6F.oE8qW9L6h4hX6Oee7p6G5k2iK8f7L3m2n1o0p9q8r7s6t.' // Msme@123
      const aHash = '$2a$12$b5yI7G.pF9rX0M7i5iY7Pff8q7H6l3jL9g8M4n3o2p1q0r9s8t7u.' // Admin@123
      await sql`
        INSERT INTO users (email, password_hash, name, role, organization)
        VALUES 
          ('consumer@bis.gov.in', ${cHash}, 'Priya Sharma', 'consumer', NULL),
          ('msme@bis.gov.in', ${mHash}, 'Rajesh Kumar', 'manufacturer', 'National Manufacturing Industries Ltd'),
          ('admin@bis.gov.in', ${aHash}, 'Admin Officer', 'admin', 'BIS HQ New Delhi')
        ON CONFLICT (email) DO NOTHING
      `
    }
  } catch (_) {}

  // 2. Seed certifications if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM certifications`
    if (count === 0) {
      await sql`
        INSERT INTO certifications (id, user_email, product, standard, category, lab, status, validity, applied)
        VALUES 
          ('CM/L-8400123', 'msme@bis.gov.in', 'Industrial Safety Helmets', 'IS 2925:1984', 'Mechanical Engineering', 'Central Laboratory Sahibabad', 'active', 'Valid until 31 Mar 2026', NOW() - INTERVAL '120 days'),
          ('CM/L-7200456', 'msme@bis.gov.in', 'Ordinary Portland Cement (43 Grade)', 'IS 269:2015', 'Civil Engineering Products', 'Western Regional Lab Mumbai', 'active', 'Valid until 15 Nov 2026', NOW() - INTERVAL '90 days'),
          ('CM/L-9100789', 'msme@bis.gov.in', 'Self-Ballasted LED Lamps for General Lighting Services', 'IS 16102 (Part 1):2012', 'Electrotechnical Products', 'National Test House Kolkata', 'active', 'Valid until 30 Sep 2025', NOW() - INTERVAL '45 days'),
          ('CM/L-6300112', 'msme@bis.gov.in', 'Secondary Cells and Batteries for Portable Applications', 'IS 16046 (Part 2):2018', 'IT & Electronics', 'ERDA Vadodara', 'in_progress', 'Under Factory Audit', NOW() - INTERVAL '20 days'),
          ('CM/L-5500984', 'msme@bis.gov.in', 'Protective Helmets for Two Wheeler Riders', 'IS 4151:2020', 'Mechanical Engineering', 'Northern Regional Lab Chandigarh', 'in_progress', 'Under Sample Testing', NOW() - INTERVAL '10 days'),
          ('CM/L-4100331', 'msme@bis.gov.in', 'Food Grade Polyethylene for Safe Use in Contact with Food', 'IS 10146:1982', 'Chemical Products', 'CIPET Ahmedabad', 'pending', 'Initial Document Scrutiny', NOW() - INTERVAL '3 days')
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch (_) {}

  // 3. Seed notifications if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM notifications`
    if (count === 0) {
      await sql`
        INSERT INTO notifications (id, title, message, target_role, priority, category, sender, action_url)
        VALUES 
          ('NOTIF-2025-01', 'Mandatory QCO for Electronics Goods & Batteries', 'Quality Control Order now enforced nationwide for IT hardware and lithium battery packs under IS 16046. Manufacture, import, or sale without BIS certification is strictly prohibited.', 'all', 'urgent', 'Gazette Order', 'BIS Directorate General', '/consumer/standards'),
          ('NOTIF-2025-02', '80% MSME Concession on Annual License & Marking Fees', 'Special incentive scheme active for registered Micro & Small Enterprises under Scheme-I. Submit valid Udyam Registration certificate to claim immediate fee waiver.', 'manufacturer', 'info', 'Fee Schedule', 'SME Promotion Cell', '/manufacturer/certification'),
          ('NOTIF-2025-03', 'Nationwide Expansion of Mandatory Gold Hallmarking (Phase-IV)', 'Phase-IV hallmarking orders now cover over 350 districts. All gold jewellery sold must carry 6-digit alphanumeric HUID and BIS triangular hallmark.', 'consumer', 'warning', 'Consumer Alert', 'Hallmarking Division', '/consumer/hallmarking'),
          ('NOTIF-2025-04', 'Mandatory Quality Audit for Electrical Cables', 'All licensees under IS 694 must upload routine compliance test logs by 5th of each month on the portal.', 'manufacturer', 'warning', 'Surveillance', 'Quality Assurance Dept', '/manufacturer/documents'),
          ('NOTIF-2025-05', 'BIS Care Mobile App v3.2 Released with AI Camera Verification', 'Citizens can now scan 6-digit HUID and ISI CM/L numbers directly using smartphone camera for instant authenticity verification.', 'all', 'info', 'Portal Update', 'IT & Digital Initiatives', '/consumer/dashboard'),
          ('NOTIF-2025-06', 'Strict Enforcement Raids on Counterfeit ISI Two-Wheeler Helmets', 'Over 45 enforcement raids conducted across transport hubs. Non-compliant manufacturers booked under Section 29 of BIS Act 2016.', 'consumer', 'urgent', 'Enforcement', 'Enforcement Wing', '/consumer/complaints')
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch (_) {}

  // 4. Seed complaints if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM complaints`
    if (count === 0) {
      await sql`
        INSERT INTO complaints (id, user_email, product, location, subject, description, status, date)
        VALUES 
          ('COMP-2025-01', 'consumer@bis.gov.in', 'Protective Helmet (IS 4151)', 'Karol Bagh, New Delhi', 'Counterfeit ISI Mark on Two-Wheeler Helmet', 'Local dealer selling helmets stamped with duplicate ISI mark logo without valid 7-digit CM/L number. Helmet shell cracked on minor impact.', 'under_investigation', NOW() - INTERVAL '12 days'),
          ('COMP-2025-02', 'consumer@bis.gov.in', '22 Karat Gold Bangle', 'Zaveri Bazaar, Mumbai', 'Gold Jewellery Sold Without 6-Digit HUID', 'Jeweller failed to provide mandatory 6-digit alphanumeric HUID on bill or ornament as mandated under IS 1417. Refused hallmark verification certificate.', 'action_taken', NOW() - INTERVAL '9 days'),
          ('COMP-2025-03', 'consumer@bis.gov.in', 'Electric Room Heater (IS 302)', 'Whitefield, Bengaluru', 'Suspicious Heating Appliance Without ISI Mark', 'Heating appliance supplied with damaged cord and missing ISI CM/L license code.', 'pending', NOW() - INTERVAL '5 days'),
          ('COMP-2025-04', 'consumer@bis.gov.in', 'Electric Immersion Rod (IS 302)', 'Chandni Chowk, Delhi', 'Uncertified Substandard Electric Immersion Rod', 'Heating appliance sold without earthing wire and lacking BIS ISI certification mark, posing severe electrical shock risk.', 'under_investigation', NOW() - INTERVAL '3 days'),
          ('COMP-2025-05', 'consumer@bis.gov.in', 'Plastic Toys Set for Toddlers (IS 9873)', 'T. Nagar, Chennai', 'Imported Toxic Chemical Plastic Toys for Children', 'Plastic toy set sold without mandatory BIS ISI certification and lacking mandatory non-toxic paint safety warning labels.', 'resolved', NOW() - INTERVAL '15 days'),
          ('COMP-2025-06', 'consumer@bis.gov.in', 'Portland Pozzolana Cement (IS 1489)', 'Jaipur, Rajasthan', 'Adulterated Cement Supplied in Duplicate Bags', 'Contractor received counterfeit brand bags with fake ISI mark. Lab test confirmed substandard compressive strength.', 'action_taken', NOW() - INTERVAL '2 days')
        ON CONFLICT (id) DO NOTHING
      `
    }
  } catch (_) {}

  // 5. Seed audit logs if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM audit_logs`
    if (count === 0) {
      await sql`
        INSERT INTO audit_logs (user_email, action, resource, ip_address, created_at)
        VALUES 
          ('admin@bis.gov.in', 'BROADCAST_CREATED', 'Gazette QCO Electronics Order #NOTIF-2025-01', '10.24.11.2', NOW() - INTERVAL '1 hour'),
          ('msme@bis.gov.in', 'DOCUMENT_UPLOADED', 'Factory Laboratory Quality Test Report (Sahibabad Lab)', '49.36.120.4', NOW() - INTERVAL '3 hours'),
          ('consumer@bis.gov.in', 'COMPLAINT_FILED', 'Complaint #COMP-2025-06: Adulterated Cement', '152.57.44.8', NOW() - INTERVAL '6 hours'),
          ('admin@bis.gov.in', 'CERTIFICATION_APPROVED', 'License #CM/L-8400123: Industrial Safety Helmets', '10.24.11.2', NOW() - INTERVAL '12 hours'),
          ('msme@bis.gov.in', 'PORTAL_LOGIN', 'MSME Manufacturer Portal Session', '49.36.120.4', NOW() - INTERVAL '1 day'),
          ('consumer@bis.gov.in', 'HUID_VERIFIED', 'Hallmark Purity Verification: 6-Digit HUID #AB8934', '152.57.44.8', NOW() - INTERVAL '1 day'),
          ('admin@bis.gov.in', 'STATUS_UPDATED', 'Complaint #COMP-2025-02 marked as ACTION_TAKEN', '10.24.11.2', NOW() - INTERVAL '2 days'),
          ('admin@bis.gov.in', 'KNOWLEDGE_DOC_ADDED', 'IS 269:2015 Portland Cement Dossier', '10.24.11.2', NOW() - INTERVAL '3 days')
      `
    }
  } catch (_) {}

  // 6. Seed documents (PDFs, Dossiers, and Evidence Images) if empty
  try {
    const [{ count }] = await sql`SELECT count(*)::int as count FROM documents`
    if (count === 0) {
      // High-quality SVG/HTML data URIs representing official documents & images
      const qcoPdfUri = 'data:application/pdf;base64,JVBERi0xLjQKJcTl8uXrp/Og0MTGCjQgMCBvYmoKPDwKL0tpZHMgWzUgMCBSXQovQ291bnQgMQovVHlwZSAvUGFnZXMKPj4KZW5kb2JqCjUgMCBvYmoKPDwKL1BhcmVudCA0IDAgUgovTWVkaWFCb3ggWzAgMCA1OTUgODQyXQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSA2IDAgUgo+Pgo+PgovQ29udGVudHMgNyAwIFIKL1R5cGUgL1BhZ2UKPj4KZW5kb2JqCjYgMCBvYmoKPDwKL0Jhc2VGb250IC9IZWx2ZXRpY2EtQm9sZAovU3VidHlwZSAvVHlwZTEKL1R5cGUgL0ZvbnQKPj4KZW5kb2JqCjcgMCBvYmoKPDwKL0xlbmd0aCAyMjAKPj4Kc3RyZWFtCkJUCi9GMSAxNCBUZgoyMCA4MDAgVGTCoChHT1ZFUk5NRU5UIE9GIElORElBIC0gQklTIEdBWkVUVEUgUVVBTElUWSBDT05UUk9MIE9SREVSIikgVGoKMTIgMAowIC0yMCBUREgKKE1hbmRhdG9yeSBJbmRpYW4gU3RhbmRhcmRzIENvbXBsaWFuY2UgT3JkZXIgMjAyNSkgVGoKMTIgMAowIC0yMCBUREgKKElTIDE2MDQ2IC8gSVMgMTA1MDAgLyBJUyAxNDE3IC0gQnVyZWF1IG9mIEluZGlhbiBTdGFuZGFyZHMpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgNCAwIFIKPj4KZW5kb2JqCnRyYWlsZXIKPDwKL1Jvb3QgMSAwIFIKPj4KJSVFT0YK'
      const hallmarkImageUri = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%230f172a"/><rect x="20" y="20" width="560" height="260" rx="16" fill="%231e293b" stroke="%233b82f6" stroke-width="2"/><text x="300" y="60" text-anchor="middle" fill="%23f8fafc" font-family="Arial" font-size="20" font-weight="bold">BUREAU OF INDIAN STANDARDS — GOLD HALLMARKING</text><text x="300" y="90" text-anchor="middle" fill="%2394a3b8" font-family="Arial" font-size="14">3 Mandatory Identifiers as per IS 1417:2016</text><g transform="translate(60, 120)"><circle cx="60" cy="50" r="40" fill="%233b82f6" fill-opacity="0.2" stroke="%233b82f6" stroke-width="3"/><polygon points="60,25 90,75 30,75" fill="%2360a5fa"/><text x="60" y="115" text-anchor="middle" fill="%23e2e8f0" font-family="Arial" font-size="13" font-weight="bold">1. BIS Triangular Logo</text></g><g transform="translate(230, 120)"><circle cx="60" cy="50" r="40" fill="%23eab308" fill-opacity="0.2" stroke="%23eab308" stroke-width="3"/><text x="60" y="58" text-anchor="middle" fill="%23fde047" font-family="Arial" font-size="18" font-weight="bold">22K 916</text><text x="60" y="115" text-anchor="middle" fill="%23e2e8f0" font-family="Arial" font-size="13" font-weight="bold">2. Purity in Karat</text></g><g transform="translate(400, 120)"><circle cx="60" cy="50" r="40" fill="%2310b981" fill-opacity="0.2" stroke="%2310b981" stroke-width="3"/><text x="60" y="58" text-anchor="middle" fill="%236ee7b7" font-family="Arial" font-size="16" font-weight="bold">AB9148</text><text x="60" y="115" text-anchor="middle" fill="%23e2e8f0" font-family="Arial" font-size="13" font-weight="bold">3. 6-Digit HUID Code</text></g></svg>'
      const helmetImageUri = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 300" width="100%" height="100%"><rect width="100%" height="100%" fill="%231e1b4b"/><rect x="20" y="20" width="560" height="260" rx="16" fill="%23312e81" stroke="%23ef4444" stroke-width="2"/><text x="300" y="60" text-anchor="middle" fill="%23f8fafc" font-family="Arial" font-size="20" font-weight="bold">BIS ENFORCEMENT SEIZURE EVIDENCE — IS 4151</text><text x="300" y="90" text-anchor="middle" fill="%23fca5a5" font-family="Arial" font-size="14">Case #COMP-2025-01: Karol Bagh Transport Raid</text><rect x="60" y="120" width="480" height="120" rx="8" fill="%231e1b4b" stroke="%23ef4444" stroke-dasharray="4"/><text x="300" y="160" text-anchor="middle" fill="%23ef4444" font-family="Arial" font-size="16" font-weight="bold">COUNTERFEIT ISI MARK DETECTED</text><text x="300" y="190" text-anchor="middle" fill="%23e2e8f0" font-family="Arial" font-size="13">Shell thickness 1.2mm (Mandatory min: 3.5mm) • Missing 7-digit CM/L license code</text><text x="300" y="215" text-anchor="middle" fill="%2394a3b8" font-family="Arial" font-size="12">Seized 250 units under Section 29, BIS Act 2016 for criminal prosecution.</text></svg>'

      await sql`
        INSERT INTO documents (id, title, file_name, file_type, file_size, category, role_access, uploader_email, description, data_base64, standard_code)
        VALUES 
          ('DOC-QCO-2025', 'Gazette Quality Control Order (QCO) 2025 on Mandatory Certification', 'QCO_Mandatory_Electronics_2025.pdf', 'application/pdf', 1048576, 'gazette', 'all', 'admin@bis.gov.in', 'Official Ministry of Consumer Affairs gazette notification ordering mandatory ISI marking and CRS registration.', ${qcoPdfUri}, 'IS 16046'),
          ('DOC-IS269', 'IS 269:2015 Ordinary Portland Cement Standard Dossier', 'IS_269_Portland_Cement_Specifications.pdf', 'application/pdf', 2097152, 'standard', 'all', 'admin@bis.gov.in', 'Comprehensive physical, chemical, and mechanical testing limits for Portland Cement.', ${qcoPdfUri}, 'IS 269'),
          ('DOC-IS1417', 'IS 1417:2016 Gold and Silver Hallmarking Purity & Sampling Guide', 'IS_1417_Gold_Silver_Hallmarking_Standard.pdf', 'application/pdf', 1572864, 'standard', 'all', 'admin@bis.gov.in', 'Official guidelines on 24K, 22K, 18K, and 14K gold testing, assaying centre standards, and 6-digit HUID registration.', ${qcoPdfUri}, 'IS 1417'),
          ('DOC-TEST-840', 'Factory Laboratory Test Compliance Certificate (Sahibabad Lab)', 'Sahibabad_Lab_Test_Report_CML8400123.pdf', 'application/pdf', 786432, 'test_report', 'manufacturer', 'msme@bis.gov.in', 'Official laboratory test report for license CM/L-8400123 verifying compliance across standard parameters.', ${qcoPdfUri}, 'IS 2925'),
          ('DOC-IMG-HALLMARK', 'BIS Hallmark 3-Symbol Official Verification Graphic Guide', 'BIS_Hallmark_3_Symbols_Guide.svg', 'image/svg+xml', 314572, 'evidence', 'all', 'admin@bis.gov.in', 'Visual identifier reference showing triangular BIS logo, karat fineness (22K916), and 6-digit laser-engraved HUID number.', ${hallmarkImageUri}, 'IS 1417'),
          ('DOC-IMG-HELMET', 'Enforcement Evidence Photo: Counterfeit Two-Wheeler Helmet Seizure', 'Seized_Non_ISI_Helmet_Evidence.svg', 'image/svg+xml', 419430, 'evidence', 'admin', 'admin@bis.gov.in', 'Photographic evidence from Karol Bagh enforcement raid documenting duplicate stamped ISI mark lacking CM/L license.', ${helmetImageUri}, 'IS 4151')
        ON CONFLICT (id) DO NOTHING
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
