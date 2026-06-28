// Ενοποιημένη ταυτοποίηση για το frontend.
//
// Αν είναι ορισμένο VITE_API_URL → χρησιμοποιεί το backend (πραγματική σύνδεση
// Taxisnet → συνεδρία). Αλλιώς → client-side ΠΡΟΣΟΜΟΙΩΣΗ με τους ίδιους dummy
// πολίτες, ώστε η εφαρμογή να δοκιμάζεται και δωρεάν (χωρίς server).
//
// Σημείωση: η σύνδεση είναι ΑΠΕΥΘΕΙΑΣ μέσω Taxisnet (gov.gr). Η διπλή ταυτοποίηση
// γίνεται από την κρατική υπηρεσία — η εφαρμογή ΔΕΝ διαχειρίζεται OTP/SMS.
import * as api from './api.js'

export const MIN_VOTING_AGE = 17

// Dummy κατάλογος Taxisnet (ίδιος με τον server — μόνο για προσομοίωση).
export const DUMMY_CITIZENS = [
  { username: 'mbelechris',    password: 'Demo!2024', afm: '123456782', fullName: 'Μάριος Μπελεχρής',      birthDate: '1990-05-12' },
  { username: 'epapadopoulou', password: 'Demo!2024', afm: '234567893', fullName: 'Ελένη Παπαδοπούλου',    birthDate: '1985-09-23' },
  { username: 'gathanasiou',   password: 'Demo!2024', afm: '345678901', fullName: 'Γιώργος Αθανασίου',     birthDate: '1978-02-03' },
  { username: 'mnikolaou',     password: 'Demo!2024', afm: '456789012', fullName: 'Μαρία Νικολάου',        birthDate: '2005-11-30' },
  { username: 'anilikos',      password: 'Demo!2024', afm: '567890123', fullName: 'Ανήλικος Δοκιμαστικός', birthDate: '2012-01-01' },
]

function ageOf(birthDate) {
  const b = new Date(birthDate)
  const now = new Date()
  let a = now.getFullYear() - b.getFullYear()
  const m = now.getMonth() - b.getMonth()
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) a--
  return a
}

// Σύνδεση μέσω Taxisnet. Επιστρέφει { ok, token, account } ή { ok:false, reason }.
export async function startLogin(username, password, consent) {
  if (api.isApiEnabled()) {
    try {
      const r = await api.authStart(username, password, consent)
      return { ok: true, token: r.token, account: r.account }
    } catch (e) {
      return { ok: false, reason: String(e.message || 'error') }
    }
  }
  // Προσομοίωση (χωρίς server)
  const c = DUMMY_CITIZENS.find(
    (x) => x.username.toLowerCase() === String(username).trim().toLowerCase() && x.password === password,
  )
  if (!c) return { ok: false, reason: 'invalid_credentials' }
  if (ageOf(c.birthDate) < MIN_VOTING_AGE) return { ok: false, reason: 'underage' }
  return {
    ok: true,
    token: 'sim-' + c.afm,
    account: { id: 'sim-' + c.afm, fullName: c.fullName, ageVerified: true },
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
  rate_limited: 'Πολλές προσπάθειες. Δοκιμάστε σε λίγο.',
}
