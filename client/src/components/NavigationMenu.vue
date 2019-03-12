<template>
  <v-bottom-nav :active="active" app class="app-navigation"
    v-model="value">
    <v-layout justify-center>
      <v-flex class="app-navigation__container text-xs-center" lg6 md7 sm9 xs12>
        <v-btn color="black" flat to="/settings">
          <span v-t="'settings'" />
          <v-icon>mdi-settings</v-icon>
        </v-btn>
        <v-btn @click="logoutUser" flat>
          <span v-t="'logout'" />
          <v-icon>mdi-logout-variant</v-icon>
        </v-btn>
      </v-flex>
    </v-layout>
  </v-bottom-nav>
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

<style lang="stylus" scoped>
.app-navigation
  background-color transparent !important
  box-shadow none
.app-navigation__container
  background-color #fff !important
  border-top 1px #D3D3D3 solid
.app-navigation >>> .v-btn:not(.v-btn--active)
  filter unset
</style>
