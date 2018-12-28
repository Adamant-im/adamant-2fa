import axios from 'axios'
import Vue from 'vue'
import VueAxios from 'vue-axios'

import './plugins/vuetify'
import './registerServiceWorker'
import App from './App.vue'
import i18n from './plugins/i18n'
import router from './router'
import store from './store'

Vue.use(VueAxios, axios)

Vue.config.productionTip = false

new Vue({
  components: { App },
  i18n,
  render: createElement => createElement(App),
  router,
  store,
  template: '<App/>'
}).$mount('#app')
