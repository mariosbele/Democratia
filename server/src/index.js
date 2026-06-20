// Εκκίνηση του backend της Democratia:
//   1) Σύνδεση/μετανάστευση βάσης.
//   2) Seed (αν είναι άδεια) ώστε να λειτουργεί ακόμη και χωρίς δίκτυο.
//   3) Εκκίνηση HTTP API.
//   4) Εκκίνηση χρονοπρογραμματιστή (αυτόματος συγχρονισμός + ανακοίνωση φάσεων).
import { config } from './config.js'
import { getDb } from './db/index.js'
import { ensureSeeded } from './seed/seed.js'
import { createServer } from './http/server.js'
import { startScheduler } from './services/scheduler.js'

getDb()

if (config.seedOnEmpty) {
  const { seeded, seededContent } = await ensureSeeded()
  if (seeded) {
    console.log(
      `[seed] Άδεια βάση — φορτώθηκαν τα επίπεδα${seededContent ? ' + demo περιεχόμενο' : ''}.`,
    )
  }
}

const server = createServer()
server.listen(config.port, () => {
  console.log(`[http] Democratia API στο http://localhost:${config.port}`)
  console.log(`[http] Δοκιμή: curl http://localhost:${config.port}/api/health`)
})

const stopScheduler = startScheduler()

function shutdown() {
  console.log('\n[server] Τερματισμός…')
  stopScheduler()
  server.close(() => process.exit(0))
}
process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
