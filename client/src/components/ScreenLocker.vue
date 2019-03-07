<template>
  <v-dialog content-class="elevation-0" v-model="value">
    <v-layout align-center column>
      <v-progress-circular color="#4A4A4A" indeterminate size="150" stroke="1" />
    </v-layout>
  </v-dialog>
</template>

<script>
export default {
  data () {
    return {
      value: false
    }
  },
  props: {
    show: { default: false, type: Boolean }
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
