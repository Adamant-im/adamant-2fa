import Router from 'vue-router'
import Vue from 'vue'

import Login from '@/views/Login'
import Signup from '@/views/Signup'
import NotFound from '@/views/NotFound'
import Verify from '@/views/Verify'

Vue.use(Router)

const router = new Router({
  base: process.env.BASE_URL,
  mode: 'history',
  routes: [
    {
      alias: '/',
      component: Login,
      name: 'login',
      path: '/login'
    },
    {
      component: () => import(/* webpackChunkName: "settings" */ '@/views/Settings.vue'),
      meta: { verification: true },
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

export default router
