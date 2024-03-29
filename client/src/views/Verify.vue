<template>
  <v-layout
    class="auth-page"
    fill-height
    justify-center
    row
  >
    <v-flex
      lg6
      md7
      sm9
      xl5
      xs11
    >
      <LanguageSwitcher />
      <v-card
        class="mt-3 text-xs-center"
        color="transparent"
        flat
      >
        <img
          class="logo"
          src="/img/icons/android-chrome-512x512.png"
        >
        <h1
          v-t="'headerTitle'"
          class="auth-page__title"
        />
      </v-card>
      <v-card
        class="mt-3 text-xs-center"
        color="transparent"
        flat
      >
        <v-layout justify-center>
          <v-flex
            lg7
            md8
            sm9
            xl6
            xs10
          >
            <v-form
              class="auth-form"
              @submit.prevent
            >
              <p v-html="$t('2faRequest', { address: account.adamantAddress.slice(-4) })" />
              <v-text-field
                ref="hotpField"
                v-model="hotp.value"
                :disabled="hotp.disabled"
                :label="$t('2faCode')"
                :rules="hotpRules"
                class="text-xs-center"
                color="rgba(0, 0, 0, 0.54)"
                hide-details
                maxlength="6"
                @input="validateHotp"
                @keyup.enter="verifyHotp"
              />
              <v-btn
                v-t="'verify'"
                :disabled="!hotp.valid"
                class="action-button"
                color="white"
                @click="verifyHotp"
              />
            </v-form>
          </v-flex>
        </v-layout>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default {
  components: { LanguageSwitcher },
  mounted: function () {
    this.$refs.hotpField.focus()
  },
  computed: {
    ...mapState(['account', 'session']),
    hotpRules () {
      // Translate validation messages on i18n locale change
      // return [this.$i18n.t(this.hotp.note) || true]
      return [true]
    }
  },
  data () {
    return {
      hotp: {
        disabled: false,
        note: '',
        valid: false,
        value: null
      },
      hotpError: { count: 2, value: null }
    }
  },
  methods: {
    ...mapActions(['logout', 'verify2fa']),
    logoutUser () {
      this.logout().then(status => {
        if (status === 204) {
          this.$router.push('login')
        }
        this.$emit('snackbar-note', status + '.logout')
      })
    },
    submitHotp () {
      this.hotp.disabled = true
      this.verify2fa(this.hotp.value).then(status => {
        if (status === 200) {
          if (this.session.se2faVerified) {
            this.$router.push('settings')
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
                this.logoutUser()
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
    verifyHotp () {
      this.validateHotp(this.hotp.value)
      if (this.hotp.valid) {
        this.submitHotp()
      } else {
        this.$emit('snackbar-note', this.hotp.note)
        // this.$refs.hotpField.focus()
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.action-button
  margin-top 25px

/**
 * Centering input text and label
 * 1. Override `style` attribute
 * 2. Align input text to center
 * 3. Fix label centering after `scaleY` animation, using `transition font-size` instead
 */
.auth-form >>> .v-label /* 1 */
  left 0
  max-width 100% !important
  width 100% !important
.auth-form >>> .v-input input
  text-align center /* 2 */
.auth-form >>> .v-input .v-label--active /* 3 */
  font-size 12px
  transform translateY(-18px)
  transition font .3s ease
  -webkit-transform translateY(-18px)
.text-field-password
  margin 10px auto 0 auto
  max-width 80%
.action-button
  margin-top 35px

.auth-form p
  font-size 16px
.auth-page__title
  color #4A4A4A
  font-size 45px
  font-weight 100
  line-height 40px
  margin 10px
  text-transform uppercase
.auth-page__subtitle
  font-size 18px
  font-weight 200
.logo
  height 213px
  width 213px
  filter sepia(0.3)
.v-text-field
  margin-top 20px

@media (max-width: 767px)
  .auth-page__subtitle
    font-size 16px
  .auth-page__title
    font-size 36px
@media (max-width: 600px)
  .auth-page__subtitle
    display none
@media only screen and (min-width : 480px)
  .logo
    height: 300px
    width: 300px
</style>
