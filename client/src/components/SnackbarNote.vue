<template>
  <v-snackbar :timeout="timeout" bottom v-model="value">
    {{$t(this.text)}}
  </v-snackbar>
  <!--v-snackbar :timeout="timeout" bottom v-model="value" v-t="this.text"></v-snackbar-->
</template>

<script>
export default {
  data () {
    return {
      timeout: 1.5e9,
      value: true
    }
  },
  props: ['text']
}
</script>
