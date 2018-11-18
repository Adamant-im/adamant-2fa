<template>
  <div id="app">
    <div id="nav">
      <router-link to="/login" v-if="sessionTimeLeft < 0 || !sessionTimeLeft">
        Login
      </router-link> |
      <a @click="logout" class="link" v-if="sessionTimeLeft > 0">
        Logout
      </a> |
      <router-link to="/settings" v-if="sessionTimeLeft > 0">
        Settings
      </router-link>
    </div>
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
