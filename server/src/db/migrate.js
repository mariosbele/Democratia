// Εφαρμογή του σχήματος στη βάση. Χρήση: `npm run migrate`.
import { getDb, closeDb } from './index.js'
import { config } from '../config.js'

getDb() // η getDb() εφαρμόζει αυτόματα το σχήμα
console.log(`[migrate] Το σχήμα εφαρμόστηκε στη βάση: ${config.dbPath}`)
closeDb()
