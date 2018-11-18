<template>
  <div>
    <h1>Login</h1>
    <label>
      Username
      <input autocomplete="on" v-model="account.username"/>
    </label>
    <br/>
    <label>
      Password
      <input autocomplete="on" v-model="account.password"/>
    </label>
    <br/>
    <button @click="login">Enter</button>
    <div class="note">{{note.login}}</div>
  </div>
</template>

<script>
export default {
  data () {
    return {
      ...this.$store.state, // Change by commiting a mutation or dispatching an action only
      note: {
        login: null
      }
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
          const error = JSON.parse(err.response.request.response).error
          this.note.login = `${error.statusCode} ${error.message}`
          console.error(err)
        })
    }
  }
}
</script>

<style scoped>
.note {color: red}
</style>
