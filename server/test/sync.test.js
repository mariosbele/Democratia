import { test } from 'node:test'
import assert from 'node:assert/strict'
import os from 'node:os'
import path from 'node:path'
import fs from 'node:fs'

process.env.DB_PATH = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dem-')), 'test.db')
process.env.SCHEDULER_ENABLED = 'false'
process.env.HELLENIC_FEED_URL = 'https://feed.example.gr/votes.json'
process.env.EUROPARL_API_BASE = 'https://data.europarl.europa.eu/api/v2'

const { getDb } = await import('../src/db/index.js')
const { ensureSeeded } = await import('../src/seed/seed.js')
const { syncSource } = await import('../src/services/sync/index.js')
const { getVoting, listPhases } = await import('../src/models/votings.js')
const { getOfficialResult } = await import('../src/models/results.js')
const { europarlAdapter } = await import('../src/services/sync/adapters/europarl.js')
const { hellenicAdapter } = await import('../src/services/sync/adapters/hellenic.js')

getDb()
await ensureSeeded()

// ── Fake fetchJson για EP: επιστρέφει ολομέλειες & αποτελέσματα ψηφοφορίας. ──
const meetingId = `MTG-PL-${new Date().getUTCFullYear()}-01-01`
const today = new Date().toISOString().slice(0, 10)

function europarlFetch(url) {
  if (url.includes('/meetings?year=')) {
    return Promise.resolve({
      data: [{ id: `https://data.europarl.europa.eu/.../${meetingId}`, activity_date: today }],
    })
  }
  if (url.includes('/vote-results')) {
    return Promise.resolve({
      data: [
        {
          activity_id: 'VOTE-EP-001',
          activity_label: [
            { '@language': 'el', '@value': 'Κανονισμός για τις εκπομπές CO₂ νέων οχημάτων' },
            { '@language': 'en', '@value': 'Regulation on CO2 emissions' },
          ],
          number_of_votes_favor: 340,
          number_of_votes_against: 279,
          number_of_votes_abstention: 21,
          activity_date: today,
          decision_outcome: 'ADOPTED',
          recorded_in_a_realization_of: { '@id': 'https://data.europarl.europa.eu/doc/TA-9-001' },
        },
      ],
    })
  }
  return Promise.reject(new Error(`unexpected url ${url}`))
}

test('EP adapter: κανονικοποίηση ψηφοφορίας σε ψήφισμα + επίσημο αποτέλεσμα', async () => {
  const society = { id: 'eu' }
  const items = await europarlAdapter.fetch({
    society,
    base: process.env.EUROPARL_API_BASE,
    lookbackDays: 365,
    fetchJson: europarlFetch,
  })
  assert.equal(items.length, 1)
  const it = items[0]
  assert.equal(it.source, 'europarl')
  assert.equal(it.title, 'Κανονισμός για τις εκπομπές CO₂ νέων οχημάτων')
  assert.equal(it.category, 'Περιβάλλον') // εντοπίστηκε από λέξεις-κλειδιά
  assert.equal(it.official.yes, 340)
  assert.equal(it.official.no, 279)
  assert.equal(it.official.abstain, 21)
  assert.equal(it.official.outcome, 'adopted')
})

test('orchestrator: ο συγχρονισμός EP γράφει ψήφισμα, φάσεις & επίσημο αποτέλεσμα', async () => {
  const res = await syncSource('europarl', { fetchJson: europarlFetch })
  assert.equal(res.ok, true)
  assert.ok(res.upserted >= 1)

  const v = getVoting('europarl:VOTE-EP-001')
  assert.ok(v, 'το ψήφισμα δημιουργήθηκε')
  assert.equal(v.society_id, 'eu')
  assert.ok(listPhases(v.id).length >= 1, 'δημιουργήθηκαν φάσεις')

  const official = getOfficialResult(v.id)
  assert.equal(official.yes, 340)
  assert.equal(official.source, 'europarl')
})

test('Hellenic adapter: ανάγνωση από ρυθμιζόμενο feed', async () => {
  const feed = {
    items: [
      {
        id: 'nomos-2024-12',
        title: 'Φορολογικό Νομοσχέδιο 2024',
        uploadedAt: '2024-01-05',
        voteDeadline: '2024-01-20',
        parliamentDate: '2024-01-21',
        url: 'https://www.hellenicparliament.gr/x',
        summary: 'Αλλαγές στη φορολογία και εισφορές.',
        fullText: 'ΣΧΕΔΙΟ ΝΟΜΟΥ\n\nΆρθρο 1 — Εισφορές',
        result: { yes: 158, no: 142, abstain: 0, outcome: 'adopted', decidedAt: '2024-01-21' },
      },
    ],
  }
  const items = await hellenicAdapter.fetch({
    society: { id: 'greece' },
    feedUrl: process.env.HELLENIC_FEED_URL,
    fetchJson: () => Promise.resolve(feed),
  })
  assert.equal(items.length, 1)
  assert.equal(items[0].category, 'Οικονομία')
  assert.equal(items[0].official.yes, 158)
  assert.ok(items[0].fullText.includes('Άρθρο 1'))
})

test('Hellenic adapter χωρίς feed → σφάλμα NO_FEED που πιάνεται από τον orchestrator', async () => {
  const items = hellenicAdapter.fetch({ society: { id: 'greece' }, feedUrl: '' })
  await assert.rejects(items, (e) => e.code === 'NO_FEED')
})
