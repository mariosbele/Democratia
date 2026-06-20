import { config } from '../config.js'
import { ageFromBirthDate, findCitizen, MIN_VOTING_AGE } from './directory.js'
import { hmac, randomOtp, safeEqual } from './secure.js'
import {
  createOtpChallenge,
  getOtpChallenge,
  bumpOtpAttempts,
  deleteOtpChallenge,
  upsertAccount,
  createSession,
} from '../models/accounts.js'

// Βήμα 1: ταυτοποίηση μέσω (προσομοιωμένου) Taxisnet → δημιουργία πρόκλησης OTP.
// Επιστρέφει { ok, challengeId, otp? } ή { ok:false, reason }.
export function startLogin(username, password) {
  const citizen = findCitizen(username, password)
  if (!citizen) return { ok: false, reason: 'invalid_credentials' }

  const age = ageFromBirthDate(citizen.birthDate)
  if (age < MIN_VOTING_AGE) return { ok: false, reason: 'underage', minAge: MIN_VOTING_AGE }

  // ΕΛΑΧΙΣΤΟΠΟΙΗΣΗ: κρατάμε μόνο hash ΑΦΜ, όνομα, και «επαληθευμένη ηλικία».
  const afmHash = hmac('afm:' + citizen.afm)
  const otp = randomOtp()
  const challengeId = createOtpChallenge({
    afmHash,
    fullName: citizen.fullName,
    ageVerified: true,
    codeHash: hmac('otp:' + challengeId_seed(afmHash) + otp),
    ttlMs: config.auth.otpTtlMs,
  })

  // Σε πραγματικό περιβάλλον το OTP στέλνεται με SMS στο citizen.phone και ΔΕΝ
  // επιστρέφεται ποτέ. Σε προσομοίωση το επιστρέφουμε για να ολοκληρωθεί η ροή.
  const out = { ok: true, challengeId, phoneHint: maskPhone(citizen.phone) }
  if (config.auth.simulateOtp) out.otp = otp
  return out
}

// Βοηθός: δένει το hash του OTP με το challenge (μέσω afmHash) ώστε να μην είναι
// επαναχρησιμοποιήσιμο σε άλλη πρόκληση.
function challengeId_seed(afmHash) {
  return afmHash.slice(0, 12) + ':'
}

// Βήμα 2: επαλήθευση OTP → δημιουργία λογαριασμού (αν δεν υπάρχει) + συνεδρία.
export function verifyOtp(challengeId, code) {
  const ch = getOtpChallenge(challengeId)
  if (!ch) return { ok: false, reason: 'invalid_challenge' }

  if (new Date(ch.expires_at).getTime() < Date.now()) {
    deleteOtpChallenge(challengeId)
    return { ok: false, reason: 'expired' }
  }
  if (ch.attempts >= config.auth.otpMaxAttempts) {
    deleteOtpChallenge(challengeId)
    return { ok: false, reason: 'too_many_attempts' }
  }

  const expected = hmac('otp:' + challengeId_seed(ch.afm_hash) + String(code ?? ''))
  if (!safeEqual(expected, ch.code_hash)) {
    bumpOtpAttempts(challengeId)
    return { ok: false, reason: 'wrong_code' }
  }

  deleteOtpChallenge(challengeId)
  const account = upsertAccount({
    afmHash: ch.afm_hash,
    fullName: ch.full_name,
    ageVerified: !!ch.age_verified,
  })
  const token = createSession(account.id, config.auth.sessionTtlMs)
  return { ok: true, token, account: publicAccount(account) }
}

export function publicAccount(account) {
  return {
    id: account.id,
    fullName: account.full_name,
    ageVerified: !!account.age_verified,
  }
}

function maskPhone(phone) {
  const s = String(phone ?? '')
  return s.length > 4 ? '••••••' + s.slice(-3) : '••••'
}
