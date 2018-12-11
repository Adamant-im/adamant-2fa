<template>
  <v-app class="application--linear-gradient">
    <v-content>
      <v-container fill-height fluid>
        <router-view/>
      </v-container>
    </v-content>
    <NavigationMenu/>
  </v-app>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import NavigationMenu from '@/components/NavigationMenu'

export default {
  components: { NavigationMenu },
  computed: {
    ...mapGetters(['account', 'sessionTimeLeft'])
  },
  created () {
    if (this.sessionTimeLeft < 0) {
      this.CLEAR_SESSION()
      this.$router.push('login')
    }
  },
  methods: {
    ...mapMutations(['CLEAR_SESSION'])
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
