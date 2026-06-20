// ────────────────────────────────────────────────────────────────────────────
// Σκελετός scraper για τις ονομαστικές ψηφοφορίες της Βουλής των Ελλήνων.
//
// ⚠️ ΣΗΜΑΝΤΙΚΟ — ΔΙΑΒΑΣΕ ΜΕ:
//   • Η Βουλή ΔΕΝ έχει επίσημο API· τα δεδομένα δημοσιεύονται ως HTML/PDF.
//   • Αυτός ο κώδικας ΔΕΝ έχει δοκιμαστεί σε ζωντανό ιστότοπο (το περιβάλλον
//     ανάπτυξης δεν έχει πρόσβαση στο διαδίκτυο). Είναι ΣΚΕΛΕΤΟΣ: η λογική του
//     pipeline είναι έτοιμη & ελεγμένη, αλλά τα regex/selectors πρέπει να
//     ΠΡΟΣΑΡΜΟΣΤΟΥΝ στην πραγματική δομή της σελίδας όταν τρέξει με δίκτυο.
//   • Σεβάσου τους όρους χρήσης & το robots.txt του ιστότοπου. Λογικά διαστήματα
//     μεταξύ αιτημάτων· χωρίς υπερβολικό φόρτο.
//
// Έξοδος: αντικείμενο { items: [...] } στη μορφή feed που δέχεται ο adapter
// (server/src/services/sync/adapters/hellenic.js) και η σελίδα admin.
// ────────────────────────────────────────────────────────────────────────────

// 👉 ΠΡΟΣΑΡΜΟΣΕ ΑΥΤΟ στη δομή της πραγματικής σελίδας. Τα ονόματα ομάδων (named
// groups) πρέπει να παραμείνουν: url, title, date, yes, no, abstain.
export const DEFAULT_CONFIG = {
  // Πρότυπο για ΚΑΘΕ εγγραφή ψηφοφορίας μέσα στη σελίδα-λίστα.
  itemPattern:
    /<article[^>]*class="[^"]*vote[^"]*"[^>]*>[\s\S]*?<a[^>]*href="(?<url>[^"]+)"[^>]*>(?<title>[\s\S]*?)<\/a>[\s\S]*?<time[^>]*>(?<date>[^<]+)<\/time>[\s\S]*?class="yes"[^>]*>(?<yes>\d+)[\s\S]*?class="no"[^>]*>(?<no>\d+)[\s\S]*?class="abstain"[^>]*>(?<abstain>\d+)/g,
  baseUrl: 'https://www.hellenicparliament.gr',
}

function stripTags(s) {
  return String(s ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function toIsoDate(s) {
  const t = String(s ?? '').trim()
  // Υποστήριξη μορφής DD/MM/YYYY (συνηθισμένη σε ελληνικές σελίδες) και ISO.
  const m = t.match(/(\d{1,2})[\/.](\d{1,2})[\/.](\d{4})/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  const d = new Date(t)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

function absUrl(url, baseUrl) {
  if (!url) return null
  return /^https?:\/\//.test(url) ? url : baseUrl + (url.startsWith('/') ? '' : '/') + url
}

// Μετατρέπει το HTML μιας σελίδας-λίστας σε εγγραφές feed. Καθαρά συναρτησιακό
// (testable χωρίς δίκτυο).
export function parseRollCallList(html, config = DEFAULT_CONFIG) {
  const items = []
  for (const m of String(html ?? '').matchAll(config.itemPattern)) {
    const g = m.groups ?? {}
    const title = stripTags(g.title)
    if (!title) continue
    const url = absUrl(g.url, config.baseUrl)
    const decidedAt = toIsoDate(g.date)
    const yes = Number(g.yes)
    const no = Number(g.no)
    const abstain = Number(g.abstain ?? 0)
    items.push({
      id: 'hp-' + (url ? hash(url) : hash(title)),
      title,
      url,
      uploadedAt: decidedAt,
      voteDeadline: decidedAt,
      parliamentDate: decidedAt,
      result: Number.isFinite(yes)
        ? {
            yes,
            no,
            abstain: Number.isFinite(abstain) ? abstain : 0,
            outcome: yes > no ? 'adopted' : 'rejected',
            decidedAt,
          }
        : undefined,
    })
  }
  return items
}

// Απλό σταθερό hash για αναγνωριστικό (χωρίς εξαρτήσεις).
function hash(s) {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h).toString(36)
}

async function defaultFetchText(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'DemocratiaBot/0.1 (+civic prototype)' },
      signal: controller.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} για ${url}`)
    return await res.text()
  } finally {
    clearTimeout(timer)
  }
}

// Κατεβάζει & αναλύει μια σελίδα-λίστα ψηφοφοριών. Επιστρέφει { items }.
export async function scrapeHellenic({ indexUrl, fetchText = defaultFetchText, config = DEFAULT_CONFIG } = {}) {
  if (!indexUrl) throw new Error('Λείπει το indexUrl (η σελίδα-λίστα ψηφοφοριών της Βουλής).')
  const html = await fetchText(indexUrl)
  return { items: parseRollCallList(html, config) }
}
