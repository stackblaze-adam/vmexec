<template>
  <div
    v-if="modalState"
    class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    @keydown.esc="onCancel"
  >
    <div class="absolute inset-0 bg-black/55 backdrop-blur-[2px]" @click="onCancel"></div>
    <div
      class="relative w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-card"
      role="dialog"
    >
      <h3 class="mb-2 font-bold">{{ modalState.title }}</h3>
      <p class="mb-4 text-sm text-muted">{{ modalState.message }}</p>
      <div class="flex justify-end gap-2">
        <button
          v-if="modalState.type === 'confirm'"
          type="button"
          class="inline-flex items-center justify-center gap-1.5 rounded-md border border-btn-sec-border bg-btn-sec px-4 py-2 text-sm text-btn-sec-text hover:bg-btn-sec-hover"
          @click="onCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          :class="modalState.danger ? dangerBtnClass : primaryBtnClass"
          @click="onOk"
        >
          {{ modalState.confirmText || 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useModal } from '@/composables/useModal'

const { modalState, close } = useModal()

const primaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 rounded-md border-0 bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover disabled:opacity-55'

const dangerBtnClass =
  'inline-flex items-center justify-center gap-1.5 rounded-md border-0 bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-55'

function onOk() {
  close(modalState.value?.type === 'confirm')
}

function onCancel() {
  close(false)
}
</script>
