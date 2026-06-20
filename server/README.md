# Democratia — Backend 🗳️⚙️

Backend για την **αυτόματη διασύνδεση ψηφισμάτων με τη Βουλή & το Ευρωκοινοβούλιο**
και την παρακολούθηση των **αποτελεσμάτων** τους (επίσημα + αποτελέσματα πλατφόρμας).

Γραμμένο **χωρίς εξωτερικά dependencies** — μόνο με ενσωματωμένα modules του Node.js
(`node:http`, `node:sqlite`, `fetch`, `node:crypto`, `node:test`). Δεν χρειάζεται
`npm install`, τρέχει οπουδήποτε υπάρχει Node ≥ 22.5.

---

## 🚀 Γρήγορη εκκίνηση

```bash
cd server
npm start              # http://localhost:8080  (seed αν η βάση είναι άδεια)
curl http://localhost:8080/api/health
```

Άλλες εντολές:

```bash
npm run dev            # με auto-reload (node --watch)
npm run migrate        # εφαρμογή σχήματος
npm run seed           # (επανα)φόρτωση δεδομένων πρωτοτύπου
npm run sync           # χειροκίνητος συγχρονισμός όλων των πηγών
npm run sync -- europarl   # συγχρονισμός μόνο Ευρωκοινοβουλίου
npm test               # σουίτα δοκιμών (node:test)
```

---

## 🧠 Πώς δουλεύει

Κάθε ψήφισμα έχει **δύο ειδών αποτελέσματα**:

1. **Αποτελέσματα πλατφόρμας** — πώς ψήφισαν οι πολίτες στη Democratia
   (ανώνυμα & αμετάκλητα), με ανακοίνωση σε **έως 3 φάσεις**.
2. **Επίσημο αποτέλεσμα** — πώς ψήφισε πραγματικά η **Βουλή** / το
   **Ευρωκοινοβούλιο**. Αντλείται **αυτόματα** από τις πηγές ανοιχτών δεδομένων.

### Αρχιτεκτονική

```
src/
  config.js                 ρυθμίσεις (env με defaults)
  db/                       SQLite (node:sqlite) + σχήμα
  models/                   data-access (societies, votings, results, ...)
  services/
    sync/
      index.js              orchestrator συγχρονισμού
      adapters/
        europarl.js         European Parliament Open Data API (v2)
        hellenic.js         Βουλή των Ελλήνων (ρυθμιζόμενο feed)
      normalize.js          κανονικοποίηση + εντοπισμός κατηγορίας
    scheduler.js            αυτόματη ανακοίνωση φάσεων + κλείσιμο + περιοδικός sync
    summary.js              «Σύνοψη AI» (ευρετικό· αντικαθίσταται από LLM)
    voterToken.js           ανωνυμοποίηση ψηφοφόρου (HMAC)
  serializers/voting.js     έξοδος στο σχήμα του frontend
  http/                     μικρός HTTP server/router + routes
  seed/seed.js              seed από το src/data/mockData.js (ενιαία πηγή)
  index.js                  entrypoint
```

### Adapters (επεκτάσιμο μοντέλο)

Κάθε κοινωνία ορίζει ποιος adapter την τροφοδοτεί (`societies.sync_source`):

| Κοινωνία | `sync_source` | Πηγή |
|----------|---------------|------|
| `athens` (Δήμος) | — | χειροκίνητα / seed |
| `greece` (Βουλή) | `hellenic` | feed Ελληνικού Κοινοβουλίου |
| `eu` (Ευρωκοινοβούλιο) | `europarl` | EP Open Data API v2 |

Ο orchestrator κανονικοποιεί κάθε εγγραφή, χτίζει σύνοψη AI, παράγει το
χρονοδιάγραμμα φάσεων, και αποθηκεύει το επίσημο αποτέλεσμα — κάνοντας **dedupe**
με βάση `(source, source_ref)` ώστε επαναλαμβανόμενοι συγχρονισμοί να ενημερώνουν
αντί να διπλασιάζουν.

---

## 🌐 Πηγές δεδομένων

### Ευρωκοινοβούλιο — European Parliament Open Data API (v2)

Δημόσιο, δομημένο (JSON-LD). Χρησιμοποιούνται:

- `GET {base}/meetings?year=YYYY` — ολομέλειες
- `GET {base}/meetings/{id}/vote-results` — αποτελέσματα ψηφοφοριών
  (ΥΠΕΡ/ΚΑΤΑ/ΑΠΟΧΗ → `yes`/`no`/`abstain`)

Ρύθμιση: `EUROPARL_API_BASE` (default `https://data.europarl.europa.eu/api/v2`).
Τεκμηρίωση: <https://data.europarl.europa.eu/en/developer-corner/opendata-api>

### Βουλή των Ελλήνων — ρυθμιζόμενο feed

⚠️ Η Βουλή **δεν** δημοσιεύει σταθερό δημόσιο API ονομαστικών ψηφοφοριών σε JSON.
Γι' αυτό ο adapter διαβάζει από ένα **feed που ορίζεις** (`HELLENIC_FEED_URL`) —
π.χ. έξοδο ενός scraper ή dataset του `data.gov.gr` μετασχηματισμένο στη μορφή:

```json
{
  "items": [
    {
      "id": "nomos-2024-12",
      "title": "Νομοσχέδιο ...",
      "category": "Οικονομία",
      "uploadedAt": "2024-01-05",
      "voteDeadline": "2024-01-20",
      "parliamentDate": "2024-01-21",
      "url": "https://www.hellenicparliament.gr/...",
      "summary": "Σύντομη περιγραφή.",
      "fullText": "ΣΧΕΔΙΟ ΝΟΜΟΥ ...\n\nΆρθρο 1 — ...",
      "result": { "yes": 158, "no": 142, "abstain": 0, "outcome": "adopted", "decidedAt": "2024-01-21" }
    }
  ]
}
```

