import { getDb } from '../db/index.js'

// ────────────────────────────────────────────────────────────────────────────
// Reports / στατιστικά πλατφόρμας (μόνο για διαχειριστή).
//
// ΣΗΜΑΝΤΙΚΟ ΓΙΑ ΤΗΝ ΙΔΙΩΤΙΚΟΤΗΤΑ: κανένα report δεν αποκαλύπτει «τι ψήφισε ο Χ».
// Η συμμετοχή (ποιος ψήφισε) και η επιλογή (τι) ζουν σε χωριστούς πίνακες — εδώ
// τα συγκεντρώνουμε μόνο ως αριθμούς (πλήθη), ποτέ συνδεδεμένα.
// ────────────────────────────────────────────────────────────────────────────

const isoDaysAgo = (days) => new Date(Date.now() - days * 86400000).toISOString()

function count(sql, ...params) {
  return getDb().prepare(sql).get(...params)?.n ?? 0
}

// Συγκεντρωτική σύνοψη της πλατφόρμας.
export function overview() {
  return {
    accounts: count(`SELECT COUNT(*) AS n FROM accounts WHERE deleted_at IS NULL`),
    accountsDeleted: count(`SELECT COUNT(*) AS n FROM accounts WHERE deleted_at IS NOT NULL`),
    activeSessions: count(`SELECT COUNT(DISTINCT account_id) AS n FROM sessions WHERE expires_at > ?`, new Date().toISOString()),
    votings: count(`SELECT COUNT(*) AS n FROM votings`),
    votingsOpen: count(`SELECT COUNT(*) AS n FROM votings WHERE status = 'open'`),
    votesTotal: count(`SELECT COUNT(*) AS n FROM platform_votes`),
    participationTotal: count(`SELECT COUNT(*) AS n FROM vote_participation`),
    comments: count(`SELECT COUNT(*) AS n FROM comments`),
  }
}

// Συμμετοχή (ψήφοι) σε χρονικά παράθυρα.
export function activity() {
  return {
    votesLast24h: count(`SELECT COUNT(*) AS n FROM platform_votes WHERE created_at >= ?`, isoDaysAgo(1)),
    votesLast7d: count(`SELECT COUNT(*) AS n FROM platform_votes WHERE created_at >= ?`, isoDaysAgo(7)),
    votesLast30d: count(`SELECT COUNT(*) AS n FROM platform_votes WHERE created_at >= ?`, isoDaysAgo(30)),
    newAccounts7d: count(`SELECT COUNT(*) AS n FROM accounts WHERE deleted_at IS NULL AND created_at >= ?`, isoDaysAgo(7)),
    newAccounts30d: count(`SELECT COUNT(*) AS n FROM accounts WHERE deleted_at IS NULL AND created_at >= ?`, isoDaysAgo(30)),
    // Ενεργοί χρήστες = μοναδικοί λογαριασμοί που ψήφισαν στο διάστημα.
    activeVoters7d: count(`SELECT COUNT(DISTINCT account_id) AS n FROM vote_participation WHERE account_id IS NOT NULL AND created_at >= ?`, isoDaysAgo(7)),
    activeVoters30d: count(`SELECT COUNT(DISTINCT account_id) AS n FROM vote_participation WHERE account_id IS NOT NULL AND created_at >= ?`, isoDaysAgo(30)),
  }
}

// Συμμετοχή ανά ψήφισμα (πόσοι ψήφισαν + αποτέλεσμα πλατφόρμας), ταξινομημένα.
export function perVoting(limit = 20) {
  const rows = getDb()
    .prepare(
      `SELECT v.id, v.title, v.status,
              (SELECT COUNT(*) FROM vote_participation p WHERE p.voting_id = v.id) AS turnout,
              (SELECT COUNT(*) FROM platform_votes pv WHERE pv.voting_id = v.id AND pv.choice = 'yes') AS yes,
              (SELECT COUNT(*) FROM platform_votes pv WHERE pv.voting_id = v.id AND pv.choice = 'no') AS no,
              (SELECT COUNT(*) FROM platform_votes pv WHERE pv.voting_id = v.id AND pv.choice = 'present') AS present
       FROM votings v
       ORDER BY turnout DESC, v.uploaded_at DESC
       LIMIT ?`,
    )
    .all(limit)
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    status: r.status,
    turnout: r.turnout,
    tally: { yes: r.yes, no: r.no, present: r.present },
  }))
}

// Πλήρης αναφορά (ό,τι χρειάζεται η σελίδα διαχείρισης).
export function fullReport() {
  return {
    generatedAt: new Date().toISOString(),
    overview: overview(),
    activity: activity(),
    perVoting: perVoting(),
  }
}
