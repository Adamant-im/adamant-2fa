<template>
  <div v-if="session.verified">
    <h1 v-t="'settings'"></h1>
    <label>
      <input @change="enable2fa" ref="enable2faCheckbox" type="checkbox" v-model="se2faChecked"/>
        {{ $t('enable2fa') }}
    </label>
    <fieldset v-show="show2fa">
      <legend v-t="'2fa'"></legend>
      <label>
        {{ $t('enterAdamantAddress') }}
        <input @input="validateAdamantAddress" autocomplete="on" maxlength="23" minlength="7"
          pattern="^U\d+$" ref="adamantAddressInput" required v-model="account.adamantAddress"/>
      </label>
      <button @click="postAdamantAddress" :disabled="!account.adamantAddress"
        ref="adamantAddressButton" v-t="'get2faCode'"></button>
      <i18n for="inner" path="redirectAdamant.outer" tag="p">
        <a href="https://msg.adamant.im/" target="_blank" v-t="'redirectAdamant.inner'"></a>
      </i18n>
      <div class="note" v-t="note.adamantAddress"></div>
      <div v-show="show2faHotp">
        <label>
          {{ $t('enter2faCode') }}
          <input @input="validateHotp" maxlength="6" minlength="6" pattern="^\d+$" ref="hotpInput"
            v-model="hotp"/>
        </label>
        <button @click="verifyHotp" ref="hotpButton" v-t="'verify'"></button>
      </div>
    </fieldset>
    <div class="note" v-t="note.hotp"></div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'account', 'apiUrl', 'session'
    ])
  },
  data () {
    return {
      se2faChecked: false,
      show2fa: false,
      show2faHotp: false,
      hotp: null,
      hotpError: {
        count: 0,
        value: null
      },
      note: {
        adamantAddress: 'empty',
        hotp: 'empty'
      }
    }
  },
  methods: {
    ...mapMutations([
      'UPDATE_ACCOUNT'
    ]),
    enable2fa (e) {
      this.show2fa = e.target.checked
      if (e.target.checked) {
        this.show2faHotp = false
        this.$refs.adamantAddressInput.disabled = false
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
        this.note.hotp = ''
      }
    },
    validateAdamantAddress (e) {
      const state = e.target.validity
      if (!state.valid) {
        // Firefox and IE have no own properties on the ValidityState object
        const reason = Object.keys(Object.getPrototypeOf(state)).find(
          key => state[key]
        )
        this.note.adamantAddress = reason + '.adamantAddress'
        this.$refs.adamantAddressButton.disabled = true
      } else {
        this.note.adamantAddress = 'empty'
        this.$refs.adamantAddressButton.disabled = false
      }
    },
    validateHotp (e) {
      const state = e.target.validity
      if (!state.valid) {
        // Firefox and IE have no own properties on the ValidityState object
        const reason = Object.keys(Object.getPrototypeOf(state)).find(
          key => state[key]
        )
        this.note.hotp = reason + '.hotpEnable'
        this.$refs.hotpButton.disabled = true
      } else {
        this.note.hotp = 'empty'
        this.$refs.hotpButton.disabled = false
      }
      this.hotpError.count = 0
      this.hotpError.value = null
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
              this.note.hotp = {
                path: '2faSent',
                args: { id: res.data.transactionId }
              }
            } else {
              this.note.hotp = {
                path: '2faSendFail',
                args: { reason: res.data.message }
              }
              this.$refs.adamantAddressInput.disabled = false
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          this.note.adamantAddress = err.response.status + '.postAdamantAddress'
        })
      this.$refs.adamantAddressInput.disabled = true
    },
    verifyHotp () {
      this.$refs.hotpInput.disabled = true
      this.axios.get(this.apiUrl + 'verifyHotp', {
        params: {
          access_token: this.session.id,
          id: this.account.id,
          hotp: this.hotp
        }
      })
        .then(res => {
          if (res.status === 200) {
            this.UPDATE_ACCOUNT({ se2faEnabled: res.data.verified })
            if (res.data.verified) {
              this.note.hotp = '2faEnabled'
              this.hotpError.count = 0
              this.show2fa = false
            } else {
              this.$refs.hotpInput.disabled = false
              this.note.hotp = {
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
                  this.note.hotp = 'empty'
                  this.$refs.adamantAddressInput.disabled = false
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
