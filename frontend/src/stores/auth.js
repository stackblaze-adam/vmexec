import { defineStore } from 'pinia'
import { authApi } from '@/api/client'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    setupSuggested: false,
    notifyEvents: [],
    loading: false,
    mfaPendingUser: '',
    mfaSetup: null,
  }),
  getters: {
    isAdmin: (s) => (s.user?.role || 'admin') === 'admin',
    isOperator: (s) => ['admin', 'operator'].includes(s.user?.role || 'admin'),
    isAuthenticated: (s) => !!s.user,
  },
  actions: {
    async fetchMe() {
      this.user = await authApi.me()
      return this.user
    },
    async bootstrap() {
      const data = await authApi.bootstrap()
      this.user = data.user
      this.setupSuggested = data.setup_wizard_suggested
      this.notifyEvents = data.notify_events || []
      return data
    },
    async login(username, password) {
      this.loading = true
      try {
        const res = await authApi.login({ username, password })
        if (res.status === 'mfa_required') {
          this.mfaPendingUser = res.username
          return 'mfa'
        }
        if (res.status === 'mfa_setup_required') {
          this.mfaSetup = { qr_code: res.qr_code, secret: res.secret }
          this.mfaPendingUser = res.username
          return 'setup'
        }
        await this.bootstrap()
        return 'ok'
      } finally {
        this.loading = false
      }
    },
    async submitMfa(code) {
      await authApi.mfa({ mfa_code: code })
      this.mfaPendingUser = ''
      await this.bootstrap()
    },
    async completeMfaSetup(code) {
      if (!this.mfaSetup?.secret) throw new Error('MFA setup not started')
      await authApi.mfaSetupComplete({ secret: this.mfaSetup.secret, mfa_code: code })
      this.mfaSetup = null
      this.mfaPendingUser = ''
      await this.bootstrap()
    },
    async logout() {
      await authApi.logout()
      this.$reset()
    },
  },
})
