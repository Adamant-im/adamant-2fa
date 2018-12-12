<template>
  <v-menu offset-y>
    <v-btn class="ma-0" flat slot="activator">
      {{localeName}}
      <v-icon right>mdi-chevron-down</v-icon>
    </v-btn>
    <v-list>
      <v-list-tile :key="locale" @click="update(locale)"
        v-for="(language, locale) in this.$i18n.messages">
        <v-list-tile-title>{{language.name}}</v-list-tile-title>
      </v-list-tile>
    </v-list>
  </v-menu>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters(['apiUrl', 'account', 'session']),
    localeName () {
      return this.$i18n.messages[this.$i18n.locale].name
    }
  },
  methods: {
    ...mapMutations(['UPDATE_ACCOUNT']),
    update (locale) {
      this.$i18n.locale = locale
      if (this.session.created) {
        this.axios.post(
          this.apiUrl + 'locale?access_token=' + this.session.id, {
            id: this.account.id,
            locale
          }
        )
          .then(res => {
            if (res.status === 200) {
              this.UPDATE_ACCOUNT({ locale: res.data.locale })
              console.info(res)
            } else console.warn(res)
          })
          .catch(err => console.error(err))
      }
    }
  },
  watch: {
    localeName: {
      handler () {
        // Since the root Vue instance initialized in <body>, Vue do not have access to <head>
        document.title = this.$i18n.t('documentTitle')
      },
      immediate: true
    }
  }
}
</script>
