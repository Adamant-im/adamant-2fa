<template>
  <v-app class="application--linear-gradient">
    <v-content>
      <router-view @lock-screen="lockScreen" @snackbar-note="showSnackbarNote" />
    </v-content>
    <NavigationMenu @snackbar-note="showSnackbarNote" />
    <ScreenLocker :show="screenLocker" />
    <SnackbarNote :options="snackbarNote" />
  </v-app>
</template>

<script>
import { mapActions, mapGetters, mapState } from 'vuex'
import NavigationMenu from '@/components/NavigationMenu'
import ScreenLocker from '@/components/ScreenLocker'
import SnackbarNote from '@/components/SnackbarNote'

export default {
  components: { NavigationMenu, ScreenLocker, SnackbarNote },
  computed: {
    ...mapGetters(['sessionTimeLeft']),
    ...mapState(['account'])
  },
  created () {
    if (this.sessionTimeLeft < 0) {
      this.logout().then(status => {
        this.$router.push('login')
        this.$emit('snackbar-note', status + '.logout')
      })
    }
  },
  data () {
    return {
      screenLocker: null,
      snackbarNote: null
    }
  },
  methods: {
    ...mapActions(['logout']),
    lockScreen (value) {
      this.screenLocker = value === undefined ? true : value
    },
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
