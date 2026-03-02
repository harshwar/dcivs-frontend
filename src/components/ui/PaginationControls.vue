<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  totalPages: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:currentPage'])

// Calculate which page numbers to show
const pageNumbers = computed(() => {
  const pages = []
  const maxVisible = 5
  
  if (props.totalPages <= maxVisible) {
    for (let i = 1; i <= props.totalPages; i++) pages.push(i)
    return pages
  }
  
  // Calculate window
  let start = Math.max(1, props.currentPage - 2)
  let end = Math.min(props.totalPages, start + maxVisible - 1)
  
  // Adjust window if we're near the end
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1)
  }
  
  if (start > 1) {
    pages.push(1)
    if (start > 2) pages.push('...')
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  if (end < props.totalPages) {
    if (end < props.totalPages - 1) pages.push('...')
    pages.push(props.totalPages)
  }
  
  return pages
})

function prev() {
  if (props.currentPage > 1) {
    emit('update:currentPage', props.currentPage - 1)
  }
}

function next() {
  if (props.currentPage < props.totalPages) {
    emit('update:currentPage', props.currentPage + 1)
  }
}

function goToPage(page) {
  if (page !== '...' && page !== props.currentPage) {
    emit('update:currentPage', page)
  }
}
</script>

<template>
  <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-white/30 dark:bg-black/20">
    <div class="flex flex-1 justify-between sm:hidden">
      <button 
        @click="prev" 
        :disabled="currentPage === 1"
        class="relative inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        Previous
      </button>
      <button 
        @click="next" 
        :disabled="currentPage === totalPages"
        class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
      >
        Next
      </button>
    </div>
    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
      <div>
        <p class="text-sm text-gray-700 dark:text-gray-400">
          Showing <span class="font-medium">Page {{ currentPage }}</span> of <span class="font-medium">{{ totalPages }}</span>
        </p>
      </div>
      <div>
        <nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
          <button 
            @click="prev"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <button
            v-for="page in pageNumbers"
            :key="page"
            @click="goToPage(page)"
            :class="[
              page === currentPage 
                ? 'relative z-20 inline-flex items-center bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110 transition-all rounded-md mx-1'
                : page === '...'
                  ? 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:outline-offset-0 cursor-default'
                  : 'relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 dark:text-gray-300 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0 transition-colors'
            ]"
          >
            {{ page }}
          </button>
          
          <button
            @click="next"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 dark:text-gray-500 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
          >
            <span class="sr-only">Next</span>
            <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>
