import { getDb } from '../db/index.js'
import { hashVoter } from '../services/voterToken.js'

const nowIso = () => new Date().toISOString()

// ── Ψήφοι πλατφόρμας (ανώνυμες, αμετάκλητες) ────────────────────────────────

// Καταχωρεί μία ανώνυμη ψήφο. Επιστρέφει { ok, reason }.
// Η ψήφος είναι αμετάκλητη: δεύτερη προσπάθεια του ίδιου ψηφοφόρου απορρίπτεται.
export function castPlatformVote(votingId, choice, voterToken) {
  if (!['yes', 'no', 'present'].includes(choice)) {
    return { ok: false, reason: 'invalid_choice' }
  }
  const voting = getDb().prepare('SELECT status FROM votings WHERE id = ?').get(votingId)
  if (!voting) return { ok: false, reason: 'not_found' }
  if (voting.status !== 'open') return { ok: false, reason: 'closed' }

  const voterHash = hashVoter(votingId, voterToken)
  try {
    getDb()
      .prepare(
        `INSERT INTO platform_votes (voting_id, choice, voter_hash, created_at)
         VALUES (?,?,?,?)`,
      )
      .run(votingId, choice, voterHash, nowIso())
    return { ok: true }
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) {
      return { ok: false, reason: 'already_voted' }
    }
    throw err
  }
}

export function hasVoted(votingId, voterToken) {
  const voterHash = hashVoter(votingId, voterToken)
  const row = getDb()
    .prepare('SELECT 1 AS x FROM platform_votes WHERE voting_id = ? AND voter_hash = ?')
    .get(votingId, voterHash)
  return !!row
}

// Συγκεντρωτικά αποτελέσματα πλατφόρμας για ένα ψήφισμα.
export function platformTally(votingId) {
  const rows = getDb()
    .prepare('SELECT choice, COUNT(*) AS n FROM platform_votes WHERE voting_id = ? GROUP BY choice')
    .all(votingId)
  const tally = { yes: 0, no: 0, present: 0 }
  for (const r of rows) tally[r.choice] = r.n
  tally.total = tally.yes + tally.no + tally.present
  return tally
}

// ── Επίσημα αποτελέσματα Βουλής / Ευρωκοινοβουλίου ──────────────────────────

export function upsertOfficialResult(votingId, r) {
  getDb()
    .prepare(
      `INSERT INTO official_results
         (voting_id, yes, no, abstain, outcome, decided_at, source, source_url, fetched_at)
       VALUES (?,?,?,?,?,?,?,?,?)
       ON CONFLICT(voting_id) DO UPDATE SET
         yes = excluded.yes, no = excluded.no, abstain = excluded.abstain,
         outcome = excluded.outcome, decided_at = excluded.decided_at,
         source = excluded.source, source_url = excluded.source_url,
         fetched_at = excluded.fetched_at`,
    )
    .run(
      votingId,
      r.yes ?? null,
      r.no ?? null,
      r.abstain ?? null,
      r.outcome ?? null,
      r.decidedAt ?? null,
      r.source ?? null,
      r.sourceUrl ?? null,
      nowIso(),
    )
}

export function getOfficialResult(votingId) {
  return getDb().prepare('SELECT * FROM official_results WHERE voting_id = ?').get(votingId)
}
