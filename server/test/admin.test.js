import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dem-')), 'test.db')
process.env.SCHEDULER_ENABLED = 'false'
process.env.ADMIN_TOKEN = 'secret-admin-123'

const { getDb } = await import('../src/db/index.js')
const { ensureSeeded } = await import('../src/seed/seed.js')
const { createServer } = await import('../src/http/server.js')

getDb()
await ensureSeeded()

let server
let base
before(async () => {
  server = createServer()
  await new Promise((r) => server.listen(0, r))
  base = `http://localhost:${server.address().port}`
})
after(() => server.close())

const adminHeaders = { 'Content-Type': 'application/json', Authorization: 'Bearer secret-admin-123' }

test('η σελίδα /admin σερβίρεται', async () => {
  const res = await fetch(`${base}/admin`)
  assert.equal(res.status, 200)
  assert.match(await res.text(), /Democratia — Διαχείριση/)
})

test('admin endpoints απαιτούν σωστό token', async () => {
  const noAuth = await fetch(`${base}/api/admin/ping`)
  assert.equal(noAuth.status, 401)
  const bad = await fetch(`${base}/api/admin/ping`, { headers: { Authorization: 'Bearer wrong' } })
  assert.equal(bad.status, 401)
  const good = await fetch(`${base}/api/admin/ping`, { headers: adminHeaders })
  assert.equal(good.status, 200)
})

test('δημιουργία ψηφίσματος Βουλής μέσω admin (με αυτόματη σύνοψη & αποτέλεσμα)', async () => {
  const res = await fetch(`${base}/api/admin/votings`, {
    method: 'POST',
    headers: adminHeaders,
    body: JSON.stringify({
      id: 'nomos-test-1',
      society: 'greece',
      category: 'Υγεία',
      title: 'Νομοσχέδιο για τη δημόσια υγεία',
      uploadedAt: '2024-03-01',
      voteDeadline: '2024-03-19',
      parliamentDate: '2024-03-20',
      status: 'closed',
      referenceUrl: 'https://www.hellenicparliament.gr/x',
      fullText: 'ΣΧΕΔΙΟ ΝΟΜΟΥ. Άρθρο 1 — Ενίσχυση νοσοκομείων.',
      official: { yes: 170, no: 118, abstain: 12, outcome: 'adopted' },
    }),
  })
  assert.equal(res.status, 201)
  const v = await res.json()
  assert.equal(v.id, 'nomos-test-1')
  assert.equal(v.society, 'greece')
  assert.ok(v.aiSummary.tldr, 'δημιουργήθηκε αυτόματη σύνοψη')
  assert.equal(v.official.yes, 170)
  assert.equal(v.official.source, 'hellenic')

  // Εμφανίζεται στη λίστα της Βουλής
  const list = await (await fetch(`${base}/api/societies/greece/votings`)).json()
  assert.ok(list.find((x) => x.id === 'nomos-test-1'))
})

test('διαγραφή ψηφίσματος μέσω admin', async () => {
  const del = await fetch(`${base}/api/admin/votings/nomos-test-1`, {
    method: 'DELETE',
    headers: adminHeaders,
  })
  assert.equal(del.status, 200)
  const after = await fetch(`${base}/api/votings/nomos-test-1`)
  assert.equal(after.status, 404)
})
