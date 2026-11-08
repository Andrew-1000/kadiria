// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  colorMode: { preference: 'dark', fallback: 'dark' },
  app: {
    head: {
      title: 'Kadiria',
      meta: [{ name: 'description', content: 'Kadiria: construction cost estimates, material quantities and professional Bills of Quantities for Kenya.' }],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }]
    }
  },
  runtimeConfig: {
    public: {
      siteName: 'Kadiria'
    }
  },
  routeRules: {
    '/projects/**': { ssr: false },
    '/admin/**': { ssr: false }
  },
  typescript: { strict: true }
})
