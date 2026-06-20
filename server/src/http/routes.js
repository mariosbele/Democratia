import { listSocieties, getSociety } from '../models/societies.js'
import {
  getVoting,
  listVotingsBySociety,
  listAllVotings,
  listPhases,
} from '../models/votings.js'
import {
  castPlatformVote,
  hasVoted,
  platformTally,
  getOfficialResult,
} from '../models/results.js'
import { listComments, listPeople, listNotifications } from '../models/community.js'
import { recentRuns } from '../models/syncRuns.js'
import { serializeVoting } from '../serializers/voting.js'
import { syncAll, syncSource } from '../services/sync/index.js'
import { ok, created, badRequest, notFound, tooMany } from './respond.js'
import { allow } from '../services/security/rateLimit.js'
import { clientIp } from './authRoutes.js'

const societyDto = (s) => ({ id: s.id, name: s.name, level: s.level })

function commentDto(c, peopleById) {
  return {
    id: c.id,
    authorId: c.author_id,
    authorName: peopleById.get(c.author_id)?.full_name ?? 'Πολίτης',
    text: c.text,
    createdAt: c.created_at,
    likes: c.likes,
  }
}

export function registerRoutes(router) {
  // ── Υγεία ────────────────────────────────────────────────────────────────
  router.get('/api/health', (req, res) => ok(res, { status: 'ok', time: new Date().toISOString() }))

  // ── Κοινωνίες / επίπεδα ────────────────────────────────────────────────────
  router.get('/api/societies', (req, res) => ok(res, listSocieties().map(societyDto)))

  router.get('/api/societies/:id/votings', (req, res) => {
    const society = getSociety(req.params.id)
    if (!society) return notFound(res, 'society_not_found')
    ok(res, listVotingsBySociety(society.id).map((v) => serializeVoting(v)))
  })

  // ── Ψηφίσματα ───────────────────────────────────────────────────────────────
  router.get('/api/votings/:id', (req, res) => {
    const v = getVoting(req.params.id)
    if (!v) return notFound(res, 'voting_not_found')
    ok(res, serializeVoting(v, { includePlatform: true }))
  })

  // Συγκεντρωτικά αποτελέσματα: πλατφόρμα + επίσημο (Βουλή/Ευρωβουλή) + φάσεις.
  router.get('/api/votings/:id/results', (req, res) => {
    const v = getVoting(req.params.id)
    if (!v) return notFound(res, 'voting_not_found')
    const official = getOfficialResult(v.id)
    ok(res, {
      votingId: v.id,
      title: v.title,
      status: v.status,
      platform: platformTally(v.id),
      official: official
        ? {
            yes: official.yes,
            no: official.no,
            abstain: official.abstain,
            outcome: official.outcome,
            decidedAt: official.decided_at,
            source: official.source,
            sourceUrl: official.source_url,
          }
        : null,
      phases: listPhases(v.id).map((p) => ({
        label: p.label,
        date: p.date,
        announced: !!p.announced,
        results:
          p.announced && p.yes != null ? { yes: p.yes, no: p.no, present: p.present } : null,
      })),
    })
  })

  // Ανώνυμη, αμετάκλητη ψήφος πολίτη.
  router.post('/api/votings/:id/vote', (req, res) => {
    if (!allow('vote:' + clientIp(req), { limit: 60, windowMs: 60 * 1000 })) {
      return tooMany(res, 'rate_limited')
    }
    const { choice, voterToken } = req.body ?? {}
    if (!choice || !voterToken) return badRequest(res, 'choice_and_voterToken_required')
    if (typeof voterToken !== 'string' || voterToken.length > 200) {
      return badRequest(res, 'invalid_voter_token')
    }
    const result = castPlatformVote(req.params.id, choice, voterToken)
    if (!result.ok) {
      const status = result.reason === 'not_found' ? 404 : 400
      return status === 404 ? notFound(res, 'voting_not_found') : badRequest(res, result.reason)
    }
    created(res, { ok: true, tally: platformTally(req.params.id) })
  })

  router.get('/api/votings/:id/has-voted', (req, res) => {
    const token = req.query.voterToken
    if (!token) return badRequest(res, 'voterToken_required')
    ok(res, { voted: hasVoted(req.params.id, token) })
  })

  router.get('/api/votings/:id/comments', (req, res) => {
    const v = getVoting(req.params.id)
    if (!v) return notFound(res, 'voting_not_found')
    const peopleById = new Map(listPeople().map((p) => [p.id, p]))
    ok(res, listComments(v.id).map((c) => commentDto(c, peopleById)))
  })

  // ── Συγχρονισμός πηγών ──────────────────────────────────────────────────────
  router.post('/api/sync/run', async (req, res) => {
    const source = req.query.source
    const results = source && source !== 'all' ? [await syncSource(source)] : await syncAll()
    ok(res, { results })
  })

  router.get('/api/sync/status', (req, res) => ok(res, { runs: recentRuns() }))

  // ── Bootstrap: όλα τα δεδομένα σε σχήμα συμβατό με το frontend mockData ──────
  router.get('/api/bootstrap', (req, res) => {
    const people = listPeople()
    const peopleById = new Map(people.map((p) => [p.id, p]))
    const commentsByVoting = {}
    const votings = listAllVotings().map((v) => {
      const comments = listComments(v.id)
      if (comments.length) commentsByVoting[v.id] = comments.map((c) => commentDto(c, peopleById))
      return serializeVoting(v)
    })
    ok(res, {
      societies: listSocieties().map(societyDto),
      votings,
      comments: commentsByVoting,
      people: Object.fromEntries(
        people.map((p) => [
          p.id,
          { id: p.id, fullName: p.full_name, role: p.role, isPolitician: !!p.is_politician },
        ]),
      ),
      notifications: listNotifications().map((n) => ({
        id: n.id,
        votingId: n.voting_id,
        title: n.title,
        subtitle: n.subtitle,
        type: n.type,
        isNew: !!n.is_new,
        date: n.date,
      })),
    })
  })
}
