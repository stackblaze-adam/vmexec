import { ref } from 'vue'

const state = ref(null)

export function useModal() {
  function confirm(message, { title = 'Confirm', confirmText = 'OK', danger = false } = {}) {
    return new Promise((resolve) => {
      state.value = { type: 'confirm', title, message, confirmText, danger, resolve }
    })
  }

  function alert(message, { title = 'Notice', confirmText = 'OK' } = {}) {
    return new Promise((resolve) => {
      state.value = { type: 'alert', title, message, confirmText, resolve }
    })
  }

  function close(result) {
    if (state.value?.resolve) state.value.resolve(result)
    state.value = null
  }

  return { modalState: state, confirm, alert, close }
}
