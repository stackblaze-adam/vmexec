<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Account</h1>
    <div class="flex gap-6 items-start max-md:flex-col">
      <nav class="flex flex-col gap-1 min-w-[160px]">
        <RouterLink
          to="/account/profile"
          class="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-muted rounded-md no-underline transition-[color,background] duration-150 hover:text-main hover:bg-btn-sec-hover router-link-active:text-brand router-link-active:bg-brand/10 router-link-active:font-semibold"
        >Profile</RouterLink>
        <RouterLink
          v-if="auth.isAdmin"
          to="/account/api"
          class="flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium text-muted rounded-md no-underline transition-[color,background] duration-150 hover:text-main hover:bg-btn-sec-hover router-link-active:text-brand router-link-active:bg-brand/10 router-link-active:font-semibold"
        >API Keys</RouterLink>
      </nav>
      <div class="flex-1">
        <div v-if="panel === 'profile'" class="rounded-lg border border-border bg-card shadow-card transition-all duration-300 p-6 space-y-4 max-w-lg">
          <h2 class="font-semibold">Profile</h2>
          <div>
            <label class="block text-xs font-semibold uppercase text-muted mb-1">Email</label>
            <input v-model="profile.email" class="w-full py-2 px-3 text-sm" />
          </div>
          <div>
            <label class="block text-xs font-semibold uppercase text-muted mb-1">Notifications</label>
            <div v-for="ev in auth.notifyEvents" :key="ev[0]" class="flex items-center gap-2 text-sm py-1">
              <input type="checkbox" :checked="subs.includes(ev[0])" @change="toggleSub(ev[0], $event.target.checked)" />
              {{ ev[1] }}
            </div>
          </div>
          <button type="button" class="inline-flex items-center justify-center gap-1.5 rounded-md border-0 bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-55 disabled:cursor-not-allowed transition-[background-color] duration-200" @click="save">Save profile</button>
          <p v-if="msg" class="text-sm text-emerald-400">{{ msg }}</p>
        </div>

        <div v-else-if="panel === 'api' && auth.isAdmin" class="rounded-lg border border-border bg-card shadow-card transition-all duration-300 p-6">
          <div class="flex justify-between mb-4">
            <h2 class="font-semibold">API keys</h2>
            <button type="button" class="inline-flex items-center justify-center gap-1.5 rounded-md border-0 bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-55 disabled:cursor-not-allowed transition-[background-color] duration-200" @click="createKey">Create key</button>
          </div>
          <div v-for="k in keys" :key="k.id" class="flex justify-between py-2 border-b border-border">
            <span>{{ k.name }} <span class="text-xs text-muted">{{ k.created_at }}</span></span>
            <button type="button" class="inline-flex items-center justify-center gap-1.5 rounded-md border border-btn-sec-border bg-btn-sec px-2 py-1 text-xs text-btn-sec-text hover:bg-btn-sec-hover transition-[background-color] duration-200" @click="revoke(k.id)">Revoke</button>
          </div>
          <p v-if="newKey" class="text-sm mt-4 p-3 rounded font-mono break-all bg-brand/10 text-brand">{{ newKey }}</p>
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
