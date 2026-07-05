const INFRA_RE = [
  /vcenter/i,
  /\bvcls\b/i,
  /vsphere cluster service/i,
  /photon platform/i,
]

export function isInfraVm(name) {
  return INFRA_RE.some((re) => re.test(name || ''))
}

export function shouldProtectVm(name) {
  const lower = (name || '').toLowerCase()
  if (lower.startsWith('tpl-') || lower.startsWith('template')) return false
  if (lower.includes('novabak')) return false
  if (lower.startsWith('vcls')) return false
  return true
}
