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
  if (typeof info.is_running === 'boolean') return info.is_running
  const action = (info.current_action || '').trim()
  if (!action) return false
  if (/^PENDING_|^Queued/.test(action)) return true
  if (/^(Preflight|CBT|Backing up VM|Fallback:|Creating backup snapshot|Waiting |Streaming disk|Secondary copy|Cleaning up|Shutting down|⚡)/.test(action)) return true
  if (action.startsWith('Backing up...')) {
    return (info.speed_mbps || 0) > 0 && (info.progress || 0) < 100
  }
  return (info.speed_mbps || 0) > 0 && (info.progress || 0) > 0 && (info.progress || 0) < 100
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

// Parse a backend timestamp. Backend stores UTC via isoformat() with no
// timezone suffix, so a bare datetime string must be treated as UTC (append Z)
// or relative math is off by the viewer's timezone offset.
export function parseServerDate(isoOrTs) {
  if (isoOrTs == null) return null
  if (typeof isoOrTs === 'number') return new Date(isoOrTs * 1000)
  let s = String(isoOrTs)
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)
  if (!hasTz && /\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/.test(s)) {
    s = s.replace(' ', 'T') + 'Z'
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d
}

// Relative time, e.g. "just now", "5 min ago", "3 hours ago", "1 day ago".
// Falls back to an absolute date for anything older than a week.
export function formatRelativeTime(isoOrTs) {
  const d = parseServerDate(isoOrTs)
  if (!d) return '—'
  const diffMs = Date.now() - d.getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 0) return 'just now'
  if (sec < 45) return 'just now'
  const min = Math.floor(sec / 60)
  if (min < 1) return 'just now'
  if (min < 60) return `${min} min ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day} day${day === 1 ? '' : 's'} ago`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

// Human-readable elapsed time, e.g. 45s, 3m 05s, 1h 12m
export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || Number.isNaN(Number(seconds))) return ''
  const s = Math.max(0, Math.round(Number(seconds)))
  if (s < 60) return `${s}s`
  const p = (n) => String(n).padStart(2, '0')
  const m = Math.floor(s / 60)
  const sec = s % 60
  if (m < 60) return `${m}m ${p(sec)}s`
  const h = Math.floor(m / 60)
  return `${h}h ${p(m % 60)}m`
}
