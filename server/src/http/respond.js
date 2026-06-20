import { config } from '../config.js'

// Κεφαλίδες ασφαλείας σε κάθε απόκριση.
export function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('X-XSS-Protection', '0')
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site')
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
}

// CORS (για χρήση του API από το frontend σε άλλο origin).
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', config.corsOrigin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token')
}

function base(res) {
  setCors(res)
  securityHeaders(res)
}

export function json(res, status, body) {
  base(res)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

export const ok = (res, body) => json(res, 200, body)
export const created = (res, body) => json(res, 201, body)
export const badRequest = (res, error) => json(res, 400, { error })
export const unauthorized = (res, error = 'unauthorized') => json(res, 401, { error })
export const forbidden = (res, error = 'forbidden') => json(res, 403, { error })
export const tooMany = (res, error = 'rate_limited') => json(res, 429, { error })
export const notFound = (res, error = 'not_found') => json(res, 404, { error })

// Σε production δεν διαρρέουμε εσωτερικά μηνύματα σφάλματος (διαφυλάσσει πληροφορίες).
export const serverError = (res, error) =>
  json(res, 500, { error: config.isProduction ? 'internal_error' : String(error) })

export function html(res, status, body) {
  base(res)
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'")
  res.end(body)
}
