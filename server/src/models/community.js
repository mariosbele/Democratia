import { getDb } from '../db/index.js'

// Χρήστες/πολίτες (για επώνυμα σχόλια).
export function upsertPerson({ id, fullName, role = null, isPolitician = false }) {
  getDb()
    .prepare(
      `INSERT INTO people (id, full_name, role, is_politician)
       VALUES (?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         full_name = excluded.full_name, role = excluded.role,
         is_politician = excluded.is_politician`,
    )
    .run(id, fullName, role, isPolitician ? 1 : 0)
}

export function listPeople() {
  return getDb().prepare('SELECT * FROM people').all()
}

export function upsertComment({ id, votingId, authorId, text, createdAt, likes = 0 }) {
  getDb()
    .prepare(
      `INSERT INTO comments (id, voting_id, author_id, text, created_at, likes)
       VALUES (?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         text = excluded.text, likes = excluded.likes`,
    )
    .run(id, votingId, authorId, text, createdAt, likes)
}

export function listComments(votingId) {
  return getDb()
    .prepare('SELECT * FROM comments WHERE voting_id = ? ORDER BY created_at')
    .all(votingId)
}

export function upsertNotification({ id, votingId, title, subtitle, type, isNew = false, date }) {
  getDb()
    .prepare(
      `INSERT INTO notifications (id, voting_id, title, subtitle, type, is_new, date)
       VALUES (?,?,?,?,?,?,?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title, subtitle = excluded.subtitle,
         type = excluded.type, is_new = excluded.is_new, date = excluded.date`,
    )
    .run(id, votingId ?? null, title, subtitle ?? null, type ?? null, isNew ? 1 : 0, date ?? null)
}

export function listNotifications() {
  return getDb().prepare('SELECT * FROM notifications ORDER BY date DESC').all()
}
