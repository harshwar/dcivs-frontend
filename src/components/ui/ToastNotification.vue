<template>
  <Teleport to="body">
    <div class="toast-container" aria-live="polite">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['toast', `toast--${toast.type}`, { 'toast--exit': !toast.visible }]"
        >
          <div class="toast__icon">
            <span v-if="toast.type === 'success'">✓</span>
            <span v-else-if="toast.type === 'error'">✕</span>
            <span v-else-if="toast.type === 'warning'">⚠</span>
            <span v-else>ℹ</span>
          </div>
          <p class="toast__message">{{ toast.message }}</p>
          <button class="toast__close" @click="remove(toast.id)" aria-label="Close">×</button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { useToast } from '../../composables/useToast.js'
const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 1.25rem;
  right: 1.25rem;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  pointer-events: none;
  max-width: 420px;
  width: calc(100% - 2.5rem);
}

.toast {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: all;
  font-family: 'Inter', -apple-system, sans-serif;
  animation: toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
}

.toast--exit {
  animation: toast-out 0.3s cubic-bezier(0.06, 0.71, 0.55, 1) forwards;
}

.toast--success {
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.3);
  color: #6ee7b7;
}

.toast--error {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

.toast--warning {
  background: rgba(245, 158, 11, 0.15);
  border-color: rgba(245, 158, 11, 0.3);
  color: #fcd34d;
}

.toast--info {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.3);
  color: #93c5fd;
}

.toast__icon {
  flex-shrink: 0;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 700;
}

.toast--success .toast__icon { background: rgba(16, 185, 129, 0.25); }
.toast--error .toast__icon { background: rgba(239, 68, 68, 0.25); }
.toast--warning .toast__icon { background: rgba(245, 158, 11, 0.25); }
.toast--info .toast__icon { background: rgba(59, 130, 246, 0.25); }

.toast__message {
  flex: 1;
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  font-weight: 500;
}

.toast__close {
  flex-shrink: 0;
  background: none;
  border: none;
  color: inherit;
  opacity: 0.5;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.25rem;
  line-height: 1;
  transition: opacity 0.2s;
}

.toast__close:hover {
  opacity: 1;
}

.toast-enter-active {
  animation: toast-in 0.35s cubic-bezier(0.21, 1.02, 0.73, 1) forwards;
}

.toast-leave-active {
  animation: toast-out 0.3s cubic-bezier(0.06, 0.71, 0.55, 1) forwards;
}

.toast-move {
  transition: transform 0.3s ease;
}

@keyframes toast-in {
  0% { opacity: 0; transform: translateX(100%) scale(0.9); }
  100% { opacity: 1; transform: translateX(0) scale(1); }
}

@keyframes toast-out {
  0% { opacity: 1; transform: translateX(0) scale(1); }
  100% { opacity: 0; transform: translateX(100%) scale(0.9); }
}

/* Light mode */
:global(.light) .toast--success,
:global(html:not(.dark)) .toast--success {
  background: rgba(16, 185, 129, 0.1);
  color: #065f46;
  border-color: rgba(16, 185, 129, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
}
:global(.light) .toast--error,
:global(html:not(.dark)) .toast--error {
  background: rgba(239, 68, 68, 0.1);
  color: #991b1b;
  border-color: rgba(239, 68, 68, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
}
:global(.light) .toast--warning,
:global(html:not(.dark)) .toast--warning {
  background: rgba(245, 158, 11, 0.1);
  color: #92400e;
  border-color: rgba(245, 158, 11, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
}
:global(.light) .toast--info,
:global(html:not(.dark)) .toast--info {
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
  border-color: rgba(59, 130, 246, 0.25);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.05);
}
</style>
