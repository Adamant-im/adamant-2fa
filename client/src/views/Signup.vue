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
        <h2
          v-t="'signupSubheader'"
          class="auth-page__subtitle mt-3"
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
            <v-form class="auth-form">
              <v-text-field
                ref="usernameField"
                v-model="username.value"
                :label="$t('username')"
                :rules="usernameRules"
                browser-autocomplete="on"
                class="text-xs-center"
                color="rgba(0, 0, 0, 0.54)"
                hide-details
                maxlength="25"
                @focus="focused = 'usernameField'"
                @input="validateUsername"
                @keyup.enter="verifyCredentials"
              />
              <v-text-field
                ref="passwordField"
                v-model="password.value"
                :label="$t('password')"
                :name="Date.now()"
                :rules="passwordRules"
                autocomplete="new-password"
                browser-autocomplete="on"
                class="text-xs-center text-field-password"
                color="rgba(0, 0, 0, 0.54)"
                hide-details
                maxlength="15"
                type="password"
                @focus="focused = 'passwordField'"
                @input="validatePassword"
                @keyup.enter="verifyCredentials"
              />
              <v-btn
                v-t="'signup'"
                class="action-button"
                color="white"
                @click="verifyCredentials"
              />
            </v-form>
          </v-flex>
        </v-layout>
      </v-card>
      <v-layout justify-center>
        <v-flex
          md8
          xs12
        >
          <h3 class="text-redirect text-xs-center">
            <router-link
              v-t="'redirectLogin'"
              to="/login"
            />
          </h3>
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
    passwordRules () {
      // Translate validation messages on i18n locale change
      // return [this.$i18n.t(this.password.note) || true]
      return [true]
    },
    usernameRules () {
      // Translate validation messages on i18n locale change
      // return [this.$i18n.t(this.username.note) || true]
      return [true]
    }
  },
  data () {
    return {
      focused: 'usernameField',
      password: {
        note: '',
        valid: false,
        value: null
      },
      username: {
        note: '',
        valid: false,
        value: null
      }
    }
  },
  methods: {
    ...mapActions(['signup']),
    signupUser () {
      this.signup({
        locale: this.$i18n.locale,
        password: this.password.value,
        username: this.username.value
      }).then(status => {
        if (status === 200) {
          this.$router.push({ name: 'login', params: { newUsername: this.username.value } })
          // this.password.value = null
          this.$emit('snackbar-note', 'signedUp')
        } else {
          this.$emit('snackbar-note', status + '.signup')
          this.$refs[this.focused].focus()
        }
      })
    },
    validatePassword (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'valueMissing.password'; break
        case value && value.length > 2: state = 'tooShort.password'
      }
      this.password.note = state
      this.password.valid = !state
    },
    validateUsername (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'valueMissing.username'; break
        case value && value.length > 2: state = 'tooShort.username'
      }
      this.username.note = state
      this.username.valid = !state
    },
    verifyCredentials () {
      this.validatePassword(this.password.value)
      this.validateUsername(this.username.value)
      if (this.password.valid && this.username.valid) {
        this.signupUser()
      } else {
        this.$emit('snackbar-note', this.username.note || this.password.note)
        this.$refs[this.focused].focus()
      }
    }
  },
  mounted () {
    this.username.value = this.account.username
    this.validatePassword(this.password.value)
    this.validateUsername(this.username.value)
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
.text-redirect
  font-weight 300
  margin-bottom 40px
  margin-top 28px
.text-redirect a
  color #4A4A4A

@media (max-width: 767px)
  .auth-page__subtitle
    font-size 16px
  .auth-page__title
    font-size 36px
@media only screen and (min-width : 480px)
  .logo
    height: 300px
    width: 300px
</style>
