<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" @click="$emit('close')"></div>

    <div class="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
      <div class="relative transform overflow-hidden rounded-2xl bg-white dark:bg-[#1b2127] text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl border border-gray-700">
        
        <!-- Header -->
        <div class="bg-indigo-600 dark:bg-indigo-900/50 px-4 py-4 sm:px-6 flex justify-between items-center">
          <h3 class="text-lg font-semibold leading-6 text-white" id="modal-title">Verify Achievement Record</h3>
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
                    <p class="text-white font-medium">Scanning Document Locally...</p>
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
                     Extracting text with Local Engine...
                  </div>

                  <div v-else class="space-y-4">
                     <!-- Success Alert -->
                     <div v-if="isMatch" class="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
                        <span class="text-green-500 text-xl">✅</span>
                        <div>
                           <h5 class="text-sm font-bold text-green-800 dark:text-green-300">Verified Match</h5>
                           <p class="text-xs text-green-700 dark:text-green-400 mt-1">
                              AI confirmed student identity in document.
                           </p>
                        </div>
                     </div>

                     <!-- Warning Alert -->
                     <div v-else class="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
                        <span class="text-yellow-500 text-xl">⚠️</span>
                        <div>
                           <h5 class="text-sm font-bold text-yellow-800 dark:text-yellow-300">Possible Mismatch</h5>
                           <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              AI could not automatically find <b>"{{ student?.name }}"</b> in the document.
                           </p>
                           <p class="text-xs text-yellow-600 dark:text-yellow-500 mt-2 font-medium">Please verify manually before issuing.</p>
                        </div>
                     </div>
                     
                     <!-- Extracted Text Toggle -->
                     <details class="group" v-if="extractedText">
                        <summary class="flex items-center gap-2 cursor-pointer text-xs text-gray-500 hover:text-indigo-500 select-none">
                           <span class="group-open:rotate-90 transition-transform">▶</span>
                           View AI Output Context
                        </summary>
                        <div class="mt-2 p-3 bg-gray-50 dark:bg-black rounded border border-gray-200 dark:border-gray-800 text-xs font-mono text-gray-600 dark:text-gray-400 max-h-32 overflow-y-auto whitespace-pre-wrap">
                           {{ extractedText }}
                        </div>
                     </details>
                  </div>
               </div>

               <!-- Estimated Gas Cost -->
               <div v-if="walletInfo" class="mt-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 flex justify-between items-center">
                  <div class="flex items-center gap-3">
                     <span class="text-blue-500 text-xl">⛽</span>
                     <div>
                        <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Gas</h5>
                        <p class="text-sm font-bold text-blue-800 dark:text-blue-300">
                           {{ formatGasCost(walletInfo.estimatedCostEth, walletInfo.ethPriceInr) }}
                        </p>
                     </div>
                  </div>
                  <div class="text-right">
                     <p class="text-xs text-gray-500 dark:text-gray-400">Current Balance:</p>
                     <p class="text-xs font-mono font-bold" :class="Number(walletInfo.balanceEth) < Number(walletInfo.estimatedCostEth) ? 'text-red-500' : 'text-green-500 dark:text-green-400'">
                        {{ walletInfo.balanceEth }} ETH
                     </p>
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
                    :disabled="scanning || isProcessing || (walletInfo && Number(walletInfo.balanceEth) < Number(walletInfo.estimatedCostEth))"
                    class="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:shadow-none"
                  >
                     <span v-if="isProcessing" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                     {{ (walletInfo && Number(walletInfo.balanceEth) < Number(walletInfo.estimatedCostEth)) ? 'Insufficient ETH' : 'Confirm & Issue' }}
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
import { API_BASE_URL } from '../../apiConfig';

/**
 * Format ETH value to a human readable gas string.
 * Shows in Gwei if the value is very small, and appends an INR estimate.
 */
function formatGasCost(ethValue, ethPriceInr) {
  if (!ethValue) return '~0.00 ETH';
  const num = Number(ethValue);
  let displayStr = '';
  
  if (num < 0.0001) {
    const gwei = (num * 1000000000).toFixed(2);
    displayStr = `${gwei} Gwei`;
  } else {
    displayStr = `~${num.toFixed(6)} ETH`;
  }

  // Add INR Estimate if price is available
  if (ethPriceInr) {
    const inrValue = (num * ethPriceInr).toFixed(2);
    displayStr += ` (₹${inrValue})`;
  }

  return displayStr;
}

const props = defineProps({
  isOpen: Boolean,
  file: File,
  student: Object,
  isProcessing: Boolean,
  preVerifiedMatch: Boolean,
  preExtractedText: String
});

const emit = defineEmits(['close', 'confirm']);

const previewUrl = ref(null);
const scanning = ref(false);
const extractedText = ref('');
const isMatch = ref(false);
const walletInfo = ref(null);

// Watch for file changes to start cleanup
watch(() => props.file, (newFile) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  
  if (newFile) {
    previewUrl.value = URL.createObjectURL(newFile);
  } else {
    previewUrl.value = null;
  }
});

// Watch for modal open to apply pre-verified data
watch(() => props.isOpen, async (open) => {
  if (open) {
    if (props.preExtractedText || props.preVerifiedMatch !== null) {
      isMatch.value = props.preVerifiedMatch;
      extractedText.value = props.preExtractedText;
    } else if (props.file && !extractedText.value) {
      startScan();
    }
    
    // Fetch estimated gas cost for this transaction
    try {
      const res = await fetch(`${API_BASE_URL}/api/nft/wallet-info`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}` }
      });
      if (res.ok) {
        walletInfo.value = await res.json();
      }
    } catch (e) {
      console.error("Failed to fetch gas estimate:", e);
    }
  }
});

async function startScan() {
  if (!props.file || !props.student) return;
  
  scanning.value = true;
  extractedText.value = '';
  isMatch.value = false;

  try {
    const formData = new FormData();
    formData.append('file', props.file);
    formData.append('studentName', props.student.name || '');
    formData.append('studentRoll', props.student.roll || '');

    const res = await fetch(`${API_BASE_URL}/api/ai/verify-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
      },
      body: formData
    });

    if (res.ok) {
      const data = await res.json();
      isMatch.value = data.match;
      extractedText.value = data.extracted_text || '';
    } else {
      throw new Error('API request failed');
    }

  } catch (err) {
    console.error('AI Verification Error:', err);
    extractedText.value = 'Error verifying document with AI.';
  } finally {
    scanning.value = false;
  }
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
});
</script>
