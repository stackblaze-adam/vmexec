<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[110] flex items-center justify-center p-4"
    role="dialog"
    aria-modal="true"
    @keydown.esc="onEsc"
  >
    <div class="absolute inset-0 bg-black/55 backdrop-blur-[2px]" @click="onBackdrop"></div>
    <div
      class="relative w-full rounded-xl border border-border bg-card shadow-card"
      :class="wide ? 'max-w-2xl' : 'max-w-lg'"
    >
      <div class="flex items-start justify-between gap-3 px-6 pt-5 pb-2">
        <div class="min-w-0">
          <h3 class="text-lg font-semibold">{{ title }}</h3>
          <p v-if="subtitle" class="text-xs text-muted mt-1">{{ subtitle }}</p>
        </div>
        <button
          v-if="!busy"
          type="button"
          class="shrink-0 p-1.5 rounded-md text-muted transition-[color,background] duration-150 hover:text-main hover:bg-btn-sec"
          aria-label="Close"
          @click="$emit('close')"
        >
          <svg class="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="px-6 pb-5">
        <slot />
      </div>
      <div v-if="$slots.footer" class="flex justify-end gap-2 px-6 pb-5 pt-2 border-t border-border">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  busy: { type: Boolean, default: false },
  wide: { type: Boolean, default: false },
})

const emit = defineEmits(['close'])

function onEsc() {
  if (!props.busy) emit('close')
}

function onBackdrop() {
  if (!props.busy) emit('close')
}
</script>
