import { fetchJson as defaultFetchJson } from '../http.js'
import { extractList, guessCategory, num, pickLang, toDateIso } from '../normalize.js'

const DAY = 24 * 60 * 60 * 1000

// Adapter για το European Parliament Open Data API (v2).
//
// Ροή:
//   1) Λίστα ολομελειών (plenary meetings) εντός του παραθύρου lookback.
//   2) Για κάθε ολομέλεια, τα αποτελέσματα ψηφοφοριών (vote-results).
//   3) Κανονικοποίηση κάθε απόφασης σε ψήφισμα + επίσημο αποτέλεσμα
//      (ΥΠΕΡ / ΚΑΤΑ / ΑΠΟΧΗ → yes / no / abstain).
//
// Τεκμηρίωση: https://data.europarl.europa.eu/en/developer-corner/opendata-api
export const europarlAdapter = {
  key: 'europarl',

  async fetch({ society, base, lookbackDays = 120, fetchJson = defaultFetchJson, maxItems = 60 }) {
    const now = Date.now()
    const since = now - lookbackDays * DAY
    const years = yearsInRange(since, now)

    // 1) Συγκέντρωση αναγνωριστικών ολομελειών (με dedupe).
    const meetingIds = new Set()
    for (const year of years) {
      const url = `${base}/meetings?year=${year}&format=application%2Fld%2Bjson`
      const payload = await fetchJson(url)
      for (const m of extractList(payload)) {
        const id = m.id ?? m['@id'] ?? m.identifier
        const date = toDateIso(m.activity_date ?? m.had_activity_date ?? m.date)
        if (!id) continue
        if (date && new Date(date).getTime() < since) continue
        meetingIds.add(String(id).split('/').pop())
      }
    }

    // 2) + 3) Αποτελέσματα ανά ολομέλεια → κανονικοποιημένα ψηφίσματα (με dedupe ανά sourceRef).
    const votings = []
    const seenRefs = new Set()
    for (const meetingId of meetingIds) {
      if (votings.length >= maxItems) break
      let payload
      try {
        const url = `${base}/meetings/${encodeURIComponent(meetingId)}/vote-results?format=application%2Fld%2Bjson`
        payload = await fetchJson(url)
      } catch {
        continue // κάποιες ολομέλειες δεν έχουν δημοσιευμένα αποτελέσματα ψηφοφορίας
      }
      for (const d of extractList(payload)) {
        const normalized = normalizeDecision(d, { society, meetingId })
        if (!normalized || seenRefs.has(normalized.sourceRef)) continue
        seenRefs.add(normalized.sourceRef)
        votings.push(normalized)
        if (votings.length >= maxItems) break
      }
    }
    return votings
  },
}

function yearsInRange(sinceMs, untilMs) {
  const a = new Date(sinceMs).getUTCFullYear()
  const b = new Date(untilMs).getUTCFullYear()
  const out = []
  for (let y = a; y <= b; y++) out.push(y)
  return out
}

function normalizeDecision(d, { society, meetingId }) {
  const title = pickLang(d.activity_label ?? d.label ?? d.title)
  if (!title) return null

  const ref = String(d.activity_id ?? d.id ?? d['@id'] ?? '').split('/').pop()
  if (!ref) return null

  const yes = num(d.number_of_votes_favor ?? d.votesFavor ?? d.for)
  const no = num(d.number_of_votes_against ?? d.votesAgainst ?? d.against)
  const abstain = num(d.number_of_votes_abstention ?? d.votesAbstention ?? d.abstention)
  const decidedAt = toDateIso(d.activity_date ?? d.had_activity_date ?? d.date)

  let outcome = pickLang(d.decision_outcome ?? d.had_decision_outcome ?? d.outcome)
  if (!outcome && yes != null && no != null) outcome = yes > no ? 'adopted' : 'rejected'
  if (outcome) {
    const o = outcome.toLowerCase()
    outcome = o.includes('adopt') || o.includes('υπερψ') || o.includes('εγκρ') ? 'adopted' : o.includes('reject') || o.includes('καταψ') || o.includes('απορρ') ? 'rejected' : outcome
  }

  const hasResult = yes != null || no != null || abstain != null
  const sourceUrl = d.recorded_in_a_realization_of?.['@id'] ?? d['@id'] ?? null

  return {
    source: 'europarl',
    sourceRef: ref,
    societyId: society.id,
    category: guessCategory(title),
    title,
    uploadedAt: decidedAt ? isoDaysBefore(decidedAt, 14) : null,
    voteDeadline: decidedAt ? isoDaysBefore(decidedAt, 1) : null,
    parliamentDate: decidedAt,
    referenceUrl: sourceUrl,
    summaryText: pickLang(d.referenceText ?? d.comment) ?? title,
    meetingId,
    official: hasResult
      ? { yes, no, abstain, outcome, decidedAt, source: 'europarl', sourceUrl }
      : null,
  }
}

function isoDaysBefore(dateIso, days) {
  return new Date(new Date(dateIso).getTime() - days * DAY).toISOString().slice(0, 10)
}
