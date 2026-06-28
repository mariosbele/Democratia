-- ────────────────────────────────────────────────────────────────────────────
-- Σχήμα βάσης δεδομένων της Democratia (SQLite).
--
-- Δύο είδη αποτελεσμάτων σε κάθε ψήφισμα:
--   1) Αποτελέσματα πλατφόρμας  → πώς ψήφισαν οι πολίτες στη Democratia (ανώνυμα,
--      ανακοινώνονται σε φάσεις).  Πίνακες: platform_votes, phases.
--   2) Επίσημο αποτέλεσμα        → πώς ψήφισε πραγματικά η Βουλή / το Ευρωκοινοβούλιο.
--      Αντλείται αυτόματα από τις πηγές ανοιχτών δεδομένων.  Πίνακας: official_results.
-- ────────────────────────────────────────────────────────────────────────────

PRAGMA foreign_keys = ON;

-- Επίπεδα διακυβέρνησης: Δήμος (Αθήνα), Βουλή (Ελλάδα), Ευρωκοινοβούλιο (ΕΕ).
CREATE TABLE IF NOT EXISTS societies (
  id          TEXT PRIMARY KEY,           -- 'athens' | 'greece' | 'eu'
  name        TEXT NOT NULL,
  level       TEXT,                        -- 'Δήμος' | 'Βουλή' | 'Ευρωκοινοβούλιο'
  sync_source TEXT,                        -- ποιος adapter τροφοδοτεί: NULL | 'hellenic' | 'europarl'
  ordinal     INTEGER DEFAULT 0
);

-- Ψηφίσματα (νομοσχέδια / κανονισμοί προς ψήφιση).
CREATE TABLE IF NOT EXISTS votings (
  id                   TEXT PRIMARY KEY,
  society_id           TEXT NOT NULL REFERENCES societies(id) ON DELETE CASCADE,
  category             TEXT,
  title                TEXT NOT NULL,
  source               TEXT NOT NULL DEFAULT 'manual',  -- 'seed' | 'manual' | 'hellenic' | 'europarl'
  source_ref           TEXT,                            -- μοναδικό αναγνωριστικό στην πηγή (για dedupe)
  uploaded_at          TEXT,
  vote_deadline        TEXT,
  parliament_date      TEXT,
  status               TEXT NOT NULL DEFAULT 'open',     -- 'open' | 'closed'
  comments_enabled     INTEGER NOT NULL DEFAULT 1,
  summary_tldr         TEXT,
  summary_keypoints    TEXT,                             -- JSON array
  summary_impact       TEXT,
  summary_reading_time TEXT,
  reference_url        TEXT,                             -- σύνδεσμος στην επίσημη πηγή
  full_text            TEXT,                             -- πλήρες επίσημο κείμενο (αν διαθέσιμο)
  created_at           TEXT NOT NULL,
  updated_at           TEXT NOT NULL,
  UNIQUE (source, source_ref)
);

CREATE INDEX IF NOT EXISTS idx_votings_society ON votings(society_id);
CREATE INDEX IF NOT EXISTS idx_votings_status  ON votings(status);

-- Φάσεις ανακοίνωσης αποτελεσμάτων πλατφόρμας (έως 3 ανά ψήφισμα).
CREATE TABLE IF NOT EXISTS phases (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  voting_id TEXT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  ordinal   INTEGER NOT NULL,                 -- 1 | 2 | 3
  label     TEXT NOT NULL,
  date      TEXT,
  announced INTEGER NOT NULL DEFAULT 0,
  yes       INTEGER,                          -- snapshot αποτελεσμάτων πλατφόρμας κατά την ανακοίνωση
  no        INTEGER,
  present   INTEGER,
  UNIQUE (voting_id, ordinal)
);

