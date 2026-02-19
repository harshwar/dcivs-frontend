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
                      <button class="text-indigo-500 hover:text-indigo-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                         View Details ->
                      </button>
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
</script>
