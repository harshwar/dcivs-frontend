<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-sm animate-fade-in">
      <div class="ide-tracker w-full max-w-2xl mx-4 rounded-2xl overflow-hidden shadow-2xl border border-gray-700">
        <!-- Title Bar -->
        <div class="ide-titlebar flex items-center justify-between px-4 py-2 bg-[#1e1e1e] border-b border-[#333]">
          <div class="flex items-center gap-2">
            <div class="flex gap-1.5">
              <span class="w-3 h-3 rounded-full bg-[#ff5f56]"></span>
              <span class="w-3 h-3 rounded-full bg-[#ffbd2e]"></span>
              <span class="w-3 h-3 rounded-full bg-[#27c93f]"></span>
            </div>
            <span class="text-gray-400 text-xs font-mono ml-2">{{ windowTitle }}</span>
          </div>
          <div class="flex items-center gap-2 text-gray-500 text-xs">
            <span v-if="job?.status === 'processing'" class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              Processing
            </span>
            <span v-else-if="job?.status === 'completed'" class="flex items-center gap-1 text-green-400">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              Complete
            </span>
            <span v-else-if="job?.status === 'failed'" class="flex items-center gap-1 text-red-400">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              Failed
            </span>
          </div>
        </div>

        <!-- Main IDE Body -->
        <div class="flex" style="height: 380px;">
          <!-- Sidebar: Steps List -->
          <div class="ide-sidebar w-52 bg-[#252526] border-r border-[#333] overflow-y-auto flex-shrink-0">
            <div class="px-3 py-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold">Pipeline Steps</div>
            <div
              v-for="(step, idx) in steps"
              :key="idx"
              class="flex items-center gap-2 px-3 py-2 text-xs font-mono cursor-default transition-colors duration-200"
              :class="{
                'bg-[#37373d] text-white': idx + 1 === currentStep,
                'text-green-400': idx + 1 < currentStep || job?.status === 'completed',
                'text-gray-500': idx + 1 > currentStep && job?.status !== 'completed',
                'text-red-400': job?.status === 'failed' && idx + 1 === currentStep
              }"
            >
              <!-- Step Icon -->
              <span class="w-4 text-center flex-shrink-0">
                <span v-if="idx + 1 < currentStep || job?.status === 'completed'">✓</span>
                <span v-else-if="idx + 1 === currentStep && job?.status === 'processing'" class="inline-block animate-spin">⟳</span>
                <span v-else-if="idx + 1 === currentStep && job?.status === 'failed'">✕</span>
                <span v-else class="text-gray-600">{{ idx + 1 }}</span>
              </span>
              <!-- Step Label -->
              <span class="truncate">{{ step.label }}</span>
            </div>
          </div>

          <!-- Main Log Pane -->
          <div class="ide-main flex-1 bg-[#1e1e1e] flex flex-col">
            <div ref="logPane" class="flex-1 overflow-y-auto p-4 font-mono text-xs leading-relaxed custom-scrollbar">
              <div
                v-for="(line, idx) in logLines"
                :key="idx"
                class="log-line py-0.5 animate-slide-in"
                :class="{
                  'text-gray-500': line.type === 'info',
                  'text-green-400': line.type === 'success',
                  'text-amber-400': line.type === 'step',
                  'text-red-400': line.type === 'error',
                  'text-blue-400': line.type === 'data'
                }"
              >
                <span class="text-gray-600 select-none mr-2">{{ String(idx + 1).padStart(3, ' ') }}</span>
                <span v-if="line.type === 'step'" class="text-amber-600 mr-1">▶</span>
                <span v-else-if="line.type === 'success'" class="mr-1">✓</span>
                <span v-else-if="line.type === 'error'" class="mr-1">✕</span>
                <span v-else class="text-gray-600 mr-1">│</span>
                {{ line.text }}
              </div>
              <!-- Cursor blink at end when processing -->
              <div v-if="job?.status === 'processing'" class="text-green-400 mt-1">
                <span class="text-gray-600 select-none mr-2">{{ String(logLines.length + 1).padStart(3, ' ') }}</span>
                <span class="animate-pulse">█</span>
              </div>
            </div>

            <!-- Status Bar -->
            <div class="ide-statusbar flex items-center justify-between px-4 py-1.5 bg-[#007acc] text-white text-[11px]">
              <div class="flex items-center gap-3">
                <span>{{ job?.step_label || 'Waiting...' }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span>Step {{ currentStep }}/{{ steps.length }}</span>
                <span>{{ job?.percentage || 0 }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="h-1 bg-[#333] relative overflow-hidden">
          <div
            class="h-full transition-all duration-700 ease-out"
            :class="{
              'bg-blue-500': job?.status === 'processing' || job?.status === 'queued',
              'bg-green-500': job?.status === 'completed',
              'bg-red-500': job?.status === 'failed'
            }"
            :style="{ width: (job?.percentage || 0) + '%' }"
          ></div>
        </div>

        <!-- Footer: Result / Action -->
        <div class="ide-footer px-4 py-3 bg-[#1e1e1e] border-t border-[#333]">
          <!-- Processing State -->
          <div v-if="job?.status === 'processing' || job?.status === 'queued'" class="text-gray-400 text-xs text-center">
            Pipeline running... do not close this window.
          </div>

          <!-- Success State -->
          <div v-else-if="job?.status === 'completed'" class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2 justify-center">
              <span v-if="job.result?.transactionHash" class="bg-green-900/30 border border-green-700/50 text-green-400 text-xs px-3 py-1.5 rounded-lg font-mono truncate max-w-full">
                Tx: {{ job.result.transactionHash }}
              </span>
              <span v-if="job.result?.tokenId" class="bg-blue-900/30 border border-blue-700/50 text-blue-400 text-xs px-3 py-1.5 rounded-lg font-mono">
                Token #{{ job.result.tokenId }}
              </span>
            </div>
            <button
              @click="handleClose"
              class="mt-1 w-full py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Done ✓
            </button>
          </div>

          <!-- Error State -->
          <div v-else-if="job?.status === 'failed'" class="flex flex-col gap-2">
            <div class="bg-red-900/20 border border-red-700/50 text-red-400 text-xs p-3 rounded-lg font-mono">
              {{ job.error || 'An unexpected error occurred.' }}
            </div>
            <button
              @click="handleClose"
              class="mt-1 w-full py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-bold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, computed, onBeforeUnmount } from 'vue'
import { useJobPoller } from '../../composables/useJobPoller'

const props = defineProps({
  /** UUID of the background job to track */
  jobId: { type: String, default: '' },
  /** Whether the tracker overlay is visible */
  visible: { type: Boolean, default: false },
  /** Title bar text */
  windowTitle: { type: String, default: 'pipeline.exe — Certificate Processor' },
  /** Step definitions for the sidebar */
  steps: {
    type: Array,
    default: () => [
      { label: 'Fetch Wallet' },
      { label: 'Pin to IPFS' },
      { label: 'Pin Metadata' },
      { label: 'Mint NFT' },
      { label: 'Save & Notify' }
    ]
  }
})

const emit = defineEmits(['close', 'complete', 'error'])

const { job, startPolling, stopPolling, reset } = useJobPoller()
const logLines = ref([])
const logPane = ref(null)
const prevStep = ref(0)

const currentStep = computed(() => job.value?.current_step || 0)

// Auto-scroll log pane to bottom
function scrollToBottom() {
  nextTick(() => {
    if (logPane.value) {
      logPane.value.scrollTop = logPane.value.scrollHeight
    }
  })
}

function addLog(text, type = 'info') {
  logLines.value.push({ text, type })
  scrollToBottom()
}

// Watch for jobId changes to start/stop polling
watch(() => props.jobId, (newId) => {
  if (newId) {
    logLines.value = []
    prevStep.value = 0
    addLog('Initializing pipeline...', 'info')
    startPolling(newId, 2000)
  } else {
    reset()
  }
})

// Watch for step changes — add log lines per step transition
watch(() => job.value?.current_step, (newStep) => {
  if (!newStep || newStep <= prevStep.value) return

  // Log all intermediate steps if we jumped
  for (let s = prevStep.value + 1; s <= newStep; s++) {
    if (s > 1 && s - 1 <= props.steps.length) {
      addLog(`${props.steps[s - 2]?.label || 'Step ' + (s-1)} completed`, 'success')
    }
    if (s <= props.steps.length) {
      addLog(`${job.value?.step_label || props.steps[s - 1]?.label || 'Step ' + s}`, 'step')
    }
  }
  prevStep.value = newStep
})

// Watch for completion or failure
watch(() => job.value?.status, (status) => {
  if (status === 'completed') {
    addLog(`${props.steps[props.steps.length - 1]?.label || 'Final step'} completed`, 'success')
    addLog('', 'info')
    if (job.value?.result?.transactionHash) {
      addLog(`Transaction: ${job.value.result.transactionHash}`, 'data')
    }
    if (job.value?.result?.tokenId) {
      addLog(`Token ID: ${job.value.result.tokenId}`, 'data')
    }
    addLog('Pipeline finished successfully!', 'success')
    emit('complete', job.value.result)
  } else if (status === 'failed') {
    addLog(`ERROR: ${job.value?.error || 'Unknown error'}`, 'error')
    emit('error', job.value?.error)
  }
})

function handleClose() {
  stopPolling()
  emit('close')
}

onBeforeUnmount(() => {
  stopPolling()
})
</script>

<style scoped>
.ide-tracker {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.animate-fade-in {
  animation: fadeIn 0.25s ease-out;
}

.animate-slide-in {
  animation: slideIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: #1e1e1e;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #424242;
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
