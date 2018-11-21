<template>
  <div>
    <h1>Settings</h1>
    <label>
      <input @change="enable2fa" ref="enable2faCheckbox" type="checkbox"/> Enable 2FA
    </label>
    <fieldset v-show="show2fa">
      <legend>2FA</legend>
      <label>
        ADAMANT address to receive 2FA codes
        <input @input="checkAdamantAddress" autocomplete="on" maxlength="21"
          minlength="21" pattern="U\d+" ref="adamantAddressInput" v-model="account.adamantAddress"/>
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
          <input @input="checkHotp" maxlength="6" minlength="6" pattern="\d+" v-model="hotp"/>
        </label>
        <button @click="verifyHotp" ref="hotpButton">Verify 2FA code</button>
      </div>
    </fieldset>
    <div class="note">{{note.hotp}}</div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'sessionTimeLeft'
    ])
  },
  data () {
    return {
      ...this.$store.state, // Change by commiting a mutation or dispatching an action only
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
      },
      validity: {
        adamantAddress: false,
        hotp: false
      }
    }
  },
  methods: {
    checkAdamantAddress (e) {
      const state = e.target.validity
      if (!state.valid) {
        // Firefox and IE have no own properties on the ValidityState object
        const reason = Object.keys(Object.getPrototypeOf(state)).find(
          key => state[key]
        )
        this.validity.adamantAddress = false
        this.note.adamantAddress = {
          patternMismatch: 'Address does not match pattern',
          tooShort: 'Address is too short'
        }[reason]
        this.$refs.adamantAddressButton.disabled = true
      } else {
        this.validity.adamantAddress = true
        this.note.adamantAddress = ''
        this.$refs.adamantAddressButton.disabled = false
      }
    },
    checkHotp (e) {
      const state = e.target.validity
      if (!state.valid) {
        // Firefox and IE have no own properties on the ValidityState object
        const reason = Object.keys(Object.getPrototypeOf(state)).find(
          key => state[key]
        )
        this.validity.hotp = false
        this.note.hotp = {
          patternMismatch: 'Code does not match pattern',
          tooShort: 'Code is too short'
        }[reason]
        this.$refs.hotpButton.disabled = true
        /* if (this.hotpError.value !== this.hotp) {
          this.hotpError.count = 1
          this.hotpError.value = this.hotp
        } else {
          this.hotpError.count++
        } */
      } else {
        this.validity.hotp = true
        this.note.hotp = ''
        this.$refs.hotpButton.disabled = false
      }
    },
    enable2fa (e) {
      this.show2fa = e.target.checked
    },
    postAdamantAddress () {
      this.axios.post(this.apiUrl + 'adamantAddress?access_token=' + this.session.id,
        this.account
      )
        .then(res => {
          if (res.status === 200) {
            this.$store.commit('UPDATE_ACCOUNT', {
              adamantAddress: res.data.adamantAddress
            })
            this.hotp = String(res.data.hotp) // @todo Get HOTP from ADAMANT messenger
            this.show2faHotp = true
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => console.error(err))
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
          if (res.data === true) {
            this.note.hotp = '2FA successfully enabled' // @todo Get notes from response
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
                this.$refs.enable2faCheckbox.checked = false
                this.$refs.adamantAddressInput.disabled = false
              }
            }
          }
          console.info(res)
        })
        .catch(err => console.error(err))
    }
  }
}
</script>

<style scoped>
.note {color: red}
</style>
