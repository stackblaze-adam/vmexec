<template>
  <div>
    <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div>
        <h1 class="text-2xl font-bold">Overview</h1>
        <p class="text-sm mt-1" style="color: var(--text-muted)">Backup health, storage, and activity at a glance</p>
      </div>
      <div class="flex items-center gap-2 text-xs" style="color: var(--text-muted)">
        <span>{{ updatedLabel }}</span>
        <button type="button" class="btn-secondary px-2 py-1 rounded text-xs font-medium" @click="refresh(true)">Refresh</button>
      </div>
    </div>

    <div v-if="data?.setup_incomplete" class="mb-5 px-4 py-3 rounded-lg border text-sm flex flex-wrap items-center justify-between gap-3" style="border-color: rgba(234,179,8,0.35); background: rgba(234,179,8,0.08)">
      <span>Setup incomplete — configure storage, hosts, and select VMs to protect.</span>
      <button type="button" class="btn-primary px-3 py-1.5 text-xs font-semibold rounded" @click="openWizard">Open setup wizard</button>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <div class="overview-stat-card">
        <div class="overview-stat-label">Protected</div>
        <div class="overview-stat-value">{{ data?.protected_count ?? '—' }}</div>
        <div class="overview-stat-sub">{{ data?.scheduled_count ?? 0 }} scheduled</div>
      </div>
      <div class="overview-stat-card">
        <div class="overview-stat-label">Running</div>
        <div class="overview-stat-value text-blue-400">{{ data?.running_count ?? '—' }}</div>
        <div class="overview-stat-sub">active backups</div>
      </div>
      <div class="overview-stat-card">
        <div class="overview-stat-label">Success</div>
        <div class="overview-stat-value text-emerald-500">{{ data?.status_counts?.Success ?? '—' }}</div>
        <div class="overview-stat-sub">last run OK</div>
      </div>
      <div class="overview-stat-card">
        <div class="overview-stat-label">Failed</div>
        <div class="overview-stat-value text-red-400">{{ data?.status_counts?.Failed ?? '—' }}</div>
        <div class="overview-stat-sub">need attention</div>
      </div>
      <div class="overview-stat-card">
        <div class="overview-stat-label">7d success</div>
        <div class="overview-stat-value">{{ data?.success_rate_7d != null ? data.success_rate_7d + '%' : '—' }}</div>
        <div class="overview-stat-sub">{{ logTotal7d }} events</div>
      </div>
      <div class="overview-stat-card">
        <div class="overview-stat-label">Engine</div>
        <div class="overview-stat-value" :class="data?.worker_online ? 'text-emerald-500' : 'text-red-400'">{{ data?.worker_online ? 'Online' : 'Offline' }}</div>
        <div class="overview-stat-sub">{{ workerSub }}</div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
      <div class="card overview-panel">
        <div class="overview-panel-header">
          <span>Storage</span>
          <span class="overview-chip">{{ data?.storage?.type ?? '—' }}</span>
        </div>
        <div class="overview-panel-body">
          <div class="overview-storage-path-line text-xs">
            <span style="color: var(--text-muted)">Backup path</span>
            <span style="color: var(--text-muted)">·</span>
            <span class="font-mono truncate" style="color: var(--brand)">{{ data?.storage?.path ?? '—' }}</span>
          </div>
          <div v-if="data?.storage?.disk_total_gb" class="overview-storage-disk">
            <div class="overview-donut-wrap">
              <div class="overview-ring">
                <svg viewBox="0 0 36 36" class="overview-ring-svg">
                  <circle class="overview-ring-bg" cx="18" cy="18" r="15.9155" />
                  <circle class="overview-ring-seg ring-free" cx="18" cy="18" r="15.9155" pathLength="100" :style="donutSeg(freePct, 0)" />
                  <circle class="overview-ring-seg ring-used" cx="18" cy="18" r="15.9155" pathLength="100" :style="donutSeg(usedPct, freePct)" />
                  <circle class="overview-ring-seg ring-backup" cx="18" cy="18" r="15.9155" pathLength="100" :style="donutSeg(backupPct, freePct + usedPct)" />
                </svg>
                <div class="overview-ring-center">
                  <div class="overview-ring-value">{{ data.storage.disk_free_gb?.toFixed(0) }} GB</div>
                  <div class="overview-ring-pct">{{ data.storage.disk_free_pct?.toFixed(0) }}% free</div>
                </div>
              </div>
            </div>
            <p class="overview-donut-legend-line">
              <span class="overview-legend-item"><span class="overview-legend-swatch ring-free"></span>Free <strong>{{ data.storage.disk_free_gb?.toFixed(1) }} GB</strong></span>
              <span class="overview-legend-item"><span class="overview-legend-swatch ring-used"></span>Used <strong>{{ data.storage.disk_used_gb?.toFixed(1) }} GB</strong></span>
              <span class="overview-legend-item"><span class="overview-legend-swatch ring-backup"></span>Backups <strong>{{ data.storage.total_human }}</strong></span>
            </p>
          </div>
          <div v-if="data?.storage?.scan_error" class="mt-3 text-xs text-red-400">{{ data.storage.scan_error }}</div>
        </div>
      </div>

      <div class="card overview-panel">
        <div class="overview-panel-header"><span>Backup status</span><span class="text-[10px] font-normal opacity-60">protected VMs · last run</span></div>
        <div class="overview-panel-body">
          <div v-for="row in statusRows" :key="row.key" class="overview-status-row">
            <span class="overview-status-row-label">{{ row.key }}</span>
            <div class="overview-status-row-bar"><div class="overview-status-row-fill" :style="{ width: row.pct + '%', background: row.color }"></div></div>
            <span class="overview-status-row-count">{{ row.count }}</span>
          </div>
          <div class="mt-4 pt-3 border-t grid grid-cols-2 gap-2 text-center" style="border-color: var(--border-color)">
            <div><div class="text-lg font-bold">{{ data?.host_count ?? '—' }}</div><div class="text-[10px] uppercase" style="color: var(--text-muted)">{{ data?.host_label ?? 'Hosts' }}</div></div>
            <div><div class="text-lg font-bold">{{ data?.inventory_count ?? '—' }}</div><div class="text-[10px] uppercase" style="color: var(--text-muted)">Inventory VMs</div></div>
          </div>
        </div>
      </div>

      <div class="card overview-panel">
        <div class="overview-panel-header"><span>Last 7 days</span><span class="text-[10px] font-normal opacity-60">backup events</span></div>
        <div class="overview-panel-body">
          <div v-for="row in logRows" :key="row.key" class="overview-status-row">
            <span class="overview-status-row-label">{{ row.key }}</span>
            <div class="overview-status-row-bar"><div class="overview-status-row-fill" :style="{ width: row.pct + '%', background: row.color }"></div></div>
            <span class="overview-status-row-count">{{ row.count }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
      <div class="card overview-panel">
        <div class="overview-panel-header">
          <span>Live backups</span>
          <RouterLink to="/backup" class="text-xs font-medium" style="color: var(--brand)">View backups →</RouterLink>
        </div>
        <div class="overview-panel-body overview-scroll-list">
          <div v-if="!data?.live_jobs?.length" class="text-sm py-6 text-center opacity-50 italic">No backups running</div>
          <div v-for="j in data?.live_jobs || []" :key="j.vm_id" class="overview-live-item">
            <div class="flex justify-between text-sm"><span class="font-semibold">{{ j.vm_name }}</span><span class="font-mono text-blue-400">{{ j.progress }}%</span></div>
            <div class="text-xs truncate" style="color: var(--text-muted)">{{ j.current_action }}</div>
            <div class="prog-container active mt-1"><div class="prog-bar" :style="{ width: j.progress + '%' }"></div></div>
          </div>
        </div>
      </div>
      <div class="card overview-panel">
        <div class="overview-panel-header">
          <span>Active restores</span>
          <RouterLink to="/restore" class="text-xs font-medium" style="color: var(--brand)">Restore →</RouterLink>
        </div>
        <div class="overview-panel-body overview-scroll-list">
          <div v-if="!data?.active_restores?.length" class="text-sm py-6 text-center opacity-50 italic">No active restores</div>
          <div v-for="r in data?.active_restores || []" :key="r.id" class="overview-live-item">
            <div class="flex justify-between text-sm"><span class="font-semibold">{{ r.vm_name }}</span><StatusBadge cls="status-running" label="In Progress" /></div>
            <div class="text-xs" style="color: var(--text-muted)">{{ r.current_action || r.status }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div class="card overview-panel">
        <div class="overview-panel-header"><span>Recent activity</span></div>
        <div class="overview-panel-body overview-scroll-list max-h-80 overflow-y-auto">
          <div v-for="l in data?.recent_activity || []" :key="l.id" class="overview-activity-item flex justify-between gap-2 text-sm">
            <span class="truncate">{{ l.vm_name }}</span>
            <StatusBadge :cls="logClass(l.status)" :label="l.status" />
          </div>
          <div v-if="!data?.recent_activity?.length" class="text-sm py-6 text-center opacity-50 italic">No recent activity</div>
        </div>
      </div>
      <div class="card overview-panel">
        <div class="overview-panel-header">
          <span>Needs attention</span>
          <span v-if="data?.attention?.length" class="overview-chip overview-chip-warn">{{ data.attention.length }}</span>
        </div>
        <div class="overview-panel-body overview-scroll-list max-h-80 overflow-y-auto">
          <div v-for="a in data?.attention || []" :key="a.vm_id + a.reason" class="overview-attention-item text-sm">
            <span class="font-medium">{{ a.vm_name }}</span> — {{ a.reason }}
            <div class="text-xs mt-0.5" style="color: var(--text-muted)">{{ a.host_name }}</div>
          </div>
          <div v-if="!data?.attention?.length" class="text-sm py-6 text-center opacity-50 italic">All clear</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { overviewApi } from '@/api/client'
import { useSetupWizard } from '@/composables/useSetupWizard'
import StatusBadge from '@/components/StatusBadge.vue'

const { open: openWizard } = useSetupWizard()
const data = ref(null)
const updatedAt = ref(null)
let timer = null

const updatedLabel = computed(() => updatedAt.value ? `Updated ${updatedAt.value.toLocaleTimeString()}` : 'Loading…')
const logTotal7d = computed(() => Object.values(data.value?.log_stats_7d || {}).reduce((a, b) => a + b, 0))
const workerSub = computed(() => {
  const age = data.value?.worker_last_seen_seconds
  if (age == null) return 'worker status'
  return age < 60 ? 'seen just now' : `seen ${Math.round(age / 60)}m ago`
})

const statusColors = { Success: '#10b981', Failed: '#ef4444', Cancelled: '#6b7280', Skipped: '#9ca3af', Never: '#64748b', Other: '#6b7280' }
const logColors = { Success: '#10b981', Failed: '#ef4444', Cancelled: '#6b7280', Skipped: '#9ca3af', Warning: '#f59e0b', Other: '#6b7280' }

const statusRows = computed(() => barRows(data.value?.status_counts, statusColors))
const logRows = computed(() => barRows(data.value?.log_stats_7d, logColors))

const freePct = computed(() => pct(data.value?.storage?.disk_free_gb, data.value?.storage?.disk_total_gb))
const usedPct = computed(() => {
  const total = data.value?.storage?.disk_total_gb || 0
  const used = (data.value?.storage?.disk_used_gb || 0) - (data.value?.storage?.disk_total_gb ? 0 : 0)
  return total ? Math.max(0, ((data.value?.storage?.disk_used_gb || 0) / total) * 100) : 0
})
const backupPct = computed(() => {
  const total = data.value?.storage?.disk_total_gb || 0
  if (!total) return 0
  const backupGb = (data.value?.storage?.disk_used_gb || 0) * 0.3
  return Math.min(20, (backupGb / total) * 100)
})

function pct(part, whole) {
  if (!whole) return 0
  return Math.min(100, Math.max(0, ((part || 0) / whole) * 100))
}

function barRows(counts, colors) {
  if (!counts) return []
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1
  return Object.entries(counts).filter(([k, n]) => n > 0 || k !== 'Other').map(([key, count]) => ({
    key, count,
    pct: Math.max(count ? (count / total) * 100 : 0, count ? 4 : 0),
    color: colors[key] || '#6b7280',
  }))
}

function donutSeg(pctVal, offset) {
  const p = Math.min(100, Math.max(0, pctVal))
  return { strokeDasharray: `${p} ${100 - p}`, strokeDashoffset: String(-offset) }
}

function logClass(s) {
  if (s === 'Success') return 'status-success'
  if (s === 'Failed') return 'status-error'
  return 'status-neutral'
}

async function refresh() {
  data.value = await overviewApi.get()
  updatedAt.value = new Date()
}

onMounted(() => {
  refresh()
  timer = setInterval(refresh, 15000)
})
onUnmounted(() => { if (timer) clearInterval(timer) })
</script>

<style scoped>
.flex { display: flex; }
.grid { display: grid; }
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-5 { gap: 1.25rem; }
.mb-5 { margin-bottom: 1.25rem; }
.mb-6 { margin-bottom: 1.5rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-3 { margin-top: 0.75rem; }
.mt-4 { margin-top: 1rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.pt-3 { padding-top: 0.75rem; }
.text-xs { font-size: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-2xl { font-size: 1.5rem; }
.text-\[10px\] { font-size: 10px; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }
.font-medium { font-weight: 500; }
.font-mono { font-family: ui-monospace, monospace; }
.font-normal { font-weight: 400; }
.uppercase { text-transform: uppercase; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.text-center { text-align: center; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.flex-wrap { flex-wrap: wrap; }
.overflow-y-auto { overflow-y: auto; }
.max-h-80 { max-height: 20rem; }
.border-t { border-top-width: 1px; }
.rounded { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.italic { font-style: italic; }
.opacity-50 { opacity: 0.5; }
.opacity-60 { opacity: 0.6; }
@media (min-width: 768px) {
  .md\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (min-width: 1024px) {
  .lg\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lg\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\:grid-cols-6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
}
</style>
