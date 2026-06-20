import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dem-')), 'test.db')
process.env.SCHEDULER_ENABLED = 'false'

const { getDb } = await import('../src/db/index.js')
const { ensureSeeded } = await import('../src/seed/seed.js')
const { upsertVoting, upsertPhase, listPhases, getVoting } = await import('../src/models/votings.js')
const { castPlatformVote } = await import('../src/models/results.js')
const { processSchedulerTick } = await import('../src/services/scheduler.js')

getDb()
await ensureSeeded()

test('ο scheduler ανακοινώνει ληγμένες φάσεις με στιγμιότυπο αποτελεσμάτων', () => {
  upsertVoting({
    id: 'test-sched-1',
    societyId: 'greece',
    title: 'Δοκιμαστικό ψήφισμα',
    source: 'manual',
    sourceRef: 'sched-1',
    uploadedAt: '2024-01-01',
    voteDeadline: '2999-12-31', // μακρινό → παραμένει ανοιχτό
    status: 'open',
  })
  upsertPhase('test-sched-1', { ordinal: 1, label: '1η Ανακοίνωση', date: '2000-01-01' }) // ληγμένη
  upsertPhase('test-sched-1', { ordinal: 2, label: 'Τελικά', date: '2999-01-01' }) // μελλοντική

  castPlatformVote('test-sched-1', 'yes', 'a')
  castPlatformVote('test-sched-1', 'yes', 'b')
  castPlatformVote('test-sched-1', 'no', 'c')

  const r = processSchedulerTick()
  assert.ok(r.announced >= 1)

  const phases = listPhases('test-sched-1')
  const p1 = phases.find((p) => p.ordinal === 1)
  const p2 = phases.find((p) => p.ordinal === 2)
  assert.equal(!!p1.announced, true)
  assert.equal(p1.yes, 2)
  assert.equal(p1.no, 1)
  assert.equal(!!p2.announced, false, 'μελλοντική φάση δεν ανακοινώνεται')
})

test('ο scheduler κλείνει ψηφίσματα μετά την προθεσμία', () => {
  upsertVoting({
    id: 'test-sched-2',
    societyId: 'greece',
    title: 'Ληγμένο ψήφισμα',
    source: 'manual',
    sourceRef: 'sched-2',
    uploadedAt: '2000-01-01',
    voteDeadline: '2000-02-01', // στο παρελθόν
    status: 'open',
  })
  const r = processSchedulerTick()
  assert.ok(r.closed >= 1)
  assert.equal(getVoting('test-sched-2').status, 'closed')
})
