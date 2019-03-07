<template>
  <v-layout justify-center mt-5 row wrap>
    <v-flex lg6 md7 sm9 xl5 xs11>
      <h3 class="grey--text mb-3 text--darken-3 title" v-t="'general'" />
      <v-divider />
      <v-layout align-center class="mb-5" row wrap>
        <v-flex xs6>
          <v-subheader class="pa-0 subheading" v-t="'language'" />
        </v-flex>
        <LanguageSwitcher />
      </v-layout>
      <h3 class="grey--text mb-3 text--darken-3 title" v-t="'security'" />
      <v-divider />
      <v-layout align-start class="mb-5" column wrap>
        <v-flex lg7 md8 sm9 xl6 xs10>
          <v-checkbox :label="$t('enable2fa')" @change="check2fa" color="darken-1 grey"
            v-model="se2faChecked" />
        </v-flex>
        <v-flex lg7 md8 sm9 xl6 xs10 v-show="show2fa">
          <v-text-field :disabled="adamantAddress.disabled" :label="$t('enterAdamantAddress')"
            :rules="adamantAddressRules" @input="validateAdamantAddress"
            @keyup.enter="verifyAdamantAddress" browser-autocomplete="on" class="text-xs-center"
            maxlength="23" ref="adamantAddressField" v-model="adamantAddress.value" />
          <v-btn :disabled="!adamantAddress.valid" @click="submitAdamantAddress"
            v-t="'get2faCode'" />
          <i18n for="inner" path="redirectAdamant.outer" tag="p">
            <a class="grey--text text--darken-2" href="https://msg.adamant.im/" target="_blank"
              v-t="'redirectAdamant.inner'" />
          </i18n>
          <div v-show="show2faHotp">
            <v-text-field :disabled="hotp.disabled" :label="$t('enter2faCode')" :rules="hotpRules"
              @keyup.enter="verifyHotp" @input="validateHotp" browser-autocomplete="on"
              class="text-xs-center" maxlength="6" ref="hotpField" v-model="hotp.value" />
            <v-btn :disabled="!hotp.valid" @click="submitHotp" v-t="'verify'" />
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
      // return [this.$i18n.t(this.adamantAddress.note) || true]
      return [true]
    },
    hotpRules () {
      // Translate validation messages on i18n locale change
      // return [this.$i18n.t(this.hotp.note) || true]
      return [true]
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
        this.hotp.disabled = false
        this.hotp.value = null
        this.$nextTick(() => this.$refs.adamantAddressField.focus())
      } else if (this.account.se2faEnabled) {
        this.disable2fa().then(status => {
          this.$emit('snackbar-note', '2faDisabled')
          this.adamantAddress.value = ''
        })
      }
    },
    submitAdamantAddress () {
      this.adamantAddress.disabled = true
      this.postAdamantAddress(this.adamantAddress.value).then(({ data, status }) => {
        if (status === 200) {
          this.hotpError.count = 2
          this.show2faHotp = true
          this.$nextTick(() => this.$refs.hotpField.focus())
          this.$emit('snackbar-note', {
            args: { id: data.transactionId },
            path: '2faSentWithTx'
          })
        } else {
          this.$emit('snackbar-note', status + '.adamantAddress')
          this.adamantAddress.disabled = false
        }
      })
    },
    submitHotp () {
      this.hotp.disabled = true
      this.enable2fa(this.hotp.value).then(status => {
        if (status === 200) {
          if (this.account.se2faEnabled) {
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
    },
    validateAdamantAddress (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'valueMissing.adamantAddress'; break
        case /^U\d+$/.test(value): state = 'patternMismatch.adamantAddress'; break
        case value && value.length > 6: state = 'tooShort.adamantAddress'
      }
      this.adamantAddress.note = state
      this.adamantAddress.valid = !state
    },
    validateHotp (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'valueMissing.hotp'; break
        case /^\d+$/.test(value): state = 'patternMismatch.hotp'; break
        case value && value.length > 5: state = 'tooShort.hotp'
      }
      this.hotp.note = state
      this.hotp.valid = !state
    },
    verifyAdamantAddress () {
      this.validateAdamantAddress(this.adamantAddress.value)
      if (this.adamantAddress.valid) {
        this.submitAdamantAddress()
      } else {
        this.$emit('snackbar-note', this.adamantAddress.note)
      }
    },
    verifyHotp () {
      this.validateHotp(this.hotp.value)
      if (this.hotp.valid) {
        this.submitHotp()
      } else {
        this.$emit('snackbar-note', this.hotp.note)
      }
    }
  },
  mounted () {
    if (this.account.se2faEnabled) this.se2faChecked = true
    this.adamantAddress.value = this.account.adamantAddress
    this.validateAdamantAddress(this.adamantAddress.value)
  }
}
</script>

<style lang="stylus" scoped>
.v-divider
  border-width 0
  border-top 1px rgba(0, 0, 0, .12) solid
</style>
