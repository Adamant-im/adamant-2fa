// const VuetifyLoaderPlugin = require('vuetify-loader/lib/plugin')

module.exports = {
  /* configureWebpack: {
    plugins: [
      new VuetifyLoaderPlugin()
    ]
  }, */
  pluginOptions: {
    i18n: {
      locale: 'ru',
      fallbackLocale: 'en',
      localeDir: 'locales',
      enableInSFC: true
    }
  }
}
