<template>
  <v-snackbar :timeout="timeout" top v-model="value">
    {{ $t(this.path, this.args) }}
  </v-snackbar>
</template>

<script>
export default {
  computed: {
    args () {
      console.log(this.options)
      return typeof this.options === 'string' ? null : this.options.args
    },
    path () {
      console.log(this.options)
      return typeof this.options === 'string' ? this.options : this.options.path
    }
  },
  data () {
    console.log(this)
    return {
      timeout: 1500,
      value: true
    }
  },
  props: ['options']
}
</script>
