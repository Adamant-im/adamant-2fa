<template>
  <v-snackbar :timeout="timeout" top v-model="value">
    {{ $t(this.path, this.args) }}
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    args () {
      return typeof this.options === 'string' ? null : this.options.args
    },
    path () {
      return typeof this.options === 'string' ? this.options : this.options.path
    }
  },
  data () {
    return {
      timeout: 1500,
      value: true
    }
  },
  props: ['options']
}
</script>
