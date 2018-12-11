<template>
  <v-bottom-nav :active.sync="active" :value="value" app class="app-navigation">
    <v-btn color="black" flat to="/settings">
      <span>{{ $t('settings') }}</span>
      <v-icon>mdi-settings</v-icon>
    </v-btn>
    <v-btn @click="logout" flat>
      <span>{{ $t('logout') }}</span>
      <v-icon>mdi-logout-variant</v-icon>
    </v-btn>
  </v-bottom-nav>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters(['apiUrl', 'session']),
    value () {
      return typeof this.props === 'number'
    }
  },
  data () {
    return {
      active: this.props
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
  },
  props: ['props']
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
