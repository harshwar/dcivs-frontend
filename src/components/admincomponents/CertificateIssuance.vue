<template>
  <div class="glass p-6 rounded-xl border border-gray-700 bg-[#1b2127]">
    <h2 class="text-xl font-bold text-white mb-4">Register Achievement Record</h2>

    <div class="flex flex-col gap-4">
      <!-- STUDENT DROPDOWN -->
      <div class="flex flex-col gap-1">
        <span class="text-gray-400 text-sm">Select Student</span>
      <CustomSelect
          v-model="selectedStudentId"
          :options="studentOptions"
          placeholder="-- Choose a Student --"
          :searchable="true"
        />
      </div>

      <!-- ACHIEVEMENT TITLE -->
      <div class="flex flex-col gap-1">
        <span class="text-gray-400 text-sm">Achievement Title</span>
        <input
          v-model="title"
          class="input-field"
          placeholder="e.g. Bachelor of Science"
        />
      </div>

      <!-- DEPARTMENT -->
      <div class="flex flex-col gap-1">
        <span class="text-gray-400 text-sm">Department</span>
        <input
          v-model="department"
          class="input-field"
          placeholder="e.g. Computer Science"
        />
      </div>

      <!-- DESCRIPTION -->
      <div class="flex flex-col gap-1">
        <span class="text-gray-400 text-sm">Description</span>
        <textarea
          v-model="description"
          class="input-field h-24 resize-none"
          placeholder="Enter details about this record..."
        ></textarea>
      </div>

      <!-- FILE UPLOAD -->
      <div class="flex flex-col gap-1">
        <div class="flex justify-between items-center">
          <span class="text-gray-400 text-sm">Achievement File (Image)</span>
          <span v-if="isScanning" class="text-blue-400 text-xs flex items-center gap-1 animate-pulse">
            <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            AI Scanning...
          </span>
        </div>
        <FileUpload
          v-model="selectedFile"
          accept="image/*"
          hint="PNG, JPG, or WEBP"
        />
      </div>

      <!-- SUBMIT BUTTON -->
      <button
        class="mt-4 px-6 py-3 rounded-lg font-bold text-white transition-all transform active:scale-95"
        :class="isFormValid ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 cursor-not-allowed'"
        :disabled="!isFormValid || isIssuing"
        @click="issueCertificate"
      >
        <span v-if="!isIssuing">Anchor Record on Blockchain</span>
        <span v-else class="flex items-center justify-center gap-2">
           <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
             <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
             <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
           </svg>
           Processing...
        </span>
      </button>
    </div>

    <IssuanceConfirmationModal 
      :isOpen="showConfirmationModal" 
      :file="selectedFile"
      :student="selectedStudent"
      :isProcessing="isIssuing"
      :preVerifiedMatch="autoVerifiedMatch"
      :preExtractedText="autoExtractedText"
      @close="showConfirmationModal = false"
      @confirm="confirmIssuance"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import CustomSelect from '../ui/CustomSelect.vue'
import FileUpload from '../ui/FileUpload.vue'
import IssuanceConfirmationModal from './IssuanceConfirmationModal.vue'
import { useToast } from '../../composables/useToast.js'
import { API_BASE_URL } from '../../apiConfig'

const toast = useToast()

// Component props (not heavily used here but available for extensibility)
const props = defineProps(['apiBase']) 

// --- Reactive State ---
const students = ref([]) // List of students for the dropdown
const selectedStudentId = ref('') // ID of student to receive the certificate
const title = ref('') // Certificate name
const description = ref('') // Brief detail about the cert
const department = ref('') // Academic department
const selectedFile = ref(null) // The actual certificate image/file
const isIssuing = ref(false) // Loading state for the submit button
const isScanning = ref(false) // Loading state for AI scanning
const showConfirmationModal = ref(false) // Modal visibility

const autoVerifiedMatch = ref(null);
const autoExtractedText = ref('');

// Automatically scan the certificate when an image AND a student are selected
watch([selectedFile, selectedStudentId], async ([newFile, newStudentId]) => {
  if (newFile && newStudentId) {
    await scanCertificate(newFile);
  } else if (newFile && !newStudentId) {
    toast.warning('Please select a student to enable automatic verification and summarization.');
  }
});

