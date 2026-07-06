<template>
  <span :class="badgeClass">{{ label }}</span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cls: { type: String, required: true },
  label: { type: String, required: true },
})

const VARIANTS = {
  'status-success': 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  'status-error': 'bg-red-500/10 text-red-400 border border-red-500/20',
  'status-neutral': 'bg-gray-500/10 text-muted border border-border',
  'status-running': 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
  'status-cancelled': 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
}

const badgeClass = computed(() => [
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
  VARIANTS[props.cls] || VARIANTS['status-neutral'],
])
</script>
