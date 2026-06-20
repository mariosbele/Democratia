// Απλός in-memory rate limiter (sliding window). Χωρίς εξαρτήσεις.
// Για ένα instance είναι αρκετός· σε πολλαπλά instances χρειάζεται κοινός store.
const buckets = new Map()

// Επιστρέφει true αν ΕΠΙΤΡΕΠΕΤΑΙ το αίτημα, false αν ξεπεράστηκε το όριο.
export function allow(key, { limit, windowMs }) {
  const now = Date.now()
  const arr = buckets.get(key) ?? []
  // Κράτα μόνο τα χτυπήματα μέσα στο παράθυρο.
  const recent = arr.filter((t) => now - t < windowMs)
  recent.push(now)
  buckets.set(key, recent)
  return recent.length <= limit
}

// Περιοδικός καθαρισμός παλιών κλειδιών (αποφυγή διαρροής μνήμης).
const cleanup = setInterval(() => {
  const now = Date.now()
  for (const [key, arr] of buckets) {
    const recent = arr.filter((t) => now - t < 60 * 60 * 1000)
    if (recent.length === 0) buckets.delete(key)
    else buckets.set(key, recent)
  }
}, 10 * 60 * 1000)
cleanup.unref?.()

export function resetRateLimits() {
  buckets.clear()
}
