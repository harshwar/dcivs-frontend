<template>
  <div 
    class="fixed inset-0 z-50 overflow-hidden" 
    aria-labelledby="slide-over-title" 
    role="dialog" 
    aria-modal="true"
    v-if="open"
  >
    <div class="absolute inset-0 overflow-hidden">
      <!-- Backdrop -->
      <div 
        class="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        @click="$emit('close')"
        aria-hidden="true"
      ></div>

      <div class="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div class="pointer-events-auto w-screen max-w-md transition-transform transform duration-500 sm:duration-700 bg-white dark:bg-[#1b2127] shadow-xl">
          
          <!-- Loading State -->
          <div v-if="loading" class="h-full flex flex-col items-center justify-center space-y-4">
             <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
             <p class="text-gray-500 dark:text-gray-400">Loading student profile...</p>
          </div>

          <!-- Content -->
          <div v-else class="flex h-full flex-col overflow-y-scroll bg-white dark:bg-[#1b2127] shadow-xl">
            <!-- Header -->
            <div class="px-4 py-6 sm:px-6 bg-indigo-600 dark:bg-indigo-900/50">
              <div class="flex items-start justify-between">
                <h2 class="text-lg font-medium text-white" id="slide-over-title">
                  Student Profile
                </h2>
                <div class="ml-3 flex h-7 items-center">
                  <button 
                    type="button" 
                    class="rounded-md bg-transparent text-indigo-200 hover:text-white focus:outline-none"
                    @click="$emit('close')"
                  >
                    <span class="sr-only">Close panel</span>
                    <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              <div class="mt-4">
                 <div class="flex items-center gap-4">
                    <div class="h-16 w-16 rounded-full bg-white/20 flex items-center justify-center text-3xl">
                       🎓
                    </div>
                    <div>
                       <h3 class="text-xl font-bold text-white">{{ details?.profile?.full_name }}</h3>
                       <p class="text-indigo-200 text-sm">{{ details?.profile?.email }}</p>
                    </div>
                 </div>
              </div>
            </div>

            <!-- Body -->
            <div class="relative flex-1 px-4 py-6 sm:px-6 space-y-8">
              
              <!-- 1. Academic Info -->
              <div class="space-y-4">
                 <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Academic Information</h4>
                 <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-gray-50 dark:bg-[#283039] rounded-lg">
                       <label class="text-xs text-gray-500 block mb-1">Student ID</label>
                       <span class="font-mono font-medium dark:text-gray-200">{{ details?.profile?.student_id_number }}</span>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-[#283039] rounded-lg">
                       <label class="text-xs text-gray-500 block mb-1">Course & Year</label>
                       <span class="font-medium dark:text-gray-200">{{ details?.profile?.course_name }} ({{ details?.profile?.year }})</span>
                    </div>
                 </div>
              </div>

              <!-- 2. Wallet & Blockchain -->
              <div class="space-y-4">
                 <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Blockchain Identity</h4>
                 <div class="p-4 bg-gray-50 dark:bg-[#283039] rounded-xl border border-gray-100 dark:border-gray-700">
                    <div class="flex justify-between items-start mb-2">
                       <label class="text-xs text-gray-500">Wallet Address</label>
                       <a 
                         v-if="details?.wallet?.address"
                         :href="`https://sepolia.etherscan.io/address/${details.wallet.address}`"
                         target="_blank"
                         class="text-xs text-blue-500 hover:underline flex items-center gap-1"
                       >
                         View on Explorer ↗
                       </a>
                    </div>
                    <div class="font-mono text-sm break-all text-gray-800 dark:text-gray-200 mb-4">
                       {{ details?.wallet?.address || 'No wallet connected' }}
                    </div>
                    
                    <div class="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                       <span class="text-sm text-gray-500">ETH Balance</span>
                       <span class="font-mono font-bold text-gray-900 dark:text-white">{{ details?.wallet?.balance }} ETH</span>
                    </div>
                 </div>
              </div>

              <!-- 3. Certificates -->
              <div class="space-y-4">
                 <div class="flex items-center justify-between">
                    <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Certificates ({{ details?.certificates?.length || 0 }})</h4>
                 </div>
                 
                 <div v-if="!details?.certificates?.length" class="text-center py-6 text-gray-400 text-sm bg-gray-50 dark:bg-[#283039] rounded-lg">
                    No certificates issued.
                 </div>

                 <div v-else class="space-y-3">
                    <div 
                      v-for="cert in details.certificates" 
                      :key="cert.id"
                      class="p-3 bg-white dark:bg-[#283039] border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-between hover:shadow-md transition-shadow"
                    >
                       <div class="flex items-center gap-3">
                          <div class="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded text-indigo-600">📜</div>
                          <div>
                             <div class="font-medium text-sm text-gray-900 dark:text-white">{{ cert.title }}</div>
                             <div class="text-xs text-gray-500">{{ new Date(cert.issue_date).toLocaleDateString() }}</div>
                          </div>
                       </div>
                       <a 
                         :href="`/verify/${cert.token_id}`" 
                         target="_blank"
                         class="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                       >
                         View
                       </a>
                    </div>
                 </div>
              </div>

              <!-- 4. Recent Activity -->
              <div class="space-y-4">
                 <h4 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">Recent Activity</h4>
                 <div class="flow-root">
                    <ul role="list" class="-mb-8">
                       <li v-for="(log, idx) in details?.logs" :key="log.id">
                          <div class="relative pb-8">
                             <span v-if="idx !== details.logs.length - 1" class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-700" aria-hidden="true"></span>
                             <div class="relative flex space-x-3">
                                <div>
                                   <span class="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center ring-8 ring-white dark:ring-[#1b2127]">
                                      <span class="text-xs">📝</span>
                                   </span>
                                </div>
                                <div class="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                                   <div>
                                      <p class="text-sm text-gray-600 dark:text-gray-300">{{ log.action }}</p>
                                   </div>
                                   <div class="whitespace-nowrap text-right text-sm text-gray-500">
                                      {{ new Date(log.created_at).toLocaleDateString() }}
                                   </div>
                                </div>
                             </div>
                          </div>
                       </li>
                       <li v-if="!details?.logs?.length">
                          <p class="text-sm text-gray-500 italic">No recent activity.</p>
                       </li>
                    </ul>
                 </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue';

const props = defineProps({
  open: Boolean,
  studentId: [Number, String]
});
const emit = defineEmits(['close']);

const loading = ref(false);
const details = ref(null);
import { API_BASE_URL } from '../../apiConfig'
const API_BASE = `${API_BASE_URL}/api`

async function fetchDetails() {
  if (!props.studentId) return;
  
  loading.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/students/${props.studentId}/details`, {
       headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
       details.value = await res.json();
    }
  } catch (e) {
    console.error('Fetch detail error:', e);
  } finally {
    loading.value = false;
  }
}

watch(() => props.open, (newVal) => {
  if (newVal && props.studentId) {
    fetchDetails();
  } else {
    details.value = null; // Reset on close
  }
});
</script>
