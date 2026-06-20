// Παραγωγή χρονοδιαγράμματος φάσεων ανακοίνωσης αποτελεσμάτων πλατφόρμας.
//
// Σύμφωνα με τις προδιαγραφές: έως 3 φάσεις, με την τελική ανακοίνωση μία ημέρα
// πριν την επίσημη κοινοβουλευτική ψηφοφορία. Οι ενδιάμεσες φάσεις κατανέμονται
// ομοιόμορφα μεταξύ της ανάρτησης (uploadedAt) και της προθεσμίας (voteDeadline).

const DAY = 24 * 60 * 60 * 1000
const iso = (d) => new Date(d).toISOString().slice(0, 10)

const LABELS = ['1η Ανακοίνωση', '2η Ανακοίνωση', 'Τελικά Αποτελέσματα']

export function buildPhaseSchedule({ uploadedAt, voteDeadline, count = 3 }) {
  const start = uploadedAt ? new Date(uploadedAt).getTime() : Date.now()
  const end = voteDeadline ? new Date(voteDeadline).getTime() : start + 14 * DAY
  const span = Math.max(DAY, end - start)
  const n = Math.min(3, Math.max(1, count))

  const phases = []
  for (let i = 0; i < n; i++) {
    // Η τελευταία φάση πέφτει στην προθεσμία· οι υπόλοιπες κατανέμονται πριν.
    const fraction = n === 1 ? 1 : i / (n - 1)
    const date = iso(start + span * fraction)
    phases.push({
      ordinal: i + 1,
      label: LABELS[i] ?? `Φάση ${i + 1}`,
      date,
      announced: false,
      results: null,
    })
  }
  return phases
}
