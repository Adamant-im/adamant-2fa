<template>
  <div>
    <component :is="'default'" class="application--linear-gradient">
      <router-view/>
    </component>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  data () {
    return {
      documentTitle: this.$i18n.t('documentTitle')
    }
  },
  methods: {
    ...mapMutations(['CLEAR_SESSION'])
  },
  created () {
    if (this.sessionTimeLeft < 0) {
      this.CLEAR_SESSION()
      this.$router.push('login')
    }
  },
  updated () {
    document.title = this.documentTitle
  }
}
</script>

<style scoped>
.application--linear-gradient {
  background: repeating-linear-gradient(
    140deg,
    #f6f6f6,
    #f6f6f6 1px,
    #fefefe 0,
    #fefefe 5px
  ) !important;
}
</style>
