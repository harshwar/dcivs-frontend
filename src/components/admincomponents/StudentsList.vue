<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Filters -->
    <div class="glass-panel p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-wrap gap-4 items-center justify-between">
       <div class="flex gap-4 items-center flex-1">
          <!-- Course Filter -->
          <select v-model="filterCourse" class="glass-input px-4 py-2 rounded-lg text-sm bg-white dark:bg-[#1b2127] border border-gray-300 dark:border-gray-600">
             <option value="">All Courses</option>
             <option v-for="c in uniqueCourses" :key="c" :value="c">{{ c }}</option>
          </select>
          <!-- Year Filter -->
          <select v-model="filterYear" class="glass-input px-4 py-2 rounded-lg text-sm bg-white dark:bg-[#1b2127] border border-gray-300 dark:border-gray-600">
             <option value="">All Years</option>
             <option v-for="y in uniqueYears" :key="y" :value="y">{{ y }}</option>
          </select>
          <!-- Search -->
          <div class="relative flex-1 max-w-md">
             <input 
               v-model="searchQuery" 
               type="text" 
               placeholder="Search by name, ID or wallet..." 
               class="glass-input pl-10 pr-4 py-2 rounded-lg text-sm w-full bg-white dark:bg-[#1b2127] border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
             />
             <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
          </div>
       </div>
       <div class="text-sm text-gray-500 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          Showing {{ filteredStudents.length }} students
       </div>
    </div>

    <!-- Table -->
    <div class="glass-panel rounded-2xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
       <div class="overflow-x-auto">
          <table class="w-full text-left">
             <thead class="bg-gray-50 dark:bg-[#1b2127] text-gray-500 dark:text-gray-400 text-sm border-b border-gray-200 dark:border-gray-700">
                <tr>
                   <th class="px-6 py-3 cursor-pointer hover:text-indigo-500 transition-colors">Name</th>
                   <th class="px-6 py-3">ID Number</th>
                   <th class="px-6 py-3">Course</th>
                   <th class="px-6 py-3">Year</th>
                   <th class="px-6 py-3">Wallet</th>
                   <th class="px-6 py-3 text-right">Actions</th>
                </tr>
             </thead>
             <tbody class="divide-y divide-gray-200 dark:divide-[#283039]">
                <tr 
                  v-for="student in filteredStudents" 
                  :key="student.id" 
                  class="hover:bg-gray-50 dark:hover:bg-[#1b2127]/50 transition cursor-pointer group"
                  @click="openDetails(student)"
                >
                   <td class="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-3">
                      <div class="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-xs font-bold text-indigo-600 dark:text-indigo-300">
                         {{ student.name.charAt(0) }}
                      </div>
                      {{ student.name }}
                   </td>
                   <td class="px-6 py-4 font-mono text-sm text-gray-500">{{ student.roll }}</td>
                   <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ student.course || '-' }}</td>
                   <td class="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{{ student.year || '-' }}</td>
                   <td class="px-6 py-4 font-mono text-xs text-gray-400">
                      {{ student.wallet ? `${student.wallet.slice(0,6)}...${student.wallet.slice(-4)}` : 'Not Connected' }}
                   </td>
                   <td class="px-6 py-4 text-right">
                      <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          @click.stop="openEditModal(student)"
                          class="p-2 text-gray-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button class="text-indigo-500 hover:text-indigo-600 text-sm font-medium">
                           View Details ->
                        </button>
                      </div>
                   </td>
                </tr>
                <tr v-if="filteredStudents.length === 0">
                    <td colspan="6" class="px-6 py-12 text-center text-gray-500">
                        No students found matching your filters.
                    </td>
                </tr>
             </tbody>
          </table>
       </div>
    </div>

    <!-- Edit Modal Overlay -->
    <div v-if="editingStudent" class="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 animate-fade-in" @click.self="closeEditModal">
      <div class="bg-white dark:bg-[#1b2127] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-200 dark:border-[#30363d] animate-slide-up">
        
        <div class="p-6 border-b border-gray-100 dark:border-[#30363d] flex justify-between items-center bg-gray-50 dark:bg-[#161b22]">
          <h3 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            ✏️ Edit Active Student
          </h3>
          <button @click="closeEditModal" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            ✕
          </button>
        </div>

        <div class="p-6 space-y-4 text-left">
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

    <!-- Slide Over -->
    <transition
      enter-active-class="transform transition ease-in-out duration-500 sm:duration-700"
      enter-from-class="translate-x-full"
      enter-to-class="translate-x-0"
      leave-active-class="transform transition ease-in-out duration-500 sm:duration-700"
      leave-from-class="translate-x-0"
      leave-to-class="translate-x-full"
    >
        <StudentDetailSlideOver 
        :open="showSlideOver" 
        :studentId="selectedStudentId" 
        @close="showSlideOver = false" 
        />
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import StudentDetailSlideOver from './StudentDetailSlideOver.vue';
import { API_BASE_URL } from '../../apiConfig';
import { useToast } from '../../composables/useToast';

const toast = useToast();
const API_BASE = `${API_BASE_URL}/api/admin`;

const emit = defineEmits(['edit-student']);

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  }
});

const searchQuery = ref('');
const filterCourse = ref('');
const filterYear = ref('');
const showSlideOver = ref(false);
const selectedStudentId = ref(null);

// Edit Modal State
const editingStudent = ref(null);
const isSavingEdit = ref(false);
const editForm = ref({
  full_name: '',
  student_id_number: '',
  course_name: '',
  year: ''
});

const uniqueCourses = computed(() => {
   const courses = props.students.map(s => s.course).filter(Boolean);
   return [...new Set(courses)].sort();
});

const uniqueYears = computed(() => {
   const years = props.students.map(s => s.year).filter(Boolean);
   return [...new Set(years)].sort();
});

const filteredStudents = computed(() => {
   return props.students.filter(s => {
      const matchesSearch = (s.name || '').toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                            (s.roll || '').toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                            (s.wallet || '').toLowerCase().includes(searchQuery.value.toLowerCase());
      const matchesCourse = !filterCourse.value || s.course === filterCourse.value;
      const matchesYear = !filterYear.value || s.year === filterYear.value;
      
      return matchesSearch && matchesCourse && matchesYear;
   });
});

function openDetails(student) {
   selectedStudentId.value = student.id;
   showSlideOver.value = true;
}

// --- Edit Functions ---
function openEditModal(student) {
  editingStudent.value = student;
  editForm.value = {
    full_name: student.name, // the mapped prop in AdminDashboard
    student_id_number: student.roll, // mapped prop
    course_name: student.course || '',
    year: student.year || ''
  };
}

function closeEditModal() {
  editingStudent.value = null;
  editForm.value = { full_name: '', student_id_number: '', course_name: '', year: '' };
}

async function saveEdit() {
  if (!editForm.value.full_name || !editForm.value.student_id_number || !editForm.value.course_name || !editForm.value.year) {
    toast.error('All fields are required.');
    return;
  }

  isSavingEdit.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/students/${editingStudent.value.id}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editForm.value)
    });
    
    if (res.ok) {
      const { student: updatedStudent } = await res.json();
      toast.success('Student details updated!');
      // Emit the full DB record up to the parent to merge
      emit('edit-student', updatedStudent);
      closeEditModal();
    } else {
      const data = await res.json();
      throw new Error(data.error || 'Update failed');
    }
  } catch (err) {
    toast.error(err.message);
  } finally {
    isSavingEdit.value = false;
  }
}
</script>

<style scoped>
.animate-slide-up {
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
