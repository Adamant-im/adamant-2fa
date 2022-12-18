<template>
  <v-dialog
    v-model="value"
    content-class="elevation-0"
    persistent
  >
    <v-layout
      align-center
      column
    >
      <v-progress-circular
        color="#4A4A4A"
        indeterminate
        size="150"
        stroke="1"
      />
    </v-layout>
  </v-dialog>
</template>

<script>
export default {
  props: {
    show: { default: false, type: Boolean }
  },
  data () {
    return {
      value: false
    }
  },
  watch: {
    show () {
      this.value = this.show
    }
  }
}
</script>

<style lang="stylus" scoped>
>>> .v-dialog
  overflow-y hidden
</style>
