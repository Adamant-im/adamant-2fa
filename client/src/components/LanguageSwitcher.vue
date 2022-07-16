<template>
  <v-layout justify-end>
    <v-flex>
      <v-select
        v-model="value"
        :items="items"
        :label="value"
        background-color="transparent"
        flat
        item-text="language"
        item-value="locale"
        hide-details
        solo
      />
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from 'vuex'

export default {
  computed: {
    ...mapState(['session']),
    value: {
      get () {
        return this.$i18n.messages[this.$i18n.locale].name
      },
      set (value) {
        this.$i18n.locale = value
        if (this.session.created) {
          this.postLocale(value)
        }
      }
    }
  },
  data () {
    return {
      items: Object.keys(this.$i18n.messages).map(value => ({
        language: this.$i18n.messages[value].name,
        locale: value
      }))
    }
  },
  methods: {
    ...mapActions(['postLocale'])
  },
  watch: {
    value: {
      handler () {
        // Since the root Vue instance initialized in <body>, Vue do not have access to <head>
        document.title = this.$i18n.t('documentTitle')
      },
      immediate: true
    }
  }
}
</script>

<style lang="stylus" scoped>
.flex
  max-width 120px
  padding-right 1.1rem
>>> .v-select
  color rgba(0, 0, 0, .54)
  transform translateX(40%)
  :hover
    color #000
  .v-icon
    color inherit
    transform translateX(-330%) rotateZ(270deg) !important
</style>
