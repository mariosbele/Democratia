// Χειροκίνητος συγχρονισμός από γραμμή εντολών.
//   npm run sync            → όλες οι ενεργές πηγές (config.sync.sources)
//   npm run sync -- europarl → μόνο η συγκεκριμένη πηγή
import { getDb, closeDb } from '../../db/index.js'
import { ensureSeeded } from '../../seed/seed.js'
import { syncAll, syncSource } from './index.js'

getDb()
await ensureSeeded() // τα επίπεδα πρέπει να υπάρχουν ώστε να αντιστοιχηθούν τα ψηφίσματα

const arg = process.argv[2]
const results = arg ? [await syncSource(arg)] : await syncAll()

for (const r of results) {
  if (r.ok) console.log(`✓ ${r.source}: fetched=${r.fetched} upserted=${r.upserted}${r.skipped ? ` (skipped: ${r.skipped})` : ''}`)
  else console.error(`✗ ${r.source}: ${r.error}`)
}

closeDb()
