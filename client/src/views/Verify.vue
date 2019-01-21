<template>
  <v-layout class="login-page" fill-height justify-center row>
    <v-flex md5 sm8 xs12>
      <div class="text-xs-right">
        <LanguageSwitcher/>
      </div>
      <v-card class="mt-3 text-xs-center" color="transparent" flat>
        <img class="logo" src="/img/adamant-logo-transparent-512x512.png"/>
        <h1 class="login-page__title" v-t="'documentTitle'"></h1>
      </v-card>
      <v-card class="mt-3 text-xs-center" color="transparent" flat>
        <v-layout justify-center>
          <v-flex md8 xs12>
            <v-form class="login-form">
              <p v-html="$t('2faRequest')"></p>
              <v-text-field :disabled="hotp.disabled" :placeholder="$t('2faCode')"
                :rules="hotpRules" @input="validateHotp" class="text-xs-center" maxlength="6"
                v-model="hotp.value"/>
              <v-btn :disabled="!hotp.valid" @click="verifyHotp" v-t="'verify'"/>
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
  computed: {
    ...mapState(['session']),
    hotpRules () {
      // Translate validation messages on i18n locale change
      return [this.$i18n.t(this.hotp.note) || true]
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
          }
        }
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
