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
            :rules="adamantAddress.rules" browser-autocomplete="on" class="text-xs-center"
            maxlength="23" v-model="account.adamantAddress"/>
          <v-btn @click="postAdamantAddress" :disabled="!account.adamantAddress"
            ref="adamantAddressButton" v-t="'get2faCode'"/>
          <i18n for="inner" path="redirectAdamant.outer" tag="p">
            <a href="https://msg.adamant.im/" target="_blank" v-t="'redirectAdamant.inner'"></a>
          </i18n>
          <div v-show="show2faHotp">
            <v-text-field :disabled="hotp.disabled" :label="$t('enter2faCode')" :rules="hotp.rules"
              browser-autocomplete="on" class="text-xs-center" maxlength="6" v-model="hotp.value"/>
            <v-btn @click="verifyHotp" ref="hotpButton" v-t="'verify'"/>
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
    ...mapGetters(['account', 'apiUrl', 'session', 'sessionTimeLeft'])
  },
  data () {
    return {
      adamantAddress: {
        disabled: false,
        rules: [
          value => /^U\d+$/.test(value) || this.$i18n.t('patternMismatch.adamantAddress'),
          value => Boolean(value) || this.$i18n.t('required.adamantAddress'),
          value => (value && value.length < 24) || this.$i18n.t('tooLong.adamantAddress'),
          value => (value && value.length > 6) || this.$i18n.t('tooShort.adamantAddress')
        ]
      },
      hotp: {
        disabled: false,
        rules: [
          value => /^\d+$/.test(value) || this.$i18n.t('patternMismatch.hotp'),
          value => Boolean(value) || this.$i18n.t('required.hotp'),
          value => (value && value.length < 7) || this.$i18n.t('tooLong.hotp'),
          value => (value && value.length > 5) || this.$i18n.t('tooShort.hotp')
        ],
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
        })
      this.adamantAddress.disabled = true
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
              this.hotp.disabled = false
              this.snackbarNote = {
                path: '2faNotValid',
                args: { count: 2 - this.hotpError.count }
              }
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
