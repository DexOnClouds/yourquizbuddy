module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {
      ignoreWarnings: true,
      ignoreValue: ['start'],
      flexbox: true,
      grid: true,
      overrideBrowserslist: ['last 2 versions', '> 1%', 'not dead'],
    },
  },
}
