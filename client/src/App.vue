<template>
  <v-app class="application--linear-gradient">
    <v-content>
      <v-container fill-height fluid>
        <router-view @snackbar-note="showSnackbarNote"/>
      </v-container>
    </v-content>
    <NavigationMenu @snackbar-note="showSnackbarNote"/>
    <SnackbarNote :options="snackbarNote"/>
  </v-app>
</template>

<script>
import { mapActions, mapGetters, mapMutations, mapState } from 'vuex'
import NavigationMenu from '@/components/NavigationMenu'
import SnackbarNote from '@/components/SnackbarNote'

export default {
  components: { NavigationMenu, SnackbarNote },
  computed: {
    ...mapGetters(['sessionTimeLeft']),
    ...mapState(['account'])
  },
  created () {
    if (this.sessionTimeLeft < 0) {
      this.logout().then(status => {
        // Clear expired session even if backend not available
        if (status !== 204) {
          this.clearSession()
        }
        this.$router.push('login')
        this.$emit('snackbar-note', status + '.logout')
      })
    }
  },
  data () {
    return {
      snackbarNote: null
    }
  },
  methods: {
    ...mapActions(['logout']),
    ...mapMutations(['clearSession']),
    showSnackbarNote (note) {
      // Object wrap adds reactivity to prop and triggers SnackbarNote component update
      this.snackbarNote = { note }
    }
  },
  mounted () {
    this.$i18n.locale = this.account.locale || this.$i18n.fallbackLocale
  }
}
</script>

<style scoped>
.application--linear-gradient {
  background: repeating-linear-gradient(
    140deg,
    #f6f6f6,
    #f6f6f6 1px,
    #fefefe 0,
    #fefefe 5px
  ) !important;
}
</style>
