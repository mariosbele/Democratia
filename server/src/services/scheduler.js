import { config } from '../config.js'
import { listAllVotings, listPhases, announcePhase, setVotingStatus } from '../models/votings.js'
import { platformTally } from '../models/results.js'
import { syncAll } from './sync/index.js'

const todayIso = () => new Date().toISOString().slice(0, 10)

// Ένα «τικ» του χρονοπρογραμματιστή (ντετερμινιστικό & testable):
//   • Ανακοινώνει όσες φάσεις έχουν φτάσει η ημερομηνία τους, αποθηκεύοντας
//     στιγμιότυπο των τρεχόντων αποτελεσμάτων της πλατφόρμας.
//   • Κλείνει ψηφίσματα των οποίων πέρασε η προθεσμία.
export function processSchedulerTick(today = todayIso()) {
  let announced = 0
  let closed = 0

  for (const v of listAllVotings()) {
    // Ανακοίνωση φάσεων που «ωρίμασαν».
    for (const ph of listPhases(v.id)) {
      if (!ph.announced && ph.date && ph.date <= today) {
        announcePhase(ph.id, platformTally(v.id))
        announced += 1
      }
    }

    // Κλείσιμο ψηφίσματος στην προθεσμία.
    const horizon = v.vote_deadline ?? v.parliament_date
    if (v.status === 'open' && horizon && horizon < today) {
      setVotingStatus(v.id, 'closed')
      closed += 1
    }
  }

  return { announced, closed }
}

let tickTimer = null
let syncTimer = null

export function startScheduler({ onSync } = {}) {
  if (!config.scheduler.enabled) {
    console.log('[scheduler] Απενεργοποιημένος (SCHEDULER_ENABLED=false).')
    return () => {}
  }

  // Τικ φάσεων/κλεισίματος.
  processSchedulerTick()
  tickTimer = setInterval(() => {
    try {
      const r = processSchedulerTick()
      if (r.announced || r.closed) {
        console.log(`[scheduler] φάσεις ανακοινώθηκαν=${r.announced}, ψηφίσματα έκλεισαν=${r.closed}`)
      }
    } catch (err) {
      console.error('[scheduler] σφάλμα τικ:', err.message)
    }
  }, config.scheduler.tickMs)
  tickTimer.unref?.()

  // Περιοδικός συγχρονισμός πηγών.
  const runSync = async () => {
    try {
      const results = await syncAll()
      for (const r of results) {
        if (r.ok) console.log(`[sync] ${r.source}: fetched=${r.fetched} upserted=${r.upserted}`)
        else console.warn(`[sync] ${r.source}: ΑΠΟΤΥΧΙΑ — ${r.error}`)
      }
      onSync?.(results)
    } catch (err) {
      console.error('[sync] σφάλμα:', err.message)
    }
  }
  runSync()
  syncTimer = setInterval(runSync, config.sync.intervalMs)
  syncTimer.unref?.()

  return function stopScheduler() {
    if (tickTimer) clearInterval(tickTimer)
    if (syncTimer) clearInterval(syncTimer)
    tickTimer = syncTimer = null
  }
}
