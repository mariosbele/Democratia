// Παραγωγή «Σύνοψης AI» για ένα ψήφισμα.
//
// Προς το παρόν χρησιμοποιείται ένας ντετερμινιστικός ευρετικός αλγόριθμος που
// εξάγει TL;DR, βασικά σημεία και «τι σημαίνει για εσάς» από το κείμενο/τίτλο.
// Η συνάρτηση είναι σχεδιασμένη ώστε να αντικατασταθεί εύκολα από κλήση σε LLM
// (π.χ. Claude) — αρκεί να επιστρέφει το ίδιο σχήμα { tldr, keyPoints, impact, readingTime }.

const SENTENCE_SPLIT = /(?<=[.!;·])\s+/

function clean(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function sentences(text) {
  return clean(text)
    .split(SENTENCE_SPLIT)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

function readingTimeLabel(text) {
  const words = clean(text).split(' ').filter(Boolean).length
  const minutes = Math.max(1, Math.round(words / 200))
  return `${minutes} λεπτό ανάγνωσης · Σύνοψη από AI`
}

// Επιστρέφει αντικείμενο aiSummary. Αν δοθεί έτοιμη σύνοψη (π.χ. από seed), τη σέβεται.
export function buildSummary({ title, text = '', existing = null } = {}) {
  if (existing && existing.tldr) return existing

  const body = clean(text) || clean(title)
  const sents = sentences(body)

  const tldr = sents.slice(0, 2).join(' ') || clean(title)
  const keyPoints = sents.slice(0, 4)
  if (keyPoints.length === 0 && title) keyPoints.push(clean(title))

  const impact =
    'Αν εγκριθεί, η ρύθμιση θα επηρεάσει άμεσα τους πολίτες της κοινότητας — δείτε τα βασικά σημεία πριν ψηφίσετε.'

  return {
    tldr,
    keyPoints,
    impact,
    readingTime: readingTimeLabel(body),
  }
}
