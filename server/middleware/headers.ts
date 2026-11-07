/**
 * Security headers for embedding and cross-origin use:
 *  - /embed/** pages may be framed by the admin-approved website origins (when embedding is on);
 *    all other pages may only be framed by this app itself.
 *  - /api/public/** answers CORS requests from the same approved origins.
 */
export default defineEventHandler(async (event) => {
  const path = event.path || ''
  if (path.startsWith('/_nuxt') || path.startsWith('/__nuxt')) return

  if (path.startsWith('/api/public/')) {
    const origin = getHeader(event, 'origin')
    if (origin) {
      const { origins } = await allowedOrigins()
      if (origins.includes(origin.toLowerCase())) {
        setHeaders(event, {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
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
  if (path.startsWith('/api/')) return

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
