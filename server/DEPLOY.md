# Deployment του backend της Democratia 🚀

Ο live συγχρονισμός με Βουλή/Ευρωκοινοβούλιο χρειάζεται **εξερχόμενη δικτυακή
πρόσβαση** — γι' αυτό το backend τρέχει σε πλατφόρμα cloud (όχι σε sandbox με
περιοριστική πολιτική δικτύου). Παρακάτω τρεις τρόποι· διάλεξε έναν.

> Το backend δεν έχει εξωτερικά dependencies (μόνο built-in modules του Node 22)
> και χρησιμοποιεί SQLite σε αρχείο. Για να μη χάνονται δεδομένα σε redeploy,
> χρειάζεται **persistent disk/volume**.

---

## Επιλογή Α — Render (το ευκολότερο, μέσω `render.yaml`)

1. Push το repo στο GitHub.
2. Στο [Render](https://render.com): **New → Blueprint** και επίλεξε το repo.
   Διαβάζει το `render.yaml` (στη ρίζα) και στήνει το service `democratia-api`.
3. Πάτα **Apply**. Το Render χτίζει το `server/Dockerfile` (με context τη ρίζα).
4. Μόλις ανέβει: `https://<service>.onrender.com/api/health` → `{"status":"ok"}`.

> Ο persistent disk (`/var/data`) απαιτεί πληρωμένο plan. Στο **free plan**:
> αφαίρεσε το μπλοκ `disk` και τη μεταβλητή `DB_PATH` από το `render.yaml` — η
> βάση γίνεται εφήμερη (ξαναγεμίζει από seed + συγχρονισμό σε κάθε deploy).

---

## Επιλογή Β — Railway

1. Στο [Railway](https://railway.app): **New Project → Deploy from GitHub repo**.
2. Διαβάζει το `railway.json` (στη ρίζα) και χτίζει το `server/Dockerfile`.
3. (Προαιρετικά για persistence) **Add Volume**, mount σε `/data`, και όρισε
   μεταβλητή `DB_PATH=/data/democratia.db`.
4. Επαλήθευση: `https://<service>.up.railway.app/api/health`.

---

## Επιλογή Γ — Docker σε οποιονδήποτε VPS

```bash
# build (context = ρίζα του repo, ώστε να μπει και το demo περιεχόμενο)
docker build -f server/Dockerfile -t democratia-server .

# run με persistent volume για τη βάση
docker run -d --name democratia \
  -p 8080:8080 \
  -v democratia-data:/data \
  -e VOTER_SECRET="$(openssl rand -hex 32)" \
  -e SYNC_SOURCES="europarl,hellenic" \
  -e HELLENIC_FEED_URL="" \
  democratia-server

curl http://localhost:8080/api/health
```

---

## Μεταβλητές περιβάλλοντος

| Μεταβλητή | Default | Περιγραφή |
|-----------|---------|-----------|
| `PORT` | `8080` | Θύρα (οι πλατφόρμες τη θέτουν αυτόματα) |
| `DB_PATH` | `./data/democratia.db` | Διαδρομή βάσης (σε persistent disk!) |
| `VOTER_SECRET` | — | **Όρισέ το** (τυχαίο, μακρύ) — HMAC ανωνυμίας ψήφου |
| `ADMIN_TOKEN` | — | Κωδικός σελίδας `/admin` (καταχώρηση Βουλής). Κενό = ανενεργό |
| `CORS_ORIGIN` | `*` | Origin του frontend (π.χ. `https://democratia.vercel.app`) |
| `SYNC_SOURCES` | `europarl,hellenic` | Ενεργές πηγές |
| `SYNC_INTERVAL_MS` | `21600000` | Συχνότητα συγχρονισμού (6 ώρες) |
| `HELLENIC_FEED_URL` | — | Feed Βουλής (δες `server/README.md`) |
| `SEED_ON_EMPTY` | `true` | Φόρτωση δεδομένων αν η βάση είναι άδεια |

---

## Σύνδεση του frontend (Vercel)

1. Στο Vercel project → **Settings → Environment Variables**:
   `VITE_API_URL = https://<το-backend-σου>` (χωρίς trailing slash).
2. **Redeploy** το frontend. Πλέον τραβά δεδομένα & ψηφίζει μέσω του API.
3. Για ασφάλεια, όρισε στο backend `CORS_ORIGIN` = το origin του Vercel.

Χωρίς το `VITE_API_URL`, το frontend συνεχίζει με τα mock δεδομένα (καμία αλλαγή).

---

## Ενεργοποίηση πηγών

- **Ευρωκοινοβούλιο**: δουλεύει αμέσως (δημόσιο EP Open Data API). Με δίκτυο, ο
  πρώτος συγχρονισμός τρέχει στην εκκίνηση και γεμίζει το επίπεδο «Ευρωπαϊκή Ένωση»
  με πραγματικά ψηφίσματα & αποτελέσματα.
- **Βουλή**: η Βουλή δεν έχει δημόσιο API ονομαστικών ψηφοφοριών. Όρισε
  `HELLENIC_FEED_URL` σε ένα feed (έξοδος scraper ή dataset) στη μορφή που
  περιγράφεται στο `server/README.md`.

---

## Επαλήθευση & χειρισμός

```bash
# υγεία
curl https://<backend>/api/health

# χειροκίνητος συγχρονισμός (αλλιώς τρέχει αυτόματα κάθε SYNC_INTERVAL_MS)
curl -X POST "https://<backend>/api/sync/run?source=all"

# κατάσταση συγχρονισμών
curl https://<backend>/api/sync/status

# πραγματικά ψηφίσματα Ευρωκοινοβουλίου
curl https://<backend>/api/societies/eu/votings
```

Μετά τον πρώτο επιτυχημένο συγχρονισμό, τα ψηφίσματα του επιπέδου ΕΕ θα δείχνουν
στην πραγματική επίσημη σελίδα της πηγής (το κουμπί «Πλήρες επίσημο κείμενο»).

## Καταχώρηση δεδομένων Βουλής

Όρισε `ADMIN_TOKEN` και άνοιξε `https://<backend>/admin` για να προσθέσεις
ψηφίσματα & αποτελέσματα της Βουλής με μια απλή φόρμα.

> Για βήμα-βήμα οδηγό στα ελληνικά (χωρίς ορολογία) δες το [`ΟΔΗΓΟΣ.md`](./ΟΔΗΓΟΣ.md).
