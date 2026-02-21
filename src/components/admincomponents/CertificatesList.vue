<script setup>
import { computed } from 'vue'

const props = defineProps({
  certificates: {
    type: Array,
    required: true
  },
  searchQuery: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['view', 'qr', 'toggle-revocation', 'update:searchQuery'])

// Smart Search Logic (Internal to component)
const filteredCertificates = computed(() => {
  if (!props.searchQuery) return props.certificates
  
  const query = props.searchQuery.toLowerCase()
  return props.certificates.filter(cert => {
    const name = (cert.student?.full_name || cert.student_name || '').toLowerCase()
    const title = (cert.title || '').toLowerCase()
    const tokenId = (cert.tokenId || '').toString()
    const date = new Date(cert.issue_date || cert.created_at).toLocaleDateString().toLowerCase()
    
    return name.includes(query) || 
           title.includes(query) || 
           tokenId.includes(query) ||
           date.includes(query)
  })
})

const localSearchQuery = computed({
  get: () => props.searchQuery,
  set: (val) => emit('update:searchQuery', val)
})

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString()
}
</script>

<template>
  <div class="glass-panel rounded-2xl overflow-hidden shadow-sm animate-fade-in">
    <div class="px-6 py-4 border-b border-transparent flex flex-col md:flex-row md:items-center justify-between gap-4">
      <h3 class="font-bold text-gray-900 dark:text-white">Achievement Records</h3>
      <div class="relative">
        <input 
          v-model="localSearchQuery"
          type="text" 
          placeholder="Search student, token, date..." 
          class="glass-input pl-10 pr-4 py-2 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-indigo-500 outline-none"
        />
        <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
      </div>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead class="bg-gray-50 dark:bg-[#1b2127] text-gray-500 dark:text-gray-400 text-sm">
          <tr>
            <th class="px-6 py-3 font-semibold tracking-wider">Student</th>
            <th class="px-6 py-3 font-semibold tracking-wider">Achievement</th>
            <th class="px-6 py-3 font-semibold tracking-wider">Token ID</th>
            <th class="px-6 py-3 font-semibold tracking-wider">Date</th>
            <th class="px-6 py-3 font-semibold tracking-wider">Status</th>
            <th class="px-6 py-3 font-semibold tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-[#283039]">
          <tr v-for="cert in filteredCertificates" :key="cert.id" class="hover:bg-gray-50 dark:hover:bg-[#1b2127]/50 transition group">
            <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">{{ cert.student?.full_name || cert.student_name || 'Unknown' }}</td>
            <td class="px-6 py-4 text-gray-600 dark:text-gray-300">{{ cert.title }}</td>
            <td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">
               <span class="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {{ cert.tokenId ? `#${cert.tokenId}` : 'N/A' }}
               </span>
            </td>
            <td class="px-6 py-4 text-gray-500 dark:text-gray-400">{{ formatDate(cert.issue_date || cert.created_at) }}</td>
            <td class="px-6 py-4">
              <span 
                v-if="cert.tokenId"
                class="px-2 py-1 rounded text-[10px] border font-bold uppercase tracking-wider"
                :class="cert.isRevoked 
                  ? 'bg-red-50 dark:bg-red-500/20 text-red-600 dark:text-red-300 border-red-200 dark:border-red-500/30' 
                  : 'bg-green-50 dark:bg-green-500/20 text-green-600 dark:text-green-300 border-green-200 dark:border-green-500/30'"
              >
                {{ cert.isRevoked ? 'Revoked' : 'Valid' }}
              </span>
              <span v-else class="text-gray-400 dark:text-gray-500 text-xs italic">Pending Mint...</span>
            </td>
            <td class="px-6 py-4">
              <div class="flex gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                <!-- View -->
                <a 
                  v-if="cert.tokenId"
                  :href="`/verify/${cert.tokenId}`" 
                  target="_blank"
                  class="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 text-xs px-2 py-1 border border-blue-200 dark:border-blue-400/30 rounded hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                >
                  👁 View
                </a>
                <!-- QR -->
                <button 
                  v-if="cert.tokenId"
                  @click="emit('qr', cert)"
                  class="text-purple-500 dark:text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 text-xs px-2 py-1 border border-purple-200 dark:border-purple-400/30 rounded hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                >
                  📱 QR
                </button>
                <!-- Revoke/Reinstate -->
                <button 
                  v-if="cert.tokenId"
                  @click="emit('toggle-revocation', cert)"
                  :disabled="cert.processing"
                  class="text-xs px-2 py-1 border rounded transition-all disabled:opacity-50"
                  :class="cert.isRevoked 
                    ? 'text-emerald-500 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-500/10' 
                    : 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-500/30 hover:bg-red-50 dark:hover:bg-red-500/10'"
                >
                  <span v-if="cert.processing">...</span>
                  <span v-else>{{ cert.isRevoked ? '✓ Reinstate' : '✕ Revoke' }}</span>
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredCertificates.length === 0">
            <td colspan="6" class="px-6 py-12 text-center text-gray-500 dark:text-gray-400 italic">
               No matching records found.
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
