<template>
  <v-layout class="login-page" fill-height justify-center row>
    <v-flex md5 sm8 xs12>
      <div class="text-xs-right">
        <LanguageSwitcher/>
      </div>
      <v-card class="mt-3 text-xs-center" color="transparent" flat>
        <img class="logo" src="/img/adamant-logo-transparent-512x512.png"/>
        <h1 class="login-page__title" v-t="'documentTitle'"></h1>
        <h2 class="hidden-sm-and-down login-page__subtitle mt-3" v-t="'login'"></h2>
      </v-card>
      <v-card class="mt-3 text-xs-center" color="transparent" flat>
        <v-layout justify-center>
          <v-flex md8 xs12>
            <v-form class="login-form">
              <v-text-field :label="$t('username')" :rules="usernameRules" @input="validateUsername"
                browser-autocomplete="on" class="text-xs-center" maxlength="15"
                v-model="username.value"/>
              <v-text-field :label="$t('password')" :rules="passwordRules" @input="validatePassword"
                browser-autocomplete="on" class="text-xs-center" maxlength="15" type="password"
                v-model="password.value"/>
              <v-btn :disabled="!(password.valid && username.valid)" @click="loginUser"
                v-t="'login'"/>
            </v-form>
          </v-flex>
        </v-layout>
      </v-card>
      <v-layout justify-center>
        <v-flex md8 xs12>
          <div class="passphrase-generator">
            <div class="text-xs-center">
              <h3 class="body-1 grey--text text--darken-2">
                <router-link to="/signup" v-t="'redirectSignup'"/>
              </h3>
            </div>
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
    passwordRules () {
      // Translate validation messages on i18n locale change
      return [this.$i18n.t(this.password.note) || true]
    },
    usernameRules () {
      // Translate validation messages on i18n locale change
      return [this.$i18n.t(this.username.note) || true]
    }
  },
  data () {
    return {
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
    ...mapActions(['login']),
    loginUser () {
      this.login({
        password: this.password.value,
        username: this.username.value
      }).then(status => {
        if (status === 200) {
          this.$i18n.locale = this.account.locale
          if (this.account.se2faEnabled) {
            this.$router.push('verify')
          } else {
            this.$router.push('settings')
          }
          // this.password.value = null
        } else this.$emit('snackbar-note', status + '.login')
      })
    },
    validatePassword (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'required.password'
      }
      this.password.note = state
      this.password.valid = !state
    },
    validateUsername (value) {
      let state = ''
      switch (false) {
        case Boolean(value): state = 'required.username'
      }
      this.username.note = state
      this.username.valid = !state
    }
  },
  mounted () {
    this.username.value = this.account.username
    this.validatePassword(this.password.value)
    this.validateUsername(this.username.value)
  }
}
</script>

<style scoped>
.login-page {}
.login-page__title {
  color: #4a4a4a;
  font-family: 'Exo 2';
  font-weight: 100;
  font-size: 45px;
  line-height: 40px;
  text-transform: uppercase;
}
.login-page__subtitle {
  font-family: 'Exo 2';
  font-weight: 100;
  font-size: 18px;
}

.logo {
  width: 213px;
  height: 213px;
}

/* sm-and-up */
@media only screen and (min-width : 600px) {
  .logo {
    width: 300px;
    height: 300px;
  }
}

/**
 * Centering input text and label.
 *
 * 1. Override `style` attribute.
 * 2. Align input text to center.
 * 3. Fix label centering after `scaleY` animation, using `transition font-size` instead.
 */
.login-form >>> .v-label { /* [1] */
  width: 100% !important;
  max-width: 100% !important;
  left: 0;
}
.login-form >>> .v-input input {
  text-align: center; /* [2] */
}
.login-form >>> .v-input .v-label--active { /* [3] */
  transition: font .3s ease;
  transform: translateY(-18px);
  -webkit-transform: translateY(-18px);
  font-size: 12px;
}
</style>