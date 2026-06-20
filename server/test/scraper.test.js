import { test } from 'node:test'
import assert from 'node:assert/strict'

const { parseRollCallList, scrapeHellenic } = await import(
  '../src/services/sync/scrapers/hellenicParliament.js'
)

// Δείγμα HTML στη μορφή που στοχεύει το DEFAULT_CONFIG (η πραγματική σελίδα της
// Βουλής διαφέρει — τα regex προσαρμόζονται όταν τρέξει live).
const SAMPLE = `
<html><body>
  <article class="vote">
    <h3><a href="/votes/123">Νομοσχέδιο για τη δημόσια υγεία</a></h3>
    <time>20/03/2024</time>
    <span class="yes">170</span><span class="no">118</span><span class="abstain">12</span>
  </article>
  <article class="vote">
    <h3><a href="https://www.hellenicparliament.gr/votes/124">Μεταρρύθμιση παιδείας</a></h3>
    <time>16/04/2024</time>
    <span class="yes">151</span><span class="no">140</span><span class="abstain">0</span>
  </article>
</body></html>`

test('parseRollCallList: εξάγει εγγραφές & αποτελέσματα από το δείγμα', () => {
  const items = parseRollCallList(SAMPLE)
  assert.equal(items.length, 2)
  assert.equal(items[0].title, 'Νομοσχέδιο για τη δημόσια υγεία')
  assert.equal(items[0].url, 'https://www.hellenicparliament.gr/votes/123')
  assert.equal(items[0].parliamentDate, '2024-03-20')
  assert.equal(items[0].result.yes, 170)
  assert.equal(items[0].result.outcome, 'adopted')
  assert.equal(items[1].url, 'https://www.hellenicparliament.gr/votes/124')
})

test('scrapeHellenic: χρησιμοποιεί injected fetchText (χωρίς δίκτυο)', async () => {
  const { items } = await scrapeHellenic({
    indexUrl: 'https://example.test/list',
    fetchText: async () => SAMPLE,
  })
  assert.equal(items.length, 2)
  assert.equal(items[1].title, 'Μεταρρύθμιση παιδείας')
})

test('scrapeHellenic χωρίς indexUrl → σφάλμα', async () => {
  await assert.rejects(scrapeHellenic({}), /indexUrl/)
})