async function scanCertificate(file) {
  isScanning.value = true;
  autoVerifiedMatch.value = null;
  autoExtractedText.value = '';

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('studentName', selectedStudent.value?.name || '');
    formData.append('studentRoll', selectedStudent.value?.roll || '');
    
    // Call the combined local OCR + Gemini AI backend endpoint
    const res = await fetch(`${API_BASE_URL}/api/ai/verify-document`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (res.ok) {
      const data = await res.json();
      
      // Store verification results
      autoVerifiedMatch.value = data.match;
      autoExtractedText.value = data.extracted_text || '';

      // Auto-fill fields if they are currently empty
      if (!title.value && data.title) title.value = data.title;
      if (!department.value && data.department) department.value = data.department;
      if (!description.value && data.description) description.value = data.description;
      
      if (data.match) {
        toast.success('AI Scan Complete: Identity verified and fields auto-filled! ✨');
      } else {
        toast.warning('AI Scan Complete, but could not automatically verify the student identity.');
      }
    } else {
      throw new Error('Scan failed');
    }
  } catch (err) {
    console.error('AI Scan Error:', err);
    toast.error('AI Scanning failed. Please fill details manually.');
  } finally {
    isScanning.value = false;
  }
}

const selectedStudent = computed(() => students.value.find(s => s.id === selectedStudentId.value))

// --- Form Validation Logic ---
// Computed property: returns true only if essential fields are filled
const isFormValid = computed(() => {
  return selectedStudentId.value && title.value && selectedFile.value
})

// Transform students array into CustomSelect options
const studentOptions = computed(() => 
  students.value.map(s => ({ value: s.id, label: `${s.name} (${s.roll || 'No ID'})` }))
)

/**
 * fetchStudents:
 * Fetches the list of students from the backend for the "Select Student" dropdown.
 */
async function fetchStudents() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/students`, {
      headers: {
        // Authenticate request using either admin or user token
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
      }
    })
    if (res.ok) {
      students.value = await res.json()
    }
  } catch (err) {
    console.error('Failed to fetch students:', err)
  }
}

/**
 * onFileChange is no longer needed — FileUpload handles it via v-model
 */

/**
 * issueCertificate:
 * The primary action that triggers the issuance flow.
 * Consolidates form data and sends a multipart request to the backend.
 */
async function issueCertificate() {
  // Prevent submission if form is incomplete
  if (!isFormValid.value) return

  // Open Confirmation Modal instead of immediate issue
  showConfirmationModal.value = true
}

/**
 * confirmIssuance:
 * Called when user verifies details in the modal
 */
async function confirmIssuance() {
  showConfirmationModal.value = false // Close modal immediately or keep open? Better keep open to show loading?
  // Actually the modal has a loading state. Let's keep it open and handle loading there.
  
  // Enable loading UI
  isIssuing.value = true

  // --- Prepare Data for Upload ---
  // Using FormData is required for sending files (binary data) via HTTP
  const formData = new FormData()
  formData.append('file', selectedFile.value) // Certificate image
  formData.append('recipientId', selectedStudentId.value) // Linking to specific student
  formData.append('title', title.value) 
  formData.append('description', description.value) 
  formData.append('department', department.value) 

  try {
    // POST request to the issue endpoint
    const res = await fetch(`${API_BASE_URL}/api/nft/issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
        // Note: Content-Type is intentionally omitted here as FormData sets it automatically
      },
      body: formData
    })

    const data = await res.json()
    
    // Check status
    if (res.ok) {
      // Notify admin of success and show blockchain proof
      toast.success(`Record Registered!\nTx Hash: ${data.nft.transactionHash}`)
      resetForm() // Clear the form for the next issuance
    } else {
      throw new Error(data.error || 'Failed to issue NFT')
    }
  } catch (err) {
    console.error('Issue error:', err)
    toast.error(`Error: ${err.message}`)
  } finally {
    // Disable loading UI
    isIssuing.value = false
    showConfirmationModal.value = false
  }
}

/**
 * resetForm:
 * Clears all input fields to their initial empty values.
 */
function resetForm() {
  title.value = ''
  description.value = ''
  department.value = ''
  selectedFile.value = null
  selectedStudentId.value = ''
}

// Automatically populate the student dropdown when the form component is loaded
onMounted(fetchStudents)
</script>


<style scoped>
.input-field {
  @apply w-full rounded-lg bg-transparent border border-gray-600 text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all;
}
</style>
