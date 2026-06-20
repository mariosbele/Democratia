// Κοινοί βοηθοί κανονικοποίησης δεδομένων από εξωτερικές πηγές.

import { CATEGORIES } from './categories.js'

// Εξάγει τιμή πολύγλωσσου πεδίου (JSON-LD). Δέχεται:
//   • string
//   • { el: '...', en: '...' }
//   • [ { '@language': 'el', '@value': '...' }, ... ]
export function pickLang(value, prefer = ['el', 'en']) {
  if (value == null) return null
  if (typeof value === 'string') return value
  if (Array.isArray(value)) {
    for (const lang of prefer) {
      const hit = value.find((v) => (v?.['@language'] ?? v?.language) === lang)
      if (hit) return hit['@value'] ?? hit.value ?? null
    }
    const first = value[0]
    return first?.['@value'] ?? first?.value ?? (typeof first === 'string' ? first : null)
  }
  if (typeof value === 'object') {
    for (const lang of prefer) if (value[lang]) return value[lang]
    const vals = Object.values(value)
    return vals.length ? String(vals[0]) : null
  }
  return null
}

export function num(v) {
  if (v == null) return null
  const n = Number(typeof v === 'object' ? (v['@value'] ?? v.value) : v)
  return Number.isFinite(n) ? n : null
}

export function toDateIso(v) {
  if (!v) return null
  const raw = typeof v === 'object' ? (v['@value'] ?? v.value) : v
  const d = new Date(raw)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

// Επιστρέφει τον πίνακα στοιχείων από απάντηση JSON-LD ή απλό JSON.
export function extractList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  return payload.data ?? payload['@graph'] ?? payload.results ?? payload.items ?? []
}

const CATEGORY_KEYWORDS = [
  ['Περιβάλλον', ['περιβάλλ', 'κλίμα', 'climate', 'environment', 'emission', 'εκπομπ', 'ενέργει', 'energy', 'CO2', 'CO₂', 'renewable', 'ΑΠΕ']],
  ['Οικονομία', ['οικονομ', 'φόρ', 'tax', 'budget', 'προϋπολογ', 'economic', 'finance', 'εισφορ', 'trade', 'εμπόρι']],
  ['Υγεία', ['υγεί', 'health', 'φάρμακ', 'medicine', 'pharma', 'νοσοκομ', 'pandemic']],
  ['Παιδεία', ['παιδεί', 'education', 'σχολ', 'school', 'πανεπιστ', 'university', 'research', 'έρευν']],
  ['Πολιτισμός', ['πολιτισμ', 'culture', 'τέχν', 'art', 'φεστιβάλ', 'heritage', 'τουρισ', 'tourism']],
  ['Υποδομές', ['υποδομ', 'infrastructure', 'μεταφορ', 'transport', 'digital', 'ψηφιακ', 'τεχνητή νοημοσύνη', 'artificial intelligence', 'AI']],
]

// Μαντεύει κατηγορία από τον τίτλο/κείμενο. Επιστρέφει μία από τις CATEGORIES.
export function guessCategory(text) {
  const t = String(text ?? '').toLowerCase()
  for (const [category, keywords] of CATEGORY_KEYWORDS) {
    if (keywords.some((k) => t.includes(k.toLowerCase()))) return category
  }
  return 'Υποδομές'
}

export { CATEGORIES }
