<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
      <div class="flex items-center gap-3">
        <h1 class="text-2xl font-bold">Backup</h1>
        <button type="button" :class="paused ? 'btn-secondary' : 'btn-danger'" class="px-3 py-1.5 text-xs font-medium" @click="togglePause(!paused)">
          {{ paused ? 'Resume all' : 'Pause all' }}
        </button>
      </div>
      <button type="button" class="btn-secondary px-3 py-1.5 text-sm" @click="showInventory = true">Inventory</button>
    </div>

    <div v-if="paused" class="jobs-paused-banner">
      <span class="text-sm">All backups are paused</span>
      <button type="button" class="btn-secondary px-3 py-1 text-xs" @click="togglePause(false)">Resume all</button>
    </div>

    <div class="flex flex-wrap gap-3 mb-4">
      <input v-model="search" type="text" placeholder="Search VMs…" class="flex-1 min-w-[200px] px-3 py-2 text-sm" />
      <select v-model="stateFilter" class="py-2 px-3 text-sm">
        <option value="all">All States</option>
        <option value="active">Currently Running</option>
        <option value="scheduled">Scheduled</option>
        <option value="error">Failed</option>
        <option value="success">Successful</option>
      </select>
      <select v-model="copyFilter" class="py-2 px-3 text-sm">
        <option value="all">2nd Copy: All</option>
        <option value="ok">2nd Copy: OK</option>
        <option value="failed">2nd Copy: Failed</option>
        <option value="skipped">2nd Copy: Skipped</option>
        <option value="copying">2nd Copy: Copying</option>
        <option value="none">2nd Copy: N/A</option>
      </select>
    </div>

    <div v-if="selectedIds.size" class="jobs-bulk-bar">
      <span class="text-sm font-medium">{{ selectedIds.size }} selected</span>
      <button type="button" class="btn-primary px-3 py-1.5 text-xs font-medium" @click="runSelected">Run selected</button>
      <button type="button" class="btn-danger px-3 py-1.5 text-xs font-medium" @click="abortSelected">Abort selected</button>
      <button type="button" class="btn-secondary px-3 py-1.5 text-xs font-medium" @click="pauseSelected">Pause selected</button>
      <button type="button" class="btn-secondary px-3 py-1.5 text-xs font-medium hover-text-red" @click="removeSelected">Remove selected</button>
      <button type="button" class="text-xs font-medium opacity-60" @click="clearSelection">Clear</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="jobs-table">
        <thead>
          <tr>
            <th class="w-10 text-center">
              <input ref="selectAllRef" type="checkbox" class="job-row-cb" :checked="allVisibleSelected" @change="toggleSelectAll" />
            </th>
            <th class="jobs-sort-th" :class="{ active: sortKey === 'name' }" @click="setSort('name')">Virtual Machine<span class="jobs-sort-ind">{{ sortInd('name') }}</span></th>
            <th class="jobs-sort-th" :class="{ active: sortKey === 'host' }" @click="setSort('host')">Host<span class="jobs-sort-ind">{{ sortInd('host') }}</span></th>
            <th class="jobs-sort-th" :class="{ active: sortKey === 'status' }" @click="setSort('status')">Status<span class="jobs-sort-ind">{{ sortInd('status') }}</span></th>
            <th class="jobs-sort-th" :class="{ active: sortKey === 'secondarycopy' }" @click="setSort('secondarycopy')">2nd Copy<span class="jobs-sort-ind">{{ sortInd('secondarycopy') }}</span></th>
            <th>Progress</th>
            <th class="jobs-sort-th" :class="{ active: sortKey === 'lastbackup' }" @click="setSort('lastbackup')">Last Backup<span class="jobs-sort-ind">{{ sortInd('lastbackup') }}</span></th>
            <th class="jobs-sort-th" :class="{ active: sortKey === 'schedule' }" @click="setSort('schedule')">Schedule<span class="jobs-sort-ind">{{ sortInd('schedule') }}</span></th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="vm in sorted" :key="vm.id" class="vm-job-row">
            <td class="text-center">
              <input type="checkbox" class="job-row-cb" :checked="selectedIds.has(vm.id)" @change="toggleSelect(vm.id, $event.target.checked)" />
            </td>
            <td>
              <div class="font-semibold">{{ vm.vm_name }}</div>
              <div class="text-xs" style="color: var(--text-muted)">{{ vm.cpu_count }} vCPU · {{ Math.round((vm.memory_mb || 0) / 1024) }}GB · {{ vm.storage_gb }}GB</div>
            </td>
            <td class="text-xs font-mono" style="color: var(--brand)">{{ vm.host_name || '—' }}</td>
            <td>
              <StatusBadge v-bind="rowStatus(vm)" />
              <span v-if="vm.is_job_active" class="ml-1 text-xs opacity-60">scheduled</span>
              <span v-else-if="vm.is_selected" class="ml-1 text-xs opacity-60">paused</span>
            </td>
            <td><StatusBadge v-bind="rowCopy(vm)" /></td>
            <td class="min-w-[140px]">
              <div v-if="isActive(vm)">
                <div class="flex justify-between text-xs mb-1">
                  <span class="truncate max-w-[120px]" style="color: var(--brand)">{{ progressText(vm) }}</span>
                  <span class="font-mono">{{ liveProgress(vm).progress }}%</span>
                </div>
                <div class="prog-container active"><div class="prog-bar" :style="{ width: liveProgress(vm).progress + '%' }"></div></div>
              </div>
              <span v-else class="text-xs" style="color: var(--text-muted)">—</span>
            </td>
            <td class="text-xs font-mono whitespace-nowrap" style="color: var(--text-muted)">{{ formatDate(liveProgress(vm).last_backup_ts ? liveProgress(vm).last_backup_ts : vm.last_backup) }}</td>
            <td class="text-xs whitespace-nowrap">{{ scheduleLabel(vm) }}</td>
            <td class="text-right whitespace-nowrap actions-cell">
              <div class="inline-flex gap-1 items-center justify-end">
                <button v-if="isActive(vm)" type="button" class="btn-danger px-2 py-1 text-xs" @click="stopJob(vm.id)">Stop</button>
                <button v-else type="button" class="btn-primary px-2 py-1 text-xs" :disabled="!auth.isOperator" @click="runJob(vm.id)">Run</button>
                <div class="relative job-actions-wrap">
                  <button type="button" class="btn-secondary p-1.5 rounded" title="Schedule settings" @click="toggleScheduleMenu(vm.id)">⏱</button>
                  <div v-if="openScheduleId === vm.id" class="job-actions-menu">
                    <div class="job-actions-menu-header">Schedule</div>
                    <JobSchedulePopover :vm="vm" @updated="onVmUpdated" />
                  </div>
                </div>
                <button type="button" class="btn-secondary p-1.5 rounded hover-text-red" title="Remove from tasks" @click="removeVm(vm)">🗑</button>
              </div>
            </td>
          </tr>
          <tr v-if="!sorted.length">
            <td colspan="9" class="py-12 text-center" style="color: var(--text-muted)">
              <div v-if="!jobs.length" class="text-sm font-medium mb-1">No backup tasks configured</div>
              <div v-if="!jobs.length" class="text-xs opacity-70 mb-3">Select VMs in Inventory, then apply selection.</div>
              <button v-if="!jobs.length" type="button" class="btn-secondary px-3 py-1.5 text-xs font-semibold" @click="showInventory = true">Open Inventory</button>
              <span v-else>No VMs match your filters</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Inventory drawer -->
    <div v-if="showInventory" class="inventory-drawer">
      <div class="inventory-drawer-backdrop" @click="showInventory = false"></div>
      <div class="inventory-drawer-panel">
        <div class="inventory-drawer-header">
          <h2 class="font-bold">Backup inventory</h2>
          <button type="button" class="inventory-drawer-close" @click="showInventory = false">×</button>
        </div>
        <div class="inventory-drawer-body">
          <div class="px-4 py-3 border-b" style="border-color: var(--border-color); background: var(--bg-nav)">
            <div class="flex flex-col gap-2">
              <select v-model="scanHostId" class="py-2 px-3 text-xs rounded w-full">
                <option v-for="h in hosts" :key="h.id" :value="h.id">{{ h.name }} ({{ h.host_ip }})</option>
              </select>
              <button type="button" class="btn-primary px-3 py-2 text-xs font-semibold w-full" @click="syncHost">Scan datacenter</button>
            </div>
          </div>
          <div class="inventory-scroll overflow-auto flex-1">
            <table class="min-w-full text-left text-xs">
              <thead style="background-color: var(--bg-nav); border-bottom: 1px solid var(--border-color)">
                <tr>
                  <th class="px-3 py-2 w-12 text-center"><input type="checkbox" class="job-row-cb" :checked="inventoryAllSelected" @change="toggleInventoryAll" /></th>
                  <th class="px-3 py-2 w-20 text-center">Power</th>
                  <th class="px-3 py-2">Virtual Machine</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="vm in allVms" :key="vm.id">
                  <td class="px-3 py-2 text-center"><input type="checkbox" class="job-row-cb" :checked="vm.is_selected" @change="toggleInventoryVm(vm, $event.target.checked)" /></td>
                  <td class="px-3 py-2 text-center"><StatusBadge :cls="powerCls(vm.power_state)" :label="powerLabel(vm.power_state)" /></td>
                  <td class="px-3 py-2">
                    <div class="font-medium truncate">{{ vm.vm_name }}</div>
                    <div class="text-[10px] font-mono opacity-60 truncate">{{ vm.host_name }}</div>
                  </td>
                </tr>
                <tr v-if="!allVms.length"><td colspan="3" class="px-3 py-8 text-center" style="color: var(--text-muted)">No inventory. Run a scan.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="inventory-drawer-footer">
          <div class="inventory-drawer-footer-actions">
            <button type="button" class="btn-secondary px-3 py-1.5 text-sm" @click="showInventory = false">Cancel</button>
            <button type="button" class="btn-primary px-3 py-1.5 text-sm" @click="applyInventory">Apply selection ({{ inventoryPendingCount }})</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { jobsApi, hostsApi } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useJobProgress, isJobActive, statusBadge, copyBadge, formatDate } from '@/composables/useJobProgress'
