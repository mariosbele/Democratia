import { getDb } from '../db/index.js'

const nowIso = () => new Date().toISOString()

export function startRun(source) {
  const info = getDb()
    .prepare('INSERT INTO sync_runs (source, started_at, status) VALUES (?,?,?)')
    .run(source, nowIso(), 'running')
  return Number(info.lastInsertRowid)
}

export function finishRun(id, { status, fetched = 0, upserted = 0, error = null }) {
  getDb()
    .prepare(
      `UPDATE sync_runs SET finished_at = ?, status = ?, fetched = ?, upserted = ?, error = ?
       WHERE id = ?`,
    )
    .run(nowIso(), status, fetched, upserted, error, id)
}

export function recentRuns(limit = 20) {
  return getDb().prepare('SELECT * FROM sync_runs ORDER BY id DESC LIMIT ?').all(limit)
}
