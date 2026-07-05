<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">Settings</h1>
    <div class="settings-layout">
      <aside class="settings-sidebar">
        <div class="settings-sidebar-nav card">
          <div class="settings-sidebar-header">Settings</div>
          <nav class="settings-nav">
            <button v-for="p in panels" :key="p.id" type="button" class="settings-nav-item" :class="{ active: panel === p.id }" @click="go(p.id)">{{ p.label }}</button>
          </nav>
          <div v-if="auth.isAdmin" class="settings-sidebar-footer">
            <button type="button" class="settings-wizard-btn" @click="openWizard">Setup wizard</button>
          </div>
        </div>
      </aside>

      <div class="settings-content flex-1 min-w-0">
        <div v-if="msg" class="mb-4 text-sm px-4 py-2.5 rounded border" :style="{ color: msgOk ? '#34d399' : '#f87171', borderColor: msgOk ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)' }">{{ msg }}</div>

        <!-- Storage -->
        <div v-if="panel === 'storage'" class="settings-panel">
          <h2 class="settings-panel-title">Storage</h2>
          <p class="settings-panel-desc">Primary backup repository and optional secondary copy.</p>
          <div class="card p-5 mb-4">
            <h3 class="text-sm font-semibold mb-3">Primary repository</h3>
            <div class="flex flex-wrap gap-3 mb-4">
              <label v-for="t in ['SMB','NFS','S3']" :key="t" class="flex items-center gap-1 text-xs font-medium cursor-pointer">
                <input v-model="cfg.storage_type" type="radio" :value="t" /> {{ t }}
              </label>
              <button type="button" class="text-xs font-medium ml-auto" style="color: var(--brand)" @click="testStorage">Verify connection</button>
            </div>
            <div v-if="cfg.storage_type === 'SMB'" class="space-y-3">
              <div><span class="input-label">UNC Path</span><input v-model="cfg.smb_unc_path" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
              <div class="grid grid-cols-2 gap-4">
                <div><span class="input-label">Username</span><input v-model="cfg.smb_user" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div><span class="input-label">Password</span><input v-model="cfg.smb_password" type="password" placeholder="(Unchanged)" class="w-full py-2 px-3 text-sm mt-1" /></div>
              </div>
            </div>
            <div v-else-if="cfg.storage_type === 'NFS'">
              <span class="input-label">NFS Export Path</span><input v-model="cfg.nfs_path" class="w-full py-2 px-3 font-mono text-sm mt-1" />
            </div>
            <div v-else class="grid grid-cols-2 gap-4">
              <div class="col-span-2"><span class="input-label">S3 Endpoint</span><input v-model="cfg.s3_endpoint" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Access Key</span><input v-model="cfg.s3_access_key" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Secret Key</span><input v-model="cfg.s3_secret_key" type="password" placeholder="(Unchanged)" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Bucket</span><input v-model="cfg.s3_bucket" class="w-full py-2 px-3 text-sm mt-1" /></div>
              <div><span class="input-label">Region</span><input v-model="cfg.s3_region" class="w-full py-2 px-3 text-sm mt-1" /></div>
            </div>
          </div>
          <div class="card p-5">
            <h3 class="text-sm font-semibold mb-3">Secondary copy (3-2-1)</h3>
            <label class="flex items-center gap-2 text-sm mb-4 cursor-pointer">
              <input v-model="cfg.secondary_copy_enabled" type="checkbox" /> Enable secondary copy after backup
            </label>
            <div :class="{ 'opacity-50 pointer-events-none': !cfg.secondary_copy_enabled }">
              <div class="flex flex-wrap gap-3 mb-4">
                <span class="input-label mb-0">Repository type</span>
                <label v-for="t in ['SMB','NFS','S3']" :key="'s'+t" class="flex items-center gap-1 text-xs cursor-pointer">
                  <input v-model="cfg.secondary_storage_type" type="radio" :value="t" /> {{ t }}
                </label>
              </div>
              <div v-if="cfg.secondary_storage_type === 'SMB'" class="space-y-3">
                <div><span class="input-label">UNC Path</span><input v-model="cfg.secondary_smb_unc_path" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
                <div class="grid grid-cols-2 gap-4">
                  <div><span class="input-label">Username</span><input v-model="cfg.secondary_smb_user" class="w-full py-2 px-3 text-sm mt-1" /></div>
                  <div><span class="input-label">Password</span><input v-model="cfg.secondary_smb_password" type="password" placeholder="(Unchanged)" class="w-full py-2 px-3 text-sm mt-1" /></div>
                </div>
              </div>
              <div v-else-if="cfg.secondary_storage_type === 'NFS' || !cfg.secondary_storage_type">
                <span class="input-label">NFS Export Path</span><input v-model="cfg.secondary_nfs_path" class="w-full py-2 px-3 font-mono text-sm mt-1" />
              </div>
              <div v-else class="grid grid-cols-2 gap-4">
                <div class="col-span-2"><span class="input-label">S3 Endpoint</span><input v-model="cfg.secondary_s3_endpoint" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div><span class="input-label">Access Key</span><input v-model="cfg.secondary_s3_access_key" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div><span class="input-label">Secret Key</span><input v-model="cfg.secondary_s3_secret_key" type="password" placeholder="(Unchanged)" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div><span class="input-label">Bucket</span><input v-model="cfg.secondary_s3_bucket" class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div><span class="input-label">Region</span><input v-model="cfg.secondary_s3_region" class="w-full py-2 px-3 text-sm mt-1" /></div>
              </div>
            </div>
          </div>
          <div class="flex justify-end mt-4"><button type="button" class="btn-primary px-6 py-2 text-sm font-semibold" @click="saveStorage">Save storage</button></div>
        </div>

        <!-- Engine -->
        <div v-else-if="panel === 'engine'" class="settings-panel">
          <h2 class="settings-panel-title">Engine</h2>
          <p class="settings-panel-desc">Worker, transport, and backup policy.</p>
          <div class="card p-4">
            <section class="settings-engine-section">
              <h3 class="settings-engine-heading">Concurrency &amp; transport</h3>
              <div class="settings-engine-grid">
                <div><span class="input-label">Max global</span><input v-model.number="cfg.max_global_backups" type="number" min="1" max="32" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div><span class="input-label">Max per host</span><input v-model.number="cfg.max_backups_per_host" type="number" min="1" max="8" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div><span class="input-label">Schedules / hour</span><input v-model.number="cfg.max_schedules_per_hour" type="number" min="1" max="12" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div>
                  <span class="input-label">Transport</span>
                  <select v-model="cfg.backup_transport" class="w-full py-2 px-3 text-sm">
                    <option value="nbd">VDDK / NBD</option>
                    <option value="nfc">NFC only</option>
                    <option value="legacy">Legacy</option>
                  </select>
                </div>
                <div v-if="cfg.backup_transport === 'nbd' || !cfg.backup_transport" class="span-2">
                  <span class="input-label">VDDK library path</span><input v-model="cfg.vddk_libdir" class="w-full py-2 px-3 text-sm font-mono" />
                </div>
                <div v-if="cfg.backup_transport === 'legacy'" class="span-2">
                  <span class="input-label">Disk estimate ×</span><input v-model.number="cfg.datastore_est_multiplier" type="number" min="1" max="3" step="0.1" class="w-full py-2 px-3 text-center text-sm" />
                </div>
              </div>
            </section>
            <section class="settings-engine-section">
              <h3 class="settings-engine-heading">Backups &amp; retention</h3>
              <div class="settings-engine-grid">
                <div>
                  <span class="input-label">Incremental (CBT)</span>
                  <label class="settings-toggle mt-1 cursor-pointer">
                    <span class="settings-toggle-track">
                      <input v-model="cfg.cbt_enabled" type="checkbox" :disabled="cfg.storage_type === 'S3'" />
                      <span class="track"></span><span class="thumb"></span>
                    </span>
                    <span class="text-xs font-medium">{{ cfg.cbt_enabled ? 'On' : 'Off' }}</span>
                  </label>
                </div>
                <div><span class="input-label">Full every N runs</span><input v-model.number="cfg.cbt_full_interval" type="number" min="1" max="60" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div>
                  <span class="input-label">Retention</span>
                  <select v-model="cfg.retention_mode" class="w-full py-2 px-3 text-sm mt-1">
                    <option value="count">Count (per VM)</option>
                    <option value="gfs">GFS</option>
                  </select>
                </div>
                <template v-if="cfg.retention_mode === 'gfs'">
                  <div><span class="input-label">Daily</span><input v-model.number="cfg.gfs_daily_keep" type="number" min="1" max="90" class="w-full py-2 px-3 text-center text-sm mt-1" /></div>
                  <div><span class="input-label">Weekly</span><input v-model.number="cfg.gfs_weekly_keep" type="number" min="0" max="52" class="w-full py-2 px-3 text-center text-sm mt-1" /></div>
                  <div><span class="input-label">Monthly</span><input v-model.number="cfg.gfs_monthly_keep" type="number" min="0" max="120" class="w-full py-2 px-3 text-center text-sm mt-1" /></div>
                </template>
              </div>
              <p v-if="cfg.storage_type === 'S3'" class="mt-2 text-xs px-3 py-2 rounded" style="background: rgba(234,179,8,0.12); color: #eab308;">S3 selected — CBT disabled; full backups only.</p>
            </section>
            <section class="settings-engine-section">
              <h3 class="settings-engine-heading">Safety &amp; performance</h3>
              <div class="settings-engine-grid-safety">
                <div><span class="input-label">Min DS free %</span><input v-model.number="cfg.datastore_min_free_pct" type="number" min="5" max="50" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div><span class="input-label">DS headroom GB</span><input v-model.number="cfg.datastore_headroom_gb" type="number" min="0" max="500" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div><span class="input-label">Min repo GB</span><input v-model.number="cfg.repo_min_free_gb" type="number" min="1" max="10000" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div><span class="input-label">Compression</span><input v-model.number="cfg.perf_compression_level" type="number" min="0" max="9" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div><span class="input-label">ESXi timeout</span><input v-model.number="cfg.backup_timeout_mins" type="number" min="5" max="1440" class="w-full py-2 px-3 text-center text-sm" /></div>
                <div>
                  <span class="input-label">Skip infra VMs</span>
                  <label class="settings-toggle mt-1 cursor-pointer">
                    <span class="settings-toggle-track">
                      <input v-model="cfg.exclude_infra_vms" type="checkbox" />
                      <span class="track"></span><span class="thumb"></span>
                    </span>
                    <span class="text-xs font-medium">{{ cfg.exclude_infra_vms ? 'On' : 'Off' }}</span>
                  </label>
                </div>
              </div>
            </section>
            <div class="flex justify-end pt-3 border-t mt-3" style="border-color: var(--border-color)">
              <button type="button" class="btn-primary px-5 py-1.5 text-sm font-semibold" @click="saveStorage">Save engine settings</button>
            </div>
          </div>
        </div>

        <!-- Hosts -->
        <div v-else-if="panel === 'hosts'" class="settings-panel">
          <h2 class="settings-panel-title">ESXi</h2>
          <div class="card p-6">
            <div class="flex justify-between mb-4">
              <span class="font-semibold">Registered hosts</span>
              <button type="button" class="btn-primary px-3 py-1.5 text-sm" @click="showAddHost = true">Add host</button>
            </div>
            <div v-for="h in hosts" :key="h.id" class="flex justify-between items-center py-2 border-b" style="border-color: var(--border-color)">
              <div>
                <div class="font-medium">{{ h.name }}</div>
                <div class="text-xs font-mono" style="color: var(--text-muted)">{{ h.host_ip }} · {{ h.connection_type || 'auto' }}</div>
              </div>
              <button type="button" class="btn-secondary px-2 py-1 text-xs hover-text-red" @click="removeHost(h.id)">Remove</button>
            </div>
            <form v-if="showAddHost" class="mt-4 space-y-3 p-4 rounded" style="background: var(--bg-app)" @submit.prevent="addHost">
              <input v-model="newHost.name" placeholder="Alias" class="w-full py-2 px-3 text-sm" required />
              <input v-model="newHost.host_ip" placeholder="Host IP / FQDN" class="w-full py-2 px-3 text-sm" required />
              <input v-model="newHost.username" placeholder="Username" class="w-full py-2 px-3 text-sm" required />
              <input v-model="newHost.password" type="password" placeholder="Password" class="w-full py-2 px-3 text-sm" required />
              <select v-model="newHost.connection_type" class="w-full py-2 px-3 text-sm">
                <option value="auto">Auto-detect</option>
                <option value="standalone">Standalone ESXi</option>
                <option value="vcenter">vCenter Server</option>
              </select>
              <div class="flex gap-2">
                <button type="submit" class="btn-primary px-3 py-1.5 text-sm">Save</button>
                <button type="button" class="btn-secondary px-3 py-1.5 text-sm" @click="showAddHost = false">Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <!-- Email -->
        <div v-else-if="panel === 'email'" class="settings-panel">
          <h2 class="settings-panel-title">Email (SMTP)</h2>
          <div class="card p-5">
            <div class="flex justify-end mb-4"><button type="button" class="text-xs font-medium" style="color: var(--brand)" @click="testEmail">Send test email</button></div>
            <div class="grid grid-cols-2 gap-4">
              <div class="col-span-2"><span class="input-label">SMTP server</span><input v-model="cfg.smtp_server" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
              <div><span class="input-label">Port</span><input v-model.number="cfg.smtp_port" type="number" class="w-full py-2 px-3 text-center font-mono text-sm mt-1" /></div>
              <div><span class="input-label">Username</span><input v-model="cfg.smtp_user" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
              <div><span class="input-label">Password</span><input v-model="cfg.smtp_password" type="password" placeholder="(Unchanged)" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
              <div class="col-span-2"><span class="input-label">Default recipient</span><input v-model="cfg.smtp_to_email" type="email" class="w-full py-2 px-3 font-mono text-sm mt-1" /></div>
              <label class="flex items-center gap-2 cursor-pointer col-span-2"><input v-model="cfg.smtp_use_tls" type="checkbox" /><span class="text-sm">Use STARTTLS (port 587)</span></label>
              <label class="flex items-center gap-2 cursor-pointer col-span-2"><input v-model="cfg.smtp_use_ssl" type="checkbox" /><span class="text-sm">Use SSL/TLS (port 465)</span></label>
            </div>
            <div class="mt-6 flex justify-end"><button type="button" class="btn-primary px-6 py-2 text-sm font-semibold" @click="saveEmail">Save email settings</button></div>
          </div>
        </div>

        <!-- Maintenance -->
        <div v-else-if="panel === 'maintenance'" class="settings-panel">
          <h2 class="settings-panel-title">Maintenance</h2>
          <div class="card p-6">
            <h3 class="font-semibold mb-2">Snapshot purge</h3>
            <p class="text-sm mb-4" style="color: var(--text-muted)">Remove stale backup snapshots from all registered VMs.</p>
            <button type="button" class="btn-danger px-4 py-2 text-sm" @click="purge">Purge all snapshots</button>
          </div>
        </div>

        <!-- Users -->
        <div v-else-if="panel === 'users' && auth.isAdmin" class="settings-panel">
          <h2 class="settings-panel-title">User Management</h2>
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 card overflow-hidden">
              <table class="w-full text-sm">
                <thead>
                  <tr class="text-xs uppercase" style="color: var(--text-muted); border-bottom: 1px solid var(--border-color)">
                    <th class="px-5 py-3 text-left">Username</th>
                    <th class="px-5 py-3 text-left">Role</th>
                    <th class="px-5 py-3 text-left">MFA</th>
                    <th class="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="u in users" :key="u.id" class="border-b" style="border-color: var(--border-color)">
                    <td class="px-5 py-3 font-medium">{{ u.username }} <span v-if="u.username === auth.user?.username" class="text-[10px] opacity-50">(you)</span></td>
                    <td class="px-5 py-3">
                      <select :value="u.role" class="text-xs py-1 px-2 rounded border" :disabled="u.username === auth.user?.username" style="border-color: var(--border-color)" @change="updateRole(u.id, $event.target.value)">
                        <option value="admin">Admin</option>
                        <option value="operator">Operator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                    <td class="px-5 py-3">
                      <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full" :style="u.is_mfa_enabled ? 'background:rgba(34,197,94,0.2);color:#4ade80' : 'background:rgba(234,179,8,0.2);color:#fbbf24'">{{ u.is_mfa_enabled ? 'Enabled' : 'Pending' }}</span>
                    </td>
                    <td class="px-5 py-3">
                      <div class="flex gap-2 justify-end">
                        <button type="button" class="text-xs px-2 py-1 rounded border" style="border-color: var(--border-color)" @click="resetPw(u.id)">Reset PW</button>
                        <button type="button" class="text-xs px-2 py-1 rounded border" style="border-color: var(--border-color)" @click="resetMfa(u.id)">Reset MFA</button>
                        <button v-if="u.username !== auth.user?.username" type="button" class="text-xs px-2 py-1 rounded border text-red-400" style="border-color: var(--border-color)" @click="removeUser(u.id)">Delete</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card p-5">
              <h3 class="font-semibold mb-4">Add New User</h3>
              <form class="space-y-3" @submit.prevent="createUser">
                <div><span class="input-label">Username</span><input v-model="newUser.name" required class="w-full py-2 px-3 text-sm mt-1" /></div>
                <div>
                  <span class="input-label">Role</span>
                  <select v-model="newUser.role" class="w-full py-2 px-3 text-sm mt-1">
                    <option value="operator">Operator</option>
                    <option value="viewer">Viewer</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button type="submit" class="btn-primary w-full py-2 text-sm font-semibold">Create User</button>
              </form>
              <p v-if="tempPw" class="text-sm mt-3 p-2 rounded" style="background: rgba(34,197,94,0.1); color: #34d399">Temp password: {{ tempPw }}</p>
            </div>
          </div>
        </div>

        <!-- Syslogs -->
        <div v-else-if="panel === 'syslogs'" class="settings-panel">
          <h2 class="settings-panel-title">System Logs</h2>
          <div class="grid grid-cols-2 gap-4">
            <div><div class="text-xs font-semibold mb-1">Service</div><pre class="text-xs p-3 rounded overflow-auto max-h-96 font-mono" style="background: #0a0a0a; color: #a3e635">{{ logs.service_log }}</pre></div>
            <div><div class="text-xs font-semibold mb-1">Worker</div><pre class="text-xs p-3 rounded overflow-auto max-h-96 font-mono" style="background: #0a0a0a; color: #a3e635">{{ logs.worker_log }}</pre></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { configApi, hostsApi, usersApi, logsApi, maintenanceApi } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useSetupWizard } from '@/composables/useSetupWizard'