import { useModal } from '@/composables/useModal'
import StatusBadge from '@/components/StatusBadge.vue'
import JobSchedulePopover from '@/components/JobSchedulePopover.vue'

const auth = useAuthStore()
const { confirm, alert } = useModal()
const allVms = ref([])
const hosts = ref([])
const progressMap = ref({})
const paused = ref(false)
const search = ref('')
const stateFilter = ref('all')
const copyFilter = ref('all')
const showInventory = ref(false)
const scanHostId = ref(null)
const pendingSelection = ref({})
const selectedIds = ref(new Set())
const sortKey = ref('schedule')
const sortDir = ref('asc')
const openScheduleId = ref(null)
const selectAllRef = ref(null)

useJobProgress((data) => { progressMap.value = data })

const jobs = computed(() => allVms.value.filter((v) => v.is_selected))

function liveProgress(vm) {
  return progressMap.value[vm.id] || {
    progress: vm.progress,
    current_action: vm.current_action,
    speed_mbps: 0,
    last_status: vm.last_status,
    last_backup_ts: vm.last_backup ? new Date(vm.last_backup).getTime() / 1000 : 0,
    secondary_copy_status: vm.last_secondary_copy_status,
  }
}

function isActive(vm) {
  return isJobActive(liveProgress(vm))
}

