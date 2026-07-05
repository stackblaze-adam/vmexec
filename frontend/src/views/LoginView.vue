<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background: var(--bg-app)">
    <div class="card w-full max-w-md p-8">
      <h1 class="text-2xl font-bold mb-2">VMExec</h1>
      <p class="text-sm mb-6" style="color: var(--text-muted)">Sign in to manage backups</p>

      <form v-if="step === 'password'" @submit.prevent="onLogin">
        <label class="input-label">Username</label>
        <input v-model="username" class="w-full mb-4 px-3 py-2" required autocomplete="username" />
        <label class="input-label">Password</label>
        <input v-model="password" type="password" class="w-full mb-4 px-3 py-2" required autocomplete="current-password" />
        <p v-if="error" class="text-sm mb-3" style="color: #f87171">{{ error }}</p>
        <button type="submit" class="btn-primary w-full py-2 font-semibold" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <form v-else @submit.prevent="onMfa">
        <p class="text-sm mb-4" style="color: var(--text-muted)">Enter the code from your authenticator for <strong>{{ auth.mfaPendingUser }}</strong></p>
        <label class="input-label">Authenticator code</label>
        <input v-model="mfaCode" class="w-full mb-4 px-3 py-2 font-mono tracking-widest" maxlength="6" required autocomplete="one-time-code" />
        <p v-if="error" class="text-sm mb-3" style="color: #f87171">{{ error }}</p>
        <button type="submit" class="btn-primary w-full py-2 font-semibold">Verify</button>
        <button type="button" class="btn-secondary w-full py-2 mt-2" @click="step = 'password'; error = ''">Back</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const username = ref('')
const password = ref('')
const mfaCode = ref('')
const step = ref('password')
const error = ref('')

async function onLogin() {
  error.value = ''
  try {
    const result = await auth.login(username.value, password.value)
    if (result === 'mfa') {
      step.value = 'mfa'
      return
    }
    if (result === 'setup') {
      router.push('/mfa-setup')
      return
    }
    router.push(route.query.redirect || '/overview')
  } catch (e) {
    error.value = e.message
  }
}

async function onMfa() {
  error.value = ''
  try {
    await auth.submitMfa(mfaCode.value)
    router.push(route.query.redirect || '/overview')
  } catch (e) {
    error.value = e.message
  }
}
</script>

<style scoped>
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-center { justify-content: center; }
.w-full { width: 100%; }
.max-w-md { max-width: 28rem; }
.p-8 { padding: 2rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-2 { margin-top: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.text-2xl { font-size: 1.5rem; }
.text-sm { font-size: 0.875rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-mono { font-family: ui-monospace, monospace; }
.tracking-widest { letter-spacing: 0.1em; }
</style>
