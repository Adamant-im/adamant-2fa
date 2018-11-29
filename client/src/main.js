import axios from 'axios'
import Vue from 'vue'
import VueAxios from 'vue-axios'

import App from './App.vue'
import i18n from './i18n'
import router from './router'
import store from './store'
import './registerServiceWorker'

Vue.use(VueAxios, axios)

Vue.config.productionTip = false

new Vue({
  i18n,
  router,
  store,
  render: h => h(App)
}).$mount('#app')
