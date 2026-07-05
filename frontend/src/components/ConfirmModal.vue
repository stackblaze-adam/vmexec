<template>
  <div v-if="modalState" class="modal-overlay" @keydown.esc="onCancel">
    <div class="modal-backdrop" @click="onCancel"></div>
    <div class="modal-panel card" role="dialog">
      <h3 class="font-bold mb-2">{{ modalState.title }}</h3>
      <p class="text-sm mb-4" style="color: var(--text-muted)">{{ modalState.message }}</p>
      <div class="flex justify-end gap-2">
        <button v-if="modalState.type === 'confirm'" type="button" class="btn-secondary px-4 py-2 text-sm" @click="onCancel">Cancel</button>
        <button type="button" :class="modalState.danger ? 'btn-danger' : 'btn-primary'" class="px-4 py-2 text-sm font-medium" @click="onOk">
          {{ modalState.confirmText || 'OK' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useModal } from '@/composables/useModal'

const { modalState, close } = useModal()

function onOk() {
  close(modalState.value?.type === 'confirm')
}

function onCancel() {
  close(false)
}
</script>
