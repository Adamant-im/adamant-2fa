<template>
  <div v-if="!session.verified">
    <h1>{{ $t(this.$route.name) }}</h1>
    <router-link to="/login" v-if="this.$route.name === 'signup' && session.lastSeen"
      v-t="'redirectLogin'"></router-link>
    <router-link to="/signup" v-else-if="this.$route.name === 'login' && !session.lastSeen"
      v-t="'redirectSignup'">
    </router-link>
    <fieldset v-if="session.created && account.se2faEnabled">
      <p v-html="$t('2faRequest')"></p>
      <label>
        <input @input="validateHotp" maxlength="6" minlength="6" pattern="^\d+$"
          v-bind:placeholder="$t('2faCode')" ref="hotpInput" required v-model="hotp"/>
      </label>
      <button @click="verifyHotp" ref="hotpButton">Verify</button>
      <div class="note" v-t="note.hotp"></div>
    </fieldset>
    <fieldset v-else>
      <label class="block">
        {{ $t('username') }}
        <input autocomplete="on" v-model="account.username"/>
      </label>
      <label class="block">
        {{ $t('password') }}
        <input autocomplete="on" type="password" v-model="account.password"/>
      </label>
      <button @click="login" v-if="this.$route.name === 'login'" v-t="'login'"></button>
      <button @click="signup" v-else-if="this.$route.name === 'signup'" v-t="'signup'"></button>
      <div class="note" v-t="note.auth"></div>
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
        auth: 'empty',
        hotp: 'empty'
      }
    }
  },
  methods: {
    ...mapMutations([
      'CLEAR_SESSION', 'SET_ACCOUNT', 'SET_SESSION', 'UPDATE_SESSION'
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
              ttl: res.data.ttl,
              verified: res.data.se2faEnabled ? null : true
            })
            this.SET_ACCOUNT({
              adamantAddress: res.data.adamantAddress,
              id: res.data.userId,
              se2faEnabled: res.data.se2faEnabled,
              username: res.data.username
            })
            this.note.auth = 'empty'
            if (!this.account.se2faEnabled) {
              this.$router.push('settings')
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => {
          console.error(err)
          this.note.auth = err.response.status + '.login'
        })
    },
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
          this.note.auth = err.response.status + '.signup'
        })
    },
    validateHotp (e) {
      const state = e.target.validity
      if (!state.valid) {
        // Firefox and IE have no own properties on the ValidityState object
        const reason = Object.keys(Object.getPrototypeOf(state)).find(
          key => state[key]
        )
        this.note.hotp = reason + '.hotp'
        this.$refs.hotpButton.disabled = true
      } else {
        this.note.hotp = 'empty'
        this.$refs.hotpButton.disabled = false
      }
      this.hotpError.count = 0
      this.hotpError.value = null
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
            this.UPDATE_SESSION({ verified: res.data.verified })
            if (this.session.verified) {
              this.$router.push('settings')
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
                  this.hotpError.count = 0
                  this.hotpError.value = null
                  this.note.hotp = 'empty'
                  this.hotp = null
                  this.logout()
                }
              }
            }
            console.info(res)
          } else console.warn(res)
        })
        .catch(err => console.error(err))
    }
  },
  beforeRouteEnter (to, from, next) {
    next(vm => { vm.note.auth = 'empty' })
  },
  beforeRouteLeave (to, from, next) {
    this.note.auth = 'empty'
    next()
  }
}
</script>

<style scoped>
.block {display: block}
.note {color: red}
</style>
