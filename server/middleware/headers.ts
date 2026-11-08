/**
 * Security headers for embedding and cross-origin use:
 *  - /embed/** pages may be framed by the admin-approved website origins (when embedding is on);
 *    all other pages may only be framed by this app itself.
 *  - /api/** answers CORS requests from the same approved origins (the company websites on
 *    GitHub Pages). Websites authenticate with bearer tokens, never cookies, so credentials are
 *    not allowed cross-site. Server-to-server integration endpoints need no CORS.
 */
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt')) return

  if (path.startsWith('/api/')) {
    if (path.startsWith('/api/integration/') || path.startsWith('/api/_auth/')) return
    const origin = getHeader(event, 'origin')
    if (origin) {
      const { origins } = await allowedOrigins()
      if (origins.includes(origin.toLowerCase())) {
        setHeaders(event, {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '600',
          'Vary': 'Origin'
        })
      }
    }
    if (event.method === 'OPTIONS') {
      setResponseStatus(event, 204)
      return ''
    }
    return
  }

  setHeader(event, 'X-Content-Type-Options', 'nosniff')
  setHeader(event, 'Referrer-Policy', 'strict-origin-when-cross-origin')
  if (path.startsWith('/embed')) {
    const { origins, embed } = await allowedOrigins()
    const ancestors = embed ? ["'self'", ...origins].join(' ') : "'self'"
    setHeader(event, 'Content-Security-Policy', `frame-ancestors ${ancestors}`)
  }
  else {
    setHeader(event, 'Content-Security-Policy', "frame-ancestors 'self'")
  }
})
