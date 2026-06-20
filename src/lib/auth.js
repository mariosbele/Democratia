// Ενοποιημένη ταυτοποίηση για το frontend.
//
// Αν είναι ορισμένο VITE_API_URL → χρησιμοποιεί το backend (πραγματική ροή
// Taxisnet→OTP→συνεδρία). Αλλιώς → client-side ΠΡΟΣΟΜΟΙΩΣΗ με τους ίδιους dummy
// πολίτες, ώστε η εφαρμογή να δοκιμάζεται και δωρεάν (χωρίς server).
import * as api from './api.js'

export const MIN_VOTING_AGE = 17

// Dummy κατάλογος Taxisnet (ίδιος με τον server — μόνο για προσομοίωση).
export const DUMMY_CITIZENS = [
  { username: 'mbelechris',    password: 'Demo!2024', afm: '123456782', fullName: 'Μάριος Μπελεχρής',      birthDate: '1990-05-12', phone: '+306971111111' },
  { username: 'epapadopoulou', password: 'Demo!2024', afm: '234567893', fullName: 'Ελένη Παπαδοπούλου',    birthDate: '1985-09-23', phone: '+306972222222' },
  { username: 'gathanasiou',   password: 'Demo!2024', afm: '345678901', fullName: 'Γιώργος Αθανασίου',     birthDate: '1978-02-03', phone: '+306973333333' },
  { username: 'mnikolaou',     password: 'Demo!2024', afm: '456789012', fullName: 'Μαρία Νικολάου',        birthDate: '2005-11-30', phone: '+306974444444' },
  { username: 'anilikos',      password: 'Demo!2024', afm: '567890123', fullName: 'Ανήλικος Δοκιμαστικός', birthDate: '2012-01-01', phone: '+306975555555' },
]

function ageOf(birthDate) {
  const b = new Date(birthDate)
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
}

function maskPhone(p) {
  const s = String(p ?? '')
  return s.length > 4 ? '••••••' + s.slice(-3) : '••••'
}

// Προσωρινές προκλήσεις OTP (μόνο για client-side προσομοίωση).
const simChallenges = new Map()

// Βήμα 1: επιστρέφει { ok, challengeId, otp?, phoneHint } ή { ok:false, reason }.
export async function startLogin(username, password) {
  if (api.isApiEnabled()) {
    try {
      const r = await api.authStart(username, password)
      return { ok: true, ...r }
    } catch (e) {
      return { ok: false, reason: String(e.message || 'error') }
    }
  }
  // Προσομοίωση
  const c = DUMMY_CITIZENS.find(
    (x) => x.username.toLowerCase() === String(username).trim().toLowerCase() && x.password === password,
  )
  if (!c) return { ok: false, reason: 'invalid_credentials' }
  if (ageOf(c.birthDate) < MIN_VOTING_AGE) return { ok: false, reason: 'underage' }
  const challengeId = 'sim-' + Math.random().toString(36).slice(2)
  const otp = String(Math.floor(Math.random() * 1e6)).padStart(6, '0')
  simChallenges.set(challengeId, { otp, citizen: c, expires: Date.now() + 5 * 60 * 1000 })
  return { ok: true, challengeId, otp, phoneHint: maskPhone(c.phone) }
}

// Βήμα 2: επιστρέφει { ok, token, account } ή { ok:false, reason }.
export async function verifyOtp(challengeId, code, consent) {
  if (api.isApiEnabled()) {
    try {
      const r = await api.authVerify(challengeId, code, consent)
      return { ok: true, token: r.token, account: r.account }
    } catch (e) {
      return { ok: false, reason: String(e.message || 'error') }
    }
  }
  const ch = simChallenges.get(challengeId)
  if (!ch) return { ok: false, reason: 'invalid_challenge' }
  if (Date.now() > ch.expires) { simChallenges.delete(challengeId); return { ok: false, reason: 'expired' } }
  if (String(code) !== ch.otp) return { ok: false, reason: 'wrong_code' }
  simChallenges.delete(challengeId)
  return {
    ok: true,
    token: 'sim-' + ch.citizen.afm,
    account: { id: 'sim-' + ch.citizen.afm, fullName: ch.citizen.fullName, ageVerified: true },
  }
}

export async function logout(token) {
  if (api.isApiEnabled()) { try { await api.authLogout(token) } catch { /* ignore */ } }
}

export async function exportData(token, account) {
  if (api.isApiEnabled()) return api.gdprExport(token)
  // Προσομοίωση: επιστρέφει ό,τι κρατάμε τοπικά.
  return {
    account,
    note: 'Προσομοίωση: τα δεδομένα τηρούνται τοπικά στη συσκευή σας (localStorage).',
  }
}

export async function deleteAccount(token) {
  if (api.isApiEnabled()) { try { await api.gdprDelete(token) } catch { /* ignore */ } }
}

export async function recordConsent(policy, accepted, token) {
  if (api.isApiEnabled()) { try { await api.postConsent(policy, accepted, token) } catch { /* ignore */ } }
}

// Φιλικά μηνύματα σφάλματος (ελληνικά) για την οθόνη σύνδεσης.
export const AUTH_ERRORS = {
  invalid_credentials: 'Λάθος όνομα χρήστη ή κωδικός Taxisnet.',
  underage: 'Πρέπει να είστε τουλάχιστον ' + MIN_VOTING_AGE + ' ετών για να ψηφίσετε.',
  wrong_code: 'Λάθος κωδικός OTP. Προσπαθήστε ξανά.',
  expired: 'Ο κωδικός OTP έληξε. Ξεκινήστε ξανά.',
  too_many_attempts: 'Πολλές αποτυχημένες προσπάθειες. Ξεκινήστε ξανά.',
  rate_limited: 'Πολλές προσπάθειες. Δοκιμάστε σε λίγο.',
  invalid_challenge: 'Η συνεδρία έληξε. Ξεκινήστε ξανά.',
}
