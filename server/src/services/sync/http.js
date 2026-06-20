import { config } from '../../config.js'

// Βοηθός για κλήσεις JSON/JSON-LD με timeout. Χρησιμοποιεί το ενσωματωμένο
// global fetch του Node (>=18). Πετάει σφάλμα σε μη-2xx ή timeout.
export async function fetchJson(url, { headers = {}, timeoutMs = config.sync.httpTimeoutMs } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/ld+json, application/json', ...headers },
      signal: controller.signal,
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} για ${url}`)
    }
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}
