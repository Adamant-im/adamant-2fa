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
              <v-text-field :label="$t('username')" :rules="usernameRules"
                browser-autocomplete="on" class="text-xs-center" maxlength="15"
                v-model="account.username"/>
              <v-text-field :label="$t('password')" :rules="passwordRules"
                browser-autocomplete="on" class="text-xs-center" maxlength="15" type="password"
                v-model="password.value"/>
              <v-btn :disabled="!(password.valid && username.valid)" @click="login"
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
    <SnackbarNote :options="snackbarNote"/>
  </v-layout>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import SnackbarNote from '@/components/SnackbarNote'

export default {
  components: { LanguageSwitcher, SnackbarNote },
  computed: {
    ...mapGetters(['account', 'apiUrl', 'session']),
    passwordRules () {
      // Translate validation messages on i18n locale change
      const value = this.password.value; let state = true
      switch (false) {
        case Boolean(value): state = this.$i18n.t('required.password')
      }
      this.password.valid = state === true
      return [state]
    },
    usernameRules () {
      // Translate validation messages on i18n locale change
      const value = this.account.username; let state = true
      switch (false) {
        case Boolean(value): state = this.$i18n.t('required.username')
      }
      this.username.valid = state === true
      return [state]
    }
  },
  data () {
    return {
      password: {
        valid: false,
        value: null
      },
      username: {
        valid: false
      },
      snackbarNote: 'empty'
    }
  },
  methods: {
    ...mapMutations(['SET_ACCOUNT', 'SET_SESSION']),
    login () {
      this.axios.post(this.apiUrl + 'login',
        {
          ...this.account,
          password: this.password.value
        }
      )
        .then(res => {
          if (res.status === 200) {
            this.SET_SESSION({
              created: res.data.created,
              id: res.data.id,
              lastSeen: Date.now(),
              timeDelta: Date.now() - Date.parse(res.data.created),
              ttl: res.data.ttl,
              verified: res.data.se2faEnabled ? null : true
            })
            this.SET_ACCOUNT({
              adamantAddress: res.data.adamantAddress,
              id: res.data.userId,
              locale: res.data.locale,
              se2faEnabled: res.data.se2faEnabled,
              username: res.data.username
            })
            this.$i18n.locale = this.account.locale
            if (this.account.se2faEnabled) {
              this.$router.push('verify')
            } else {
              this.$router.push('settings')
            }
            this.password.value = null
            this.snackbarNote = 'empty'
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          this.snackbarNote = err.response.status + '.login'
        })
    }
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
