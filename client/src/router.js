import Vue from 'vue'
import Router from 'vue-router'
import Authentication from '@/views/Authentication.vue'

Vue.use(Router)

export default new Router({
  mode: 'history',
  base: process.env.BASE_URL,
  routes: [
    {
      path: '/settings',
      name: 'settings',
      // route level code-splitting
      // this generates a separate chunk (about.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import(/* webpackChunkName: "about" */ './views/Settings.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: Authentication
    },
    {
      path: '/signup',
      name: 'signup',
      component: Authentication
    }
  ]
})
