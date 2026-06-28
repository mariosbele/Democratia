import { config } from '../config.js'
import { getSociety } from '../models/societies.js'
import { upsertVoting, upsertPhase, listPhases, deleteVoting, getVoting } from '../models/votings.js'
import { upsertOfficialResult } from '../models/results.js'
import { fullReport } from '../models/reports.js'
import { buildSummary } from '../services/summary.js'
import { buildPhaseSchedule } from '../services/phases.js'
import { serializeVoting } from '../serializers/voting.js'
import { ok, created, badRequest, unauthorized, tooMany, notFound, html } from './respond.js'
import { ADMIN_PAGE } from './adminPage.js'
import { safeEqual } from '../auth/secure.js'
import { allow } from '../services/security/rateLimit.js'
import { clientIp } from './authRoutes.js'

// Έλεγχος ταυτότητας admin: κεφαλίδα `Authorization: Bearer <token>` ή `X-Admin-Token`.
// Αν δεν έχει οριστεί ADMIN_TOKEN, τα admin endpoints είναι απενεργοποιημένα.
function isAdmin(req) {
  if (!config.adminToken) return false
  const auth = req.headers['authorization'] || ''
  const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  const token = bearer || req.headers['x-admin-token'] || ''
  // Σύγκριση σταθερού χρόνου (αποτροπή timing attack).
  return safeEqual(token, config.adminToken)
}

function guard(req, res) {
  if (!config.adminToken) {
    unauthorized(res, 'admin_disabled') // δεν έχει οριστεί ADMIN_TOKEN
    return false
  }
  // Rate limit στις απόπειρες admin (αποτροπή brute-force).
  if (!allow('admin:' + clientIp(req), { limit: 30, windowMs: 5 * 60 * 1000 })) {
    tooMany(res, 'rate_limited')
    return false
  }
  if (!isAdmin(req)) {
    unauthorized(res, 'invalid_admin_token')
    return false
  }
  return true
}

export function registerAdminRoutes(router) {
  // Σελίδα διαχείρισης (η ίδια δεν απαιτεί token· ζητά το token από τον χρήστη).
  router.get('/admin', (req, res) => html(res, 200, ADMIN_PAGE))

  // Έλεγχος εγκυρότητας token (το χρησιμοποιεί η σελίδα).
  router.get('/api/admin/ping', (req, res) => {
    if (!guard(req, res)) return
    ok(res, { ok: true })
  })

  // Reports / στατιστικά (μόνο αριθμοί — ποτέ «τι ψήφισε ο Χ»).
  router.get('/api/admin/reports', (req, res) => {
    if (!guard(req, res)) return
    ok(res, fullReport())
  })

  // Δημιουργία/ενημέρωση ψηφίσματος (+ προαιρετικό επίσημο αποτέλεσμα).
  router.post('/api/admin/votings', (req, res) => {
    if (!guard(req, res)) return
    const b = req.body ?? {}

    if (!b.title || !b.society) return badRequest(res, 'title_and_society_required')
    if (!getSociety(b.society)) return badRequest(res, 'unknown_society')

    const summary =
      b.summary && b.summary.tldr
        ? b.summary
        : buildSummary({ title: b.title, text: b.fullText ?? '' })

    const id = upsertVoting({
      id: b.id || undefined,
      societyId: b.society,
      category: b.category ?? null,
      title: b.title,
      source: 'manual',
      sourceRef: b.id || `manual-${Date.now()}`,
      uploadedAt: b.uploadedAt ?? null,
      voteDeadline: b.voteDeadline ?? null,
      parliamentDate: b.parliamentDate ?? null,
      status: b.status ?? 'open',
      commentsEnabled: b.commentsEnabled !== false,
      summary,
      referenceUrl: b.referenceUrl ?? null,
      fullText: b.fullText ?? null,
    })

    // Φάσεις: δημιουργία μόνο αν δεν υπάρχουν ήδη.
    if (listPhases(id).length === 0 && (b.uploadedAt || b.voteDeadline)) {
      for (const ph of buildPhaseSchedule({ uploadedAt: b.uploadedAt, voteDeadline: b.voteDeadline })) {
        upsertPhase(id, ph)
      }
    }

    // Επίσημο αποτέλεσμα (προαιρετικό).
    if (b.official && (b.official.yes != null || b.official.no != null)) {
      upsertOfficialResult(id, {
        yes: numOrNull(b.official.yes),
        no: numOrNull(b.official.no),
        abstain: numOrNull(b.official.abstain),
        outcome: b.official.outcome ?? null,
        decidedAt: b.official.decidedAt ?? b.parliamentDate ?? null,
        source: b.official.source ?? sourceForSociety(b.society),
        sourceUrl: b.official.sourceUrl ?? b.referenceUrl ?? null,
      })
    }

    created(res, serializeVoting(getVoting(id)))
  })

  // Διαγραφή ψηφίσματος.
  router.del('/api/admin/votings/:id', (req, res) => {
    if (!guard(req, res)) return
    if (!deleteVoting(req.params.id)) return notFound(res, 'voting_not_found')
    ok(res, { ok: true, deleted: req.params.id })
  })
}

function numOrNull(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function sourceForSociety(societyId) {
  if (societyId === 'eu') return 'europarl'
  if (societyId === 'greece') return 'hellenic'
  return 'municipal'
}
