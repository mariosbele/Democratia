import { config } from '../../config.js'
import { societiesForSource } from '../../models/societies.js'
import { listPhases, upsertPhase, upsertVoting } from '../../models/votings.js'
import { upsertOfficialResult } from '../../models/results.js'
import { finishRun, startRun } from '../../models/syncRuns.js'
import { buildSummary } from '../summary.js'
import { buildPhaseSchedule } from '../phases.js'
import { europarlAdapter } from './adapters/europarl.js'
import { hellenicAdapter } from './adapters/hellenic.js'

const ADAPTERS = {
  europarl: europarlAdapter,
  hellenic: hellenicAdapter,
}

const todayIso = () => new Date().toISOString().slice(0, 10)

function computeStatus({ parliamentDate, voteDeadline, official }) {
  const horizon = voteDeadline ?? parliamentDate
  if (official && official.decidedAt && official.decidedAt <= todayIso()) return 'closed'
  if (horizon && horizon < todayIso()) return 'closed'
  return 'open'
}

// Συγχρονισμός μίας πηγής. Επιστρέφει { source, fetched, upserted, ok, error }.
export async function syncSource(sourceKey, { fetchJson, now } = {}) {
  const adapter = ADAPTERS[sourceKey]
  if (!adapter) throw new Error(`Άγνωστη πηγή συγχρονισμού: ${sourceKey}`)

  const runId = startRun(sourceKey)
  let fetched = 0
  let upserted = 0
  try {
    const societies = societiesForSource(sourceKey)
    if (societies.length === 0) {
      finishRun(runId, { status: 'ok', fetched: 0, upserted: 0 })
      return { source: sourceKey, fetched: 0, upserted: 0, ok: true, skipped: 'no_target_society' }
    }

    for (const society of societies) {
      const items = await adapter.fetch({
        society,
        base: config.sync.europarlBase,
        feedUrl: config.sync.hellenicFeed,
        lookbackDays: config.sync.lookbackDays,
        fetchJson,
        now,
      })
      fetched += items.length

      for (const item of items) {
        const summary = buildSummary({ title: item.title, text: item.summaryText })
        const status = computeStatus(item)

        const votingId = upsertVoting({
          id: `${item.source}:${item.sourceRef}`,
          societyId: item.societyId,
          category: item.category,
          title: item.title,
          source: item.source,
          sourceRef: item.sourceRef,
          uploadedAt: item.uploadedAt,
          voteDeadline: item.voteDeadline,
          parliamentDate: item.parliamentDate,
          status,
          commentsEnabled: true,
          summary,
          referenceUrl: item.referenceUrl,
          fullText: item.fullText ?? null,
        })

        // Δημιουργία φάσεων μόνο αν δεν υπάρχουν (ώστε να μη χαθούν ανακοινωμένες φάσεις).
        if (listPhases(votingId).length === 0) {
          for (const ph of buildPhaseSchedule({
            uploadedAt: item.uploadedAt,
            voteDeadline: item.voteDeadline,
          })) {
            upsertPhase(votingId, ph)
          }
        }

        if (item.official) upsertOfficialResult(votingId, item.official)
        upserted += 1
      }
    }

    finishRun(runId, { status: 'ok', fetched, upserted })
    return { source: sourceKey, fetched, upserted, ok: true }
  } catch (err) {
    finishRun(runId, { status: 'error', fetched, upserted, error: String(err.message ?? err) })
    return { source: sourceKey, fetched, upserted, ok: false, error: String(err.message ?? err) }
  }
}

// Συγχρονισμός όλων των ενεργοποιημένων πηγών (config.sync.sources).
export async function syncAll(opts = {}) {
  const results = []
  for (const source of config.sync.sources) {
    results.push(await syncSource(source, opts))
  }
  return results
}
