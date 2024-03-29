<template>
  <v-layout
    class="root-container"
    justify-center
    mt-5
    row
    wrap
  >
    <v-flex
      lg6
      md7
      sm9
      xl5
      xs11
    >
      <h3
        v-t="'general'"
        class="grey--text mb-3 text--darken-3 title"
      />
      <v-divider />
      <v-layout
        align-center
        class="mb-5"
        row
        wrap
      >
        <v-flex xs6>
          <v-subheader
            v-t="'language'"
            class="pa-0"
          />
        </v-flex>
        <LanguageSwitcher />
      </v-layout>
      <h3
        v-t="'security'"
        class="grey--text mb-3 text--darken-3 title"
      />
      <v-divider />
      <v-layout
        align-start
        class="mb-5"
        column
        wrap
      >
        <v-flex
          lg7
          md8
          sm9
          xl6
          xs10
        >
          <v-checkbox
            v-model="se2faChecked"
            :label="$t('enable2fa')"
            color="darken-1 grey"
            @change="check2fa"
          />
        </v-flex>
        <v-flex
          v-show="show2fa"
          lg7
          md8
          sm9
          xl6
          xs10
        >
          <v-text-field
            ref="adamantAddressField"
            v-model="adamantAddress.value"
            :disabled="adamantAddress.disabled"
            :label="$t('enterAdamantAddress')"
            :rules="adamantAddressRules"
            browser-autocomplete="on"
            class="text-xs-center"
            color="rgba(0, 0, 0, 0.54)"
            hide-details
            maxlength="23"
            @input="validateAdamantAddress"
            @keyup.enter="verifyAdamantAddress"
          />
          <v-flex class="address-container">
            <v-btn
              v-t="'get2faCode'"
              :disabled="!adamantAddress.valid || adamantAddress.disabled"
              @click="submitAdamantAddress"
            />
            <i18n
              for="inner"
              path="redirectAdamant.outer"
              tag="p"
            >
              <a
                v-t="'redirectAdamant.inner'"
                class="grey--text text--darken-2"
                href="https://msg.adamant.im/"
                target="_blank"
              />
            </i18n>
          </v-flex>
          <div v-show="show2faHotp">
            <v-text-field
              ref="hotpField"
              v-model="hotp.value"
              :disabled="hotp.disabled"
              :label="$t('enter2faCode')"
              :rules="hotpRules"
              browser-autocomplete="on"
              class="text-xs-center"
              color="rgba(0, 0, 0, 0.54)"
              hide-details
              maxlength="6"
              @keyup.enter="verifyHotp"
              @input="validateHotp"
            />
            <v-btn
              v-t="'verify'"
              :disabled="!hotp.valid"
              class="verify-button"
              @click="submitHotp"
            />
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
          // this.adamantAddress.value = ''
          // this.validateAdamantAddress()
        })
      }
      this.adamantAddress.value = ''
      this.validateAdamantAddress()
    },
    submitAdamantAddress () {
      this.adamantAddress.disabled = true
      this.$emit('lock-screen')
      this.postAdamantAddress(this.adamantAddress.value).then(({ data, status }) => {
        if (status === 200) {
          this.hotpError.count = 2
          this.show2faHotp = true
          this.$emit('snackbar-note', {
            args: { id: data.transactionId },
            path: '2faSentWithTx'
          })
          this.$nextTick(() => this.$refs.hotpField.focus())
        } else {
          if (status === 900) {
            this.$emit('snackbar-note', `sentMessageErrors.${data?.error?.code}`)
          } else {
            this.$emit('snackbar-note', status + '.adamantAddress')
          }
          this.$nextTick(() => this.$refs.adamantAddressField.focus())
          this.adamantAddress.disabled = false
        }
        this.$emit('lock-screen', false)
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
            this.$nextTick(() => this.$refs.hotpField.focus())
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
        // this.$refs.adamantAddress.focus()
      }
    },
    verifyHotp () {
      this.validateHotp(this.hotp.value)
      if (this.hotp.valid) {
        this.submitHotp()
      } else {
        this.$emit('snackbar-note', this.hotp.note)
        // this.$refs.hotpField.focus()
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
.address-container
  display flex
  .v-btn
    margin-top 15px
  p
    padding 12px
    font-style italic
.root-container
  padding 0 1.5rem
.title
  caret-color #4A4A4A !important
  color #4A4A4A !important
.v-divider
  border-width 0
  border-top 1px rgba(0, 0, 0, .12) solid
.v-subheader
  color rgba(0, 0, 0, .87)
  font-size 16px
.verify-button
  margin-top 15px
>>> .v-input--checkbox .v-label
  color rgba(0, 0 ,0, .87)

@media (max-width: 415px)
  .address-container
    display block
    p
      padding 3px 10px
</style>
