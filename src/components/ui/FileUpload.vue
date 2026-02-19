<template>
  <div
    :class="['file-upload', { 'file-upload--dragging': isDragging, 'file-upload--has-file': hasFile }]"
    @dragover.prevent="isDragging = true"
    @dragleave.prevent="isDragging = false"
    @drop.prevent="handleDrop"
    @click="triggerInput"
  >
    <input ref="fileInput" type="file" :accept="accept" @change="handleFileChange" hidden />

    <div v-if="!hasFile" class="file-upload__empty">
      <div class="file-upload__icon">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
          <rect x="4" y="8" width="32" height="24" rx="4" stroke="currentColor" stroke-width="1.5" stroke-dasharray="4 3"/>
          <path d="M20 14V26M14 20H26" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="file-upload__text">
        <span class="file-upload__text-primary">Drop file here</span>
        <span class="file-upload__text-secondary">or click to browse</span>
      </p>
      <span v-if="hint" class="file-upload__hint">{{ hint }}</span>
    </div>

    <div v-else class="file-upload__preview">
      <img v-if="previewUrl && isImage" :src="previewUrl" class="file-upload__thumb" alt="Preview" />
      <div v-else class="file-upload__file-icon">📄</div>
      <div class="file-upload__info">
        <p class="file-upload__filename">{{ selectedFile?.name }}</p>
        <p class="file-upload__filesize">{{ formatSize(selectedFile?.size) }}</p>
      </div>
      <button class="file-upload__remove" @click.stop="clearFile" aria-label="Remove file">×</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [Object, null], default: null },
  accept: { type: String, default: '*' },
  hint: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const fileInput = ref(null)
const isDragging = ref(false)
const selectedFile = ref(props.modelValue)
const previewUrl = ref(null)

const hasFile = computed(() => selectedFile.value !== null)
const isImage = computed(() => selectedFile.value?.type?.startsWith('image/'))

watch(() => props.modelValue, (val) => { selectedFile.value = val; updatePreview() })

function triggerInput() { fileInput.value?.click() }

function handleFileChange(e) {
  const file = e.target.files?.[0]
  if (file) setFile(file)
}

function handleDrop(e) {
  isDragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) setFile(file)
}

function setFile(file) {
  selectedFile.value = file
  emit('update:modelValue', file)
  updatePreview()
}

function clearFile() {
  selectedFile.value = null
  previewUrl.value = null
  emit('update:modelValue', null)
  if (fileInput.value) fileInput.value.value = ''
}

function updatePreview() {
  if (previewUrl.value) { URL.revokeObjectURL(previewUrl.value); previewUrl.value = null }
  if (selectedFile.value && selectedFile.value.type?.startsWith('image/')) {
    previewUrl.value = URL.createObjectURL(selectedFile.value)
  }
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

onBeforeUnmount(() => { if (previewUrl.value) URL.revokeObjectURL(previewUrl.value) })
</script>

<style scoped>
.file-upload {
  width: 100%; border: 2px dashed rgba(255, 255, 255, 0.12); border-radius: 12px;
  cursor: pointer; transition: all 0.25s ease; background: rgba(255, 255, 255, 0.02);
  font-family: 'Inter', -apple-system, sans-serif;
}
.file-upload:hover { border-color: rgba(99, 102, 241, 0.4); background: rgba(99, 102, 241, 0.04); }
.file-upload--dragging { border-color: #6366f1; background: rgba(99, 102, 241, 0.08); transform: scale(1.01); }
.file-upload--has-file { border-style: solid; border-color: rgba(16, 185, 129, 0.3); background: rgba(16, 185, 129, 0.04); }

.file-upload__empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 2rem 1rem; gap: 0.5rem;
}
.file-upload__icon { color: rgba(255, 255, 255, 0.25); margin-bottom: 0.25rem; transition: color 0.2s; }
.file-upload:hover .file-upload__icon { color: rgba(99, 102, 241, 0.6); }
.file-upload--dragging .file-upload__icon { color: #6366f1; }

.file-upload__text { margin: 0; text-align: center; line-height: 1.5; }
.file-upload__text-primary { display: block; font-size: 0.875rem; font-weight: 600; color: #c9d1d9; }
.file-upload__text-secondary { display: block; font-size: 0.75rem; color: #6e7681; }
.file-upload__hint { font-size: 0.6875rem; color: #484f58; margin-top: 0.25rem; }

.file-upload__preview { display: flex; align-items: center; gap: 0.875rem; padding: 0.875rem 1rem; }
.file-upload__thumb { width: 3rem; height: 3rem; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255, 255, 255, 0.1); flex-shrink: 0; }
.file-upload__file-icon { width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center; background: rgba(255, 255, 255, 0.05); border-radius: 8px; font-size: 1.5rem; flex-shrink: 0; }
.file-upload__info { flex: 1; min-width: 0; }
.file-upload__filename { margin: 0; font-size: 0.8125rem; font-weight: 600; color: #c9d1d9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.file-upload__filesize { margin: 0.125rem 0 0; font-size: 0.6875rem; color: #6e7681; }

.file-upload__remove {
  flex-shrink: 0; width: 1.75rem; height: 1.75rem; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171; font-size: 1rem; cursor: pointer; transition: all 0.2s;
}
.file-upload__remove:hover { background: rgba(239, 68, 68, 0.2); transform: scale(1.1); }

/* Light mode */
:global(.light) .file-upload, :global(html:not(.dark)) .file-upload { border-color: #d1d5db; background: #fafafa; }
:global(.light) .file-upload:hover, :global(html:not(.dark)) .file-upload:hover { border-color: rgba(99, 102, 241, 0.4); background: rgba(99, 102, 241, 0.03); }
:global(.light) .file-upload--has-file, :global(html:not(.dark)) .file-upload--has-file { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.03); }
:global(.light) .file-upload__text-primary, :global(html:not(.dark)) .file-upload__text-primary { color: #374151; }
:global(.light) .file-upload__text-secondary, :global(html:not(.dark)) .file-upload__text-secondary { color: #9ca3af; }
:global(.light) .file-upload__icon, :global(html:not(.dark)) .file-upload__icon { color: #d1d5db; }
:global(.light) .file-upload__filename, :global(html:not(.dark)) .file-upload__filename { color: #1f2937; }
</style>
