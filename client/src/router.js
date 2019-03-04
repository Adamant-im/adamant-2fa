import Router from 'vue-router'
import Vue from 'vue'

import Login from '@/views/Login'
import Signup from '@/views/Signup'
// import Settings from '@/views/Settings'
import Verify from '@/views/Verify'

import store from './store'

Vue.use(Router)

const router = new Router({
  base: process.env.BASE_URL,
  mode: 'history',
  routes: [
    {
      component: Login,
      name: 'login',
      path: '/login',
      props: true
    },
    {
      component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue'),
      // component: Settings,
      meta: { authorization: true },
      name: 'settings',
      path: '/settings'
    },
    {
      component: Signup,
      name: 'signup',
      path: '/signup'
    },
    {
      component: Verify,
      meta: { authentication: true },
      name: 'verify',
      path: '/verify'
    },
    {
      alias: '/signup',
      path: '*'
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authentication = to.matched.some(route => route.meta.authentication)
  const authorization = to.matched.some(route => route.meta.authorization)
  const account = store.state.account
  const session = store.state.session
  if (authorization) {
    // Authorization required - settings
    if (session.se2faVerified) {
      next()
    } else if (session.created && account.se2faEnabled) {
      next('/verify')
    } else if (session.lastSeen) {
      next('/login')
    } else {
      next('/signup')
    }
  } else if (authentication) {
    // Authentication required - settings, verify
    if (session.se2faVerified) {
      next('/settings')
    } else if (session.created && account.se2faEnabled) {
      next()
    } else if (session.lastSeen) {
      next('/login')
    } else {
      next('/signup')
    }
  } else if (to.name) {
    // No permission required
    if (session.se2faVerified) {
      next('/settings')
    } else if (session.created && account.se2faEnabled) {
      next('/verify')
    } else {
      next()
    }
  } else {
    // Path undefined
    if (session.se2faVerified) {
      next('/settings')
    } else if (session.created && account.se2faEnabled) {
      next('/verify')
    } else if (session.lastSeen) {
      next('/login')
    } else {
      next('/signup')
    }
  }
})

export default router
