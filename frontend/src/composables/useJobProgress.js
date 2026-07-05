import { onMounted, onUnmounted } from 'vue'
import { jobsApi } from '@/api/client'

export function useJobProgress(onUpdate) {
  let timer = null

  async function poll() {
    try {
      const data = await jobsApi.progress()
      onUpdate(data)
    } catch {
      /* ignore transient errors */
    }
  }

  onMounted(() => {
    poll()
    timer = setInterval(poll, 2000)
  })

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })
}

export function isJobActive(info) {
  if (!info) return false
  return info.current_action !== '' || (info.progress > 0 && info.progress < 100)
}

export function statusBadge(status, active) {
  if (active) return { cls: 'status-running', label: 'Running' }
  const map = {
    Success: { cls: 'status-success', label: 'Success' },
    Failed: { cls: 'status-error', label: 'Failed' },
    Cancelled: { cls: 'status-cancelled', label: 'Cancelled' },
    Skipped: { cls: 'status-neutral', label: 'Skipped' },
  }
  return map[status] || { cls: 'status-neutral', label: 'Idle' }
}

export function copyBadge(status) {
  const s = (status || 'none').toLowerCase()
  const map = {
    ok: { cls: 'status-success', label: 'OK' },
    failed: { cls: 'status-error', label: 'Failed' },
    skipped: { cls: 'status-neutral', label: 'Skipped' },
    copying: { cls: 'status-running', label: 'Copying' },
  }
  return map[s] || { cls: 'status-neutral', label: '—' }
}

export function formatDate(isoOrTs) {
  if (!isoOrTs) return 'Never'
  const d = typeof isoOrTs === 'number' ? new Date(isoOrTs * 1000) : new Date(isoOrTs)
  if (Number.isNaN(d.getTime())) return 'Never'
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
