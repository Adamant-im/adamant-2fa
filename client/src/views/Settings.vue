<template>
  <v-layout justify-center row wrap v-if="session.verified">
    <v-flex md4 xs12>
      <h3 class="grey--text mb-3 text--darken-3 title">{{ $t('general') }}</h3>
      <!--v-layout align-center class="mb-5" row wrap>
        <v-flex xs6>
          <v-subheader class="pa-0">{{ account.username }}</v-subheader>
        </v-flex>
        <v-flex class="text-xs-right" xs6>
          <span>{{(sessionTimeLeft / 1000 / 60) || 'Session expired'}}</span>
        </v-flex>
      </v-layout-->
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
          <v-checkbox :label="$t('enable2fa')" @change="enable2fa" color="darken-1 grey"
            ref="enable2faCheckbox" v-model="se2faChecked"/>
        </v-flex>
        <v-flex xs12 v-show="show2fa">
          <v-text-field :disabled="adamantAddress.disabled" :label="$t('enterAdamantAddress')"
            :rules="adamantAddressRules" browser-autocomplete="on" class="text-xs-center"
            maxlength="23" v-model="account.adamantAddress"/>
          <v-btn @click="postAdamantAddress" :disabled="!adamantAddress.valid"
            ref="adamantAddressButton" v-t="'get2faCode'"/>
          <i18n for="inner" path="redirectAdamant.outer" tag="p">
            <a href="https://msg.adamant.im/" target="_blank" v-t="'redirectAdamant.inner'"></a>
          </i18n>
          <div v-show="show2faHotp">
            <v-text-field :disabled="hotp.disabled" :label="$t('enter2faCode')" :rules="hotpRules"
              browser-autocomplete="on" class="text-xs-center" maxlength="6" v-model="hotp.value"/>
            <v-btn :disabled="!hotp.valid" @click="verifyHotp" ref="hotpButton"
              v-t="'verify'"/>
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
    ...mapGetters(['account', 'apiUrl', 'session', 'sessionTimeLeft']),
    adamantAddressRules () {
      // Translate validation messages on i18n locale change
      const value = this.account.adamantAddress; let state = true
      switch (false) {
        case Boolean(value): state = this.$i18n.t('required.adamantAddress'); break
        case /^U\d+$/.test(value): state = this.$i18n.t('patternMismatch.adamantAddress'); break
        case value && value.length > 6: state = this.$i18n.t('tooShort.adamantAddress')
      }
      this.adamantAddress.valid = state === true
      return [state]
    },
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
      adamantAddress: {
        disabled: false,
        valid: false
      },
      hotp: {
        disabled: false,
        valid: false,
        value: null
      },
      hotpError: { count: 0, value: null },
      se2faChecked: false,
      show2fa: false,
      show2faHotp: false,
      snackbarNote: 'empty'
    }
  },
  methods: {
    ...mapMutations(['UPDATE_ACCOUNT']),
    enable2fa (checked) {
      this.show2fa = checked
      if (checked) {
        this.show2faHotp = false
        this.adamantAddress.disabled = false
      } else if (this.account.se2faEnabled) {
        this.axios.get(this.apiUrl + 'disable2fa', {
          params: {
            access_token: this.session.id,
            id: this.account.id
          }
        })
          .then(res => {
            if (res.status === 200) {
              this.UPDATE_ACCOUNT({ se2faEnabled: res.data.se2faEnabled })
              console.info(res)
            } else console.warn(res)
          })
          .catch(err => console.error(err))
        this.snackbarNote = ''
      }
    },
    postAdamantAddress () {
      this.adamantAddress.disabled = true
      this.axios.post(
        this.apiUrl + 'adamantAddress?access_token=' + this.session.id, {
          adamantAddress: this.account.adamantAddress,
          id: this.account.id
        }
      )
        .then(res => {
          if (res.status === 200) {
            this.UPDATE_ACCOUNT({ adamantAddress: res.data.adamantAddress })
            this.hotpError.count = 0
            this.hotpError.value = this.hotp
            if (res.data.success) {
              this.show2faHotp = true
              this.snackbarNote = {
                args: { id: res.data.transactionId },
                path: '2faSent'
              }
            } else {
              this.snackbarNote = {
                args: { reason: res.data.message },
                path: '2faSendFail'
              }
              this.adamantAddress.disabled = false
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          this.snackbarNote = err.response.status + '.adamantAddress'
          this.adamantAddress.disabled = false
        })
    },
    verifyHotp () {
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
            this.UPDATE_ACCOUNT({ se2faEnabled: res.data.verified })
            if (res.data.verified) {
              this.snackbarNote = '2faEnabled'
              this.hotpError.count = 0
              this.show2fa = false
            } else {
              this.snackbarNote = {
                path: '2faNotValid',
                args: { count: 2 - this.hotpError.count }
              }
              this.hotp.disabled = false
              if (this.hotpError.value !== this.hotp) {
                this.hotpError.count = 1
                this.hotpError.value = this.hotp
              } else {
                this.hotpError.count++
                if (this.hotpError.count > 2) {
                  this.show2fa = false
                  this.show2faHotp = false
                  this.snackbarNote = 'empty'
                  this.adamantAddress.disabled = false
                }
              }
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => console.error(err))
    }
  },
  mounted () {
    if (this.account.se2faEnabled) {
      this.se2faChecked = true
    }
  }
}
</script>

<style scoped>
.note {color: red}
</style>
