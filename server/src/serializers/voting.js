import { listPhases } from '../models/votings.js'
import { getOfficialResult, platformTally } from '../models/results.js'

function parseKeypoints(json) {
  try {
    const v = JSON.parse(json ?? '[]')
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}

function phaseToFrontend(p) {
  const hasResults = p.yes != null || p.no != null || p.present != null
  return {
    label: p.label,
    date: p.date,
    announced: !!p.announced,
    results: p.announced && hasResults ? { yes: p.yes ?? 0, no: p.no ?? 0, present: p.present ?? 0 } : null,
  }
}

function officialToFrontend(r) {
  if (!r) return null
  return {
    yes: r.yes,
    no: r.no,
    abstain: r.abstain,
    outcome: r.outcome, // 'adopted' | 'rejected'
    decidedAt: r.decided_at,
    source: r.source,
    sourceUrl: r.source_url,
  }
}

// Μετατρέπει μια εγγραφή ψηφίσματος (DB) στο σχήμα που περιμένει το frontend,
// εμπλουτισμένο με `official` (επίσημο αποτέλεσμα Βουλής/Ευρωβουλής) και `referenceUrl`.
export function serializeVoting(row, { includePlatform = false } = {}) {
  const out = {
    id: row.id,
    society: row.society_id,
    category: row.category,
    title: row.title,
    uploadedAt: row.uploaded_at,
    voteDeadline: row.vote_deadline,
    parliamentDate: row.parliament_date,
    status: row.status,
    commentsEnabled: !!row.comments_enabled,
    source: row.source,
    referenceUrl: row.reference_url,
    fullText: row.full_text,
    aiSummary: {
      tldr: row.summary_tldr,
      keyPoints: parseKeypoints(row.summary_keypoints),
      impact: row.summary_impact,
      readingTime: row.summary_reading_time,
    },
    phases: listPhases(row.id).map(phaseToFrontend),
    official: officialToFrontend(getOfficialResult(row.id)),
  }
  if (includePlatform) out.platformResults = platformTally(row.id)
  return out
}
