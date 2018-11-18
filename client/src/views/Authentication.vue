<template>
  <div>
    <h1>Login</h1>
    <label>
      Username
      <input v-model="account.username"/>
    </label>
    <br/>
    <label>
      Password
      <input v-model="account.password"/>
    </label>
    <br/>
    <button @click="login">Enter</button>
  </div>
</template>

<script>
const apiUrl = 'http://localhost:3000/api/Accounts/' // @todo Move to config

export default {
  data () {
    return {
      account: {
        username: 'username1',
        password: 'password1'
      }
    }
  },
  methods: {
    login () {
      this.axios.post(apiUrl + 'login',
        this.profile
      )
        .then(res => {
          console.info(res)
          // this.$router.push('profile')
        })
        .catch(err => console.error(err))
    }
  }
}
</script>
