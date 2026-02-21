<script setup>
import { ref, onMounted } from 'vue'
import { API_BASE_URL } from '../../apiConfig'
import { useToast } from '../../composables/useToast'
import { useConfirm } from '../../composables/useConfirm'

const toast = useToast()
const { confirm } = useConfirm()
const API_BASE = `${API_BASE_URL}/api/admin`

const pendingStudents = ref([])
const isLoading = ref(false)
const isProcessing = ref(null) // ID of student being processed

async function fetchPending() {
  isLoading.value = true
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/pending-students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      pendingStudents.value = await res.json()
    } else {
      throw new Error('Failed to fetch queue')
    }
  } catch (err) {
    console.error(err)
    toast.error('Failed to load approval queue')
  } finally {
    isLoading.value = false
  }
}

async function handleApprove(student) {
  const confirmed = await confirm(
    'Approve Registration',
    `Are you sure you want to approve ${student.full_name}? This will generate their blockchain wallet.`,
    { confirmText: 'Approve', danger: false }
  )
  
  if (!confirmed) return

  isProcessing.value = student.id
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/approve-student/${student.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.ok) {
      toast.success(`${student.full_name} approved!`)
      pendingStudents.value = pendingStudents.value.filter(s => s.id !== student.id)
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Approval failed')
    }
  } catch (err) {
    toast.error(err.message)
  } finally {
    isProcessing.value = null
  }
}

async function handleReject(student) {
  const confirmed = await confirm(
    'Reject Registration',
    `Are you sure you want to reject ${student.full_name}? This will delete their pending record.`,
    { confirmText: 'Reject', danger: true }
  )
  
  if (!confirmed) return

  isProcessing.value = student.id
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/reject-student/${student.id}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reason: 'Admin rejected registration' })
    })
    
    if (res.ok) {
      toast.info('Registration rejected.')
      pendingStudents.value = pendingStudents.value.filter(s => s.id !== student.id)
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Rejection failed')
    }
  } catch (err) {
    toast.error(err.message)
  } finally {
    isProcessing.value = null
  }
}

onMounted(fetchPending)
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h3 class="text-xl font-bold text-gray-900 dark:text-white">Identity Approval Queue</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">Review and activate student registrations who have verified their emails.</p>
      </div>
      <button @click="fetchPending" class="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
        <span :class="{ 'animate-spin': isLoading }" class="inline-block">↻</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="!isLoading && pendingStudents.length === 0" class="glass-panel p-12 text-center rounded-2xl border border-gray-200 dark:border-white/10">
      <div class="text-4xl mb-4">✅</div>
      <h4 class="text-lg font-bold text-gray-900 dark:text-white">All Clear!</h4>
      <p class="text-gray-500">There are no students waiting for approval at the moment.</p>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="p-12 text-center">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mb-2"></div>
      <p class="text-gray-500">Fetching approval queue...</p>
    </div>

    <!-- Student List -->
    <div v-else class="grid grid-cols-1 gap-4">
      <div v-for="student in pendingStudents" :key="student.id" class="glass-panel p-6 rounded-2xl border border-gray-200 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-500/30 transition-all">
        <div class="flex items-center gap-4">
          <div class="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
            {{ student.full_name.charAt(0) }}
          </div>
          <div>
            <h4 class="font-bold text-gray-900 dark:text-white">{{ student.full_name }}</h4>
            <div class="flex flex-wrap gap-x-4 gap-y-1 mt-1">
              <span class="text-xs text-gray-500 flex items-center gap-1">✉️ {{ student.email }}</span>
              <span class="text-xs text-gray-500 flex items-center gap-1">🆔 {{ student.student_id_number }}</span>
              <span class="text-xs text-gray-500 flex items-center gap-1">🎓 {{ student.course_name }} ({{ student.year }})</span>
            </div>
            <p class="text-[10px] text-gray-400 mt-2 italic">Applied: {{ new Date(student.created_at).toLocaleString() }}</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button 
            @click="handleReject(student)"
            :disabled="isProcessing !== null"
            class="px-4 py-2 border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
          >
            Reject
          </button>
          <button 
            @click="handleApprove(student)"
            :disabled="isProcessing !== null"
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 group disabled:opacity-50"
          >
            <span v-if="isProcessing === student.id" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ isProcessing === student.id ? 'Activating...' : 'Approve & Create Wallet' }}
            <span v-if="isProcessing !== student.id" class="group-hover:translate-x-1 transition-transform">🚀</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  @apply bg-white/50 dark:bg-[#1b2127]/50 backdrop-blur-xl transition-all duration-300;
}
</style>
