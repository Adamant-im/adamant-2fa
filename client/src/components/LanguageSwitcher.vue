<template>
  <v-layout justify-end>
    <v-flex style="max-width: 96px">
      <v-select :items="items" :label="value" background-color="transparent" flat
        item-text="language" item-value="locale" hide-details solo v-model="value">
      </v-select>
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

<style>
.v-select .v-icon {
  left: 0;
  position: absolute;
  right: auto;
  transform: translateX(-100%) rotateZ(270deg) !important
}
</style>
