// Ελάχιστος router για το node:http. Υποστηρίζει patterns με παραμέτρους (:id).
export function createRouter() {
  const routes = []

  function add(method, pattern, handler) {
    const keys = []
    const regex = new RegExp(
      '^' +
        pattern.replace(/:[^/]+/g, (m) => {
          keys.push(m.slice(1))
          return '([^/]+)'
        }) +
        '/?$',
    )
    routes.push({ method, regex, keys, handler })
  }

  function match(method, pathname) {
    for (const route of routes) {
      if (route.method !== method) continue
      const m = route.regex.exec(pathname)
      if (!m) continue
      const params = {}
      route.keys.forEach((k, i) => {
        params[k] = decodeURIComponent(m[i + 1])
      })
      return { handler: route.handler, params }
    }
    return null
  }

  return {
    get: (p, h) => add('GET', p, h),
    post: (p, h) => add('POST', p, h),
    del: (p, h) => add('DELETE', p, h),
    match,
  }
}
