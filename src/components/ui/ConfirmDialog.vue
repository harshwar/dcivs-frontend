<template>
  <Teleport to="body">
    <Transition name="confirm-overlay">
      <div v-if="state.visible" class="confirm-overlay" @click.self="handleCancel">
        <Transition name="confirm-dialog" appear>
          <div v-if="state.visible" class="confirm-dialog" role="alertdialog" :aria-label="state.title">
            <div :class="['confirm-dialog__icon', state.danger ? 'confirm-dialog__icon--danger' : 'confirm-dialog__icon--info']">
              <span v-if="state.danger">⚠</span>
              <span v-else>?</span>
            </div>
            <h3 class="confirm-dialog__title">{{ state.title }}</h3>
            <p class="confirm-dialog__message">{{ state.message }}</p>
            <div class="confirm-dialog__actions">
              <button class="confirm-dialog__btn confirm-dialog__btn--cancel" @click="handleCancel">
                {{ state.cancelText }}
              </button>
              <button
                :class="['confirm-dialog__btn', state.danger ? 'confirm-dialog__btn--danger' : 'confirm-dialog__btn--confirm']"
                @click="handleConfirm"
                ref="confirmBtn"
              >
                {{ state.confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useConfirm } from '../../composables/useConfirm.js'

const { state, handleConfirm, handleCancel } = useConfirm()
const confirmBtn = ref(null)

watch(() => state.visible, async (visible) => {
  if (visible) {
    await nextTick()
    confirmBtn.value?.focus()
  }
})

function onEscape(e) {
  if (e.key === 'Escape' && state.visible) {
    handleCancel()
  }
}

onMounted(() => window.addEventListener('keydown', onEscape))
onBeforeUnmount(() => window.removeEventListener('keydown', onEscape))
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  inset: 0;
  z-index: 99998;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  padding: 1rem;
}

.confirm-dialog {
  width: 100%;
  max-width: 400px;
  background: #161b22;
  border: 1px solid rgba(48, 54, 61, 0.8);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05);
  font-family: 'Inter', -apple-system, sans-serif;
}

.confirm-dialog__icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.25rem;
  font-size: 1.5rem;
}

.confirm-dialog__icon--danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.confirm-dialog__icon--info {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border: 1px solid rgba(99, 102, 241, 0.3);
}

.confirm-dialog__title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #f0f6fc;
}

.confirm-dialog__message {
  margin: 0 0 1.75rem;
  font-size: 0.875rem;
  color: #8b949e;
  line-height: 1.5;
}

.confirm-dialog__actions {
  display: flex;
  gap: 0.75rem;
}

.confirm-dialog__btn {
  flex: 1;
  padding: 0.625rem 1rem;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
  font-family: inherit;
}

.confirm-dialog__btn--cancel {
  background: #21262d;
  color: #c9d1d9;
  border: 1px solid #30363d;
}
.confirm-dialog__btn--cancel:hover {
  background: #30363d;
  color: #f0f6fc;
}

.confirm-dialog__btn--confirm {
  background: #6366f1;
  color: white;
  box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}
.confirm-dialog__btn--confirm:hover {
  background: #818cf8;
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.confirm-dialog__btn--danger {
  background: #dc2626;
  color: white;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}
.confirm-dialog__btn--danger:hover {
  background: #ef4444;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  transform: translateY(-1px);
}

.confirm-overlay-enter-active { transition: opacity 0.2s ease; }
.confirm-overlay-leave-active { transition: opacity 0.2s ease 0.1s; }
.confirm-overlay-enter-from, .confirm-overlay-leave-to { opacity: 0; }

.confirm-dialog-enter-active { transition: all 0.3s cubic-bezier(0.21, 1.02, 0.73, 1); }
.confirm-dialog-leave-active { transition: all 0.2s ease; }
.confirm-dialog-enter-from { opacity: 0; transform: scale(0.9) translateY(10px); }
.confirm-dialog-leave-to { opacity: 0; transform: scale(0.95) translateY(-5px); }

/* Light mode */
:global(.light) .confirm-dialog,
:global(html:not(.dark)) .confirm-dialog {
  background: #ffffff;
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}
:global(.light) .confirm-dialog__title,
:global(html:not(.dark)) .confirm-dialog__title { color: #1f2937; }
:global(.light) .confirm-dialog__message,
:global(html:not(.dark)) .confirm-dialog__message { color: #6b7280; }
:global(.light) .confirm-dialog__btn--cancel,
:global(html:not(.dark)) .confirm-dialog__btn--cancel {
  background: #f3f4f6; color: #374151; border-color: #e5e7eb;
}
:global(.light) .confirm-dialog__btn--cancel:hover,
:global(html:not(.dark)) .confirm-dialog__btn--cancel:hover { background: #e5e7eb; }
</style>
