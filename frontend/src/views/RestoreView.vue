<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Restore</h1>
      <button type="button" class="btn-primary px-4 py-2 text-sm font-medium" @click="showDeploy = true">Deploy restore</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="jobs-table">
        <thead>
          <tr>
            <th>Target VM</th>
            <th>Host</th>
            <th>Status</th>
            <th>Progress</th>
            <th>Started</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in restores" :key="r.id">
            <td class="font-semibold">{{ r.target_name }}</td>
            <td class="text-xs">{{ r.target_esxi_host }}</td>
            <td><StatusBadge :cls="restoreClass(r.status)" :label="r.status" /></td>
            <td>
              <div v-if="r.status === 'In Progress'">
                <div class="prog-container active"><div class="prog-bar" :style="{ width: r.progress + '%' }"></div></div>
                <span class="text-xs font-mono">{{ r.progress }}%</span>
              </div>
              <span v-else class="text-xs" style="color: var(--text-muted)">—</span>
            </td>
            <td class="text-xs font-mono" style="color: var(--text-muted)">{{ formatDate(r.start_time) }}</td>
            <td class="text-right">
              <button v-if="r.status === 'In Progress'" type="button" class="btn-danger px-2 py-1 text-xs mr-1" @click="stop(r.id)">Stop</button>
              <button type="button" class="btn-secondary px-2 py-1 text-xs" @click="remove(r.id)">Remove</button>
            </td>
          </tr>
          <tr v-if="!restores.length"><td colspan="6" class="py-10 text-center" style="color: var(--text-muted)">No restore jobs</td></tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDeploy" class="inventory-drawer">
      <div class="inventory-drawer-backdrop" @click="showDeploy = false"></div>
      <div class="inventory-drawer-panel">
        <div class="inventory-drawer-header">
          <h2 class="font-bold">Deploy restore</h2>
          <button type="button" class="inventory-drawer-close" @click="showDeploy = false">×</button>
        </div>
        <form class="p-4 space-y-4 overflow-auto" @submit.prevent="submitRestore">
          <div>
            <label class="input-label">Backup source</label>
            <select v-model="form.source_ova" class="w-full py-2 px-3 text-sm" required>
              <option value="">Select backup…</option>
              <option v-for="opt in backupOptions" :key="opt" :value="opt">{{ opt }}</option>
            </select>
          </div>
          <div>
            <label class="input-label">Target ESXi host</label>
            <select v-model="form.target_esxi_id" class="w-full py-2 px-3 text-sm" required @change="loadDatastores">
              <option v-for="h in hosts" :key="h.id" :value="h.id">{{ h.name }}</option>
            </select>
          </div>
          <div>
            <label class="input-label">Datastore</label>
            <select v-model="form.datastore" class="w-full py-2 px-3 text-sm" required>
              <option v-for="ds in datastores" :key="ds" :value="ds">{{ ds }}</option>
            </select>
          </div>
          <div>
            <label class="input-label">New VM name</label>
            <input v-model="form.target_name" class="w-full py-2 px-3 text-sm" required />
          </div>
          <p v-if="error" class="text-sm" style="color: #f87171">{{ error }}</p>
          <div class="inventory-drawer-footer-actions">
            <button type="button" class="btn-secondary px-4 py-2" @click="showDeploy = false">Cancel</button>
            <button type="submit" class="btn-primary px-4 py-2">Start restore</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { restoreApi, hostsApi } from '@/api/client'
import { formatDate } from '@/composables/useJobProgress'
import StatusBadge from '@/components/StatusBadge.vue'

const restores = ref([])
const hosts = ref([])
const backups = ref([])
const datastores = ref([])
const showDeploy = ref(false)
const error = ref('')
const form = ref({ source_ova: '', target_esxi_id: null, datastore: '', target_name: '' })
let timer = null

const backupOptions = computed(() => {
  const opts = []
  for (const g of backups.value || []) {
    for (const v of g.versions || []) {
      opts.push(`${g.vm_name}/${v.path}`)
    }
  }
  return opts
})

function restoreClass(s) {
  if (s === 'Success') return 'status-success'
  if (s === 'Failed') return 'status-error'
  if (s === 'In Progress') return 'status-running'
  return 'status-neutral'
}

async function load() {
  const [r, h, b] = await Promise.all([restoreApi.list(), hostsApi.list(), restoreApi.backups()])
  restores.value = r
  hosts.value = h
  backups.value = b
  if (h.length && !form.value.target_esxi_id) {
    form.value.target_esxi_id = h[0].id
    await loadDatastores()
  }
}

async function loadDatastores() {
  if (!form.value.target_esxi_id) return
  const ds = await hostsApi.datastores(form.value.target_esxi_id)
  datastores.value = ds.datastores || ds || []
  if (datastores.value.length) form.value.datastore = datastores.value[0]
}

async function submitRestore() {
  error.value = ''
  try {
    await restoreApi.create(form.value)
    showDeploy.value = false
    await load()
  } catch (e) {
    error.value = e.message
  }
}

async function stop(id) { await restoreApi.stop(id); await load() }
async function remove(id) { await restoreApi.remove(id); await load() }

onMounted(() => {
  load()
  timer = setInterval(load, 3000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.w-full { width: 100%; }
.p-4 { padding: 1rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-10 { padding-top: 2.5rem; padding-bottom: 2.5rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mr-1 { margin-right: 0.25rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-2xl { font-size: 1.5rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, monospace; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.overflow-auto { overflow: auto; }
.overflow-x-auto { overflow-x: auto; }
.space-y-4 > * + * { margin-top: 1rem; }
</style>
