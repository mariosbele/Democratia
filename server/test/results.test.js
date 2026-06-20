import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

// Απομονωμένη βάση ανά αρχείο test (πριν από κάθε import που διαβάζει config).
process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dem-')), 'test.db')
process.env.SCHEDULER_ENABLED = 'false'

const { getDb } = await import('../src/db/index.js')
const { ensureSeeded } = await import('../src/seed/seed.js')
const { castPlatformVote, platformTally, hasVoted, upsertOfficialResult, getOfficialResult } =
  await import('../src/models/results.js')

getDb()
await ensureSeeded()

test('η ανώνυμη ψήφος καταγράφεται και μετριέται', () => {
  const r1 = castPlatformVote('v-budget-2024', 'yes', 'voter-A')
  const r2 = castPlatformVote('v-budget-2024', 'no', 'voter-B')
  const r3 = castPlatformVote('v-budget-2024', 'yes', 'voter-C')
  assert.ok(r1.ok && r2.ok && r3.ok)

  const tally = platformTally('v-budget-2024')
  assert.equal(tally.yes, 2)
  assert.equal(tally.no, 1)
  assert.equal(tally.total, 3)
})

test('η ψήφος είναι αμετάκλητη (μία ανά χρήστη ανά ψήφισμα)', () => {
  const first = castPlatformVote('v-cleaning', 'yes', 'voter-A')
  const again = castPlatformVote('v-cleaning', 'no', 'voter-A')
  assert.ok(first.ok)
  assert.equal(again.ok, false)
  assert.equal(again.reason, 'already_voted')
  assert.equal(platformTally('v-cleaning').yes, 1)
})

test('απορρίπτονται μη έγκυρες επιλογές και κλειστά ψηφίσματα', () => {
  assert.equal(castPlatformVote('v-budget-2024', 'maybe', 'x').reason, 'invalid_choice')
  // v-police είναι 'closed' στα seed δεδομένα
  assert.equal(castPlatformVote('v-police', 'yes', 'x').reason, 'closed')
})

test('hasVoted εντοπίζει ψηφοφόρο χωρίς να αποθηκεύει στοιχεία', () => {
  castPlatformVote('v-christmas', 'present', 'voter-Z')
  assert.equal(hasVoted('v-christmas', 'voter-Z'), true)
  assert.equal(hasVoted('v-christmas', 'voter-Y'), false)
})

test('αποθήκευση & ανάκτηση επίσημου αποτελέσματος Βουλής/Ευρωβουλής', () => {
  upsertOfficialResult('v-budget-2024', {
    yes: 158,
    no: 142,
    abstain: 0,
    outcome: 'adopted',
    decidedAt: '2023-12-15',
    source: 'hellenic',
    sourceUrl: 'https://example.org/x',
  })
  const r = getOfficialResult('v-budget-2024')
  assert.equal(r.yes, 158)
  assert.equal(r.outcome, 'adopted')
  // upsert: δεύτερη εγγραφή ενημερώνει, δεν διπλασιάζει
  upsertOfficialResult('v-budget-2024', { yes: 160, no: 140, abstain: 0, outcome: 'adopted' })
  assert.equal(getOfficialResult('v-budget-2024').yes, 160)
})