function rowStatus(vm) {
  const p = liveProgress(vm)
  const b = statusBadge(p.last_status || vm.last_status, isActive(vm))
  return { cls: b.cls, label: b.label }
}

function rowCopy(vm) {
  const p = liveProgress(vm)
  const b = copyBadge(p.secondary_copy_status || vm.last_secondary_copy_status)
  return { cls: b.cls, label: b.label }
}

function progressText(vm) {
  const p = liveProgress(vm)
  const speed = p.speed_mbps > 0 ? ` · ${p.speed_mbps} MB/s` : ''
  return (p.current_action || 'Processing…') + speed
}

function scheduleLabel(vm) {
  const freq = (vm.schedule_frequency || 'daily').replace(/^./, (c) => c.toUpperCase())
  const h = String(vm.schedule_hour).padStart(2, '0')
  const m = String(vm.schedule_minute).padStart(2, '0')
  const cbt = vm.cbt_enabled !== false ? 'CBT' : 'full'
  return `${freq} ${h}:${m} · keep ${vm.retention_count} · ${cbt}`
}

function statusSort(vm) {
  if (isActive(vm)) return '0-running'
  const s = vm.last_status || 'None'
  if (s === 'Failed') return '1-failed'
  if (s === 'Cancelled') return '2-cancelled'
  if (s === 'Success') return '3-success'
  if (s === 'Skipped') return '4-skipped'
  return '5-idle'
}

function copySort(vm) {
  const sc = (liveProgress(vm).secondary_copy_status || vm.last_secondary_copy_status || 'none').toLowerCase()
  if (sc === 'copying') return '0-copying'
  if (sc === 'failed') return '1-failed'
  if (sc === 'none') return '2-none'
  if (sc === 'skipped') return '3-skipped'
  if (sc === 'ok') return '4-ok'
  return '2-none'
}

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return jobs.value.filter((vm) => {
    if (!vm.vm_name.toLowerCase().includes(q)) return false
    const p = liveProgress(vm)
    const active = isActive(vm)
    const copy = (p.secondary_copy_status || vm.last_secondary_copy_status || 'none').toLowerCase()
    const status = p.last_status || vm.last_status
    if (stateFilter.value === 'active' && !active) return false
    if (stateFilter.value === 'scheduled' && !vm.is_job_active) return false
    if (stateFilter.value === 'error' && status !== 'Failed') return false
    if (stateFilter.value === 'success' && status !== 'Success') return false
    if (copyFilter.value !== 'all' && copy !== copyFilter.value) return false
    return true
  })
})

