<template>
  <div class="job-schedule-popover p-3" @click.stop>
    <div class="mb-2 flex justify-between items-center">
      <span class="input-label text-xs">Frequency</span>
      <span v-if="saved" class="text-xs font-semibold text-green-400">✓ Saved</span>
    </div>
    <select v-model="form.schedule_frequency" class="w-full py-1.5 px-2 text-xs mb-2" @change="save">
      <option value="daily">Daily</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
    </select>

    <div class="mb-2" :style="{ opacity: form.schedule_frequency === 'daily' ? 0.35 : 1 }">
      <span class="input-label text-xs">Days</span>
      <div class="grid grid-cols-7 gap-0.5 mt-1">
        <label v-for="d in dayLabels" :key="d.num" class="text-center text-xs py-1 rounded border cursor-pointer"
          :style="days.includes(String(d.num)) ? 'border-color:var(--brand);color:var(--brand)' : ''">
          <input v-model="days" type="checkbox" :value="String(d.num)" class="sr-only" :disabled="form.schedule_frequency === 'daily'" @change="onDaysChange" />
          {{ d.lbl }}
        </label>
      </div>
    </div>

    <div class="grid grid-cols-4 gap-2 mb-2">
      <div><span class="input-label text-xs">Hour</span><input v-model.number="form.schedule_hour" type="number" min="0" max="23" class="w-full px-2 py-1 text-center text-sm font-mono" @change="save" /></div>
      <div><span class="input-label text-xs">Min</span><input v-model.number="form.schedule_minute" type="number" min="0" max="59" class="w-full px-2 py-1 text-center text-sm font-mono" @change="save" /></div>
      <div><span class="input-label text-xs">Keep</span><input v-model.number="form.retention_count" type="number" min="1" max="60" class="w-full px-2 py-1 text-center text-sm font-mono" @change="save" /></div>
      <div class="flex flex-col items-center">
        <span class="input-label text-xs">Active</span>
        <input v-model="form.is_job_active" type="checkbox" class="mt-2" @change="save" />
      </div>
    </div>

    <div class="pt-2 mb-2" style="border-top: 1px dashed var(--border-color)">
      <label class="flex items-center gap-2 text-xs cursor-pointer">
        <input v-model="form.power_off_for_backup" type="checkbox" @change="save" />
        <span :style="{ color: form.power_off_for_backup ? '#f97316' : '#059669' }">
          {{ form.power_off_for_backup ? 'Power off — faster backup' : 'Live — VM stays on' }}
        </span>
      </label>
    </div>

    <div class="pt-2" style="border-top: 1px dashed var(--border-color)">
      <label class="flex items-center gap-2 text-xs cursor-pointer">
        <input v-model="form.cbt_enabled" type="checkbox" @change="save" />
        <span :style="{ color: form.cbt_enabled ? 'var(--brand)' : 'var(--text-muted)' }">
          {{ form.cbt_enabled ? 'Incremental — delta after first full' : 'Full only — no incrementals' }}
        </span>
      </label>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { jobsApi } from '@/api/client'

const props = defineProps({ vm: { type: Object, required: true } })
const emit = defineEmits(['updated'])

const dayLabels = [
  { num: 0, lbl: 'Mo' }, { num: 1, lbl: 'Tu' }, { num: 2, lbl: 'We' }, { num: 3, lbl: 'Th' },
  { num: 4, lbl: 'Fr' }, { num: 5, lbl: 'Sa' }, { num: 6, lbl: 'Su' },
]

const saved = ref(false)
let saveTimer = null

const form = reactive({
  schedule_frequency: 'daily',
  schedule_hour: 2,
  schedule_minute: 0,
  retention_count: 7,
  is_job_active: true,
  power_off_for_backup: false,
  cbt_enabled: true,
})

const days = ref(['0', '1', '2', '3', '4', '5', '6'])

function syncFromVm(vm) {
  form.schedule_frequency = vm.schedule_frequency || 'daily'
  form.schedule_hour = vm.schedule_hour ?? 2
  form.schedule_minute = vm.schedule_minute ?? 0
  form.retention_count = vm.retention_count ?? 7
  form.is_job_active = vm.is_job_active !== false
  form.power_off_for_backup = !!vm.power_off_for_backup
  form.cbt_enabled = vm.cbt_enabled !== false
  days.value = (vm.schedule_days || '0,1,2,3,4,5,6').split(',').filter(Boolean)
}

watch(() => props.vm, (vm) => { if (vm) syncFromVm(vm) }, { immediate: true })

function onDaysChange() {
  if (form.schedule_frequency === 'daily') days.value = ['0', '1', '2', '3', '4', '5', '6']
  debounceSave()
}

function debounceSave() {
  clearTimeout(saveTimer)
  saveTimer = setTimeout(save, 600)
}

async function save() {
  clearTimeout(saveTimer)
  try {
    const body = {
      ...form,
      schedule_days: days.value.length ? days.value.join(',') : '0,1,2,3,4,5,6',
    }
    const updated = await jobsApi.patch(props.vm.id, body)
    saved.value = true
    setTimeout(() => { saved.value = false }, 1800)
    emit('updated', updated)
  } catch (e) {
    console.warn('schedule save failed', e)
  }
}
</script>

<style scoped>
.grid { display: grid; }
.grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.grid-cols-7 { grid-template-columns: repeat(7, minmax(0, 1fr)); }
.gap-0\.5 { gap: 0.125rem; }
.gap-2 { gap: 0.5rem; }
.mb-2 { margin-bottom: 0.5rem; }
.p-3 { padding: 0.75rem; }
.pt-2 { padding-top: 0.5rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-1\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
.text-xs { font-size: 0.75rem; }
.font-mono { font-family: ui-monospace, monospace; }
.font-semibold { font-weight: 600; }
.text-center { text-align: center; }
.w-full { width: 100%; }
.flex { display: flex; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.cursor-pointer { cursor: pointer; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); }
.border { border-width: 1px; border-style: solid; border-color: var(--border-color); }
.rounded { border-radius: 0.25rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
</style>
