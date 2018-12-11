import axios from 'axios'
import Vue from 'vue'
import VueAxios from 'vue-axios'

import './plugins/vuetify'
import './registerServiceWorker'
import App from './App.vue'
import i18n from './i18n'
import router from './router'
import store from './store'

Vue.use(VueAxios, axios)

Vue.config.productionTip = false

router.beforeEach((to, from, next) => {
  const authentification = to.matched.some(route => route.meta.authentification)
  const verification = to.matched.some(route => route.meta.verification)
  const account = store.getters.account
  const session = store.getters.session
  if (verification) {
    if (session.verified) {
      next()
    } else if (session.created && account.se2faEnabled) {
      next('/verify')
    } else {
      next('/login')
    }
  } else if (authentification) {
    if (session.created) {
      next()
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

new Vue({
  components: { App },
  i18n,
  render: createElement => createElement(App),
  router,
  store,
  template: '<App/>'
}).$mount('#app')
