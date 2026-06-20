import http from 'node:http'
import { createRouter } from './router.js'
import { registerRoutes } from './routes.js'
import { registerAdminRoutes } from './admin.js'
import { registerAuthRoutes } from './authRoutes.js'
import { setCors, securityHeaders, notFound, serverError, badRequest } from './respond.js'

const MAX_BODY = 1_000_000 // 1MB όριο σώματος αιτήματος

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('payload_too_large'))
        req.destroy()
        return
      }
      data += chunk
    })
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export function createServer() {
  const router = createRouter()
  registerRoutes(router)
  registerAuthRoutes(router)
  registerAdminRoutes(router)

  return http.createServer(async (req, res) => {
    try {
      // Προπτήση CORS.
      if (req.method === 'OPTIONS') {
        setCors(res)
        securityHeaders(res)
        res.statusCode = 204
        return res.end()
      }

      const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`)
      const route = router.match(req.method, url.pathname)
      if (!route) return notFound(res, 'route_not_found')

      const query = Object.fromEntries(url.searchParams.entries())
      let body
      if (req.method === 'POST') {
        const raw = await readBody(req)
        if (raw) {
          try {
            body = JSON.parse(raw)
          } catch {
            return badRequest(res, 'invalid_json')
          }
        }
      }

      req.params = route.params
      req.query = query
      req.body = body
      await route.handler(req, res)
    } catch (err) {
      console.error('[http] σφάλμα:', err)
      if (!res.headersSent) serverError(res, err.message ?? err)
    }
  })
}
