import Router from 'vue-router'
import Vue from 'vue'

import Login from '@/views/Login'
import Signup from '@/views/Signup'
import NotFound from '@/views/NotFound'
// import Settings from '@/views/Settings'
import Verify from '@/views/Verify'

import store from './store'

Vue.use(Router)

const router = new Router({
  base: process.env.BASE_URL,
  mode: 'history',
  routes: [
    {
      alias: '/',
      // Does not trigger if browser URL was changed by user manually
      beforeEnter: (to, from, next) => {
        const session = store.state.session
        if (session.created) {
          next(false)
        } else {
          next()
        }
      },
      component: Login,
      name: 'login',
      path: '/login'
    },
    {
      component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue'),
      // component: Settings,
      meta: { verification: true },
      name: 'settings',
      path: '/settings'
    },
    {
      // Does not trigger if browser URL was changed by user manually
      beforeEnter: (to, from, next) => {
        const session = store.state.session
        if (session.created) {
          next(false)
        } else {
          next()
        }
      },
      component: Signup,
      name: 'signup',
      path: '/signup'
    },
    {
      // Does not trigger if browser URL was changed by user manually
      beforeEnter: (to, from, next) => {
        const session = store.state.session
        if (session.verified) {
          next(false)
        } else {
          next()
        }
      },
      component: Verify,
      meta: { authentification: true },
      name: 'verify',
      path: '/verify'
    },
    {
      component: NotFound,
      name: 'notFound',
      path: '*'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authentification = to.matched.some(route => route.meta.authentification)
  const verification = to.matched.some(route => route.meta.verification)
  const account = store.state.account
  const session = store.state.session
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

export default router
