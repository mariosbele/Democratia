import { DatabaseSync } from 'node:sqlite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { config } from '../config.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMA_PATH = path.join(__dirname, 'schema.sql')

let db = null

// Singleton σύνδεση SQLite. Δημιουργεί τον φάκελο/αρχείο αν λείπει και
// εφαρμόζει το σχήμα (idempotent — CREATE TABLE IF NOT EXISTS).
export function getDb() {
  if (db) return db
  if (config.dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(config.dbPath), { recursive: true })
  }
  db = new DatabaseSync(config.dbPath)
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA foreign_keys = ON;')
  migrate(db)
  return db
}

// Idempotent μεταναστεύσεις στηλών για βάσεις που δημιουργήθηκαν με παλαιότερο σχήμα
// (το CREATE TABLE IF NOT EXISTS δεν προσθέτει νέες στήλες σε υπάρχοντα πίνακα).
const COLUMN_MIGRATIONS = [{ table: 'votings', column: 'full_text', type: 'TEXT' }]

function applyColumnMigrations(database) {
  for (const { table, column, type } of COLUMN_MIGRATIONS) {
    const cols = database.prepare(`PRAGMA table_info(${table})`).all()
    if (!cols.some((c) => c.name === column)) {
      database.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`)
    }
  }
}

// Διαχωρισμός «κάλπης» από «εκλογικό κατάλογο»: παλιές βάσεις είχαν τη στήλη
// platform_votes.voter_hash (ψήφος + ταυτότητα στην ίδια γραμμή). Τη μεταφέρουμε
// στον πίνακα vote_participation και ξαναχτίζουμε την κάλπη ΧΩΡΙΣ ταυτότητα.
function migratePlatformVotes(database) {
  const cols = database.prepare(`PRAGMA table_info(platform_votes)`).all()
  if (!cols.some((c) => c.name === 'voter_hash')) return // ήδη νέο σχήμα

  database.exec('BEGIN')
  try {
    // Μεταφορά της «συμμετοχής» (ποιος ψήφισε) — χωρίς να ξέρουμε λογαριασμό.
    database.exec(
      `INSERT OR IGNORE INTO vote_participation (voting_id, account_id, voter_hash, created_at)
       SELECT voting_id, NULL, voter_hash, created_at FROM platform_votes`,
    )
    // Ξαναχτίσιμο της κάλπης χωρίς voter_hash (μένει μόνο η επιλογή).
    database.exec(`ALTER TABLE platform_votes RENAME TO platform_votes_old`)
    database.exec(
      `CREATE TABLE platform_votes (
         id         INTEGER PRIMARY KEY AUTOINCREMENT,
         voting_id  TEXT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
         choice     TEXT NOT NULL CHECK (choice IN ('yes','no','present')),
         created_at TEXT NOT NULL
       )`,
    )
    database.exec(
      `INSERT INTO platform_votes (voting_id, choice, created_at)
       SELECT voting_id, choice, created_at FROM platform_votes_old`,
    )
    database.exec(`DROP TABLE platform_votes_old`)
    database.exec(`CREATE INDEX IF NOT EXISTS idx_platform_votes_voting ON platform_votes(voting_id)`)
    database.exec('COMMIT')
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}

export function migrate(database = getDb()) {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8')
  database.exec(schema)
  applyColumnMigrations(database)
  migratePlatformVotes(database)
  return database
}

export function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

// Βοηθός: τρέχει συνάρτηση μέσα σε transaction.
export function tx(fn) {
  const database = getDb()
  database.exec('BEGIN')
  try {
    const result = fn(database)
    database.exec('COMMIT')
    return result
  } catch (err) {
    database.exec('ROLLBACK')
    throw err
  }
}
