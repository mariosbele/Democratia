import { getDb } from '../db/index.js'

const nowIso = () => new Date().toISOString()

// Δημιουργία ή ενημέρωση ψηφίσματος. Επιστρέφει το id.
// Κάνει dedupe με βάση (source, source_ref): αν ξανασυγχρονιστεί το ίδιο
// εξωτερικό αντικείμενο, ενημερώνεται αντί να διπλασιαστεί.
export function upsertVoting(v) {
  const db = getDb()
  const now = nowIso()
  const keypoints = JSON.stringify(v.summary?.keyPoints ?? [])

  // Εντοπισμός υπάρχουσας εγγραφής (είτε με id είτε με source+source_ref).
  let existing = null
  if (v.id) existing = db.prepare('SELECT id FROM votings WHERE id = ?').get(v.id)
  if (!existing && v.source && v.sourceRef) {
    existing = db
      .prepare('SELECT id FROM votings WHERE source = ? AND source_ref = ?')
      .get(v.source, v.sourceRef)
  }

  if (existing) {
    db.prepare(
      `UPDATE votings SET
         society_id = ?, category = ?, title = ?, source = ?, source_ref = ?,
         uploaded_at = ?, vote_deadline = ?, parliament_date = ?, status = ?,
         comments_enabled = ?, summary_tldr = ?, summary_keypoints = ?,
         summary_impact = ?, summary_reading_time = ?, reference_url = ?,
         full_text = ?, updated_at = ?
       WHERE id = ?`,
    ).run(
      v.societyId,
      v.category ?? null,
      v.title,
      v.source ?? 'manual',
      v.sourceRef ?? null,
      v.uploadedAt ?? null,
      v.voteDeadline ?? null,
      v.parliamentDate ?? null,
      v.status ?? 'open',
      v.commentsEnabled === false ? 0 : 1,
      v.summary?.tldr ?? null,
      keypoints,
      v.summary?.impact ?? null,
      v.summary?.readingTime ?? null,
      v.referenceUrl ?? null,
      v.fullText ?? null,
      now,
      existing.id,
    )
    return existing.id
  }

  const id = v.id ?? `${v.source}:${v.sourceRef}`
  db.prepare(
    `INSERT INTO votings (
       id, society_id, category, title, source, source_ref, uploaded_at,
       vote_deadline, parliament_date, status, comments_enabled, summary_tldr,
       summary_keypoints, summary_impact, summary_reading_time, reference_url,
       full_text, created_at, updated_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  ).run(
    id,
    v.societyId,
    v.category ?? null,
    v.title,
    v.source ?? 'manual',
    v.sourceRef ?? null,
    v.uploadedAt ?? null,
    v.voteDeadline ?? null,
    v.parliamentDate ?? null,
    v.status ?? 'open',
    v.commentsEnabled === false ? 0 : 1,
    v.summary?.tldr ?? null,
    keypoints,
    v.summary?.impact ?? null,
    v.summary?.readingTime ?? null,
    v.referenceUrl ?? null,
    v.fullText ?? null,
    now,
    now,
  )
  return id
}

export function getVoting(id) {
  return getDb().prepare('SELECT * FROM votings WHERE id = ?').get(id)
}

export function listVotingsBySociety(societyId) {
  return getDb()
    .prepare('SELECT * FROM votings WHERE society_id = ? ORDER BY uploaded_at DESC')
    .all(societyId)
}

export function listAllVotings() {
  return getDb().prepare('SELECT * FROM votings ORDER BY uploaded_at DESC').all()
}

export function setVotingStatus(id, status) {
  getDb()
    .prepare('UPDATE votings SET status = ?, updated_at = ? WHERE id = ?')
    .run(status, nowIso(), id)
}

export function deleteVoting(id) {
  const info = getDb().prepare('DELETE FROM votings WHERE id = ?').run(id)
  return info.changes > 0
}

// ── Φάσεις ───────────────────────────────────────────────────────────────────
export function upsertPhase(votingId, { ordinal, label, date, announced = false, results = null }) {
  getDb()
    .prepare(
      `INSERT INTO phases (voting_id, ordinal, label, date, announced, yes, no, present)
       VALUES (?,?,?,?,?,?,?,?)
       ON CONFLICT(voting_id, ordinal) DO UPDATE SET
         label = excluded.label, date = excluded.date,
         announced = excluded.announced, yes = excluded.yes,
         no = excluded.no, present = excluded.present`,
    )
    .run(
      votingId,
      ordinal,
      label,
      date ?? null,
      announced ? 1 : 0,
      results?.yes ?? null,
      results?.no ?? null,
      results?.present ?? null,
    )
}

export function listPhases(votingId) {
  return getDb()
    .prepare('SELECT * FROM phases WHERE voting_id = ? ORDER BY ordinal')
    .all(votingId)
}

export function announcePhase(phaseId, results) {
  getDb()
    .prepare('UPDATE phases SET announced = 1, yes = ?, no = ?, present = ? WHERE id = ?')
    .run(results.yes, results.no, results.present, phaseId)
}
