import { getDb } from '../db/index.js'
import { randomToken } from '../auth/secure.js'

const nowIso = () => new Date().toISOString()

// ── Λογαριασμοί ─────────────────────────────────────────────────────────────
// Βρίσκει ή δημιουργεί λογαριασμό με βάση το hash του ΑΦΜ (μοναδικότητα).
export function upsertAccount({ afmHash, fullName, ageVerified }) {
  const db = getDb()
  const existing = db.prepare('SELECT * FROM accounts WHERE afm_hash = ?').get(afmHash)
  if (existing) {
    // Επανενεργοποίηση αν είχε διαγραφεί + ενημέρωση ονόματος.
    db.prepare(
      'UPDATE accounts SET full_name = ?, age_verified = ?, deleted_at = NULL WHERE id = ?',
    ).run(fullName, ageVerified ? 1 : 0, existing.id)
    return db.prepare('SELECT * FROM accounts WHERE id = ?').get(existing.id)
  }
  const id = 'acc-' + randomToken(8)
  db.prepare(
    'INSERT INTO accounts (id, afm_hash, full_name, age_verified, created_at) VALUES (?,?,?,?,?)',
  ).run(id, afmHash, fullName, ageVerified ? 1 : 0, nowIso())
  return db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)
}

export function getAccount(id) {
  return getDb().prepare('SELECT * FROM accounts WHERE id = ? AND deleted_at IS NULL').get(id)
}

// Δικαίωμα διαγραφής (GDPR): ανωνυμοποίηση/soft-delete + κατάργηση συνεδριών.
export function eraseAccount(id) {
  const db = getDb()
  db.prepare('DELETE FROM sessions WHERE account_id = ?').run(id)
  // Διαγραφή ΑΦΜ-hash & ονόματος ώστε να μη μένει κανένα στοιχείο ταυτότητας.
  const info = db
    .prepare(
      `UPDATE accounts SET full_name = 'Διαγραμμένος χρήστης',
         afm_hash = 'erased-' || id, deleted_at = ? WHERE id = ? AND deleted_at IS NULL`,
    )
    .run(nowIso(), id)
  return info.changes > 0
}

// ── Συνεδρίες ───────────────────────────────────────────────────────────────
import { hmac } from '../auth/secure.js'

export function createSession(accountId, ttlMs) {
  const token = randomToken(32)
  const tokenHash = hmac(token)
  const now = Date.now()
  getDb()
    .prepare('INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?,?,?,?)')
    .run(tokenHash, accountId, new Date(now).toISOString(), new Date(now + ttlMs).toISOString())
  return token // ο πελάτης κρατά το token· εμείς μόνο το hash
}

export function accountForToken(token) {
  if (!token) return null
  const row = getDb().prepare('SELECT * FROM sessions WHERE token_hash = ?').get(hmac(token))
  if (!row) return null
  if (new Date(row.expires_at).getTime() < Date.now()) {
    getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(row.token_hash)
    return null
  }
  return getAccount(row.account_id)
}

export function destroySession(token) {
  if (!token) return
  getDb().prepare('DELETE FROM sessions WHERE token_hash = ?').run(hmac(token))
}

// ── OTP προκλήσεις ──────────────────────────────────────────────────────────
export function createOtpChallenge({ afmHash, fullName, ageVerified, codeHash, ttlMs }) {
  const id = 'otp-' + randomToken(8)
  const now = Date.now()
  getDb()
    .prepare(
      `INSERT INTO otp_challenges (id, afm_hash, full_name, age_verified, code_hash, created_at, expires_at)
       VALUES (?,?,?,?,?,?,?)`,
    )
    .run(id, afmHash, fullName, ageVerified ? 1 : 0, codeHash, new Date(now).toISOString(), new Date(now + ttlMs).toISOString())
  return id
}

export function getOtpChallenge(id) {
  return getDb().prepare('SELECT * FROM otp_challenges WHERE id = ?').get(id)
}

export function bumpOtpAttempts(id) {
  getDb().prepare('UPDATE otp_challenges SET attempts = attempts + 1 WHERE id = ?').run(id)
}

export function deleteOtpChallenge(id) {
  getDb().prepare('DELETE FROM otp_challenges WHERE id = ?').run(id)
}

// ── Συγκαταθέσεις (GDPR) ────────────────────────────────────────────────────
export function recordConsent({ accountId = null, policy, version, accepted = true }) {
  getDb()
    .prepare(
      'INSERT INTO consents (account_id, policy, version, accepted, created_at) VALUES (?,?,?,?,?)',
    )
    .run(accountId, policy, version, accepted ? 1 : 0, nowIso())
}

export function consentsForAccount(accountId) {
  return getDb().prepare('SELECT * FROM consents WHERE account_id = ? ORDER BY id').all(accountId)
}
