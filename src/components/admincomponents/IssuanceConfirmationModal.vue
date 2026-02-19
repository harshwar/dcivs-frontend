<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-[#1b2127] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-700">
        
        <!-- Header -->
        <div class="bg-indigo-600 dark:bg-indigo-900/50 px-4 py-4 sm:px-6 flex justify-between items-center">
          <h3 class="text-lg font-semibold leading-6 text-white" id="modal-title">verify Achievement Record</h3>
          <button @click="$emit('close')" class="text-indigo-200 hover:text-white">✕</button>
        </div>

        <div class="px-4 py-5 sm:p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            <!-- Left: Document Preview -->
            <div class="space-y-4">
              <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider">Document Preview</h4>
              <div class="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-black aspect-[3/4] flex items-center justify-center">
                 <img v-if="previewUrl" :src="previewUrl" class="max-w-full max-h-full object-contain" alt="Certificate Preview" />
                 <div v-else class="text-gray-400">No preview available</div>
                 
                 <!-- Scanning Overlay -->
                 <div v-if="scanning" class="absolute inset-0 bg-black/50 flex flex-col items-center justify-center backdrop-blur-sm">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-3"></div>
                    <p class="text-white font-medium">Scanning Document...</p>
                    <p class="text-white/70 text-sm mt-1">{{ scanProgress }}%</p>
                 </div>
              </div>
            </div>

            <!-- Right: Verification Details -->
            <div class="space-y-6 flex flex-col h-full">
               
               <!-- 1. Student Details -->
               <div class="p-4 rounded-xl bg-gray-50 dark:bg-[#283039] border border-gray-200 dark:border-gray-700">
                  <h4 class="text-xs font-semibold text-gray-500 mb-3 uppercase">Recipient</h4>
                  <div class="flex items-center gap-4">
                     <div class="h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-300">
                        {{ student?.name?.charAt(0) }}
                     </div>
                     <div>
                        <div class="font-bold text-gray-900 dark:text-white">{{ student?.name }}</div>
                        <div class="text-sm text-gray-500 font-mono">{{ student?.roll }}</div>
                     </div>
                  </div>
               </div>

               <!-- 2. OCR Result -->
               <div class="flex-1">
                  <h4 class="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Verification Status</h4>
                  
                  <div v-if="scanning" class="h-32 flex items-center justify-center text-gray-500 text-sm italic">
                     Analyzing text...
                  </div>

                  <div v-else class="space-y-4">
                     <!-- Success Alert -->
                     <div v-if="isMatch" class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
                        <span class="text-green-500 text-xl">✅</span>
                        <div>
                           <h5 class="text-sm font-bold text-green-800 dark:text-green-300">Verified Match</h5>
                           <p class="text-xs text-green-700 dark:text-green-400 mt-1">
                              Found student name <b>"{{ matchedName }}"</b> in the document.
                           </p>
                        </div>
                     </div>

                     <!-- Warning Alert -->
                     <div v-else class="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                        <span class="text-yellow-500 text-xl">⚠️</span>
                        <div>
                           <h5 class="text-sm font-bold text-yellow-800 dark:text-yellow-300">Possible Mismatch</h5>
                           <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              Could not automatically find <b>"{{ student?.name }}"</b> in the document.
                           </p>
                           <p class="text-xs text-yellow-600 dark:text-yellow-500 mt-2 font-medium">Please verify manually before issuing.</p>
                        </div>
                     </div>
                     
                     <!-- Extracted Text Toggle -->
                     <details class="group">
                        <summary class="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-indigo-500 select-none">
                           <span class="group-open:rotate-90 transition-transform">▶</span>
                           View Extracted Text
                        </summary>
                        <div class="mt-2 p-3 bg-gray-50 dark:bg-black rounded border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                           {{ extractedText || 'No text detected.' }}
                        </div>
                     </details>
                  </div>
               </div>

               <!-- Actions -->
               <div class="grid grid-cols-2 gap-4 mt-auto">
                  <button 
                    @click="$emit('close')"
                    class="px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors"
                  >
                     Cancel
                  </button>
                  <button 
                    @click="$emit('confirm')"
                    :disabled="scanning || isProcessing"
                    class="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
                  >
                     <span v-if="isProcessing" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                     Confirm & Issue
                  </button>
               </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue';
import Tesseract from 'tesseract.js';

const props = defineProps({
  isOpen: Boolean,
  file: File,
  student: Object,
  isProcessing: Boolean
});

const emit = defineEmits(['close', 'confirm']);

const previewUrl = ref(null);
const scanning = ref(false);
const scanProgress = ref(0);
const extractedText = ref('');
const isMatch = ref(false);
const matchedName = ref('');

// Watch for file changes to start cleanup and scanning
watch(() => props.file, (newFile) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile);
    if (props.isOpen) startScan();
  } else {
    previewUrl.value = null;
  }
});

// Watch for modal open to trigger scan if not done
watch(() => props.isOpen, (open) => {
  if (open && props.file && !extractedText.value) {
    startScan();
  }
});

async function startScan() {
  if (!props.file || !props.student) return;
  
  scanning.value = true;
  extractedText.value = '';
  isMatch.value = false;
  scanProgress.value = 0;

  try {
    const { data: { text } } = await Tesseract.recognize(
      props.file,
      'eng',
      { 
        logger: m => {
          if (m.status === 'recognizing text') {
            scanProgress.value = Math.floor(m.progress * 100);
          }
        }
      }
    );

    extractedText.value = text;
    verifyText(text);

  } catch (err) {
    console.error('OCR Error:', err);
    extractedText.value = 'Error scanning document.';
  } finally {
    scanning.value = false;
  }
}

function verifyText(text) {
  const normalizedText = text.toLowerCase();
  const studentName = props.student.name.toLowerCase();
  const studentRoll = (props.student.roll || '').toLowerCase();
  
  // Split name into parts to allow partial match (e.g. "John Doe" matches "Mr. John Doe")
  const nameParts = studentName.split(' ').filter(p => p.length > 2);
  const foundName = nameParts.some(part => normalizedText.includes(part));
  
  const foundRoll = studentRoll && normalizedText.includes(studentRoll);

  if (foundName || foundRoll) {
      isMatch.value = true;
      matchedName.value = foundName ? props.student.name : props.student.roll;
  }
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>