import { useModal } from '@/composables/useModal'

const props = defineProps({ panel: { type: String, default: 'storage' } })
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const { open: openWizard } = useSetupWizard()
const { confirm } = useModal()

const panel = computed(() => props.panel || route.params.panel || 'storage')
const cfg = ref({ secondary_storage_type: 'NFS' })
const hosts = ref([])
const users = ref([])
const logs = ref({ service_log: '', worker_log: '' })
const msg = ref('')
const msgOk = ref(true)
const showAddHost = ref(false)
const newHost = ref({ name: '', host_ip: '', username: '', password: '', connection_type: 'auto' })
const newUser = ref({ name: '', role: 'operator' })
const tempPw = ref('')

const panels = computed(() => {
  const all = [
    { id: 'storage', label: 'Storage' },
    { id: 'hosts', label: 'ESXi' },
    { id: 'engine', label: 'Engine' },
    { id: 'email', label: 'SMTP' },
    { id: 'maintenance', label: 'Maintenance' },
    { id: 'users', label: 'Users' },
    { id: 'syslogs', label: 'System Logs' },
  ]
  if (!auth.isAdmin) return all.filter((p) => p.id === 'syslogs')
  return all
})

function go(id) { router.push(`/settings/${id}`) }

async function load() {
  if (auth.isAdmin) {
    cfg.value = await configApi.get()
    if (!cfg.value.secondary_storage_type) cfg.value.secondary_storage_type = 'NFS'
    hosts.value = await hostsApi.list()
    if (panel.value === 'users') users.value = await usersApi.list()
  }
  if (panel.value === 'syslogs') {
    logs.value = await logsApi.system({ service_lines: 100, worker_lines: 100 })
  }
}

