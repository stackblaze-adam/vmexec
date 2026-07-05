<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Account</h1>
    <div class="settings-layout">
      <nav class="flex flex-col gap-1 min-w-[160px]">
        <RouterLink to="/account/profile" class="settings-nav-item px-3 py-2 text-sm rounded">Profile</RouterLink>
        <RouterLink v-if="auth.isAdmin" to="/account/api" class="settings-nav-item px-3 py-2 text-sm rounded">API Keys</RouterLink>
      </nav>
      <div class="flex-1">
        <div v-if="panel === 'profile'" class="card p-6 space-y-4 max-w-lg">
          <h2 class="font-semibold">Profile</h2>
          <div>
            <label class="input-label">Email</label>
            <input v-model="profile.email" class="w-full py-2 px-3 text-sm" />
          </div>
          <div>
            <label class="input-label">Notifications</label>
            <div v-for="ev in auth.notifyEvents" :key="ev[0]" class="flex items-center gap-2 text-sm py-1">
              <input type="checkbox" :checked="subs.includes(ev[0])" @change="toggleSub(ev[0], $event.target.checked)" />
              {{ ev[1] }}
            </div>
          </div>
          <button type="button" class="btn-primary px-4 py-2 text-sm" @click="save">Save profile</button>
          <p v-if="msg" class="text-sm" style="color: #34d399">{{ msg }}</p>
        </div>

        <div v-else-if="panel === 'api' && auth.isAdmin" class="card p-6">
          <div class="flex justify-between mb-4">
            <h2 class="font-semibold">API keys</h2>
            <button type="button" class="btn-primary px-3 py-1.5 text-sm" @click="createKey">Create key</button>
          </div>
          <div v-for="k in keys" :key="k.id" class="flex justify-between py-2 border-b" style="border-color: var(--border-color)">
            <span>{{ k.name }} <span class="text-xs" style="color: var(--text-muted)">{{ k.created_at }}</span></span>
            <button type="button" class="btn-secondary px-2 py-1 text-xs" @click="revoke(k.id)">Revoke</button>
          </div>
          <p v-if="newKey" class="text-sm mt-4 p-3 rounded font-mono break-all" style="background: rgba(59,130,246,0.1); color: var(--brand)">{{ newKey }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { profileApi, keysApi } from '@/api/client'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({ panel: { type: String, default: 'profile' } })
const route = useRoute()
const auth = useAuthStore()
const panel = computed(() => props.panel || route.params.panel || 'profile')
const profile = ref({ email: '', notify_subscriptions: '' })
const subs = ref([])
const keys = ref([])
const msg = ref('')
const newKey = ref('')

function toggleSub(key, on) {
  const set = new Set(subs.value)
  if (on) set.add(key)
  else set.delete(key)
  subs.value = [...set]
  profile.value.notify_subscriptions = subs.value.join(',')
}

async function load() {
  await auth.bootstrap()
  profile.value.email = auth.user?.email || ''
  subs.value = (auth.user?.notify_subscriptions || '').split(',').filter(Boolean)
  if (panel.value === 'api') keys.value = await keysApi.list()
}

async function save() {
  profile.value.notify_subscriptions = subs.value.join(',')
  await profileApi.update(profile.value)
  msg.value = 'Profile saved.'
}

async function createKey() {
  const name = prompt('Key name') || 'default'
  const r = await keysApi.create({ name })
  newKey.value = r.key
  keys.value = await keysApi.list()
}

async function revoke(id) {
  if (!confirm('Revoke this key?')) return
  await keysApi.revoke(id)
  keys.value = await keysApi.list()
}

onMounted(load)
</script>

<style scoped>
.settings-nav-item { display: block; text-decoration: none; color: var(--text-muted); }
.settings-nav-item.router-link-active { background: var(--btn-sec-hover); color: var(--brand); font-weight: 600; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-4 { margin-top: 1rem; }
.p-3 { padding: 0.75rem; }
.p-6 { padding: 1.5rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-2xl { font-size: 1.5rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-mono { font-family: ui-monospace, monospace; }
.w-full { width: 100%; }
.max-w-lg { max-width: 32rem; }
.min-w-\[160px\] { min-width: 160px; }
.rounded { border-radius: 0.375rem; }
.border-b { border-bottom-width: 1px; }
.break-all { word-break: break-all; }
.space-y-4 > * + * { margin-top: 1rem; }
</style>
