/**
 * useToast Composable
 * Global toast notification system.
 * Usage: const toast = useToast(); toast.success('Done!');
 */
import { reactive, computed } from 'vue'

let toastId = 0

const state = reactive({
  toasts: []
})

// Computed ref so destructured `toasts` stays reactive
const toastsRef = computed(() => state.toasts)

function addToast(message, type = 'info', duration = 4000) {
  const id = ++toastId
  state.toasts.push({ id, message, type, visible: true })

  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }

  return id
}

function removeToast(id) {
  const index = state.toasts.findIndex(t => t.id === id)
  if (index !== -1) {
    state.toasts[index].visible = false
    // Remove from DOM after exit animation
    setTimeout(() => {
      state.toasts = state.toasts.filter(t => t.id !== id)
    }, 300)
  }
}

export function useToast() {
  return {
    toasts: toastsRef,
    success: (msg, duration) => addToast(msg, 'success', duration),
    error: (msg, duration) => addToast(msg, 'error', duration),
    info: (msg, duration) => addToast(msg, 'info', duration),
    warning: (msg, duration) => addToast(msg, 'warning', duration),
    remove: removeToast,
  }
}