async function saveStorage() {
  await configApi.updateStorage(cfg.value)
  msg.value = 'Saved.'; msgOk.value = true
}

async function saveEmail() {
  await configApi.update(cfg.value)
  msg.value = 'Email settings saved.'; msgOk.value = true
}

async function testStorage() {
  const r = await configApi.testStorage()
  msg.value = r.message; msgOk.value = r.ok
}

async function testEmail() {
  const r = await configApi.testEmail()
  msg.value = r.message; msgOk.value = r.ok
}

async function addHost() {
  await hostsApi.create(newHost.value)
  showAddHost.value = false
  newHost.value = { name: '', host_ip: '', username: '', password: '', connection_type: 'auto' }
  hosts.value = await hostsApi.list()
}

async function removeHost(id) {
  if (!await confirm('Remove this host?', { title: 'Remove host', confirmText: 'Remove', danger: true })) return
  await hostsApi.remove(id)
  hosts.value = await hostsApi.list()
}

async function purge() {
  if (!await confirm('Purge snapshots on all VMs?', { title: 'Snapshot purge', confirmText: 'Purge', danger: true })) return
  await maintenanceApi.snapshotPurge()
  msg.value = 'Snapshot purge started.'; msgOk.value = true
}

async function createUser() {
  const r = await usersApi.create({ username: newUser.value.name, role: newUser.value.role })
  tempPw.value = r.temporary_password
  newUser.value = { name: '', role: 'operator' }
  users.value = await usersApi.list()
}

