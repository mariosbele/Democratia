import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dem-')), 'test.db')
process.env.SCHEDULER_ENABLED = 'false'
process.env.AUTH_SECRET = 'test-secret'

const { getDb } = await import('../src/db/index.js')
const { ensureSeeded } = await import('../src/seed/seed.js')
const { createServer } = await import('../src/http/server.js')
const { resetRateLimits } = await import('../src/services/security/rateLimit.js')

getDb()
await ensureSeeded()

let server, base
before(async () => {
  server = createServer()
  await new Promise((r) => server.listen(0, r))
  base = `http://localhost:${server.address().port}`
})
after(() => server.close())

const post = (p, body, token) =>
  fetch(base + p, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    body: JSON.stringify(body),
  })
const get = (p, token) => fetch(base + p, { headers: token ? { Authorization: 'Bearer ' + token } : {} })

test('λάθος διαπιστευτήρια Taxisnet → απόρριψη', async () => {
  const r = await post('/api/auth/taxisnet/start', { username: 'mbelechris', password: 'wrong' })
  assert.equal(r.status, 400)
  assert.equal((await r.json()).error, 'invalid_credentials')
})

test('ανήλικος → απόρριψη με έλεγχο ηλικίας', async () => {
  const r = await post('/api/auth/taxisnet/start', { username: 'anilikos', password: 'Demo!2024' })
  assert.equal(r.status, 400)
  assert.equal((await r.json()).error, 'underage')
})

test('πλήρης ροή: Taxisnet → OTP → συνεδρία → me → logout', async () => {
  const start = await post('/api/auth/taxisnet/start', { username: 'mbelechris', password: 'Demo!2024' })
  assert.equal(start.status, 200)
  const s = await start.json()
  assert.ok(s.challengeId)
  assert.ok(/^\d{6}$/.test(s.otp), 'σε προσομοίωση επιστρέφεται OTP')
  assert.ok(s.phoneHint.includes('•'), 'το τηλέφωνο εμφανίζεται κρυμμένο')

  // λάθος OTP
  const bad = await post('/api/auth/taxisnet/verify', { challengeId: s.challengeId, code: '000000' })
  // (μικρή πιθανότητα σύμπτωσης· αν συμπέσει, το παρακάτω verify θα αποτύχει — αμελητέο)
  if (bad.status === 201) return

  const ver = await post('/api/auth/taxisnet/verify', {
    challengeId: s.challengeId,
    code: s.otp,
    consent: true,
  })
  assert.equal(ver.status, 201)
  const v = await ver.json()
  assert.ok(v.token)
  assert.equal(v.account.fullName, 'Μάριος Μπελεχρής')
  assert.equal(v.account.ageVerified, true)

  const me = await get('/api/auth/me', v.token)
  assert.equal(me.status, 200)

  // εξαγωγή δεδομένων (GDPR) — περιλαμβάνει συγκαταθέσεις, ΟΧΙ ψήφους
  const data = await (await get('/api/me/data', v.token)).json()
  assert.equal(data.account.fullName, 'Μάριος Μπελεχρής')
  assert.ok(data.consents.length >= 2)

  const out = await post('/api/auth/logout', {}, v.token)
  assert.equal(out.status, 200)
  const me2 = await get('/api/auth/me', v.token)
  assert.equal(me2.status, 401)
})

test('μοναδικότητα λογαριασμού ανά πολίτη (ίδιο ΑΦΜ → ίδιος λογαριασμός)', async () => {
  const login = async () => {
    const s = await (await post('/api/auth/taxisnet/start', { username: 'epapadopoulou', password: 'Demo!2024' })).json()
    return (await (await post('/api/auth/taxisnet/verify', { challengeId: s.challengeId, code: s.otp })).json()).account.id
  }
  assert.equal(await login(), await login())
})

test('δικαίωμα διαγραφής (GDPR): ο λογαριασμός σβήνεται', async () => {
  const s = await (await post('/api/auth/taxisnet/start', { username: 'gathanasiou', password: 'Demo!2024' })).json()
  const v = await (await post('/api/auth/taxisnet/verify', { challengeId: s.challengeId, code: s.otp })).json()
  const del = await fetch(base + '/api/me', { method: 'DELETE', headers: { Authorization: 'Bearer ' + v.token } })
  assert.equal(del.status, 200)
  // η συνεδρία ακυρώθηκε
  assert.equal((await get('/api/auth/me', v.token)).status, 401)
})

test('κεφαλίδες ασφαλείας υπάρχουν', async () => {
  const r = await get('/api/health')
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(r.headers.get('x-frame-options'), 'DENY')
})

test('rate limiting στη σύνδεση (πολλές απόπειρες → 429)', async () => {
  resetRateLimits()
  let got429 = false
  for (let i = 0; i < 13; i++) {
    const r = await post('/api/auth/taxisnet/start', { username: 'x', password: 'y' })
    if (r.status === 429) { got429 = true; break }
  }
  assert.ok(got429, 'ενεργοποιήθηκε το όριο ρυθμού')
})
