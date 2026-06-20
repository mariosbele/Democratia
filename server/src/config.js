import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

function bool(v, def) {
  if (v == null) return def
  return v === '1' || v.toLowerCase() === 'true'
}

// Ρυθμίσεις μέσω μεταβλητών περιβάλλοντος, με λογικά defaults για πρωτότυπο.
export const config = {
  root,
  port: Number(process.env.PORT ?? 8080),
  dbPath: process.env.DB_PATH ?? path.join(root, 'data', 'democratia.db'),

  // Μυστικό για το HMAC ανωνυμοποίησης ψηφοφόρων. ΑΛΛΑΞΕ το σε production.
  voterSecret: process.env.VOTER_SECRET ?? 'dev-only-change-me',

  // Επιτρεπόμενο origin για CORS. '*' (default) ή π.χ. https://democratia.vercel.app
  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  // Μυστικό για τη σελίδα/endpoints διαχείρισης (admin). Αν είναι κενό, τα admin
  // endpoints είναι ΑΠΕΝΕΡΓΟΠΟΙΗΜΕΝΑ (ασφαλές default). Όρισέ το σε production.
  adminToken: process.env.ADMIN_TOKEN ?? '',

  isProduction: process.env.NODE_ENV === 'production',

  auth: {
    // Μυστικό για HMAC (hash ΑΦΜ/OTP) & υπογραφές. ΑΛΛΑΞΕ το σε production.
    secret: process.env.AUTH_SECRET ?? process.env.VOTER_SECRET ?? 'dev-only-change-me',
    sessionTtlMs: Number(process.env.SESSION_TTL_MS ?? 7 * 24 * 60 * 60 * 1000), // 7 ημέρες
    otpTtlMs: Number(process.env.OTP_TTL_MS ?? 5 * 60 * 1000), // 5 λεπτά
    otpMaxAttempts: Number(process.env.OTP_MAX_ATTEMPTS ?? 5),
    // Σε προσομοίωση επιστρέφουμε το OTP στην απόκριση (δεν στέλνουμε SMS).
    // Σε production όρισε SIMULATE_OTP=false και σύνδεσε πραγματικό πάροχο.
    simulateOtp: (process.env.SIMULATE_OTP ?? 'true') !== 'false',
  },

  // Τρέχουσα έκδοση όρων/πολιτικής (για το αρχείο συγκαταθέσεων GDPR).
  policyVersion: process.env.POLICY_VERSION ?? '2025-06-01',

  // Αν η βάση είναι άδεια κατά την εκκίνηση, φόρτωσε τα seed δεδομένα ώστε
  // η εφαρμογή να λειτουργεί ακόμη και χωρίς δικτυακή πρόσβαση στις πηγές.
  seedOnEmpty: bool(process.env.SEED_ON_EMPTY, true),

  sync: {
    // Ποιες πηγές θα συγχρονίζονται αυτόματα.
    sources: (process.env.SYNC_SOURCES ?? 'europarl,hellenic')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    intervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 6 * 60 * 60 * 1000), // 6 ώρες
    lookbackDays: Number(process.env.SYNC_LOOKBACK_DAYS ?? 120),
    // European Parliament Open Data API (v2).
    europarlBase: process.env.EUROPARL_API_BASE ?? 'https://data.europarl.europa.eu/api/v2',
    // Ελληνικό Κοινοβούλιο: δεν υπάρχει σταθερό δημόσιο API ονομαστικών ψηφοφοριών —
    // ορίζεται feed (π.χ. dataset data.gov.gr ή έξοδος scraper). Δες server/README.md.
    hellenicFeed: process.env.HELLENIC_FEED_URL ?? '',
    httpTimeoutMs: Number(process.env.SYNC_HTTP_TIMEOUT_MS ?? 20000),
  },

  scheduler: {
    enabled: bool(process.env.SCHEDULER_ENABLED, true),
    tickMs: Number(process.env.SCHEDULER_TICK_MS ?? 60 * 1000), // 1 λεπτό
  },
}
