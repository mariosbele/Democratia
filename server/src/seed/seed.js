// Αρχικοποίηση της βάσης.
//
// Τα τρία επίπεδα διακυβέρνησης (Δήμος/Βουλή/Ευρωκοινοβούλιο) είναι ΕΝΣΩΜΑΤΩΜΕΝΑ
// εδώ, ώστε το backend να είναι αυτάρκες κατά το deploy (δεν εξαρτάται από αρχεία
// του frontend) — αυτά απαιτούνται για να αντιστοιχιστούν τα ψηφίσματα στις πηγές.
//
// Το πλούσιο demo περιεχόμενο (ψηφίσματα/σχόλια/ειδοποιήσεις) φορτώνεται από το
// src/data/mockData.js ΜΟΝΟ αν είναι διαθέσιμο (π.χ. σε monorepo/τοπικά). Σε
// server-only deploy, η βάση ξεκινά με τα επίπεδα και γεμίζει από τον συγχρονισμό.
import { getDb, closeDb, tx } from '../db/index.js'
import { upsertSociety } from '../models/societies.js'
import { upsertVoting, upsertPhase } from '../models/votings.js'
import { upsertOfficialResult } from '../models/results.js'
import { upsertPerson, upsertComment, upsertNotification } from '../models/community.js'

// Ποιος adapter τροφοδοτεί κάθε επίπεδο (για τον αυτόματο συγχρονισμό).
const BASE_SOCIETIES = [
  { id: 'athens', name: 'Αθήνα', level: 'Δήμος', syncSource: null },
  { id: 'greece', name: 'Ελλάδα', level: 'Βουλή', syncSource: 'hellenic' },
  { id: 'eu', name: 'Ευρωπαϊκή Ένωση', level: 'Ευρωκοινοβούλιο', syncSource: 'europarl' },
]

export function isEmpty() {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM societies').get()
  return row.n === 0
}

// Προσπαθεί να φορτώσει το demo περιεχόμενο του frontend (αν υπάρχει).
async function loadMockContent() {
  try {
    return await import('../../../src/data/mockData.js')
  } catch {
    return null
  }
}

export async function seedAll() {
  const mock = await loadMockContent()

  tx(() => {
    BASE_SOCIETIES.forEach((s, i) => upsertSociety({ ...s, ordinal: i }))
    if (!mock) return

    for (const p of Object.values(mock.PEOPLE ?? {})) {
      upsertPerson({
        id: p.id,
        fullName: p.fullName,
        role: p.role ?? null,
        isPolitician: !!p.isPolitician,
      })
    }

    for (const v of mock.VOTINGS ?? []) {
      const id = upsertVoting({
        id: v.id,
        societyId: v.society,
        category: v.category,
        title: v.title,
        source: 'seed',
        sourceRef: v.id,
        uploadedAt: v.uploadedAt,
        voteDeadline: v.voteDeadline,
        parliamentDate: v.parliamentDate,
        status: v.status,
        commentsEnabled: v.commentsEnabled !== false,
        summary: v.aiSummary ? { ...v.aiSummary, existing: true } : null,
        referenceUrl: v.officialUrl ?? null,
        fullText: v.fullText ?? null,
      })
      ;(v.phases ?? []).forEach((ph, i) =>
        upsertPhase(id, {
          ordinal: i + 1,
          label: ph.label,
          date: ph.date,
          announced: !!ph.announced,
          results: ph.results ?? null,
        }),
      )
      if (v.official) {
        upsertOfficialResult(id, {
          yes: v.official.yes,
          no: v.official.no,
          abstain: v.official.abstain,
          outcome: v.official.outcome,
          decidedAt: v.official.decidedAt,
          source: v.official.source,
          sourceUrl: v.official.sourceUrl,
        })
      }
    }

    for (const [votingId, comments] of Object.entries(mock.COMMENTS ?? {})) {
      for (const c of comments) {
        upsertComment({
          id: c.id,
          votingId,
          authorId: c.authorId,
          text: c.text,
          createdAt: c.createdAt,
          likes: c.likes ?? 0,
        })
      }
    }

    for (const n of mock.NOTIFICATIONS ?? []) {
      upsertNotification({
        id: n.id,
        votingId: n.votingId,
        title: n.title,
        subtitle: n.subtitle,
        type: n.type,
        isNew: !!n.isNew,
        date: n.date,
      })
    }
  })

  return { seededContent: !!mock }
}

// Φορτώνει seed μόνο αν η βάση είναι άδεια.
export async function ensureSeeded() {
  if (isEmpty()) {
    const { seededContent } = await seedAll()
    return { seeded: true, seededContent }
  }
  return { seeded: false, seededContent: false }
}

// Εκτέλεση ως script: `npm run seed`
if (import.meta.url === `file://${process.argv[1]}`) {
  getDb()
  const { seededContent } = await seedAll()
  console.log(
    `[seed] Τα επίπεδα φορτώθηκαν${seededContent ? ' + demo περιεχόμενο (mockData)' : ' (χωρίς demo περιεχόμενο)'}.`,
  )
  closeDb()
}
