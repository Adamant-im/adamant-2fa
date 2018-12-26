<template>
  <v-snackbar :timeout="timeout" top v-model="value">
    {{ note }}
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    note () {
      if (this.options) {
        if (typeof this.options.note === 'string') {
          // i18n string syntax
          return this.$i18n.t(this.options.note)
        } else {
          if (this.options.note.args) {
            // i18n object syntax
            return this.$i18n.t(this.options.note.path, this.options.note.args)
          } else {
            // i18n object syntax with pluralization
            return this.$i18n.tc(this.options.note.path, this.options.note.choice)
          }
        }
      }
    }
  },
  data () {
    return {
      timeout: 3e3,
      value: false
    }
  },
  props: ['options'],
  watch: {
    options () {
      if (this.options) {
        this.value = true // Resets to false after timeout
      }
    }
  }
}
</script>
