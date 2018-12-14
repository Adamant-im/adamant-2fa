<template>
  <v-snackbar :timeout="timeout" top v-model="value">
    {{ $t(this.path, this.args) }}
  </v-snackbar>
</template>

<script>
export default {
  data () {
    return {
      args: null,
      path: 'empty',
      timeout: 3e3,
      value: false
    }
  },
  props: ['options'],
  watch: {
    options () {
      if (this.options) {
        this.value = true // Resets to false after timeout
        if (typeof this.options.note === 'string') {
          // i18n string syntax
          this.args = null
          this.path = this.options.note
        } else {
          // i18n object syntax
          this.args = this.options.note.args
          this.path = this.options.note.path
        }
      }
    }
  }
}
</script>