async function updateRole(id, role) {
  await usersApi.role(id, { role })
  users.value = await usersApi.list()
}

async function resetPw(id) {
  const r = await usersApi.resetPassword(id)
  tempPw.value = r.temporary_password
}

async function resetMfa(id) {
  if (!await confirm('Reset MFA? User will set it up again on next login.', { title: 'Reset MFA', confirmText: 'Reset' })) return
  await usersApi.resetMfa(id)
  users.value = await usersApi.list()
}

async function removeUser(id) {
  if (!await confirm('Delete user? This cannot be undone.', { title: 'Delete user', confirmText: 'Delete', danger: true })) return
  await usersApi.remove(id)
  users.value = await usersApi.list()
}

watch(panel, load)
onMounted(load)
</script>

<style scoped>
.flex { display: flex; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.mb-0 { margin-bottom: 0; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }
.ml-auto { margin-left: auto; }
.p-4 { padding: 1rem; }
.p-5 { padding: 1.25rem; }
.p-6 { padding: 1.5rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-5 { padding-left: 1.25rem; padding-right: 1.25rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-2\.5 { padding-top: 0.625rem; padding-bottom: 0.625rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.pt-3 { padding-top: 0.75rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-2xl { font-size: 1.5rem; }
.text-\[10px\] { font-size: 10px; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, monospace; }
.w-full { width: 100%; }
.flex-1 { flex: 1; }
.min-w-0 { min-width: 0; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.justify-end { justify-content: flex-end; }
.text-left { text-align: left; }
.text-right { text-align: right; }
.text-center { text-align: center; }
.uppercase { text-transform: uppercase; }
.rounded { border-radius: 0.375rem; }
.rounded-full { border-radius: 9999px; }
.border { border-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-t { border-top-width: 1px; }
.overflow-hidden { overflow: hidden; }
.overflow-auto { overflow: auto; }
.max-h-96 { max-height: 24rem; }
.col-span-2 { grid-column: span 2; }
.space-y-3 > * + * { margin-top: 0.75rem; }
.opacity-50 { opacity: 0.5; }
.pointer-events-none { pointer-events: none; }
.cursor-pointer { cursor: pointer; }
.hover-text-red:hover { color: #f87171; }
@media (min-width: 1024px) {
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:col-span-2 { grid-column: span 2; }
}
</style>
