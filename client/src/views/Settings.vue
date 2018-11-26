<template>
  <div>
    <h1>Settings</h1>
    <label>
      <input @change="enable2fa" ref="enable2faCheckbox" type="checkbox"
        v-model="account.se2faEnabled"/> Enable 2FA
    </label>
    <fieldset v-show="show2fa">
      <legend>2FA</legend>
      <label>
        ADAMANT address to receive 2FA codes
        <input @input="validateAdamantAddress" autocomplete="on" maxlength="23" minlength="7"
          pattern="^U\d+$" ref="adamantAddressInput" required v-model="account.adamantAddress"/>
      </label>
      <button @click="postAdamantAddress" ref="adamantAddressButton">Get 2FA code</button>
      <p>
        Do not have ADAMANT account yet?
        <a href="https://msg.adamant.im/" target="_blank">Create one in a second</a>
      </p>
      <div class="note">{{note.adamantAddress}}</div>
      <div v-show="show2faHotp">
        <label>
          Enter the 2FA code you received
          <input @input="validateHotp" maxlength="6" minlength="6" pattern="^\d+$" v-model="hotp"/>
        </label>
        <button @click="verifyHotp" ref="hotpButton">Verify 2FA code</button>
      </div>
    </fieldset>
    <div class="note">{{note.hotp}}</div>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'account', 'apiUrl', 'session', 'sessionTimeLeft'
    ])
  },
  data () {
    return {
      admSend: null,
      show2fa: false,
      show2faHotp: false,
      hotp: null,
      hotpError: {
        count: 0,
        value: null
      },
      note: {
        adamantAddress: null,
        hotp: null
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
      } else {
        this.axios.get(this.apiUrl + 'disable2fa', {
          params: {
            access_token: this.session.id,
            id: this.account.id
          }
        })
          .then(res => {
            if (res.status === 200) {
              this.account.se2faEnabled = res.data.se2faEnabled
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
        this.note.adamantAddress = {
          patternMismatch: 'Address does not match pattern',
          tooLong: 'Address is too long', // Never appears?
          tooShort: 'Address is too short',
          valueMissing: 'Address is required to send 2FA codes'
        }[reason]
        this.$refs.adamantAddressButton.disabled = true
      } else {
        this.note.adamantAddress = ''
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
        this.note.hotp = {
          patternMismatch: 'Code does not match pattern',
          tooLong: 'Code is too long', // Never appears?
          tooShort: 'Code is too short'
        }[reason]
        this.$refs.hotpButton.disabled = true
      } else {
        this.note.hotp = ''
        this.$refs.hotpButton.disabled = false
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
            this.UPDATE_ACCOUNT({
              adamantAddress: res.data.adamantAddress
            })
            this.hotpError.count = 0
            this.hotpError.value = this.hotp
            if (res.data.success) {
              this.show2faHotp = true
              this.note.hotp = 'Code sent with transaction ID ' + res.data.transactionId
            } else {
              this.note.hotp = 'Code did not send, ' + res.data.message
              this.$refs.adamantAddressInput.disabled = false
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          if (err.response.status === 422) { // Address already registered
            this.note.adamantAddress = err.response.data.error.message
            this.$refs.adamantAddressInput.disabled = false
          }
        })
      this.$refs.adamantAddressInput.disabled = true
    },
    verifyHotp () {
      this.axios.get(this.apiUrl + 'verifyHotp', {
        params: {
          access_token: this.session.id,
          id: this.account.id,
          hotp: this.hotp
        }
      })
        .then(res => {
          if (res.status === 200) {
            if (res.data.verified) {
              this.account.se2faEnabled = true
              this.note.hotp = '2FA successfully enabled'
              this.hotpError.count = 0
              this.show2fa = false
            } else {
              this.note.hotp = 'Code is not valid, ' + (2 - this.hotpError.count) + ' attempts left'
              if (this.hotpError.value !== this.hotp) {
                this.hotpError.count = 1
                this.hotpError.value = this.hotp
              } else {
                this.hotpError.count++
                if (this.hotpError.count > 2) {
                  this.show2fa = false
                  this.show2faHotp = false
                  this.note.hotp = ''
                  this.account.se2faEnabled = false
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
    if (!this.account.adamantAddress) { // ADAMANT address not had been set yet
      this.$refs.adamantAddressButton.disabled = true
    }
  }
}
</script>

<style scoped>
.note {color: red}
</style>
