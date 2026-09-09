import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('Error: DATABASE_URL environment variable is required to run seed_db.js');
  process.exit(1);
}

async function seed() {
  console.log('Connecting to NeonDB...');
  const sql = neon(DATABASE_URL);

  console.log('Creating tables...');
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
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_sessions (
      id         TEXT PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
      title      TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id         SERIAL PRIMARY KEY,
      session_id TEXT REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role       TEXT NOT NULL,
      content    TEXT NOT NULL,
      metadata   JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         SERIAL PRIMARY KEY,
      user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
      action     TEXT NOT NULL,
      resource   TEXT,
      details    JSONB,
      ip_address TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  console.log('Tables created. Seeding demo users...');

  const demoUsers = [
    { email: 'consumer@bis.gov.in', password: 'Consumer@123', name: 'Priya Sharma',   role: 'consumer',     organization: null },
    { email: 'msme@bis.gov.in',     password: 'Msme@123',     name: 'Rajesh Kumar',   role: 'manufacturer', organization: 'RK Industries Ltd' },
    { email: 'pro@bis.gov.in',      password: 'Pro@123',      name: 'Anita Verma',    role: 'professional', organization: 'Export Consultants' },
    { email: 'admin@bis.gov.in',    password: 'Admin@123',    name: 'Admin Officer',  role: 'admin',        organization: 'BIS HQ Delhi' }
  ];

  for (const user of demoUsers) {
    const hash = await bcrypt.hash(user.password, 12);
    
    // Check if exists
    const [existing] = await sql`SELECT id FROM users WHERE email = ${user.email} LIMIT 1`;
    if (!existing) {
      await sql`
        INSERT INTO users (email, password_hash, name, role, organization)
        VALUES (${user.email}, ${hash}, ${user.name}, ${user.role}, ${user.organization})
      `;
      console.log(`Seeded: ${user.email}`);
    } else {
      console.log(`User ${user.email} already exists. Skipping.`);
    }
  }

  console.log('Seeding complete!');
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
