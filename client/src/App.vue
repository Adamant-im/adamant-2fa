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
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'sessionTimeLeft'
    ])
  },
  data () {
    return this.$store.state // Change by commiting a mutation or dispatching an action only
  },
  methods: {
    logout () {
      this.axios.post(this.apiUrl + 'logout/?access_token=' + this.session.id)
        .then(res => {
          if (res.status === 204) {
            this.$store.commit('CLEAR_SESSION')
            this.$router.push('login')
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => console.error(err))
    }
  }
}
</script>

<style scoped>
.link {cursor: pointer; text-decoration: underline}
.note {color: lightgray}
</style>