-- «ΚΑΛΠΗ»: ανώνυμες ψήφοι πολιτών (τι ψηφίστηκε).
-- ΔΕΝ περιέχει κανένα αναγνωριστικό ψηφοφόρου — μόνο την επιλογή. Έτσι, ακόμη
-- και σε πλήρη διαρροή (βάση + μυστικά), η ψήφος ΔΕΝ μπορεί να συνδεθεί με
-- πρόσωπο. Το «ποιος ψήφισε» τηρείται χωριστά στον πίνακα vote_participation.
CREATE TABLE IF NOT EXISTS platform_votes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  voting_id  TEXT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  choice     TEXT NOT NULL CHECK (choice IN ('yes','no','present')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_votes_voting ON platform_votes(voting_id);

-- «ΕΚΛΟΓΙΚΟΣ ΚΑΤΑΛΟΓΟΣ»: ποιος ψήφισε (ΧΩΡΙΣ την επιλογή του).
-- Χρησιμεύει για: (α) «ένας ψηφοφόρος, μία ψήφος» ανά ψήφισμα, (β) να ξέρουμε
-- ΟΤΙ ψήφισε κάποιος (όπως στις εθνικές εκλογές), (γ) reports συμμετοχής.
-- account_id: ο συνδεδεμένος λογαριασμός (NULL για ανώνυμη ψήφο συσκευής ή μετά
-- από διαγραφή λογαριασμού — η συμμετοχή μένει μετρημένη, ο σύνδεσμος ταυτότητας φεύγει).
-- voter_hash: HMAC του αναγνωριστικού, μόνο για τον έλεγχο μοναδικότητας.
CREATE TABLE IF NOT EXISTS vote_participation (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  voting_id  TEXT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  account_id TEXT REFERENCES accounts(id) ON DELETE SET NULL,
  voter_hash TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (voting_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_participation_voting ON vote_participation(voting_id);
CREATE INDEX IF NOT EXISTS idx_participation_account ON vote_participation(account_id);

-- Επίσημο αποτέλεσμα από Βουλή / Ευρωκοινοβούλιο (αντλείται αυτόματα).
CREATE TABLE IF NOT EXISTS official_results (
  voting_id  TEXT PRIMARY KEY REFERENCES votings(id) ON DELETE CASCADE,
  yes        INTEGER,
  no         INTEGER,
  abstain    INTEGER,
  outcome    TEXT,            -- 'adopted' | 'rejected' | NULL
  decided_at TEXT,
  source     TEXT,
  source_url TEXT,
  fetched_at TEXT NOT NULL
);

-- Ιστορικό εκτελέσεων συγχρονισμού (για παρακολούθηση/diagnostics).
CREATE TABLE IF NOT EXISTS sync_runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  source      TEXT NOT NULL,
  started_at  TEXT NOT NULL,
  finished_at TEXT,
  status      TEXT NOT NULL DEFAULT 'running',  -- 'running' | 'ok' | 'error'
  fetched     INTEGER DEFAULT 0,
  upserted    INTEGER DEFAULT 0,
  error       TEXT
);

-- ── Κοινότητα (επώνυμα σχόλια, χρήστες, ειδοποιήσεις) ───────────────────────
CREATE TABLE IF NOT EXISTS people (
  id            TEXT PRIMARY KEY,
  full_name     TEXT NOT NULL,
  role          TEXT,
  is_politician INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS comments (
  id         TEXT PRIMARY KEY,
  voting_id  TEXT NOT NULL REFERENCES votings(id) ON DELETE CASCADE,
  author_id  TEXT NOT NULL REFERENCES people(id),
  text       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  likes      INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_comments_voting ON comments(voting_id);

CREATE TABLE IF NOT EXISTS notifications (
  id        TEXT PRIMARY KEY,
  voting_id TEXT REFERENCES votings(id) ON DELETE SET NULL,
  title     TEXT NOT NULL,
  subtitle  TEXT,
  type      TEXT,
  is_new    INTEGER NOT NULL DEFAULT 0,
  date      TEXT
);

-- ── Ταυτοποίηση & λογαριασμοί (ελαχιστοποίηση δεδομένων) ─────────────────────
-- ΑΠΟΘΗΚΕΥΟΥΜΕ ΤΑ ΕΛΑΧΙΣΤΑ: μη αναστρέψιμο hash του ΑΦΜ (για μοναδικότητα,
-- ΧΩΡΙΣ να κρατάμε τον ΑΦΜ), όνομα (απαιτείται για επώνυμα σχόλια), και αν έχει
-- επαληθευτεί η ηλικία. ΔΕΝ αποθηκεύονται: ΑΦΜ, κωδικοί, τηλέφωνο, ημ. γέννησης.
CREATE TABLE IF NOT EXISTS accounts (
  id           TEXT PRIMARY KEY,           -- εσωτερικό τυχαίο id
  afm_hash     TEXT NOT NULL UNIQUE,       -- HMAC(ΑΦΜ) — μοναδικότητα χωρίς PII
  full_name    TEXT NOT NULL,
  age_verified INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL,
  deleted_at   TEXT                        -- soft-delete (δικαίωμα διαγραφής)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,             -- αποθηκεύεται ΜΟΝΟ το hash του token
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_account ON sessions(account_id);

-- Αρχείο συγκαταθέσεων (GDPR — απόδειξη συναίνεσης σε όρους/πολιτική).
CREATE TABLE IF NOT EXISTS consents (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  policy     TEXT NOT NULL,                -- π.χ. 'terms' | 'privacy'
  version    TEXT NOT NULL,
  accepted   INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_consents_account ON consents(account_id);