Τα `category`, `summary`, `fullText`, `result` είναι προαιρετικά (η κατηγορία
μαντεύεται από τον τίτλο, το `fullText` εμφανίζεται ως «Πλήρες κείμενο» στο
frontend, το αποτέλεσμα μπαίνει όταν γίνει διαθέσιμο).

> **Σημείωση δικτύου:** ο live συγχρονισμός απαιτεί εξερχόμενη δικτυακή πρόσβαση
> στις παραπάνω πηγές. Σε περιβάλλοντα με περιοριστική δικτυακή πολιτική
> (όπως το sandbox ανάπτυξης) ο συγχρονισμός αποτυγχάνει «ήπια» και η εφαρμογή
> συνεχίζει με τα seed δεδομένα.

---

## 🔌 HTTP API

| Method | Path | Περιγραφή |
|--------|------|-----------|
| GET | `/api/health` | Έλεγχος λειτουργίας |
| GET | `/api/societies` | Επίπεδα (Δήμος/Βουλή/Ευρωκοινοβούλιο) |
| GET | `/api/societies/:id/votings` | Ψηφίσματα ανά επίπεδο |
| GET | `/api/votings/:id` | Ένα ψήφισμα (με φάσεις & `official`) |
| GET | `/api/votings/:id/results` | Πλατφόρμα + επίσημο + φάσεις |
| POST | `/api/votings/:id/vote` | Ανώνυμη ψήφος `{ choice, voterToken }` |
| GET | `/api/votings/:id/has-voted?voterToken=…` | Έχει ψηφίσει; |
| GET | `/api/votings/:id/comments` | Επώνυμα σχόλια |
| POST | `/api/sync/run?source=all\|europarl\|hellenic` | Χειροκίνητος συγχρονισμός |
| GET | `/api/sync/status` | Ιστορικό συγχρονισμών |
| GET | `/api/bootstrap` | Όλα τα δεδομένα σε σχήμα συμβατό με το frontend |
| GET | `/admin` | Σελίδα διαχείρισης (καταχώρηση ψηφισμάτων) |
| POST | `/api/admin/votings` | Δημιουργία/ενημέρωση ψηφίσματος *(admin)* |
| DELETE | `/api/admin/votings/:id` | Διαγραφή ψηφίσματος *(admin)* |

### Διαχείριση (admin) — καταχώρηση δεδομένων Βουλής

Όρισε `ADMIN_TOKEN` και άνοιξε `https://<backend>/admin`. Η σελίδα ζητά τον
κωδικό και επιτρέπει προσθήκη/διαγραφή ψηφισμάτων + αποτελεσμάτων. Τα admin
endpoints απαιτούν κεφαλίδα `Authorization: Bearer <ADMIN_TOKEN>`. Αν δεν οριστεί
`ADMIN_TOKEN`, η διαχείριση είναι απενεργοποιημένη.

### Scraper Βουλής (προαιρετικό, σκελετός)

`npm run scrape:hellenic` — διαβάζει σελίδα ονομαστικών ψηφοφοριών της Βουλής και
παράγει feed JSON. ⚠️ Τα regex/selectors στο
`src/services/sync/scrapers/hellenicParliament.js` πρέπει να **προσαρμοστούν στη
δομή της πραγματικής σελίδας** (δεν δοκιμάστηκε live — χωρίς δίκτυο εδώ). Χρήση:

```bash
HP_INDEX_URL="https://www.hellenicparliament.gr/..." npm run scrape:hellenic > feed.json
# ή απευθείας αποστολή στο admin:
HP_INDEX_URL="..." ADMIN_API="https://<backend>" ADMIN_TOKEN="..." \
  node src/services/sync/scrapers/cli.js --post
```

### Ανωνυμία ψήφου

Ο client στέλνει ένα opaque `voterToken` (π.χ. τυχαίο id συσκευής). Ο server το
μετατρέπει σε **μη αναστρέψιμο HMAC** δεμένο με το ψήφισμα (`voterToken.js`):
δεν αποθηκεύεται κανένα προσωπικό στοιχείο, η ψήφος δεν συνδέεται με χρήστη, και
ένα `UNIQUE` constraint εγγυάται **μία ψήφο ανά χρήστη ανά ψήφισμα** (αμετάκλητη).

---

## 🔗 Σύνδεση με το frontend

Το `GET /api/bootstrap` επιστρέφει `societies`, `votings`, `comments`, `people`,
`notifications` στο ίδιο σχήμα με το `src/data/mockData.js`. Δες το έτοιμο
`src/lib/api.js` και τη μεταβλητή `VITE_API_URL` για σταδιακή μετάβαση από τα
mock δεδομένα στο API.

---

## ⚙️ Ρυθμίσεις

Δες το `.env.example`. Βασικές μεταβλητές: `PORT`, `DB_PATH`, `VOTER_SECRET`,
`CORS_ORIGIN`, `SYNC_SOURCES`, `SYNC_INTERVAL_MS`, `EUROPARL_API_BASE`,
`HELLENIC_FEED_URL`, `SCHEDULER_ENABLED`.

## ☁️ Deployment

Οδηγίες για Render / Railway / Docker (με ενεργό live συγχρονισμό) στο
[`DEPLOY.md`](./DEPLOY.md). Έτοιμα: `server/Dockerfile`, `render.yaml`,
`railway.json` (στη ρίζα του repo).
