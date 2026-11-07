export default defineAppConfig({
  ui: {
    colors: {
      primary: 'amber',
      neutral: 'stone'
    },
    dashboardPanel: {
      // The panel body is a scrolling flex column; stop cards/alerts (overflow-hidden)
      // from shrinking to fit the viewport so long pages scroll instead of being clipped.
      slots: { body: '*:shrink-0' }
    }
  }
})
