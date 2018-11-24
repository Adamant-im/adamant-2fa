<template>
  <div id="app">
    <ul id="nav">
      <li v-if="sessionTimeLeft < 0 || !sessionTimeLeft">
        <router-link to="/login">
          Login
        </router-link>
      </li>
      <li v-if="sessionTimeLeft > 0">
        <a @click="logout" class="link">
          Logout
        </a>
      </li>
      <li v-if="sessionTimeLeft > 0">
        <router-link to="/settings">
          Settings
        </router-link>
      </li>
      <li v-if="sessionTimeLeft < 0 || !sessionTimeLeft">
        <router-link to="/signup">
          Signup
        </router-link>
      </li>
    </ul>
    <router-view/>
    <span class="note">{{sessionTimeLeft / 1000 / 60}}</span>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import Authentication from '@/views/Authentication.vue'

export default {
  computed: {
    ...mapGetters([
      'apiUrl', 'session', 'sessionTimeLeft'
    ])
  },
  methods: {
    ...mapMutations([
      'CLEAR_SESSION'
    ]),
    logout: Authentication.methods.logout
  }
}
</script>

<style scoped>
.link {cursor: pointer; text-decoration: underline}
.note {color: lightgray}
</style>
