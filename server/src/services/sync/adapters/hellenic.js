import { fetchJson as defaultFetchJson } from '../http.js'
import { extractList, guessCategory, num, toDateIso } from '../normalize.js'

// Adapter για το Ελληνικό Κοινοβούλιο (Βουλή των Ελλήνων).
//
// ΣΗΜΕΙΩΣΗ: Η Βουλή δεν δημοσιεύει σταθερό, δημόσιο API ονομαστικών ψηφοφοριών
// σε δομημένη μορφή (JSON). Γι' αυτό ο adapter διαβάζει από ένα ΡΥΘΜΙΖΟΜΕΝΟ feed
// (μεταβλητή HELLENIC_FEED_URL) που επιστρέφει την παρακάτω μορφή — μπορεί να είναι
// η έξοδος ενός scraper ή ένα dataset του data.gov.gr μετασχηματισμένο:
//
//   {
//     "items": [
//       {
//         "id": "psifisma-2024-001",
//         "title": "Νομοσχέδιο ...",
//         "category": "Οικονομία",            // προαιρετικό (αλλιώς μαντεύεται)
//         "uploadedAt": "2024-01-05",
//         "voteDeadline": "2024-01-20",
//         "parliamentDate": "2024-01-21",
//         "url": "https://www.hellenicparliament.gr/...",
//         "summary": "...",
//         "fullText": "ΣΧΕΔΙΟ ΝΟΜΟΥ ...\n\nΆρθρο 1 — ...",   // προαιρετικό: πλήρες κείμενο
//         "result": { "yes": 158, "no": 142, "abstain": 0, "outcome": "adopted", "decidedAt": "2024-01-21" }
//       }
//     ]
//   }
export const hellenicAdapter = {
  key: 'hellenic',

  async fetch({ society, feedUrl, fetchJson = defaultFetchJson, maxItems = 100 }) {
    if (!feedUrl) {
      // Δεν έχει ρυθμιστεί feed — δεν υπάρχει διαθέσιμη πηγή ακόμη.
      const err = new Error(
        'Δεν έχει ρυθμιστεί HELLENIC_FEED_URL. Δες server/README.md για τη μορφή του feed.',
      )
      err.code = 'NO_FEED'
      throw err
    }

    const payload = await fetchJson(feedUrl)
    const items = extractList(payload)
    const votings = []
    for (const item of items) {
      if (votings.length >= maxItems) break
      const normalized = normalizeItem(item, society)
      if (normalized) votings.push(normalized)
    }
    return votings
  },
}

function normalizeItem(item, society) {
  const title = item.title?.trim()
  const ref = String(item.id ?? '').trim()
  if (!title || !ref) return null

  const r = item.result ?? null
  const official = r
    ? {
        yes: num(r.yes),
        no: num(r.no),
        abstain: num(r.abstain),
        outcome: r.outcome ?? (num(r.yes) > num(r.no) ? 'adopted' : 'rejected'),
        decidedAt: toDateIso(r.decidedAt ?? item.parliamentDate),
        source: 'hellenic',
        sourceUrl: item.url ?? null,
      }
    : null

  return {
    source: 'hellenic',
    sourceRef: ref,
    societyId: society.id,
    category: item.category ?? guessCategory(`${title} ${item.summary ?? ''}`),
    title,
    uploadedAt: toDateIso(item.uploadedAt),
    voteDeadline: toDateIso(item.voteDeadline),
    parliamentDate: toDateIso(item.parliamentDate),
    referenceUrl: item.url ?? item.documentUrl ?? null,
    summaryText: item.summary ?? title,
    fullText: item.fullText ?? null,
    official,
  }
}
