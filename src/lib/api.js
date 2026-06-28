// Πελάτης (client) για το backend API της Democratia.
//
// Προαιρετική, σταδιακή μετάβαση από τα mock δεδομένα (src/data/mockData.js)
// στο πραγματικό backend. Ορίζεται μέσω της μεταβλητής περιβάλλοντος VITE_API_URL
// (π.χ. σε ένα .env: VITE_API_URL=http://localhost:8080). Αν δεν οριστεί, το
// `isApiEnabled()` επιστρέφει false και η εφαρμογή συνεχίζει με τα mock δεδομένα.

const API_URL = import.meta.env?.VITE_API_URL ?? ''

export function isApiEnabled() {
  return Boolean(API_URL)
}

async function get(path) {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`)
  return res.json()
}

async function post(path, body, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)
  return data
}

async function authedGet(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)
  return data
}

async function del(path, token) {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'DELETE',
    headers: token ? { Authorization: 'Bearer ' + token } : {},
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error ?? `API ${res.status}`)
  return data
}

// ── Ταυτοποίηση (απευθείας Taxisnet → συνεδρία) ──────────────────────────────
export const authStart = (username, password, consent) =>
  post('/api/auth/taxisnet/start', { username, password, consent })
export const authMe = (token) => authedGet('/api/auth/me', token)
export const authLogout = (token) => post('/api/auth/logout', {}, token)

// ── GDPR ─────────────────────────────────────────────────────────────────────
export const gdprExport = (token) => authedGet('/api/me/data', token)
export const gdprDelete = (token) => del('/api/me', token)
export const postConsent = (policy, accepted, token) =>
  post('/api/consent', { policy, accepted }, token)

// Φέρνει όλα τα δεδομένα σε σχήμα συμβατό με το mockData
// (societies, votings, comments, people, notifications).
export const fetchBootstrap = () => get('/api/bootstrap')

export const fetchSocieties = () => get('/api/societies')
export const fetchVotingsBySociety = (societyId) => get(`/api/societies/${societyId}/votings`)
export const fetchVoting = (id) => get(`/api/votings/${id}`)
export const fetchResults = (id) => get(`/api/votings/${id}/results`)
export const fetchComments = (id) => get(`/api/votings/${id}/comments`)

// Ανώνυμη ψήφος. Όταν υπάρχει `token` (συνεδρία), ο server ταυτοποιεί τον
// λογαριασμό από αυτό· το voterToken (συσκευής) είναι εφεδρικό για μη συνδεδεμένους.
export const castVote = (id, choice, voterToken, token) =>
  post(`/api/votings/${id}/vote`, { choice, voterToken }, token)

export const hasVoted = (id, voterToken, token) =>
  authedGet(`/api/votings/${id}/has-voted?voterToken=${encodeURIComponent(voterToken)}`, token)

// Δημιουργεί/ανακτά σταθερό ανώνυμο token συσκευής (localStorage).
export function getVoterToken() {
  const KEY = 'democratia.voterToken'
  let token = localStorage.getItem(KEY)
  if (!token) {
    token = crypto.randomUUID()
    localStorage.setItem(KEY, token)
  }
  return token
}
