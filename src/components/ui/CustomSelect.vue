<template>
  <div class="custom-select" ref="selectRoot" :class="{ 'custom-select--open': isOpen, 'custom-select--disabled': disabled }">
    <button
      type="button"
      class="custom-select__trigger"
      @click="toggle"
      @keydown="handleTriggerKeydown"
      :disabled="disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
    >
      <span :class="['custom-select__value', { 'custom-select__placeholder': !selectedOption }]">
        {{ selectedOption ? selectedOption.label : placeholder }}
      </span>
      <span class="custom-select__arrow">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
    </button>

    <Transition name="select-dropdown">
      <div v-if="isOpen" class="custom-select__dropdown" role="listbox">
        <div v-if="searchable" class="custom-select__search-wrap">
          <input
            ref="searchInput"
            v-model="searchQuery"
            class="custom-select__search"
            placeholder="Search..."
            @keydown="handleSearchKeydown"
          />
        </div>
        <div class="custom-select__options" ref="optionsContainer">
          <div
            v-for="(option, index) in filteredOptions"
            :key="option.value"
            :class="['custom-select__option', {
              'custom-select__option--selected': modelValue === option.value,
              'custom-select__option--focused': focusedIndex === index,
              'custom-select__option--disabled': option.disabled
            }]"
            @click.stop="selectOption(option)"
            @mouseenter="focusedIndex = index"
            role="option"
            :aria-selected="modelValue === option.value"
          >
            <span class="custom-select__option-label">{{ option.label }}</span>
            <span v-if="modelValue === option.value" class="custom-select__check">✓</span>
          </div>
          <div v-if="filteredOptions.length === 0" class="custom-select__empty">
            No results found
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Select an option' },
  searchable: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = ref(false)
const searchQuery = ref('')
const focusedIndex = ref(-1)
const selectRoot = ref(null)
const searchInput = ref(null)
const optionsContainer = ref(null)

const selectedOption = computed(() =>
  props.options.find(o => o.value === props.modelValue)
)

const filteredOptions = computed(() => {
  if (!searchQuery.value) return props.options
  const q = searchQuery.value.toLowerCase()
  return props.options.filter(o => o.label.toLowerCase().includes(q))
})

function toggle() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    searchQuery.value = ''
    focusedIndex.value = -1
    nextTick(() => {
      if (props.searchable && searchInput.value) searchInput.value.focus()
    })
  }
}

function selectOption(option) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  
  // Wrap the closure in nextTick to ensure the DOM updates before forcibly hiding it
  nextTick(() => {
    isOpen.value = false
    searchQuery.value = ''
    if (document.activeElement) document.activeElement.blur()
  })
}

function handleTriggerKeydown(e) {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
  else if (e.key === 'ArrowDown') { e.preventDefault(); if (!isOpen.value) toggle() }
  else if (e.key === 'Escape') { isOpen.value = false }
}

function handleSearchKeydown(e) {
  const opts = filteredOptions.value
  if (e.key === 'ArrowDown') { e.preventDefault(); focusedIndex.value = Math.min(focusedIndex.value + 1, opts.length - 1); scrollToFocused() }
  else if (e.key === 'ArrowUp') { e.preventDefault(); focusedIndex.value = Math.max(focusedIndex.value - 1, 0); scrollToFocused() }
  else if (e.key === 'Enter') { e.preventDefault(); if (focusedIndex.value >= 0 && opts[focusedIndex.value]) selectOption(opts[focusedIndex.value]) }
  else if (e.key === 'Escape') { isOpen.value = false }
}

function scrollToFocused() {
  nextTick(() => {
    const container = optionsContainer.value
    if (!container) return
    const focused = container.children[focusedIndex.value]
    if (focused) focused.scrollIntoView({ block: 'nearest' })
  })
}

