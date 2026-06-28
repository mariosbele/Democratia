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
const { upsertAccount } = await import('../src/models/accounts.js')

getDb()
await ensureSeeded()

test('διαχωρισμός κάλπης/καταλόγου: η ψήφος δεν συνδέεται με ταυτότητα', () => {
  const db = getDb()
  // Η «κάλπη» (platform_votes) ΔΕΝ έχει στήλη ταυτότητας ψηφοφόρου.
  const cols = db.prepare('PRAGMA table_info(platform_votes)').all().map((c) => c.name)
  assert.ok(!cols.includes('voter_hash'), 'η κάλπη δεν περιέχει voter_hash')
  assert.ok(!cols.includes('account_id'), 'η κάλπη δεν περιέχει account_id')

  // Συνδεδεμένος ψηφοφόρος: καταγράφεται στον εκλογικό κατάλογο (account_id),
  // ενώ η επιλογή του πάει ανώνυμα στην κάλπη.
  const acc = upsertAccount({ afmHash: 'hash-test-1', fullName: 'Δοκιμή', ageVerified: true })
  const r = castPlatformVote('v-energy', 'yes', { accountId: acc.id })
  assert.ok(r.ok)
  const part = db
    .prepare('SELECT account_id FROM vote_participation WHERE voting_id = ? AND account_id = ?')
    .get('v-energy', acc.id)
  assert.ok(part, 'η συμμετοχή καταγράφηκε με account_id')
  // Δεύτερη ψήφος ίδιου λογαριασμού απορρίπτεται.
  assert.equal(castPlatformVote('v-energy', 'no', { accountId: acc.id }).reason, 'already_voted')
})

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
