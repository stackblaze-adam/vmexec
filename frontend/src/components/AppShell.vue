<template>
  <div class="min-h-screen flex flex-col">
    <header class="nav-bar sticky top-0 z-40">
      <div class="nav-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="nav-brand">
          <span class="vmexec-wordmark"><span class="vmexec-wordmark-vm">VM</span><span class="vmexec-wordmark-exec">Exec</span></span>
        </div>
        <nav class="nav-primary hidden md:flex">
          <RouterLink v-for="t in tabs" :key="t.to" :to="t.to" class="tab-nav" :class="{ 'border-brand text-brand': isActive(t.to) }" :style="linkStyle(t.to)">
            {{ t.label }}
          </RouterLink>
        </nav>
        <div class="nav-utilities">
          <select v-model="theme" class="text-xs py-1 px-2" @change="applyTheme">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="cyberpunk">Cyberpunk</option>
          </select>
          <div class="nav-user-wrap hidden md:block">
            <button type="button" class="nav-user-btn" @click="menuOpen = !menuOpen">
              <span class="nav-user-avatar">{{ initials }}</span>
              <span>{{ auth.user?.username }}</span>
            </button>
            <div class="nav-user-menu" :class="{ hidden: !menuOpen }">
              <div class="nav-user-menu-header">Account</div>
              <RouterLink to="/account/profile" class="nav-user-item" @click="menuOpen = false">Profile</RouterLink>
              <RouterLink v-if="auth.isAdmin" to="/account/api" class="nav-user-item" @click="menuOpen = false">API Keys</RouterLink>
              <div class="nav-user-menu-divider"></div>
              <button type="button" class="nav-user-signout" @click="signOut">Sign out</button>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <RouterView />
    </main>

    <footer class="app-footer mt-auto">
      <div class="app-footer-inner max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="app-footer-meta">
          <span>VMExec — VM Backup &amp; Disaster Recovery</span>
        </div>
      </div>
    </footer>

    <ConfirmModal />
    <SetupWizard v-if="auth.isAdmin" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSetupWizard } from '@/composables/useSetupWizard'
import ConfirmModal from '@/components/ConfirmModal.vue'
import SetupWizard from '@/components/SetupWizard.vue'

const auth = useAuthStore()
const { open: openSetupWizard } = useSetupWizard()
const route = useRoute()
const router = useRouter()
const menuOpen = ref(false)
const theme = ref(localStorage.getItem('userTheme') || 'light')

const tabs = [
  { to: '/overview', label: 'Overview' },
  { to: '/backup', label: 'Backup' },
  { to: '/restore', label: 'Restore' },
  { to: '/settings/storage', label: 'Settings' },
]

const initials = computed(() => (auth.user?.username || '?').slice(0, 2).toUpperCase())

function isActive(path) {
  if (path.startsWith('/settings')) return route.path.startsWith('/settings')
  return route.path === path || route.path.startsWith(path + '/')
}

function linkStyle(path) {
  return isActive(path) ? { borderColor: 'var(--brand)', color: 'var(--brand)' } : { color: 'var(--text-muted)' }
}

function applyTheme() {
  localStorage.setItem('userTheme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

async function signOut() {
  await auth.logout()
  router.push('/login')
}

onMounted(async () => {
  if (!auth.user) await auth.bootstrap()
  applyTheme()
  if (auth.isAdmin && auth.setupSuggested && !localStorage.getItem('setup_wizard_done')) {
    setTimeout(() => openSetupWizard(), 300)
  }
})
</script>

<style scoped>
.border-brand { border-bottom-color: var(--brand) !important; }
.text-brand { color: var(--brand) !important; }
.min-h-screen { min-height: 100vh; }
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.hidden { display: none; }
.sticky { position: sticky; }
.top-0 { top: 0; }
.z-40 { z-index: 40; }
.w-full { width: 100%; }
.mx-auto { margin-left: auto; margin-right: auto; }
.max-w-7xl { max-width: 80rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.mt-auto { margin-top: auto; }
@media (min-width: 768px) {
  .md\:flex { display: flex; }
  .md\:block { display: block; }
}
</style>
