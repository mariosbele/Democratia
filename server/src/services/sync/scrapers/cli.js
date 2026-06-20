// CLI για τον scraper της Βουλής.
//
// Χρήση:
//   HP_INDEX_URL="https://www.hellenicparliament.gr/..." npm run scrape:hellenic
//     → τυπώνει JSON feed στο stdout (αποθήκευσέ το ή σέρβιρέ το ως HELLENIC_FEED_URL)
//
//   Με αποστολή στο admin endpoint (αντί για εκτύπωση):
//   HP_INDEX_URL="..." ADMIN_API="https://<backend>" ADMIN_TOKEN="..." \
//     node src/services/sync/scrapers/cli.js --post
//
// ⚠️ Πριν τη χρήση, ρύθμισε τα regex/selectors στο hellenicParliament.js στη
// δομή της πραγματικής σελίδας (δες τα σχόλια εκεί).
import { scrapeHellenic } from './hellenicParliament.js'

const indexUrl = process.env.HP_INDEX_URL || process.argv.find((a) => a.startsWith('http'))
const post = process.argv.includes('--post')

if (!indexUrl) {
  console.error('Όρισε HP_INDEX_URL (ή δώσε URL ως όρισμα).')
  process.exit(1)
}

const { items } = await scrapeHellenic({ indexUrl })
console.error(`[scrape] Βρέθηκαν ${items.length} εγγραφές.`)

if (!post) {
  // Έξοδος ως feed JSON (μορφή που δέχεται ο hellenic adapter).
  process.stdout.write(JSON.stringify({ items }, null, 2) + '\n')
} else {
  const api = process.env.ADMIN_API
  const token = process.env.ADMIN_TOKEN
  if (!api || !token) {
    console.error('Για --post χρειάζονται ADMIN_API και ADMIN_TOKEN.')
    process.exit(1)
  }
  let okCount = 0
  for (const it of items) {
    const body = {
      id: it.id,
      society: 'greece',
      title: it.title,
      uploadedAt: it.uploadedAt,
      voteDeadline: it.voteDeadline,
      parliamentDate: it.parliamentDate,
      status: 'closed',
      referenceUrl: it.url,
      official: it.result,
    }
    const r = await fetch(`${api}/api/admin/votings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    })
    if (r.ok) okCount++
    else console.error(`  ✗ ${it.title}: HTTP ${r.status}`)
  }
  console.error(`[scrape] Στάλθηκαν ${okCount}/${items.length} στο ${api}.`)
}