const sorted = computed(() => {
  const list = [...filtered.value]
  const dir = sortDir.value === 'asc' ? 1 : -1
  list.sort((a, b) => {
    let av; let bv
    if (sortKey.value === 'name') {
      av = a.vm_name.toLowerCase(); bv = b.vm_name.toLowerCase()
    } else if (sortKey.value === 'host') {
      av = (a.host_name || '').toLowerCase(); bv = (b.host_name || '').toLowerCase()
    } else if (sortKey.value === 'lastbackup') {
      av = a.last_backup ? new Date(a.last_backup).getTime() : 0
      bv = b.last_backup ? new Date(b.last_backup).getTime() : 0
    } else if (sortKey.value === 'status') {
      av = statusSort(a); bv = statusSort(b)
    } else if (sortKey.value === 'secondarycopy') {
      av = copySort(a); bv = copySort(b)
    } else if (sortKey.value === 'schedule') {
      av = (a.schedule_hour || 0) * 60 + (a.schedule_minute || 0)
      bv = (b.schedule_hour || 0) * 60 + (b.schedule_minute || 0)
    } else return 0
    if (av < bv) return -1 * dir
    if (av > bv) return 1 * dir
    return 0
  })
  return list
})

const allVisibleSelected = computed(() => sorted.value.length > 0 && sorted.value.every((v) => selectedIds.value.has(v.id)))
const inventoryAllSelected = computed(() => allVms.value.length > 0 && allVms.value.every((v) => v.is_selected))
const inventoryPendingCount = computed(() => Object.keys(pendingSelection.value).length)

watch(allVisibleSelected, (all) => {
  if (selectAllRef.value) selectAllRef.value.indeterminate = selectedIds.value.size > 0 && !all
})

function setSort(key) {
  if (sortKey.value === key) sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  else { sortKey.value = key; sortDir.value = 'asc' }
}

function sortInd(key) {
  return sortKey.value === key ? (sortDir.value === 'asc' ? '↑' : '↓') : ''
}

function toggleSelect(id, checked) {
  const s = new Set(selectedIds.value)
  if (checked) s.add(id); else s.delete(id)
  selectedIds.value = s
}

function toggleSelectAll(e) {
  const s = new Set(selectedIds.value)
  sorted.value.forEach((v) => { if (e.target.checked) s.add(v.id); else s.delete(v.id) })
  selectedIds.value = s
}

function clearSelection() {
  selectedIds.value = new Set()
}

function toggleScheduleMenu(id) {
  openScheduleId.value = openScheduleId.value === id ? null : id
}

function onVmUpdated(updated) {
  const idx = allVms.value.findIndex((v) => v.id === updated.id)
  if (idx >= 0) allVms.value[idx] = { ...allVms.value[idx], ...updated }
}

function powerCls(s) {
  if (s === 'poweredOn') return 'status-success'
  return 'status-neutral'
}

function powerLabel(s) {
  if (s === 'poweredOn') return 'ON'
  if (s === 'poweredOff') return 'OFF'
  return s || '?'
}

async function load() {
  const [vms, h, sched] = await Promise.all([jobsApi.vms(), hostsApi.list(), jobsApi.scheduler()])
  allVms.value = vms
  hosts.value = h
  paused.value = sched.paused
  if (h.length && !scanHostId.value) scanHostId.value = h[0].id
}

async function runJob(id) {
  await jobsApi.run(id)
  await load()
}

async function stopJob(id) {
  await jobsApi.stop(id)
}

async function togglePause(p) {
  if (p) await jobsApi.pauseAll()
  else await jobsApi.resumeAll()
  paused.value = p
}

async function removeVm(vm) {
  const running = isActive(vm)
  const msg = running
    ? `${vm.vm_name} has a backup running. Remove from tasks anyway?`
    : `Remove ${vm.vm_name} from backup tasks? You can re-enable it from Inventory.`
  const ok = await confirm(msg, { title: 'Remove from tasks', confirmText: 'Remove', danger: true })
  if (!ok) return
  await jobsApi.patch(vm.id, { is_selected: false, is_job_active: false })
  selectedIds.value.delete(vm.id)
  await load()
}

