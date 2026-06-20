import { getDb } from '../db/index.js'

export function upsertSociety({ id, name, level = null, syncSource = null, ordinal = 0 }) {
  getDb()
    .prepare(
      `INSERT INTO societies (id, name, level, sync_source, ordinal)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name,
         level = excluded.level,
         sync_source = excluded.sync_source,
         ordinal = excluded.ordinal`,
    )
    .run(id, name, level, syncSource, ordinal)
}

export function listSocieties() {
  return getDb().prepare('SELECT * FROM societies ORDER BY ordinal, name').all()
}

export function getSociety(id) {
  return getDb().prepare('SELECT * FROM societies WHERE id = ?').get(id)
}

// Επιστρέφει τις κοινωνίες που τροφοδοτεί ένας συγκεκριμένος adapter.
export function societiesForSource(syncSource) {
  return getDb().prepare('SELECT * FROM societies WHERE sync_source = ?').all(syncSource)
}