function handleClickOutside(e) {
  if (selectRoot.value && !selectRoot.value.contains(e.target)) isOpen.value = false
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped>
.custom-select { position: relative; width: 100%; font-family: 'Inter', -apple-system, sans-serif; }

.custom-select__trigger {
  width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;
  padding: 0.5rem 0.875rem; background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.15); border-radius: 10px;
  color: #f0f6fc; font-size: 0.875rem; cursor: pointer;
  transition: all 0.2s ease; font-family: inherit; text-align: left; outline: none;
}
.custom-select__trigger:hover { border-color: rgba(255, 255, 255, 0.25); background: rgba(255, 255, 255, 0.03); }
.custom-select__trigger:focus-visible { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2); }
.custom-select--open .custom-select__trigger { border-color: #6366f1; background: rgba(255, 255, 255, 0.05); }
.custom-select--disabled .custom-select__trigger { opacity: 0.5; cursor: not-allowed; }
.custom-select__placeholder { color: rgba(255, 255, 255, 0.35); }
.custom-select__arrow { flex-shrink: 0; color: rgba(255, 255, 255, 0.4); transition: transform 0.25s ease; display: flex; }
.custom-select--open .custom-select__arrow { transform: rotate(180deg); }

.custom-select__dropdown {
  position: absolute; top: calc(100% + 6px); left: 0; right: 0; z-index: 100;
  background: #1c2128; border: 1px solid rgba(48, 54, 61, 0.9); border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.04);
  overflow: hidden;
}

.custom-select__search-wrap { padding: 0.5rem; border-bottom: 1px solid rgba(48, 54, 61, 0.6); }
.custom-select__search {
  width: 100%; padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px; color: #f0f6fc; font-size: 0.8125rem; outline: none; font-family: inherit;
}
.custom-select__search:focus { border-color: #6366f1; }
.custom-select__search::placeholder { color: rgba(255, 255, 255, 0.3); }

.custom-select__options {
  max-height: 220px; overflow-y: auto; padding: 0.375rem;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
}

.custom-select__option {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0.75rem; border-radius: 8px; font-size: 0.875rem;
  color: #c9d1d9; cursor: pointer; transition: all 0.15s ease;
}
.custom-select__option:hover, .custom-select__option--focused { background: rgba(99, 102, 241, 0.1); color: #f0f6fc; }
.custom-select__option--selected { color: #a5b4fc; font-weight: 600; }
.custom-select__option--disabled { opacity: 0.4; cursor: not-allowed; }
.custom-select__check { color: #6366f1; font-weight: 700; font-size: 0.75rem; }
.custom-select__empty { padding: 1rem; text-align: center; color: #6e7681; font-size: 0.8125rem; }

.select-dropdown-enter-active { transition: all 0.2s cubic-bezier(0.21, 1.02, 0.73, 1); }
.select-dropdown-leave-active { transition: all 0.15s ease; }
.select-dropdown-enter-from { opacity: 0; transform: translateY(-8px) scale(0.97); }
.select-dropdown-leave-to { opacity: 0; transform: translateY(-4px) scale(0.98); }

/* Light mode */
:global(.light) .custom-select__trigger, :global(html:not(.dark)) .custom-select__trigger { border-color: #d1d5db; color: #1f2937; background: white; }
:global(.light) .custom-select__trigger:hover, :global(html:not(.dark)) .custom-select__trigger:hover { border-color: #9ca3af; background: #f9fafb; }
:global(.light) .custom-select__placeholder, :global(html:not(.dark)) .custom-select__placeholder { color: #9ca3af; }
:global(.light) .custom-select__dropdown, :global(html:not(.dark)) .custom-select__dropdown { background: #ffffff; border-color: #e5e7eb; box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1); }
:global(.light) .custom-select__search, :global(html:not(.dark)) .custom-select__search { background: #f9fafb; border-color: #e5e7eb; color: #1f2937; }
:global(.light) .custom-select__option, :global(html:not(.dark)) .custom-select__option { color: #374151; }
:global(.light) .custom-select__option:hover, :global(html:not(.dark)) .custom-select__option:hover { background: rgba(99, 102, 241, 0.08); color: #1f2937; }
:global(.light) .custom-select__arrow, :global(html:not(.dark)) .custom-select__arrow { color: #9ca3af; }
</style>
