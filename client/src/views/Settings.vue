<template>
  <div>
    <h1>Settings</h1>
    <fieldset>
      <legend>ADAMANT</legend>
      <label>
        ADAMANT address to receive 2FA codes
        <input v-model="account.adamantAddress"/>
      </label>
      <button @click="postAdamantAddress">Get 2FA code</button>
      <br/>
      <label>
        Enter the 2FA code you received
        <input v-model="account.seHotp"/>
      </label>
      <button @click="verifyHotp">Verify 2FA code</button>
      <div>{{note.hotp}}</div>
    </fieldset>
  </div>
</template>

<script>
const apiUrl = 'http://localhost:3000/api/Accounts/' // @todo Move to config

export default {
  data () {
    return {
      account: {
        adamantAddress: 'U01234567890123456789',
        id: '5bed89c8be24ce1afd449940',
        seHotp: ''
      },
      note: {
        hotp: ''
      }
    }
  },

  methods: {
    postAdamantAddress () {
      this.axios.post(apiUrl + 'adamantAddress',
        this.account
      )
        .then(res => {
          console.info(res)
          this.account.seToken = String(res.data)
        })
        .catch(err => console.error(err))
    },
    verifyHotp () {
      this.axios.get(apiUrl + 'verifyHotp', {
        params: this.account
      })
        .then(res => {
          console.info(res)
          if (res.data === true) {
            this.note.hotp = '2FA succesfully enabled'
          } else {
            this.note.hotp = '2FA code is not valid'
          }
        })
        .catch(err => console.error(err))
    }
  }
}
</script>