async function runSelected() {
  const ids = [...selectedIds.value]
  const idle = ids.filter((id) => {
    const vm = allVms.value.find((v) => v.id === id)
    return vm && !isActive(vm)
  })
  if (!idle.length) {
    await alert('All selected VMs are already running a backup.', { title: 'Run selected' })
    return
  }
  const ok = await confirm(`Start backup for ${idle.length} VM(s)?`, { title: 'Run selected', confirmText: 'Run' })
  if (!ok) return
  let started = 0
  for (const id of idle) {
    try { await jobsApi.run(id); started++ } catch { /* continue */ }
  }
  await alert(`Backup queued for ${started} VM(s).`, { title: 'Backups started' })
  clearSelection()
  await load()
}

async function abortSelected() {
  const running = [...selectedIds.value].filter((id) => {
    const vm = allVms.value.find((v) => v.id === id)
    return vm && isActive(vm)
  })
  if (!running.length) {
    await alert('No running backups among the selected VMs.', { title: 'Abort selected' })
    return
  }
  const ok = await confirm(`Abort ${running.length} running backup(s)?`, { title: 'Abort selected', confirmText: 'Abort', danger: true })
  if (!ok) return
  let stopped = 0
  for (const id of running) {
    try { await jobsApi.stop(id); stopped++ } catch { /* continue */ }
  }
  await alert(`Stop requested for ${stopped} backup(s).`, { title: 'Backups stopping' })
  clearSelection()
}

async function pauseSelected() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  const ok = await confirm(`Pause scheduled backups for ${ids.length} VM(s)?`, { title: 'Pause selected', confirmText: 'Pause' })
  if (!ok) return
  let n = 0
  for (const id of ids) {
    try {
      await jobsApi.patch(id, { is_job_active: false })
      n++
    } catch { /* continue */ }
  }
  await alert(`Paused schedules for ${n} VM(s).`, { title: 'Pause selected' })
  clearSelection()
  await load()
}

async function removeSelected() {
  const ids = [...selectedIds.value]
  if (!ids.length) return
  const ok = await confirm(`Remove ${ids.length} VM(s) from backup tasks?`, { title: 'Remove selected', confirmText: 'Remove', danger: true })
  if (!ok) return
  for (const id of ids) {
    await jobsApi.patch(id, { is_selected: false, is_job_active: false })
  }
  clearSelection()
  await load()
}

function toggleInventoryVm(vm, checked) {
  pendingSelection.value[vm.id] = checked
  vm.is_selected = checked
}

function toggleInventoryAll(e) {
  allVms.value.forEach((vm) => toggleInventoryVm(vm, e.target.checked))
}

async function syncHost() {
  if (!scanHostId.value) return
  await hostsApi.sync(scanHostId.value)
  await load()
}

async function applyInventory() {
  const updates = Object.entries(pendingSelection.value).map(([id, sel]) => ({
    vm_id: Number(id),
    is_selected: sel,
  }))
  if (updates.length) await jobsApi.inventoryApply({ updates, restagger: true })
  pendingSelection.value = {}
  showInventory.value = false
  await load()
}

function onDocClick(e) {
  if (!e.target.closest('.job-actions-wrap')) openScheduleId.value = null
}

onMounted(() => {
  load()
  document.addEventListener('click', onDocClick)
})
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>

<style scoped>
.flex { display: flex; }
.inline-flex { display: inline-flex; }
.flex-wrap { flex-wrap: wrap; }
.flex-col { flex-direction: column; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-6 { margin-bottom: 1.5rem; }
.ml-1 { margin-left: 0.25rem; }
.p-1\.5 { padding: 0.375rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.py-12 { padding-top: 3rem; padding-bottom: 3rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-2xl { font-size: 1.5rem; }
.text-\[10px\] { font-size: 10px; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, monospace; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.overflow-auto { overflow: auto; }
.overflow-x-auto { overflow-x: auto; }
.min-w-full { min-width: 100%; }
.min-w-\[140px\] { min-width: 140px; }
.min-w-\[200px\] { min-width: 200px; }
.w-10 { width: 2.5rem; }
.w-12 { width: 3rem; }
.w-20 { width: 5rem; }
.whitespace-nowrap { white-space: nowrap; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.max-w-\[120px\] { max-width: 120px; }
.opacity-60 { opacity: 0.6; }
.opacity-70 { opacity: 0.7; }
.rounded { border-radius: 0.375rem; }
.border-b { border-bottom-width: 1px; }
.relative { position: relative; }
.hover-text-red:hover { color: #f87171; border-color: rgba(248,113,113,0.5); }
</style>
