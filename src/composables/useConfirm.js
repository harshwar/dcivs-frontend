/**
 * useConfirm Composable
 * Promise-based confirmation dialog.
 * Usage: const { confirm } = useConfirm(); const ok = await confirm('Title', 'Message');
 */
import { reactive } from 'vue'

const state = reactive({
  visible: false,
  title: '',
  message: '',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  danger: false,
  resolve: null,
})

export function useConfirm() {
  function confirm(title, message, options = {}) {
    state.title = title
    state.message = message
    state.confirmText = options.confirmText || 'Confirm'
    state.cancelText = options.cancelText || 'Cancel'
    state.danger = options.danger || false
    state.visible = true

    return new Promise((resolve) => {
      state.resolve = resolve
    })
  }

  function handleConfirm() {
    state.visible = false
    if (state.resolve) state.resolve(true)
    state.resolve = null
  }

  function handleCancel() {
    state.visible = false
    if (state.resolve) state.resolve(false)
    state.resolve = null
  }

  return {
    state,
    confirm,
    handleConfirm,
    handleCancel,
  }
}
