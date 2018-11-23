<template>
  <div>
    <h1>{{this.$route.name === 'login' ? 'Login' : 'Signup'}}</h1>
    <router-link to="/login" v-if="this.$route.name === 'signup' && session.lastSeen">
      I already have an account. Let me in
    </router-link>
    <router-link to="/signup" v-else-if="this.$route.name === 'login' && !session.lastSeen">
      Do not have an account yet? Signup one
    </router-link>
    <fieldset v-if="session.created && account.se2faEnabled">
      <label class="block">
        <input @input="validateHotp" maxlength="6" minlength="6" pattern="\d+"
          placeholder="2FA code" ref="hotpInput" required v-model="hotp"/>
      </label>
      <button @click="verifyHotp" ref="hotpButton">Verify</button>
      <div class="note">{{note.hotp}}</div>
    </fieldset>
    <fieldset v-else>
      <label class="block">
        Username
        <input autocomplete="on" v-model="account.username"/>
      </label>
      <label class="block">
        Password
        <input autocomplete="on" type="password" v-model="account.password"/>
      </label>
      <button @click="login" v-if="this.$route.name === 'login'">Login</button>
      <button @click="signup" v-else-if="this.$route.name === 'signup'">Signup</button>
      <div class="note">{{note.auth}}</div>
    </fieldset>
  </div>
</template>

<script>
import { mapGetters, mapMutations } from 'vuex'

export default {
  computed: {
    ...mapGetters([
      'account', 'session', 'apiUrl'
    ])
  },
  data () {
    return {
      hotp: null,
      hotpError: {
        count: 0,
        value: null
      },
      note: {
        auth: null,
        hotp: null
      }
    }
  },
  methods: {
    ...mapMutations([
      'CLEAR_SESSION', 'SET_ACCOUNT', 'SET_SESSION'
    ]),
    login () {
      this.axios.post(this.apiUrl + 'login',
        this.account
      )
        .then(res => {
          if (res.status === 200) {
            this.SET_SESSION({
              created: res.data.created,
              id: res.data.id,
              lastSeen: Date.now(),
              timeDelta: Date.now() - Date.parse(res.data.created),
              ttl: res.data.ttl
            })
            this.SET_ACCOUNT({
              adamantAddress: res.data.adamantAddress,
              id: res.data.userId,
              se2faEnabled: res.data.se2faEnabled
            })
            if (!this.account.se2faEnabled) {
              this.$router.push('settings')
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          const error = err.response.data.error
          this.note.auth = `${error.statusCode} ${error.message}`
        })
    },
    signup () {
      this.axios.post(this.apiUrl, {
        password: this.account.password,
        username: this.account.username
      })
        .then(res => {
          if (res.status === 200) {
            this.login()
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          const error = err.response.data.error
          this.note.auth = `${error.statusCode} ${error.message}`
        })
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
          tooShort: 'Code is too short',
          valueMissing: 'Code is required to login'
        }[reason]
        this.$refs.hotpButton.disabled = true
      } else {
        this.note.hotp = ''
        this.$refs.hotpButton.disabled = false
      }
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
          if (typeof res.data === 'boolean') {
            if (res.data) {
              this.$router.push('settings')
            } else {
              this.note.hotp = 'Code is not valid, ' + (2 - this.hotpError.count) + ' attempts left'
              if (this.hotpError.value !== this.hotp) {
                this.hotpError.count = 1
                this.hotpError.value = this.hotp
              } else {
                this.hotpError.count++
                if (this.hotpError.count > 2) {
                  this.axios.post(this.apiUrl + 'logout/?access_token=' + this.session.id)
                    .then(res => {
                      if (res.status === 204) {
                        this.CLEAR_SESSION()
                        this.$router.push('login')
                        console.info(res)
                      } else console.warn(res)
                    })
                    .catch(err => console.error(err))
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
.block {display: block}
.note {color: red}
</style>
