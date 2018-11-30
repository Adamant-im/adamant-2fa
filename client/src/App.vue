<template>
  <div id="app">
    <div class="right">
      <select class="right" v-model="$i18n.locale">
        <option v-for="(lang, i) in ['ru', 'en']" :key="`Lang${i}`" :value="lang">
          {{ lang.toUpperCase() }}
        </option>
      </select>
      <div v-if="session.created && session.verified">{{account.username}}</div>
    </div>
    <ul id="nav">
      <li v-if="!session.created">
        <router-link to="/login" v-t="'login'"></router-link>
      </li>
      <li v-if="session.created">
        <a @click="logout" class="link" v-t="'logout'"></a>
      </li>
      <li v-if="session.created && session.verified">
        <router-link to="/settings" v-t="'settings'"></router-link>
      </li>
      <li v-if="!session.created">
        <router-link to="/signup" v-t="'signup'"></router-link>
      </li>
    </ul>
    <router-view/>
    <span class="note">{{(sessionTimeLeft / 1000 / 60) || ''}}</span>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import Authentication from '@/views/Authentication.vue'

export default {
  computed: {
    ...mapGetters([
      'account', 'apiUrl', 'session', 'sessionTimeLeft'
    ])
  },
  methods: {
    ...mapMutations([
      'CLEAR_SESSION'
    ]),
    logout: Authentication.methods.logout
  },
  created () {
    if (this.sessionTimeLeft < 0) {
      this.CLEAR_SESSION()
      this.$router.push('login')
    }
  }
}
</script>

<style scoped>
.link {cursor: pointer; text-decoration: underline}
.note {color: lightgray}
.right {float: right}
</style>
