<template>
  <v-layout justify-center row wrap>
    <v-flex md4 xs12>
      <h3 class="grey--text mb-3 text--darken-3 title">{{ $t('general') }}</h3>
      <v-layout align-center class="mb-5" row wrap>
        <v-flex xs6>
          <v-subheader class="pa-0">{{ $t('language') }}</v-subheader>
        </v-flex>
        <v-flex class="text-xs-right" xs6>
          <LanguageSwitcher/>
        </v-flex>
      </v-layout>
      <h3 class="grey--text mb-3 text--darken-3 title">{{ $t('security') }}</h3>
      <v-layout align-center class="mb-5" row wrap>
        <v-flex xs12>
          <v-checkbox :label="$t('enable2fa')" @change="check2fa" color="darken-1 grey"
            v-model="se2faChecked"/>
        </v-flex>
        <v-flex xs12 v-show="show2fa">
          <v-text-field :disabled="adamantAddress.disabled" :label="$t('enterAdamantAddress')"
            :rules="adamantAddressRules" @input="validateAdamantAddress" browser-autocomplete="on"
            class="text-xs-center" maxlength="23" v-model="adamantAddress.value"/>
          <v-btn @click="updateAdamantAddress" :disabled="!adamantAddress.valid"
            v-t="'get2faCode'"/>
          <i18n for="inner" path="redirectAdamant.outer" tag="p">
            <a href="https://msg.adamant.im/" target="_blank" v-t="'redirectAdamant.inner'"></a>
          </i18n>
          <div v-show="show2faHotp">
            <v-text-field :disabled="hotp.disabled" :label="$t('enter2faCode')" :rules="hotpRules"
              @input="validateHotp" browser-autocomplete="on" class="text-xs-center"
              maxlength="6" v-model="hotp.value"/>
            <v-btn :disabled="!hotp.valid" @click="verifyHotp" v-t="'verify'"/>
          </div>
        </v-flex>
      </v-layout>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default {
  components: { LanguageSwitcher },
  computed: {
    ...mapState(['account']),
    adamantAddressRules () {
      // Translate validation messages on i18n locale change
      return [this.$i18n.t(this.adamantAddress.note) || true]
    },
    hotpRules () {
      // Translate validation messages on i18n locale change
      return [this.$i18n.t(this.hotp.note) || true]
    }
  },
  data () {
    return {
      adamantAddress: {
        disabled: false,
        note: '',
        valid: false,
        value: null
      },
      hotp: {
        disabled: false,
        note: '',
        valid: false,
        value: null
      },
      hotpError: { count: 2, value: null },
      se2faChecked: false,
      show2fa: false,
      show2faHotp: false
    }
  },
  methods: {
    ...mapActions(['disable2fa', 'enable2fa', 'postAdamantAddress']),
    check2fa (checked) {
      this.show2fa = checked
      if (checked) {
        this.show2faHotp = false
        this.adamantAddress.disabled = false
      } else if (this.account.se2faEnabled) {
        this.disable2fa().then(status => {
          this.$emit('snackbar-note', '2faDisabled')
        })
      }
    },
    updateAdamantAddress () {
      this.adamantAddress.disabled = true
      this.postAdamantAddress(this.adamantAddress.value).then(({ data, status }) => {
        if (status === 200) {
          this.hotpError.count = 2
          if (data.success) {
            this.show2faHotp = true
            this.$emit('snackbar-note', {
              args: { id: data.transactionId },
              path: '2faSent'
            })
          } else {
            this.$emit('snackbar-note', '422.adamantAddress')
            this.adamantAddress.disabled = false
          }
        } else {
          this.$emit('snackbar-note', status + '.adamantAddress')
          this.adamantAddress.disabled = false
        }
      })
    },
    validateAdamantAddress (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'required.adamantAddress'; break
        case /^U\d+$/.test(value): state = 'patternMismatch.adamantAddress'; break
        case value && value.length > 6: state = 'tooShort.adamantAddress'
      }
      this.adamantAddress.note = state
      this.adamantAddress.valid = !state
    },
    validateHotp (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'required.hotp'; break
        case /^\d+$/.test(value): state = 'patternMismatch.hotp'; break
        case value && value.length > 5: state = 'tooShort.hotp'
      }
      this.hotp.note = state
      this.hotp.valid = !state
    },
    verifyHotp () {
      this.hotp.disabled = true
      this.enable2fa(this.hotp.value).then(({ data, status }) => {
        if (status === 200) {
          if (data.verified) {
            this.$emit('snackbar-note', '2faEnabled')
            this.hotpError.count = 2
            this.show2fa = false
          } else {
            this.hotp.disabled = false
            if (this.hotpError.value !== this.hotp.value) {
              this.hotpError.count = 2
              this.hotpError.value = this.hotp.value
              this.$emit('snackbar-note', {
                choice: this.hotpError.count,
                path: '2faNotValid'
              })
            } else {
              if (this.hotpError.count < 1) {
                this.show2fa = false
                this.show2faHotp = false
                this.adamantAddress.disabled = false
                this.hotp.value = null
                this.se2faChecked = false
              } else {
                this.$emit('snackbar-note', {
                  choice: this.hotpError.count,
                  path: '2faNotValid'
                })
              }
            }
            this.hotpError.count--
          }
        }
      })
    }
  },
  mounted () {
    if (this.account.se2faEnabled) this.se2faChecked = true
    this.adamantAddress.value = this.account.adamantAddress
    this.validateAdamantAddress(this.adamantAddress.value)
  },
  // Does not trigger if browser URL was changed by user manually
  beforeRouteLeave (to, from, next) {
    const session = this.$store.state.session
    if (session.created) {
      // User goes back in browser history
      if (to.name === ('login' || 'signup' || 'verify')) {
        next(false)
      } else {
        next()
      }
    } else {
      // User logged out
      next()
    }
  }
}
</script>

<style scoped>

</style>
