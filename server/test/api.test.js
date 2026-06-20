import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dem-')), 'test.db')
process.env.SCHEDULER_ENABLED = 'false'

const { getDb } = await import('../src/db/index.js')
const { ensureSeeded } = await import('../src/seed/seed.js')
const { createServer } = await import('../src/http/server.js')

getDb()
await ensureSeeded()

let server
let base

before(async () => {
  server = createServer()
  await new Promise((resolve) => server.listen(0, resolve))
  base = `http://localhost:${server.address().port}`
})

after(() => server.close())

const getJson = async (p) => {
  const res = await fetch(base + p)
  return { status: res.status, body: await res.json() }
}

test('GET /api/health', async () => {
  const { status, body } = await getJson('/api/health')
  assert.equal(status, 200)
  assert.equal(body.status, 'ok')
})

test('GET /api/societies επιστρέφει τα 3 επίπεδα', async () => {
  const { body } = await getJson('/api/societies')
  const ids = body.map((s) => s.id)
  assert.deepEqual(ids.sort(), ['athens', 'eu', 'greece'])
  assert.ok(body.find((s) => s.id === 'greece').level === 'Βουλή')
})

test('GET /api/societies/:id/votings φιλτράρει ανά κοινωνία', async () => {
  const { body } = await getJson('/api/societies/eu/votings')
  assert.ok(body.length >= 1)
  assert.ok(body.every((v) => v.society === 'eu'))
  assert.ok(body[0].aiSummary && Array.isArray(body[0].aiSummary.keyPoints))
})

test('GET /api/votings/:id περιλαμβάνει φάσεις, official & πλήρες κείμενο', async () => {
  const { status, body } = await getJson('/api/votings/v-budget-2024')
  assert.equal(status, 200)
  assert.equal(body.id, 'v-budget-2024')
  assert.ok(Array.isArray(body.phases))
  assert.ok('official' in body)
  assert.ok(typeof body.fullText === 'string' && body.fullText.includes('Άρθρο 1'))
  assert.ok(body.referenceUrl, 'υπάρχει σύνδεσμος επίσημης πηγής')
})

test('POST /api/votings/:id/vote — ανώνυμη & αμετάκλητη', async () => {
  const cast = (choice, token) =>
    fetch(`${base}/api/votings/v-cleaning/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choice, voterToken: token }),
    })

  const r1 = await cast('yes', 'tok-1')
  assert.equal(r1.status, 201)
  const r2 = await cast('no', 'tok-1') // ίδιος χρήστης ξανά
  assert.equal(r2.status, 400)
  assert.equal((await r2.json()).error, 'already_voted')

  const { body } = await getJson('/api/votings/v-cleaning/results')
  assert.equal(body.platform.yes, 1)
})

test('GET /api/bootstrap επιστρέφει πλήρες σχήμα συμβατό με το frontend', async () => {
  const { body } = await getJson('/api/bootstrap')
  assert.ok(Array.isArray(body.societies))
  assert.ok(Array.isArray(body.votings))
  assert.equal(typeof body.comments, 'object')
  assert.equal(typeof body.people, 'object')
  assert.ok(Array.isArray(body.notifications))
})

test('404 σε άγνωστο ψήφισμα', async () => {
  const { status } = await getJson('/api/votings/does-not-exist')
  assert.equal(status, 404)
})
