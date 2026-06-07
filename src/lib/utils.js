// Βοηθητικές συναρτήσεις

export function formatDate(iso) {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  if (!d) return iso
  return `${d}/${m}/${y}`
}

// Η τελευταία ανακοινωμένη φάση αποτελεσμάτων ενός ψηφίσματος
export function latestAnnouncedPhase(voting) {
  const announced = (voting.phases || []).filter((p) => p.announced && p.results)
  return announced.length ? announced[announced.length - 1] : null
}

// Υπολογισμός ποσοστών από counts {yes,no,present}
export function toPercentages(results) {
  const total = (results?.yes || 0) + (results?.no || 0) + (results?.present || 0)
  if (!total) return { yes: 0, no: 0, present: 0, total: 0 }
  return {
    yes: Math.round((results.yes / total) * 100),
    no: Math.round((results.no / total) * 100),
    present: Math.round((results.present / total) * 100),
    total,
  }
}

export const CHOICE_LABELS = {
  yes: 'ΝΑΙ',
  no: 'ΟΧΙ',
  present: 'ΠΑΡΩΝ',
}

export const CATEGORY_COLORS = {
  Οικονομία: 'bg-amber-100 text-amber-800',
  Περιβάλλον: 'bg-emerald-100 text-emerald-800',
  Πολιτισμός: 'bg-fuchsia-100 text-fuchsia-800',
  Παιδεία: 'bg-sky-100 text-sky-800',
  Υγεία: 'bg-rose-100 text-rose-800',
  Υποδομές: 'bg-slate-200 text-slate-700',
}
