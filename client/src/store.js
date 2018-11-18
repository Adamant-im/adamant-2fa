import createPersistedState from 'vuex-persistedstate'
import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export default new Vuex.Store({
  actions: {
    getAccountData: ({ commit, state }) => {
      Vue.axios.get(state.apiUrl + state.session.userId, {
        params: { access_token: state.session.id }
      })
        .then(res => {
          if (res.status === 200) {
            commit('SET_ACCOUNT', res.data)
          } else console.warn(res)
        })
        .catch(err => console.error(err))
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
    CLEAR_SESSION: state => {
      for (let k in state.session) { // Shallow iteration
        state.session[k] = null
      }
    },
    SET_ACCOUNT: (state, account) => {
      state.account = account
    },
    SET_SESSION: (state, session) => {
      state.session = session
    }
  },
  plugins: [
    createPersistedState({
      storage: window.sessionStorage
    })
  ],
  state: {
    account: {
      adamantAddress: null,
      id: null,
      username: null
    },
    session: {
      created: null,
      id: null,
      hotp: null,
      timeDelta: null, // Difference between server and client time
      ttl: null,
      userId: null
    },
    apiUrl: 'http://localhost:3000/api/Accounts/'
  }
})
