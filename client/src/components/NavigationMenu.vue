<template>
  <div>
    <v-bottom-nav :active="active" app class="app-navigation" v-model="value">
      <v-btn color="black" flat to="/settings">
        <span>{{ $t('settings') }}</span>
        <v-icon>mdi-settings</v-icon>
      </v-btn>
      <v-btn @click="logoutUser" flat>
        <span>{{ $t('logout') }}</span>
        <v-icon>mdi-logout-variant</v-icon>
      </v-btn>
    </v-bottom-nav>
  </div>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['apiUrl', 'session']),
    active () {
      return {
        settings: 0 // Currently active button
        // ...other pages with navigation menu
      }[this.$route.name]
    },
    value () {
      // Do not show NavigationMenu if no button is active
      return typeof this.active === 'number'
    }
  },
  methods: {
    ...mapActions(['logout']),
    logoutUser () {
      this.logout().then(status => {
        // Logout user even if access token expired
        this.$router.push('login')
        this.$emit('snackbar-note', status + '.logout')
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
