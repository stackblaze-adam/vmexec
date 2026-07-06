<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-2xl font-bold">Restore</h1>
      <button type="button" :class="btnSecondary" class="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold" @click="openDeploy">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
        Deploy restore
      </button>
    </div>

    <div class="rounded-lg border border-border bg-card shadow-card overflow-x-auto">
      <table class="w-full border-separate border-spacing-0 text-sm">
        <thead>
          <tr>
            <th class="text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted px-4 py-3 border-b border-border bg-nav">Target VM</th>
            <th class="text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted px-4 py-3 border-b border-border bg-nav">Host</th>
            <th class="text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted px-4 py-3 border-b border-border bg-nav">Progress</th>
            <th class="text-left text-[0.7rem] font-semibold uppercase tracking-wide text-muted px-4 py-3 border-b border-border bg-nav">Started</th>
            <th class="text-right text-[0.7rem] font-semibold uppercase tracking-wide text-muted px-4 py-3 border-b border-border bg-nav">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in restores" :key="r.id">
            <td class="px-4 py-3 border-b border-border align-middle font-semibold">{{ r.target_name }}</td>
            <td class="px-4 py-3 border-b border-border align-middle text-xs">{{ r.target_esxi_host }}</td>
            <td class="px-4 py-3 border-b border-border align-middle min-w-[140px]">
              <button
                v-if="r.status === 'In Progress' || r.status === 'Success' || r.status === 'Failed'"
                type="button"
                class="w-full text-left rounded-md cursor-pointer transition-shadow border-0 bg-transparent p-0"
                :class="r.status === 'Failed' ? 'hover:ring-2 hover:ring-red-500/25' : 'hover:ring-2 hover:ring-blue-500/25'"
                title="View restore details"
                @click="openRestoreDrawer(r)"
              >
                <div v-if="r.status === 'In Progress'">
                  <div class="flex justify-between text-xs mb-1">
                    <span class="truncate max-w-[120px] text-brand">{{ r.current_action || 'Restoring…' }}</span>
                    <span class="font-mono">{{ r.progress }}%</span>
                  </div>
                  <div class="block h-1 mt-1 bg-border rounded-sm overflow-hidden">
                    <div class="h-full bg-brand rounded-sm transition-[width] duration-500 ease-in-out" :style="{ width: r.progress + '%' }"></div>
                  </div>
                </div>
                <StatusBadge v-else v-bind="restoreProgress(r)" />
              </button>
              <span v-else class="text-xs text-muted">—</span>
            </td>
            <td class="px-4 py-3 border-b border-border align-middle text-xs font-mono text-muted">
              <span>{{ formatDate(r.start_time) }}</span>
              <span v-if="r.duration_seconds != null" class="block text-[0.7rem] opacity-70">took {{ formatDuration(r.duration_seconds) }}</span>
            </td>
            <td class="text-right px-4 py-3 border-b border-border align-middle">
              <div class="inline-flex gap-1 items-center justify-end">
                <button
                  v-if="r.status === 'In Progress'"
                  type="button"
                  :class="btnIconDanger"
                  title="Stop restore"
                  @click="stop(r.id)"
                >
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6h12v12H6z"/></svg>
                </button>
                <button type="button" :class="btnIconSecondary" class="hover:text-red-500" title="Remove from list" @click="remove(r.id)">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="!restores.length">
            <td colspan="5" class="py-12 text-center text-muted">
              <div class="text-sm font-medium mb-1">No active or recent restores</div>
              <div class="text-xs opacity-70 mb-3">Open Deploy restore to launch a VM from backup.</div>
              <button type="button" :class="btnSecondary" class="px-3 py-1.5 text-xs font-semibold" @click="openDeploy">Deploy restore</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="showDeploy" class="fixed inset-0 z-80">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" @click="closeDeploy"></div>
      <aside
        class="absolute top-0 right-0 bottom-0 w-full max-w-lg flex flex-col bg-card border-l border-border shadow-[-4px_0_24px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-labelledby="restore-drawer-title"
      >
        <div class="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border bg-nav shrink-0">
          <div>
            <h3 id="restore-drawer-title" class="text-base font-semibold leading-tight m-0">Deploy restore</h3>
            <p class="text-[0.625rem] mt-0.5 text-muted opacity-75">{{ drawerSubtitle }}</p>
          </div>
          <button
            type="button"
            class="p-1.5 rounded-md text-muted border border-border bg-transparent cursor-pointer hover:text-main hover:bg-card"
            aria-label="Close deploy restore"
            @click="closeDeploy"
          >
            <svg class="w-4 h-4 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div id="restore-drawer-panel" class="flex flex-col h-full min-h-0">
            <div class="flex flex-col gap-2 px-4 py-3 border-b border-border bg-nav shrink-0">
              <input
                v-if="groupedBackups.length"
                v-model="searchQuery"
                type="search"
                class="w-full px-3 py-2 text-xs rounded-md"
                placeholder="Search backups…"
                autocomplete="off"
              />
              <button type="button" :class="btnPrimary" class="w-full px-3 py-2 text-xs font-semibold" :disabled="scanLoading" @click="scanRepository">
                {{ scanLoading ? 'Scanning…' : 'Scan repository' }}
              </button>
            </div>

            <div class="flex-1 min-h-[5rem] overflow-auto">
              <table class="w-full border-collapse text-xs text-left">
                <thead>
                  <tr>
                    <th class="sticky top-0 z-[1] w-8 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border" aria-label="Selected"></th>
                    <th class="sticky top-0 z-[1] text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border">Virtual Machine</th>
                    <th class="sticky top-0 z-[1] w-[4.5rem] text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border">Versions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-if="scanLoading">
                    <td colspan="3" class="px-3 py-8 text-center text-xs font-medium text-muted italic opacity-60">Scanning repository…</td>
                  </tr>
                  <tr
                    v-for="group in filteredGroups"
                    v-else
                    :key="group.vm_name"
                    class="cursor-pointer transition-colors duration-150 hover:bg-btn-sec-hover"
                    :class="{ 'bg-brand/12 hover:bg-brand/12': selectedGroup?.vm_name === group.vm_name }"
                    @click="selectVm(group)"
                  >
                    <td class="w-8 text-center px-3 py-2 border-b border-border align-middle">
                      <span
                        class="inline-block w-2 h-2 rounded-full"
                        :class="selectedGroup?.vm_name === group.vm_name ? 'bg-brand shadow-[0_0_0_2px_rgba(59,130,246,0.25)]' : 'bg-border'"
                      ></span>
                    </td>
                    <td class="px-3 py-2 border-b border-border align-middle">
                      <div class="font-medium overflow-hidden text-ellipsis whitespace-nowrap max-w-64" :title="group.vm_name">{{ group.vm_name }}</div>
                    </td>
                    <td class="w-[4.5rem] text-center px-3 py-2 border-b border-border align-middle font-mono text-[0.625rem] opacity-65">{{ group.versions.length }}</td>
                  </tr>
                  <tr v-if="!scanLoading && !filteredGroups.length">
                    <td colspan="3" class="px-3 py-8 text-center text-xs font-medium text-muted">{{ scanError || 'No backups loaded. Scan repository.' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="selectedGroup" class="shrink-0 border-t border-border flex flex-col min-h-0">
              <div class="px-3 py-2 text-[0.625rem] font-bold uppercase tracking-wide text-muted border-b border-border bg-nav">Backup version</div>
              <div class="max-h-44 min-h-0 overflow-auto">
                <table class="w-full border-collapse text-xs text-left">
                  <thead>
                    <tr>
                      <th class="sticky top-0 z-[1] w-8 text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border" aria-label="Selected"></th>
                      <th class="sticky top-0 z-[1] text-left text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border">Date</th>
                      <th class="sticky top-0 z-[1] w-[6.5rem] text-center text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border">Type</th>
                      <th class="sticky top-0 z-[1] w-[4.5rem] text-right text-[0.6875rem] font-semibold uppercase tracking-wide text-muted px-3 py-2 bg-nav border-b border-border">Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(version, idx) in selectedGroup.versions"
                      :key="version.path"
                      class="cursor-pointer transition-colors duration-150 hover:bg-btn-sec-hover"
                      :class="{ 'bg-brand/12 hover:bg-brand/12': selectedVersion?.path === version.path }"
                      @click="selectVersion(version, idx)"
                    >
                      <td class="w-8 text-center px-3 py-2 border-b border-border align-middle">
                        <span
                          class="inline-block w-2 h-2 rounded-full"
                          :class="selectedVersion?.path === version.path ? 'bg-brand shadow-[0_0_0_2px_rgba(59,130,246,0.25)]' : 'bg-border'"
                        ></span>
                      </td>
                      <td class="px-3 py-2 border-b border-border align-middle font-mono font-medium">{{ version.date }}</td>
                      <td class="w-[6.5rem] text-center px-3 py-2 border-b border-border align-middle">
                        <span class="inline-block text-[0.5625rem] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" :class="pointBadgeClass(version)">{{ pointTypeLabel(version) }}</span>
                      </td>
                      <td class="w-[4.5rem] text-right px-3 py-2 border-b border-border align-middle font-mono text-[0.625rem] opacity-65">{{ version.size }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div v-if="chainData?.points?.length" class="px-4 py-3 border-t border-border bg-nav">
                <span class="block text-xs font-semibold uppercase text-muted">CBT backup chain</span>
                <p class="text-[0.625rem] opacity-55 mt-0.5 mb-2 text-muted">Full → incremental → synthetic timeline</p>
                <div class="border border-border rounded-md px-3 py-2 text-xs max-h-[7.5rem] overflow-y-auto">
                  <template v-for="(point, idx) in chainData.points" :key="point.id">
                    <div v-if="idx > 0" class="ml-1 opacity-40 leading-none text-[0.625rem]">↓</div>
                    <div class="flex items-center flex-wrap gap-x-2 gap-y-1.5 py-1" :class="{ 'opacity-85': !point.is_latest }">
                      <span class="w-2 h-2 rounded-full shrink-0" :style="{ background: chainTypeColor(point.type) }"></span>
                      <span class="font-mono font-medium">{{ point.display_date }}</span>
                      <span class="inline-block text-[0.5625rem] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded" :class="chainPointBadgeClass(point.type)">{{ point.type_label }}</span>
                      <span class="opacity-55 font-mono text-[0.625rem]">{{ point.size }}</span>
                      <span v-if="point.is_latest" class="text-[0.625rem] opacity-45">latest</span>
                    </div>
                  </template>
                </div>
              </div>
            </div>

            <div class="shrink-0 px-4 py-3 border-t border-border bg-nav">
              <div class="flex flex-col gap-3">
                <div>
                  <label class="block text-xs font-semibold uppercase text-muted">Target hypervisor</label>
                  <select v-model="form.target_esxi_id" class="mt-1 w-full px-3 py-2 text-xs rounded-md" required @change="loadDatastores">
                    <option v-for="h in hosts" :key="h.id" :value="h.id">{{ h.name }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase text-muted">Target datastore</label>
                  <select v-model="form.datastore" class="mt-1 w-full px-3 py-2 text-xs rounded-md" required :disabled="!datastores.length">
                    <option v-if="!datastores.length" value="" disabled selected>Select host first…</option>
                    <option v-for="ds in datastores" :key="dsName(ds)" :value="dsName(ds)">{{ dsLabel(ds) }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold uppercase text-muted">New VM name</label>
                  <input v-model="form.target_name" class="mt-1 w-full px-3 py-2 text-xs rounded-md" placeholder="e.g. MyVM_Restored" required />
                </div>
                <p v-if="error" class="text-[0.8125rem] text-red-400 m-0">{{ error }}</p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3 px-4 py-3.5 border-t border-border bg-nav shrink-0 max-[480px]:flex-col max-[480px]:items-stretch max-[480px]:gap-2.5">
          <span class="text-xs text-muted shrink-0">{{ selectionLabel }}</span>
          <div class="flex gap-2 flex-wrap justify-end max-[480px]:justify-stretch">
            <button type="button" :class="btnSecondary" class="px-3 py-1.5 text-xs font-medium max-[480px]:flex-1" @click="closeDeploy">Cancel</button>
            <button
              type="button"
              :class="btnPrimary"
              class="px-3 py-1.5 text-xs font-semibold max-[480px]:flex-1"
              :disabled="!canDeploy"
              @click="submitRestore"
            >Deploy and close</button>
          </div>
        </div>
      </aside>
    </div>

    <!-- Restore job details drawer -->
    <div v-if="detailRestore" class="fixed inset-0 z-80">
      <div class="absolute inset-0 bg-black/45 backdrop-blur-[1px]" @click="closeRestoreDrawer"></div>
      <aside
        class="absolute top-0 right-0 bottom-0 w-full max-w-md flex flex-col bg-card border-l border-border shadow-[-4px_0_24px_rgba(0,0,0,0.18)]"
        role="dialog"
        aria-labelledby="restore-detail-title"
      >
        <div class="flex items-center justify-between gap-3 px-4 pt-4 pb-3 border-b border-border bg-nav shrink-0">
          <div class="min-w-0">
            <h3 id="restore-detail-title" class="text-base font-semibold leading-tight m-0 truncate">{{ restoreDrawerTitle }}</h3>
            <p class="text-sm font-mono text-brand mt-0.5 truncate">{{ detailRestore.target_name }}</p>
          </div>
          <button
            type="button"
            class="shrink-0 p-1.5 rounded-md text-muted border border-border bg-transparent cursor-pointer hover:text-main hover:bg-card"
            aria-label="Close"
            @click="closeRestoreDrawer"
          >
            <svg class="w-4 h-4 block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span class="block font-semibold uppercase tracking-wide text-muted mb-1">Host</span>
              <span class="font-mono text-brand">{{ detailRestore.target_esxi_host || '—' }}</span>
            </div>
            <div>
              <span class="block font-semibold uppercase tracking-wide text-muted mb-1">Datastore</span>
              <span class="font-mono text-muted">{{ detailRestore.datastore || '—' }}</span>
            </div>
            <div>
              <span class="block font-semibold uppercase tracking-wide text-muted mb-1">Started</span>
              <span class="font-mono text-muted">{{ formatDate(detailRestore.start_time) }}</span>
            </div>
            <div v-if="detailRestore.end_time">
              <span class="block font-semibold uppercase tracking-wide text-muted mb-1">Finished</span>
              <span class="font-mono text-muted">{{ formatDate(detailRestore.end_time) }}</span>
            </div>
            <div v-if="detailRestore.duration_seconds != null">
              <span class="block font-semibold uppercase tracking-wide text-muted mb-1">Duration</span>
              <span class="font-mono text-muted">{{ formatDuration(detailRestore.duration_seconds) }}</span>
            </div>
            <div class="col-span-2">
              <span class="block font-semibold uppercase tracking-wide text-muted mb-1">Source backup</span>
              <span class="font-mono text-muted break-all">{{ detailRestore.source_path || '—' }}</span>
            </div>
          </div>

          <div v-if="detailRestore.status === 'In Progress'">
            <span class="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Progress</span>
            <div class="rounded-lg border border-blue-500/25 bg-blue-500/8 p-4">
              <div class="flex items-center justify-between gap-2 mb-2">
                <StatusBadge cls="status-running" label="Running" />
                <span class="text-lg font-bold font-mono text-brand tabular-nums">{{ detailRestore.progress }}%</span>
              </div>
              <div class="h-2 rounded-sm bg-border overflow-hidden mb-2">
                <div class="h-full bg-brand rounded-sm transition-[width] duration-500 ease-in-out" :style="{ width: detailRestore.progress + '%' }"></div>
              </div>
              <p class="text-sm text-main m-0">{{ detailRestore.current_action || 'Restoring…' }}</p>
            </div>
          </div>

          <div v-else-if="detailRestore.status === 'Failed'">
            <span class="block text-xs font-semibold uppercase tracking-wide text-muted mb-2">Error</span>
            <pre class="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono p-3 rounded-lg border border-red-500/25 bg-red-500/8 text-red-400 m-0">{{ detailRestore.error_message || 'No error message recorded.' }}</pre>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-4 py-3.5 border-t border-border bg-nav shrink-0">
          <button type="button" :class="btnSecondary" class="px-3 py-1.5 text-xs font-medium" @click="closeRestoreDrawer">Close</button>
          <button
            v-if="detailRestore.status === 'In Progress'"
            type="button"
            :class="btnDanger"
            class="px-3 py-1.5 text-xs font-semibold"
            @click="stopFromDrawer"
          >Stop restore</button>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { restoreApi, hostsApi } from '@/api/client'
import { formatDate, formatDuration, statusBadge } from '@/composables/useJobProgress'
import { useModal } from '@/composables/useModal'
import StatusBadge from '@/components/StatusBadge.vue'

const btnPrimary =
  'inline-flex items-center justify-center rounded-md border-0 bg-brand text-white hover:bg-brand-hover transition-colors duration-200 disabled:opacity-55'
const btnSecondary =
  'inline-flex items-center justify-center rounded-md border border-btn-sec-border bg-btn-sec text-btn-sec-text hover:bg-btn-sec-hover transition-colors duration-200'
const btnDanger =
  'inline-flex items-center justify-center rounded-md border-0 bg-red-600 text-white hover:bg-red-700 transition-colors duration-200'
const btnIcon =
  'inline-flex items-center justify-center w-8 h-8 rounded-md transition-colors duration-200 disabled:opacity-55 disabled:cursor-not-allowed shrink-0'
const btnIconDanger = `${btnIcon} border-0 bg-red-600 text-white hover:bg-red-700`
const btnIconSecondary = `${btnIcon} border border-btn-sec-border bg-btn-sec text-btn-sec-text hover:bg-btn-sec-hover`

const pointBadgeStyles = {
  full: 'bg-blue-500/15 text-blue-400',
  incremental: 'bg-emerald-500/15 text-emerald-400',
  'synthetic-full': 'bg-violet-500/15 text-violet-400',
  legacy: 'bg-gray-500/15 text-muted',
}

const { confirm } = useModal()

const restores = ref([])
const detailRestore = ref(null)
const hosts = ref([])
const groupedBackups = ref([])
const datastores = ref([])
const showDeploy = ref(false)
const scanLoading = ref(false)
const scanError = ref('')
const searchQuery = ref('')
const selectedGroup = ref(null)
const selectedVersion = ref(null)
const chainData = ref(null)
const error = ref('')
const form = ref({ source_ova: '', target_esxi_id: null, datastore: '', target_name: '' })
let timer = null

const filteredGroups = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return groupedBackups.value
  return groupedBackups.value.filter((g) => g.vm_name.toLowerCase().includes(q))
})

const drawerSubtitle = computed(() => {
  if (scanLoading.value) return 'Scanning backup repository…'
  if (groupedBackups.value.length) return `${groupedBackups.value.length} VM(s) · select backup and target`
  return 'Select backup, target host, and deploy'
})

const restoreDrawerTitle = computed(() => {
  if (!detailRestore.value) return 'Restore details'
  if (detailRestore.value.status === 'In Progress') return 'Restore in progress'
  if (detailRestore.value.status === 'Failed') return 'Restore failed'
  if (detailRestore.value.status === 'Success') return 'Restore succeeded'
  return 'Restore details'
})

const selectionLabel = computed(() => {
  if (!selectedVersion.value) return 'No backup selected'
  const v = selectedVersion.value
  const type = pointTypeLabel(v).toLowerCase()
  return `${v.date} · ${type} · ${v.size}`
})

const canDeploy = computed(() =>
  Boolean(selectedVersion.value?.path && form.value.target_esxi_id && form.value.datastore && form.value.target_name.trim())
)

function restoreProgress(r) {
  const b = statusBadge(r.status, r.status === 'In Progress')
  return { cls: b.cls, label: b.label }
}

function openRestoreDrawer(r) {
  detailRestore.value = r
}

function closeRestoreDrawer() {
  detailRestore.value = null
}

async function stopFromDrawer() {
  if (!detailRestore.value) return
  await stop(detailRestore.value.id)
  closeRestoreDrawer()
}

function pointTypeLabel(version) {
  const pt = version.point_type || (version.backup_type === 'legacy' ? 'legacy' : 'full')
  const labels = {
    full: 'Full',
    incremental: 'Incremental',
    synthetic_full: 'Synthetic full',
    legacy: 'Legacy full',
  }
  return labels[pt] || 'Full'
}

function pointTypeKey(version) {
  const pt = version.point_type || (version.backup_type === 'legacy' ? 'legacy' : 'full')
  return pt.replace('_', '-')
}

function pointBadgeClass(version) {
  return pointBadgeStyles[pointTypeKey(version)] || pointBadgeStyles.full
}

function chainPointBadgeClass(type) {
  return pointBadgeStyles[type.replace('_', '-')] || pointBadgeStyles.full
}

function chainTypeColor(type) {
  return { full: '#3b82f6', incremental: '#10b981', synthetic_full: '#8b5cf6' }[type] || '#6b7280'
}

function dsName(ds) {
  return typeof ds === 'string' ? ds : ds.name
}

function dsLabel(ds) {
  if (typeof ds === 'string') return ds
  return ds.free_gb != null ? `${ds.name}  [${ds.free_gb} GB Free]` : ds.name
}

function resetDrawerState() {
  searchQuery.value = ''
  selectedGroup.value = null
  selectedVersion.value = null
  chainData.value = null
  form.value.source_ova = ''
  form.value.target_name = ''
  error.value = ''
  scanError.value = ''
}

function openDeploy() {
  showDeploy.value = true
  scanRepository()
}

function closeDeploy() {
  showDeploy.value = false
  resetDrawerState()
}

async function scanRepository() {
  scanLoading.value = true
  scanError.value = ''
  try {
    groupedBackups.value = await restoreApi.backups()
    if (!groupedBackups.value.length) scanError.value = 'Repository is empty'
  } catch (e) {
    groupedBackups.value = []
    scanError.value = e.message || 'Scan failed'
  } finally {
    scanLoading.value = false
  }
}

async function selectVm(group) {
  selectedGroup.value = group
  if (!form.value.target_name) form.value.target_name = `${group.vm_name}_Restored`
  if (group.versions?.length) selectVersion(group.versions[0], 0)
  else selectedVersion.value = null
  await loadChain(group.vm_name)
}

function selectVersion(version, idx) {
  selectedVersion.value = version
  form.value.source_ova = version.path
}

async function loadChain(vmName) {
  chainData.value = null
  try {
    const data = await restoreApi.chain(vmName)
    if (data?.points?.length) chainData.value = data
  } catch {
    chainData.value = null
  }
}

async function load() {
  const [r, h] = await Promise.all([restoreApi.list(), hostsApi.list()])
  restores.value = r
  if (detailRestore.value) {
    const updated = r.find((job) => job.id === detailRestore.value.id)
    detailRestore.value = updated || null
  }
  hosts.value = h
  if (h.length && !form.value.target_esxi_id) {
    form.value.target_esxi_id = h[0].id
    await loadDatastores()
  }
}

async function loadDatastores() {
  if (!form.value.target_esxi_id) return
  try {
    const ds = await hostsApi.datastores(form.value.target_esxi_id)
    datastores.value = Array.isArray(ds) ? ds : ds.datastores || []
    if (datastores.value.length) form.value.datastore = dsName(datastores.value[0])
    else form.value.datastore = ''
  } catch {
    datastores.value = []
    form.value.datastore = ''
  }
}

async function submitRestore() {
  if (!canDeploy.value) return
  const ok = await confirm('Launch restore to the target host? Existing VMs with the same name may conflict if running.', {
    title: 'Launch restore',
    confirmText: 'Deploy',
  })
  if (!ok) return
  error.value = ''
  try {
    await restoreApi.create({
      target_esxi_id: form.value.target_esxi_id,
      source_ova: form.value.source_ova,
      target_name: form.value.target_name.trim(),
      datastore: form.value.datastore,
    })
    closeDeploy()
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
