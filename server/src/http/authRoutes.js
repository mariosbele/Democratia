import { config } from '../config.js'
import { startLogin, verifyOtp, publicAccount } from '../auth/service.js'
import {
  accountForToken,
  destroySession,
  eraseAccount,
  recordConsent,
  consentsForAccount,
} from '../models/accounts.js'
import { allow } from '../services/security/rateLimit.js'
import { ok, created, badRequest, unauthorized, tooMany } from './respond.js'

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for']
  if (fwd) return String(fwd).split(',')[0].trim()
  return req.socket?.remoteAddress || 'unknown'
}

function bearer(req) {
  const auth = req.headers['authorization'] || ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : ''
}

// Επιστρέφει τον συνδεδεμένο λογαριασμό ή null.
export function currentAccount(req) {
  return accountForToken(bearer(req))
}

// Φρουρός: απαιτεί έγκυρη συνεδρία.
export function requireSession(req, res) {
  const account = currentAccount(req)
  if (!account) {
    unauthorized(res, 'login_required')
    return null
  }
  return account
}

const limited = (req, res, key, limit, windowMs) => {
  if (!allow(`${key}:${clientIp(req)}`, { limit, windowMs })) {
    tooMany(res, 'rate_limited')
    return true
  }
  return false
}

export function registerAuthRoutes(router) {
  // Βήμα 1 — σύνδεση μέσω (προσομοιωμένου) Taxisnet → αποστολή OTP.
  router.post('/api/auth/taxisnet/start', (req, res) => {
    if (limited(req, res, 'login', 10, 5 * 60 * 1000)) return // 10 / 5 λεπτά
    const { username, password } = req.body ?? {}
    if (!username || !password) return badRequest(res, 'credentials_required')
    const r = startLogin(username, password)
    if (!r.ok) return badRequest(res, r.reason)
    ok(res, r)
  })

  // Βήμα 2 — επαλήθευση OTP → έκδοση συνεδρίας.
  router.post('/api/auth/taxisnet/verify', (req, res) => {
    if (limited(req, res, 'otp', 20, 5 * 60 * 1000)) return
    const { challengeId, code } = req.body ?? {}
    if (!challengeId || !code) return badRequest(res, 'challenge_and_code_required')
    const r = verifyOtp(challengeId, code)
    if (!r.ok) return badRequest(res, r.reason)
    // Καταγραφή συγκατάθεσης κατά την εγγραφή/σύνδεση (αν συνοδεύεται).
    if (req.body.consent) {
      recordConsent({ accountId: r.account.id, policy: 'terms', version: config.policyVersion })
      recordConsent({ accountId: r.account.id, policy: 'privacy', version: config.policyVersion })
    }
    created(res, r)
  })

  router.get('/api/auth/me', (req, res) => {
    const account = currentAccount(req)
    if (!account) return unauthorized(res, 'login_required')
    ok(res, { account: publicAccount(account) })
  })

  router.post('/api/auth/logout', (req, res) => {
    const auth = req.headers['authorization'] || ''
    destroySession(auth.startsWith('Bearer ') ? auth.slice(7) : '')
    ok(res, { ok: true })
  })

  // ── GDPR ──────────────────────────────────────────────────────────────────
  // Καταγραφή συγκατάθεσης (μπορεί και χωρίς σύνδεση — π.χ. αποδοχή πριν την είσοδο).
  router.post('/api/consent', (req, res) => {
    const account = currentAccount(req)
    const { policy = 'terms', accepted = true } = req.body ?? {}
    recordConsent({
      accountId: account?.id ?? null,
      policy,
      version: config.policyVersion,
      accepted,
    })
    created(res, { ok: true, version: config.policyVersion })
  })

  // Δικαίωμα πρόσβασης — εξαγωγή δεδομένων του χρήστη.
  router.get('/api/me/data', (req, res) => {
    const account = requireSession(req, res)
    if (!account) return
    ok(res, {
      account: {
        id: account.id,
        fullName: account.full_name,
        ageVerified: !!account.age_verified,
        createdAt: account.created_at,
      },
      consents: consentsForAccount(account.id).map((c) => ({
        policy: c.policy,
        version: c.version,
        accepted: !!c.accepted,
        date: c.created_at,
      })),
      note: 'Οι ψήφοι σας είναι ανώνυμες και δεν συνδέονται με τον λογαριασμό σας — δεν περιλαμβάνονται.',
    })
  })

  // Δικαίωμα διαγραφής — διαγραφή λογαριασμού & στοιχείων ταυτότητας.
  router.del('/api/me', (req, res) => {
    const account = requireSession(req, res)
    if (!account) return
    eraseAccount(account.id)
    ok(res, { ok: true, erased: true })
  })
}
