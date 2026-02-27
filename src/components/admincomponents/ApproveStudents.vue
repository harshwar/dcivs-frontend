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

// Edit Modal State
const editingStudent = ref(null)
const editForm = ref({
  full_name: '',
  student_id_number: '',
  course_name: '',
  year: ''
})
const isSavingEdit = ref(false)

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

// --- Edit Functions ---
function openEditModal(student) {
  editingStudent.value = student
  editForm.value = {
    full_name: student.full_name,
    student_id_number: student.student_id_number,
    course_name: student.course_name,
    year: student.year
  }
}

function closeEditModal() {
  editingStudent.value = null
  editForm.value = { full_name: '', student_id_number: '', course_name: '', year: '' }
}

async function saveEdit() {
  if (!editForm.value.full_name || !editForm.value.student_id_number || !editForm.value.course_name || !editForm.value.year) {
    toast.error('All fields are required.')
    return
  }

  isSavingEdit.value = true
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/students/${editingStudent.value.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm.value)
    })
    
    if (res.ok) {
      const { student: updatedStudent } = await res.json()
      toast.success('Student details updated!')
      // Update local array seamlessly
      const index = pendingStudents.value.findIndex(s => s.id === updatedStudent.id)
      if (index !== -1) {
        pendingStudents.value[index] = { ...pendingStudents.value[index], ...updatedStudent }
      }
      closeEditModal()
    } else {
      const data = await res.json()
      throw new Error(data.error || 'Update failed')
    }
  } catch (err) {
    toast.error(err.message)
  } finally {
    isSavingEdit.value = false
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

        <div class="flex items-center gap-2">
          <button 
            @click="openEditModal(student)"
            :disabled="isProcessing !== null"
            class="p-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-all disabled:opacity-50"
            title="Edit Details"
          >
            ✏️
          </button>
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
    
    <!-- Edit Modal Overlay -->
    <div v-if="editingStudent" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 animate-fade-in" @click.self="closeEditModal">
      <div class="bg-white dark:bg-[#1b2127] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-[#30363d] animate-slide-up">
        
        <div class="p-6 border-b border-gray-100 dark:border-[#30363d] flex justify-between items-center bg-gray-50 dark:bg-[#161b22]">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ✏️ Edit Pending Student
          </h3>
          <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            ✕
          </button>
        </div>

        <div class="p-6 space-y-4">
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Full Name</label>
            <input v-model="editForm.full_name" type="text" class="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Student ID (Roll Number)</label>
            <input v-model="editForm.student_id_number" type="text" class="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Course Name</label>
              <input v-model="editForm.course_name" type="text" class="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Graduation Year</label>
              <input v-model="editForm.year" type="number" class="w-full bg-white dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div class="pt-2 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 p-3 rounded-lg border border-amber-200 dark:border-amber-500/20">
            <strong>Note:</strong> Editing these details will permanently update the student's profile before their blockchain wallet is created.
          </div>
        </div>

        <div class="p-4 border-t border-gray-100 dark:border-[#30363d] bg-gray-50 dark:bg-[#161b22] flex justify-end gap-3">
          <button @click="closeEditModal" class="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-[#30363d] rounded-xl transition-colors disabled:opacity-50" :disabled="isSavingEdit">
            Cancel
          </button>
          <button @click="saveEdit" :disabled="isSavingEdit" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2 disabled:opacity-50">
            <span v-if="isSavingEdit" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ isSavingEdit ? 'Saving...' : 'Save Changes' }}
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
.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
