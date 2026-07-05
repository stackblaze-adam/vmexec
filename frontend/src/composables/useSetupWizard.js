import { ref } from 'vue'

export const setupWizardOpen = ref(false)

export function useSetupWizard() {
  function open() {
    setupWizardOpen.value = true
  }
  function close() {
    setupWizardOpen.value = false
  }
  return { visible: setupWizardOpen, open, close }
}
