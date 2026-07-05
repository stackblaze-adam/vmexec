<template>
  <div class="min-h-screen flex items-center justify-center px-4" style="background: var(--bg-app)">
    <div class="card w-full max-w-md p-8">
      <h1 class="text-xl font-bold mb-2">Set up MFA</h1>
      <p class="text-sm mb-4" style="color: var(--text-muted)">Scan this QR code with Google Authenticator or similar.</p>
      <div class="flex justify-center mb-4">
        <img v-if="qr" :src="'data:image/png;base64,' + qr" alt="MFA QR" class="rounded border" style="border-color: var(--border-color)" />
      </div>
      <p class="text-xs font-mono break-all mb-4 p-2 rounded" style="background: var(--bg-app); color: var(--text-muted)">{{ secret }}</p>
      <form @submit.prevent="onVerify">
        <label class="input-label">Verification code</label>
        <input v-model="code" class="w-full mb-4 px-3 py-2 font-mono" maxlength="6" required />
        <p v-if="error" class="text-sm mb-3" style="color: #f87171">{{ error }}</p>
        <button type="submit" class="btn-primary w-full py-2 font-semibold">Enable MFA &amp; continue</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/client'

const auth = useAuthStore()
const router = useRouter()
const qr = ref(auth.mfaSetup?.qr_code || '')
const secret = ref(auth.mfaSetup?.secret || '')
const code = ref('')
const error = ref('')

onMounted(async () => {
  if (!qr.value) {
    try {
      const res = await authApi.mfaSetupStart()
      qr.value = res.qr_code
      secret.value = res.secret
      auth.mfaSetup = res
    } catch (e) {
      error.value = e.message
    }
  }
})

async function onVerify() {
  error.value = ''
  try {
    await auth.completeMfaSetup(code.value)
    router.push('/overview')
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
.p-2 { padding: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.text-xl { font-size: 1.25rem; }
.text-sm { font-size: 0.875rem; }
.text-xs { font-size: 0.75rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-mono { font-family: ui-monospace, monospace; }
.break-all { word-break: break-all; }
.rounded { border-radius: 0.375rem; }
.border { border-width: 1px; }
</style>
