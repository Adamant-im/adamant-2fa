<template>
  <div>
    <v-bottom-nav :active="active" app class="app-navigation" v-model="value">
      <v-btn color="black" flat to="/settings">
        <span>{{ $t('settings') }}</span>
        <v-icon>mdi-settings</v-icon>
      </v-btn>
      <v-btn @click="logout" flat>
        <span>{{ $t('logout') }}</span>
        <v-icon>mdi-logout-variant</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters(['apiUrl', 'session']),
    active () {
      return {
        settings: 0 // Currently active button
        // ...other pages with navigation menu
      }[this.$route.name]
    },
    value () {
      return typeof this.active === 'number'
    }
  },
  methods: {
    ...mapMutations(['CLEAR_SESSION']),
    logout () {
      this.axios.post(this.apiUrl + 'logout/?access_token=' + this.session.id)
        .then(res => {
          if (res.status === 204) {
            this.CLEAR_SESSION()
            this.$router.push('login')
            this.$emit('snackbar-note', res.status + '.logout')
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          if (err.status === 401) { // Access token expired
            this.CLEAR_SESSION()
            this.$router.push('login')
          }
        })
    }
  }
}
</script>

<style scoped>
/**
 * Disable grayscale filter.
 */
.app-navigation >>> .v-btn:not(.v-btn--active) {
  filter: unset
}
</style>
