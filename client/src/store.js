import createPersistedState from 'vuex-persistedstate'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  actions: {
    disable2fa ({ commit, state }) {
      return Vue.axios.get(`${state.apiUrl}${state.account.id}/disable2fa`, {
        params: {
          access_token: state.session.id,
          id: state.account.id
        }
      }).then(res => {
        if (res.status === 200) {
          commit('updateAccount', {
            se2faEnabled: res.data.se2faEnabled
          })
          console.info('2FA auth disabled:', res)
        } else console.warn('Failed to disable 2FA auth:', res)
        return res.status
      }).catch(error => {
        console.error('Error while disabling 2FA auth:', error)
        return error.response.status
      })
    },
    enable2fa ({ commit, state }, hotp) {
      return Vue.axios.get(`${state.apiUrl}${state.account.id}/enable2fa`, {
        params: {
          access_token: state.session.id,
          id: state.account.id,
          hotp
        }
      }).then(res => {
        if (res.status === 200) {
          commit('updateAccount', {
            se2faEnabled: res.data.se2faEnabled
          })
          commit('updateSession', {
            // If 2FA enabled, verification already passed and vice versa
            se2faVerified: res.data.se2faEnabled
          })
          console.info('2FA auth enabled:', res)
        } else console.warn('Failed to enable 2FA auth:', res)
        return res.status
      }).catch(error => {
        console.error('Error while enabling 2FA auth:', error)
        return error.response
      })
    },
    login ({ commit, state }, params) {
      return Vue.axios.post(state.apiUrl + 'login', params).then(res => {
        if (res.status === 200) {
          commit('setSession', {
            created: res.data.created,
            id: res.data.id,
            lastSeen: Date.now(),
            timeDelta: Date.now() - Date.parse(res.data.created),
            ttl: res.data.ttl,
            se2faVerified: res.data.se2faEnabled ? null : true
          })
          commit('setAccount', {
            adamantAddress: res.data.adamantAddress,
            id: res.data.userId,
            locale: res.data.locale,
            se2faEnabled: res.data.se2faEnabled,
            username: res.data.username
          })
          console.info('Login successful:', res)
        } else console.warn('Login failed:', res)
        return res
      }).catch(error => {
        console.error('Error occurred while Login:', error)
        return error.response || { status: 503 }
      })
    },
    logout ({ commit, state }) {
      return Vue.axios.post(
        `${state.apiUrl}logout/?access_token=${state.session.id}`
      ).then(res => {
        if (res.status === 204) {
          commit('clearSession')
          console.info('Logout successful:', res)
        } else console.warn('Logout failed:', res)
        return res.status
      }).catch(error => {
        console.error('Error occurred while Logout:', error)
        // Clear expired session even if backend is not available
        commit('clearSession')
        return error.response ? error.response.status : 503
      })
    },
    postAdamantAddress ({ commit, state }, adamantAddress) {
      return Vue.axios.post(
        `${state.apiUrl}${state.account.id}/adamantAddress?access_token=${state.session.id}`,
        {
          adamantAddress
        }
      ).then(res => {
        if (res.status === 200) {
          commit('updateAccount', {
            adamantAddress: res.data.adamantAddress
          })
          console.info('ADAMANT address submitted:', res)
        } else console.warn('Failed to submit ADAMANT address:', res)
        return res
      }).catch(error => {
        console.error('Error occurred while submitting ADAMANT address:', error)
        return error.response
      })
    },
    postLocale ({ commit, state }, locale) {
      return Vue.axios.post(
        `${state.apiUrl}${state.account.id}/locale?access_token=${state.session.id}`,
        {
          id: state.account.id,
          locale
        }
      ).then(res => {
        if (res.status === 200) {
          commit('updateAccount', {
            locale: res.data.locale
          })
          console.info('Locale submitted:', res)
        } else console.warn('Failed to submit locale:', res)
        return res.status
      }).catch(error => {
        console.error('Error occurred while submitting locale:', error)
        return error.response.status
      })
    },
    signup ({ state }, params) {
      return Vue.axios.post(state.apiUrl, params).then(res => {
        if (res.status === 200) {
          console.info('Signup successful:', res)
        } else console.warn('Signup failed:', res)
        return res.status
      }).catch(error => {
        console.error('Error occurred while Signup:', error)
        return error.response ? error.response.status : 503
      })
    },
    verify2fa ({ commit, state }, hotp) {
      return Vue.axios.post(
        `${state.apiUrl}${state.account.id}/verify2fa?access_token=${state.session.id}`,
        {
          id: state.account.id,
          hotp
        }
      ).then(res => {
        if (res.status === 200) {
          commit('updateSession', {
            se2faVerified: res.data.se2faVerified
          })
          console.info('2FA code verified:', res)
        } else console.warn('Failed to verify 2FA code:', res)
        return res.status
      }).catch(error => {
        console.error('Error occurred while verifying 2FA code:', error)
        return error.response
      })
    }
  },
  getters: {
    sessionTimeLeft: state => {
      return (
        Date.parse(state.session.created) +
        state.session.timeDelta +
        state.session.ttl
      ) - Date.now()
    }
  },
  mutations: {
    clearSession: state => {
      // Shallow iteration
      for (const k in state.session) {
        if (Object.prototype.hasOwnProperty.call(state.session, k)) {
          state.session[k] = null
        }
      }
      state.session.lastSeen = Date.now()
    },
    setAccount: (state, account) => {
      state.account = account
    },
    setSession: (state, session) => {
      state.session = session
    },
    updateAccount: (state, account) => {
      Object.assign(state.account, account)
    },
    updateSession: (state, session) => {
      Object.assign(state.session, session)
    }
  },
  plugins: [
    createPersistedState({ storage: window.localStorage })
  ],
  state: {
    account: {
      adamantAddress: null,
      id: null,
      locale: null,
      se2faEnabled: null,
      username: null
    },
    apiUrl: getApiUrl(),
    session: {
      created: null, // Created ISO timestamp string
      id: null, // Access token
      lastSeen: null, // Indicates that user had been logged at least once
      timeDelta: null, // Difference between server and client time
      ttl: null, // Time to live, 20 minutes 16 seconds approximately by default
      se2faVerified: null // Indicates that user logged in and passed 2FA
    }
  },
  strict: process.env.NODE_ENV !== 'production'
})

function getApiUrl () {
  return 'http://localhost:3000/api/Accounts/'
  // if (process.env.NODE_ENV === 'production') {
  //   return window.location.host.includes('onion')
  //     ? `http://${window.location.host}/api/Accounts/`
  //     : `https://${window.location.host}/api/Accounts/`
  // } else {
  //   return 'http://localhost:3000/api/Accounts/'
  // }
}
