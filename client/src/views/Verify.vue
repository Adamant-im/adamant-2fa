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
                :rules="hotpRules" class="text-xs-center" maxlength="6" v-model="hotp.value"/>
              <v-btn :disabled="!hotp.valid" @click="verify" v-t="'verify'"/>
            </v-form>
          </v-flex>
        </v-layout>
      </v-card>
    </v-flex>
  </v-layout>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'
import LanguageSwitcher from '@/components/LanguageSwitcher'

export default {
  components: { LanguageSwitcher },
  computed: {
    ...mapGetters(['account', 'apiUrl', 'session']),
    hotpRules () {
      // Translate validation messages on i18n locale change
      const value = this.hotp.value; let state = true
      switch (false) {
        case Boolean(value): state = this.$i18n.t('required.hotp'); break
        case /^\d+$/.test(value): state = this.$i18n.t('patternMismatch.hotp'); break
        case value && value.length > 5: state = this.$i18n.t('tooShort.hotp')
      }
      this.hotp.valid = state === true
      return [state]
    }
  },
  data () {
    return {
      hotp: {
        disabled: false,
        valid: false,
        value: null
      },
      hotpError: { count: 0, value: null }
    }
  },
  methods: {
    ...mapMutations(['CLEAR_SESSION', 'UPDATE_SESSION']),
    logout () {
      this.axios.post(this.apiUrl + 'logout/?access_token=' + this.session.id)
        .then(res => {
          if (res.status === 204) {
            this.CLEAR_SESSION()
            this.$router.push('login')
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          if (err.status === 401) { // Access token expired
            this.CLEAR_SESSION()
            this.$router.push('login')
          }
        })
    },
    verify () {
      this.hotp.disabled = true
      this.axios.get(this.apiUrl + 'verifyHotp', {
        params: {
          access_token: this.session.id,
          id: this.account.id,
          hotp: this.hotp.value
        }
      })
        .then(res => {
          if (res.status === 200) {
            this.UPDATE_SESSION({ verified: res.data.verified })
            if (this.session.verified) {
              this.$router.push('settings')
            } else {
              this.hotp.disabled = false
              this.$emit('snackbar-note', {
                path: '2faNotValid',
                args: { count: 2 - this.hotpError.count }
              })
              if (this.hotpError.value !== this.hotp.value) {
                this.hotpError.count = 1
                this.hotpError.value = this.hotp.value
              } else {
                this.hotpError.count++
                if (this.hotpError.count > 2) {
                  this.hotpError.count = 0
                  this.hotpError.value = null
                  this.hotp.value = null
                  this.logout()
                }
              }
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => console.error(err))
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
