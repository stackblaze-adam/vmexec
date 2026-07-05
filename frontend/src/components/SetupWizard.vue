<template>
  <div v-if="visible" class="wizard-overlay" role="dialog" aria-modal="true">
    <div class="wizard-backdrop" @click="onClose(true)"></div>
    <div class="wizard-panel card">
      <div class="wizard-topbar">
        <div>
          <h2 class="text-xl font-bold tracking-wide uppercase">Setup Wizard</h2>
          <p class="text-xs mt-0.5" style="color: var(--text-muted)">
            Step {{ step }} of 5 · {{ stepNames[step - 1] }}
          </p>
        </div>
        <button type="button" class="wizard-close" aria-label="Close" @click="onClose(true)">×</button>
      </div>

      <div v-if="error" class="wizard-error-banner" role="alert">{{ error }}</div>

      <div class="wizard-layout">
        <nav class="wizard-nav" aria-label="Setup steps">
          <div v-for="n in 5" :key="n" class="wizard-nav-item" :class="{ active: step === n, done: step > n }">
            <span class="wizard-nav-num">{{ n }}</span>
            <span class="wizard-nav-label">{{ stepNames[n - 1] }}</span>
          </div>
        </nav>

        <div class="wizard-content">
          <!-- Step 1: Storage -->
          <div v-show="step === 1" class="wizard-step">
            <div class="flex flex-wrap justify-between items-center gap-3 mb-4 border-b pb-3" style="border-color:var(--border-color)">
              <h3 class="font-semibold text-base">Backup storage</h3>
              <div class="flex gap-3">
                <label v-for="t in ['SMB','NFS','S3']" :key="t" class="flex items-center gap-1 text-xs font-medium cursor-pointer">
                  <input v-model="storageType" type="radio" :value="t" /> {{ t }}
                </label>
              </div>
            </div>
            <div v-if="storageType === 'SMB'" class="max-w-3xl space-y-3">
              <div><span class="input-label">UNC Path</span><input v-model="storage.smb_unc_path" class="w-full py-2 px-3 font-mono text-sm mt-1" placeholder="\\server\share\backups" /></div>
              <div class="grid grid-cols-2 gap-4">
                <div><span class="input-label">Username</span><input v-model="storage.smb_user" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div><span class="input-label">Password</span><input v-model="storage.smb_password" type="password" class="w-full py-2 px-3 text-sm mt-1" /></div>
              </div>
            </div>
            <div v-else-if="storageType === 'NFS'" class="max-w-3xl">
              <span class="input-label">NFS Export Path</span>
              <input v-model="storage.nfs_path" class="w-full py-2 px-3 font-mono text-sm mt-1" placeholder="/mnt/backups" />
            </div>
            <div v-else class="max-w-3xl grid grid-cols-2 gap-4">
              <div class="col-span-2"><span class="input-label">S3 Endpoint</span><input v-model="storage.s3_endpoint" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Access Key</span><input v-model="storage.s3_access_key" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Secret Key</span><input v-model="storage.s3_secret_key" type="password" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Bucket</span><input v-model="storage.s3_bucket" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Region</span><input v-model="storage.s3_region" class="w-full py-2 px-3 text-sm mt-1" placeholder="us-east-1" /></div>
            </div>
            <div v-if="storageStatus" class="mt-4 px-4 py-3 rounded text-sm font-medium max-w-3xl" :style="storageStatusStyle">{{ storageStatus }}</div>
          </div>

          <!-- Step 2: Hosts -->
          <div v-show="step === 2" class="wizard-step">
            <div class="wizard-step-inner">
              <h3 class="font-semibold text-base mb-1">ESXi / vCenter</h3>
              <p class="text-sm mb-4" style="color: var(--text-muted)">Register a standalone ESXi host or vCenter Server.</p>
              <div class="flex flex-wrap items-end gap-2 mb-4">
                <div class="flex-1 min-w-[5rem]"><span class="input-label">Alias</span><input v-model="newHost.name" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div class="flex-[1.4] min-w-[7rem]"><span class="input-label">IP / FQDN</span><input v-model="newHost.host_ip" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
                <div class="w-24"><span class="input-label">User</span><input v-model="newHost.username" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div class="w-28"><span class="input-label">Password</span><input v-model="newHost.password" type="password" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div class="w-36">
                  <span class="input-label">Connection</span>
                  <select v-model="newHost.connection_type" class="w-full py-2 px-3 text-sm mt-1">
                    <option value="auto">Auto-detect</option>
                    <option value="standalone">Standalone ESXi</option>
                    <option value="vcenter">vCenter Server</option>
                  </select>
                </div>
                <button type="button" class="btn-secondary px-4 py-2 text-sm font-medium" @click="addHost">Add Host</button>
              </div>
              <div class="card overflow-hidden wizard-step-scroll">
                <div class="px-4 py-2.5 border-b font-semibold text-sm" style="border-color:var(--border-color); background:var(--bg-nav)">Registered Hosts</div>
                <ul class="divide-y text-sm overflow-y-auto" style="border-color:var(--border-color); max-height: 16rem">
                  <li v-if="!hosts.length" class="px-4 py-3 text-center" style="color:var(--text-muted)">No hosts added yet.</li>
                  <li v-for="h in hosts" :key="h.id" class="px-4 py-3 flex justify-between items-center gap-3">
                    <div>
                      <span class="font-medium block">{{ h.name }}</span>
                      <span class="text-xs font-mono" style="color:var(--brand)">{{ h.host_ip }}</span>
                    </div>
                    <button type="button" class="text-xs hover:text-red-400" @click="deleteHost(h)">Remove</button>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Step 3: VMs -->
          <div v-show="step === 3" class="wizard-step">
            <div class="wizard-step-inner">
              <div class="flex flex-wrap justify-between items-start gap-3 mb-4">
                <div>
                  <h3 class="font-semibold text-base mb-1">Select VMs to protect</h3>
                  <p class="text-sm" style="color: var(--text-muted)">Recommended excludes templates, vCLS, and this backup server.</p>
                </div>
                <div class="flex gap-2">
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs font-medium" @click="selectRecommended">Recommended</button>
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs font-medium" @click="selectAllVms(true)">All</button>
                  <button type="button" class="btn-secondary px-3 py-1.5 text-xs font-medium" @click="selectAllVms(false)">None</button>
                </div>
              </div>
              <div class="wizard-step-scroll card overflow-hidden">
                <table class="jobs-table">
                  <thead><tr><th class="w-10"></th><th>VM Name</th><th>Host</th><th class="text-right">Disk</th></tr></thead>
                  <tbody>
                    <tr v-if="!vms.length"><td colspan="4" class="p-4 text-center text-sm" style="color:var(--text-muted)">No VMs found.</td></tr>
                    <tr v-for="v in vms" :key="v.id">
                      <td class="text-center"><input v-model="v._selected" type="checkbox" /></td>
                      <td class="font-mono text-xs">{{ v.vm_name }}</td>
                      <td class="text-xs" style="color:var(--text-muted)">{{ hostLabel(v.esxi_host_id) }}</td>
                      <td class="text-right text-xs">{{ v.storage_gb ? v.storage_gb.toFixed(1) + ' GB' : '—' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- Step 4: Schedule -->
          <div v-show="step === 4" class="wizard-step">
            <h3 class="font-semibold text-base mb-1">Default schedule</h3>
            <p class="text-sm mb-4" style="color: var(--text-muted)">Applied to all selected VMs. Adjust per VM later on Backup.</p>
            <div class="max-w-md space-y-3">
              <div>
                <span class="input-label text-xs">Frequency</span>
                <select v-model="schedule.frequency" class="w-full py-2 px-3 text-sm">
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div :style="{ opacity: schedule.frequency === 'daily' ? 0.35 : 1 }">
                <span class="input-label text-xs">Days</span>
                <div class="grid grid-cols-7 gap-0.5 mt-1">
                  <label v-for="d in dayLabels" :key="d.num" class="text-center text-xs py-1 rounded border cursor-pointer">
                    <input v-model="schedule.days" type="checkbox" :value="String(d.num)" class="sr-only" :disabled="schedule.frequency === 'daily'" /> {{ d.lbl }}
                  </label>
                </div>
              </div>
              <div class="grid grid-cols-4 gap-2">
                <div><span class="input-label text-xs">Hour</span><input v-model.number="schedule.hour" type="number" min="0" max="23" class="w-full px-2 py-1 text-center font-mono text-sm" /></div>
                <div><span class="input-label text-xs">Min</span><input v-model.number="schedule.minute" type="number" min="0" max="59" class="w-full px-2 py-1 text-center font-mono text-sm" /></div>
                <div><span class="input-label text-xs">Keep</span><input v-model.number="schedule.retention" type="number" min="1" max="60" class="w-full px-2 py-1 text-center font-mono text-sm" /></div>
                <div class="flex flex-col items-center"><span class="input-label text-xs">Active</span><input v-model="schedule.active" type="checkbox" class="mt-2" /></div>
              </div>
              <label class="flex items-center gap-2 text-sm cursor-pointer">
                <input v-model="schedule.stagger" type="checkbox" /> Stagger start times per host
              </label>
              <div v-if="storageType !== 'S3'" class="pt-2" style="border-top: 1px dashed var(--border-color)">
                <label class="flex items-center gap-2 text-sm"><input v-model="schedule.cbt" type="checkbox" /> Enable incremental (CBT)</label>
                <div class="mt-2"><span class="input-label text-xs">Full every N runs</span><input v-model.number="schedule.cbtInterval" type="number" min="1" max="60" class="w-24 px-2 py-1 text-center text-sm ml-2" /></div>
              </div>
            </div>
          </div>

          <!-- Step 5: Complete -->
          <div v-show="step === 5" class="wizard-step">
            <h3 class="font-semibold text-base mb-2">Setup complete</h3>
            <p class="text-sm mb-4" style="color: var(--text-muted)">{{ summary }}</p>
            <p class="text-sm">Your VMs are configured for scheduled backups. You can fine-tune schedules on the Backup tab.</p>
          </div>
        </div>
      </div>

      <div class="wizard-footer">
        <button v-if="step > 1 && step < 5" type="button" class="btn-secondary px-4 py-2 text-sm" @click="step--">Back</button>
        <div class="flex-1"></div>
        <button type="button" class="btn-primary px-4 py-2 text-sm font-medium" :disabled="busy" @click="next">
          {{ nextLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { configApi, hostsApi, jobsApi } from '@/api/client'
import { useSetupWizard } from '@/composables/useSetupWizard'
import { useModal } from '@/composables/useModal'
import { shouldProtectVm } from '@/composables/useInfra'

const { visible, close } = useSetupWizard()
const { confirm, alert } = useModal()
const router = useRouter()

const stepNames = ['Storage', 'ESXi Hosts', 'Select VMs', 'Schedule', 'Complete']
const step = ref(1)
const error = ref('')
const busy = ref(false)
const storageStatus = ref('')
const storageStatusOk = ref(true)
const summary = ref('')
const storageType = ref('NFS')
const storage = reactive({ smb_unc_path: '', smb_user: '', smb_password: '', nfs_path: '/mnt/backups', s3_endpoint: '', s3_access_key: '', s3_secret_key: '', s3_bucket: '', s3_region: '' })
const hosts = ref([])
const vms = ref([])
const newHost = reactive({ name: '', host_ip: '', username: 'root', password: '', connection_type: 'auto' })
const schedule = reactive({ frequency: 'daily', days: ['0','1','2','3','4'], hour: 2, minute: 0, retention: 7, active: true, stagger: true, cbt: true, cbtInterval: 7 })
const dayLabels = [{ num: 0, lbl: 'Mo' }, { num: 1, lbl: 'Tu' }, { num: 2, lbl: 'We' }, { num: 3, lbl: 'Th' }, { num: 4, lbl: 'Fr' }, { num: 5, lbl: 'Sa' }, { num: 6, lbl: 'Su' }]

const storageStatusStyle = computed(() => ({
  background: storageStatusOk.value ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.08)',
  color: storageStatusOk.value ? '#4ade80' : 'var(--text-muted)',
}))

const nextLabel = computed(() => {
  if (busy.value) return 'Working…'
  if (step.value === 4) return 'Apply & Finish'
  if (step.value === 5) return 'Go to Backup'
  return 'Continue'
})

watch(visible, async (open) => {
  if (!open) return
  step.value = 1
  error.value = ''
  storageStatus.value = ''
  try {
    hosts.value = await hostsApi.list()
    const cfg = await configApi.get()
    storageType.value = cfg.storage_type || 'NFS'
    Object.assign(storage, cfg)
    schedule.cbt = cfg.cbt_enabled !== false
    schedule.cbtInterval = cfg.cbt_full_interval || 7
  } catch { /* ignore */ }
})

function hostLabel(id) {
  const h = hosts.value.find((x) => x.id === id)
  return h ? h.name : `Host #${id}`
}

function onClose(skip) {
  if (step.value >= 5 && !skip) localStorage.setItem('setup_wizard_done', '1')
  close()
  document.body.style.overflow = ''
}

watch(visible, (v) => { document.body.style.overflow = v ? 'hidden' : '' })

function storagePayload() {
  const body = { storage_type: storageType.value }
  if (storageType.value === 'SMB') {
    body.smb_unc_path = storage.smb_unc_path
    body.smb_user = storage.smb_user
    if (storage.smb_password) body.smb_password = storage.smb_password
  } else if (storageType.value === 'NFS') {
    body.nfs_path = storage.nfs_path || '/mnt/backups'
  } else {
    body.s3_endpoint = storage.s3_endpoint
    body.s3_access_key = storage.s3_access_key
    if (storage.s3_secret_key) body.s3_secret_key = storage.s3_secret_key
    body.s3_bucket = storage.s3_bucket
    body.s3_region = storage.s3_region
  }
  return body
}

async function addHost() {
  error.value = ''
  if (!newHost.name || !newHost.host_ip || !newHost.username || !newHost.password) {
    error.value = 'Fill in alias, host, username, and password.'
    return
  }
  const host = await hostsApi.create({ ...newHost })
  if (!hosts.value.some((h) => h.id === host.id)) hosts.value.push(host)
  newHost.password = ''
}

async function deleteHost(h) {
  const ok = await confirm(`Remove ${h.name} from VMExec?`, { title: 'Remove host', confirmText: 'Remove', danger: true })
  if (!ok) return
  await hostsApi.remove(h.id)
  hosts.value = hosts.value.filter((x) => x.id !== h.id)
}

function selectRecommended() {
  vms.value.forEach((v) => { v._selected = shouldProtectVm(v.vm_name) })
}

function selectAllVms(on) {
  vms.value.forEach((v) => { v._selected = on })
}

async function next() {
  error.value = ''
  try {
    if (step.value === 5) {
      localStorage.setItem('setup_wizard_done', '1')
      onClose(true)
      router.push('/backup')
      return
    }
    busy.value = true
    if (step.value === 1) {
      storageStatus.value = 'Testing storage connection…'
      storageStatusOk.value = false
      await configApi.updateStorage(storagePayload())
      const test = await configApi.testStorage()
      if (!test.ok) throw new Error(test.message || 'Storage test failed')
      storageStatus.value = '✓ ' + test.message
      storageStatusOk.value = true
      step.value = 2
    } else if (step.value === 2) {
      if (!hosts.value.length) throw new Error('Add at least one ESXi host.')
      const warnings = []
      for (const h of hosts.value) {
        try { await hostsApi.sync(h.id) } catch (e) { warnings.push(`${h.name}: ${e.message}`) }
      }
      if (warnings.length === hosts.value.length) throw new Error('Could not discover VMs from any host.')
      const list = await jobsApi.vms()
      vms.value = list.map((v) => ({ ...v, _selected: shouldProtectVm(v.vm_name) }))
      step.value = 3
      if (warnings.length) error.value = 'Some hosts could not be synced: ' + warnings.join('; ')
    } else if (step.value === 3) {
      if (!vms.value.some((v) => v._selected)) throw new Error('Select at least one VM to protect.')
      step.value = 4
    } else if (step.value === 4) {
      await applySchedule()
      step.value = 5
    }
  } catch (e) {
    error.value = e.message || String(e)
  } finally {
    busy.value = false
  }
}

async function applySchedule() {
  const selected = vms.value.filter((v) => v._selected)
  const days = schedule.frequency === 'daily' ? '0,1,2,3,4,5,6' : (schedule.days.length ? schedule.days.join(',') : '0,1,2,3,4,5,6')
  if (schedule.frequency === 'weekly' && !schedule.days.length) throw new Error('Pick at least one day for a weekly schedule.')

  const hostIds = [...new Set(selected.map((v) => v.esxi_host_id).filter(Boolean))].sort((a, b) => a - b)
  const hostHour = {}
  hostIds.forEach((hid, i) => { hostHour[hid] = (schedule.hour + (schedule.stagger ? i : 0)) % 24 })

  const cbtEnabled = storageType.value !== 'S3' && schedule.cbt
  await configApi.update({ cbt_enabled: cbtEnabled, cbt_full_interval: schedule.cbtInterval })

  let updated = 0
  for (const v of vms.value) {
    const body = v._selected ? {
      is_selected: true,
      is_job_active: schedule.active,
      schedule_hour: hostHour[v.esxi_host_id] ?? schedule.hour,
      schedule_minute: schedule.minute,
      retention_count: schedule.retention,
      schedule_frequency: schedule.frequency,
      schedule_days: days,
      power_off_for_backup: false,
      cbt_enabled: cbtEnabled,
    } : { is_selected: false, is_job_active: false }
    await jobsApi.patch(v.id, body)
    if (v._selected) updated++
  }
  summary.value = `Configured ${updated} VM(s) for scheduled backups.`
}
</script>

<style scoped>
.flex { display: flex; }
.flex-wrap { flex-wrap: wrap; }
.flex-1 { flex: 1; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.grid { display: grid; }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.col-span-2 { grid-column: span 2; }
.mb-1 { margin-bottom: 0.25rem; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.pb-3 { padding-bottom: 0.75rem; }
.pt-2 { padding-top: 0.5rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-base { font-size: 1rem; }
.text-xl { font-size: 1.25rem; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, monospace; }
.tracking-wide { letter-spacing: 0.025em; }
.uppercase { text-transform: uppercase; }
.w-full { width: 100%; }
.w-10 { width: 2.5rem; }
.w-24 { width: 6rem; }
.w-28 { width: 7rem; }
.w-36 { width: 9rem; }
.min-w-[5rem] { min-width: 5rem; }
.min-w-[7rem] { min-width: 7rem; }
.max-w-3xl { max-width: 48rem; }
.max-w-md { max-width: 28rem; }
.border { border-width: 1px; border-style: solid; border-color: var(--border-color); }
.border-b { border-bottom-width: 1px; }
.rounded { border-radius: 0.25rem; }
.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.divide-y > * + * { border-top: 1px solid var(--border-color); }
.space-y-3 > * + * { margin-top: 0.75rem; }
.cursor-pointer { cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.flex-[1.4] { flex: 1.4; }
</style>
