<template>
  <div>
    <h1>{{this.$route.name === 'login' ? 'Login' : 'Signup'}}</h1>
    <router-link to="/login" v-if="this.$route.name === 'signup' && session.created">
      I already have an account. Let me in
    </router-link>
    <router-link to="/signup" v-else>
      Do not have an account yet? Signup one
    </router-link>
    <br/>
    <label>
      Username
      <input autocomplete="on" v-model="account.username"/>
    </label>
    <br/>
    <label>
      Password
      <input autocomplete="on" type="password" v-model="account.password"/>
    </label>
    <br/>
    <button @click="login" v-if="this.$route.name === 'login'">Login</button>
    <button @click="signup" v-else-if="this.$route.name === 'signup'">Signup</button>
    <div class="note">{{note.auth}}</div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      ...this.$store.state, // Change by commiting a mutation or dispatching an action only
      note: { auth: null }
    }
  },
  methods: {
    login () {
      this.axios.post(this.apiUrl + 'login',
        this.account
      )
        .then(res => {
          if (res.status === 200) {
            this.$store.commit('SET_SESSION', {
              ...res.data,
              timeDelta: Date.now() - Date.parse(res.data.created)
            })
            this.$store.dispatch('getAccountData')
            this.$router.push('settings')
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
    }
  }
}
</script>

<style scoped>
.note {color: red}
</style>
