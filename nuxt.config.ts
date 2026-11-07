// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },
  modules: ['@nuxt/ui', 'nuxt-auth-utils'],
  css: ['~/assets/css/main.css'],
  colorMode: { preference: 'dark', fallback: 'dark' },
  app: {
    head: {
      title: 'Davecore BQ',
      meta: [{ name: 'description', content: 'Construction cost estimates, material quantities and professional Bills of Quantities for Kenya.' }]
    }
  },
  runtimeConfig: {
    public: {
      siteName: 'Davecore BQ'
    }
  },
  routeRules: {
    '/projects/**': { ssr: false },
    '/admin/**': { ssr: false }
  },
  typescript: { strict: true }
})
