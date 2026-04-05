<template>
  <div class="glass p-6 rounded-xl border border-gray-700 bg-[#1b2127]">
    <h2 class="text-xl font-bold text-white mb-4">Register Achievement Record</h2>

    <div id="tour-issue-form" class="flex flex-col gap-4">
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

      <!-- AI TOGGLE -->
      <div class="flex items-center justify-between p-3 rounded-lg border transition-all duration-300"
           :class="aiEnabled ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-yellow-500/40 bg-yellow-500/5'">
        <div class="flex items-center gap-3">
          <span class="text-lg">{{ aiEnabled ? '🤖' : '✋' }}</span>
          <div>
            <span class="text-sm font-bold" :class="aiEnabled ? 'text-indigo-300' : 'text-yellow-300'">{{ aiEnabled ? 'AI Verification Active' : 'Manual Mode' }}</span>
            <p class="text-[11px] text-gray-500">{{ aiEnabled ? 'Auto-scan, identity match & field extraction' : 'AI disabled — fill all fields manually' }}</p>
          </div>
        </div>
        <button @click="aiEnabled = !aiEnabled" class="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900"
                :class="aiEnabled ? 'bg-indigo-600 focus:ring-indigo-500' : 'bg-gray-600 focus:ring-yellow-500'">
          <span class="block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300"
                :class="aiEnabled ? 'translate-x-6' : 'translate-x-0.5'"></span>
        </button>
      </div>

      <!-- FILE UPLOAD -->
      <div id="tour-issue-uploader" class="flex flex-col gap-1 relative">
        <div class="flex justify-between items-center mb-1">
          <span class="text-gray-400 text-sm">Achievement File</span>
          <!-- Format Standardization Loader -->
          <span v-if="isConverting && !isScanning" class="text-indigo-400 text-xs flex items-center gap-1 animate-pulse">
            <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            Standardizing Format...
          </span>
          <!-- AI Scan Loader (Simple Text when scanning starts but waiting for tracker) -->
          <span v-if="isScanning && aiEnabled" class="text-blue-400 text-xs flex items-center gap-1 animate-pulse">
            <svg class="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
            Connecting to AI Server...
          </span>
        </div>

        <FileUpload
          v-model="selectedFile"
          accept="image/*,application/pdf"
          hint="PNG, JPG, WEBP, HEIC, or PDF"
        />

      </div>

      <!-- SUBMIT BUTTON -->
      <button
         id="tour-issue-btn"
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
      :file="standardizedImage || selectedFile"
      :student="selectedStudent"
      :isProcessing="isIssuing"
      :preVerifiedMatch="autoVerifiedMatch"
      :preExtractedText="autoExtractedText"
      :aiDisabled="!aiEnabled"
      @close="showConfirmationModal = false"
      @confirm="confirmIssuance"
    />

    <!-- Progress Tracker (Style 6 IDE) for AI Scanning -->
    <ProgressTracker
      :jobId="activeScanJobId"
      :visible="showScanProgressTracker"
      windowTitle="scan.exe — AI Verification"
      :steps="scanSteps"
      @complete="onScanComplete"
      @error="onScanError"
      @close="showScanProgressTracker = false; activeScanJobId = ''"
    />

    <!-- Progress Tracker (Style 6 IDE) -->
    <ProgressTracker
      :jobId="activeJobId"
      :visible="showProgressTracker"
      windowTitle="pipeline.exe — Certificate Issuance"
      :steps="pipelineSteps"
      @complete="onPipelineComplete"
      @error="onPipelineError"
      @close="showProgressTracker = false; activeJobId = ''"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import CustomSelect from '../ui/CustomSelect.vue'
import FileUpload from '../ui/FileUpload.vue'
import IssuanceConfirmationModal from './IssuanceConfirmationModal.vue'
import ProgressTracker from '../ui/ProgressTracker.vue'
import { useToast } from '../../composables/useToast.js'
import { API_BASE_URL } from '../../apiConfig'
import { standardizeFileToPNG } from '../../utils/fileStandardizer.js'

import { useJobPoller } from '../../composables/useJobPoller'

const toast = useToast()

// Component props (not heavily used here but available for extensibility)
const props = defineProps(['apiBase']) 

// --- Reactive State ---
const students = ref([]) // List of students for the dropdown
const selectedStudentId = ref('') // ID of student to receive the certificate
const title = ref('') // Certificate name
const description = ref('') // Brief detail about the cert
const department = ref('') // Academic department
const selectedFile = ref(null) // The actual raw uploaded file
const standardizedImage = ref(null) // The parsed clean PNG blob
const isIssuing = ref(false) // Loading state for the submit button
const isConverting = ref(false) // Loading state for file standardization
const isScanning = ref(false) // Loading state for AI scanning
const aiEnabled = ref(true) // Toggle for AI verification
const showConfirmationModal = ref(false) // Modal visibility
const activeJobId = ref('') // Current polling job for async issuance

const showScanProgressTracker = ref(false) // Progress tracker for scanning
const activeScanJobId = ref('') // Current polling job for AI scan

const showProgressTracker = ref(false) // Progress tracker for issuance pipeline
// activeJobId is actually declared at line 173

const scanSteps = [
  { label: 'Initialize Vision' },
  { label: 'Extract Text (OCR)' },
  { label: 'Redact PII' },
  { label: 'Gemini AI Analysis' }
]

const pipelineSteps = [
  { label: 'Fetch Wallet' },
  { label: 'Pin to IPFS' },
  { label: 'Pin Metadata' },
  { label: 'Mint NFT' },
  { label: 'Save & Notify' }
]

const autoVerifiedMatch = ref(null);
const autoExtractedText = ref('');

watch(selectedFile, async (newFile) => {
  // Reset previous state
  standardizedImage.value = null;
  autoVerifiedMatch.value = null;
  autoExtractedText.value = '';

  if (newFile) {
    try {
      // 1. Convert any weird format / PDF into a squeaky clean PNG Blob
      isConverting.value = true;
      const cleanPngBlob = await standardizeFileToPNG(newFile);
      standardizedImage.value = cleanPngBlob;
    } catch (err) {
      toast.error(err.message || 'Failed to parse file.');
      selectedFile.value = null;
      return;
    } finally {
      isConverting.value = false;
    }

    // 2. Pass the standard PNG right into the AI Scanner (only if AI is enabled)
    if (aiEnabled.value) {
      await scanCertificate(standardizedImage.value);
    }
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
    
    // Call the NEW async endpoint — returns jobId immediately
    const res = await fetch(`${API_BASE_URL}/api/ai/start-verify`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
      },
      body: formData
    });
    
    if (res.ok) {
      const { jobId } = await res.json();
      activeScanJobId.value = jobId;
      showScanProgressTracker.value = true;
    } else {
      throw new Error('Scan request failed');
    }
  } catch (err) {
    console.error('AI Scan Error:', err);
    toast.error('AI Scanning failed. Please fill details manually.');
    isScanning.value = false;
  }
}

function onScanComplete(data) {
  isScanning.value = false;

  // Store verification results
  autoVerifiedMatch.value = data.match;
  autoExtractedText.value = data.extracted_text || '';

  // Auto-fill fields if they are currently empty
  if (!title.value && data.title) title.value = data.title;
  if (!department.value && data.department) department.value = data.department;
  if (!description.value && data.description) description.value = data.description;
  
  // If we did a blind scan (no student selected), attempt to auto-match
  if (!selectedStudentId.value && data.raw_text) {
    const rawText = data.raw_text.toLowerCase();
    let matchedStudent = null;

    // Pass 1: Strict Check for Exact Roll Number
    for (const student of students.value) {
      if (student.roll && rawText.includes(student.roll.toLowerCase())) {
        matchedStudent = student;
        break;
      }
    }

    // Pass 2: Fallback check for fuzzy Full Name match
    if (!matchedStudent) {
      for (const student of students.value) {
        if (student.name) {
          const nameParts = student.name.toLowerCase().split(' ').filter(p => p.length > 2);
          const allPartsFound = nameParts.length > 0 && nameParts.every(part => rawText.includes(part));
          if (allPartsFound) {
            matchedStudent = student;
            break;
          }
        }
      }
    }

    if (matchedStudent) {
      selectedStudentId.value = matchedStudent.id;
      autoVerifiedMatch.value = true;
      toast.success(`Identity auto-detected: ${matchedStudent.name}! ✨`);
    } else {
      toast.warning('AI Scan Complete, but could not auto-identify student. Please select manually.');
    }
  } else {
    if (data.match) {
      toast.success('AI Scan Complete: Identity verified and fields auto-filled! ✨');
    } else if (selectedStudentId.value) {
      toast.warning('AI Scan Complete, but could not mathematically verify the selected student identity.');
    } else {
      toast.success('AI Scan Complete: Extracted details successfully.');
    }
  }
}

function onScanError(error) {
  isScanning.value = false;
  toast.error(`AI Scanning failed: ${error || 'Please view terminal details.'}`);
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
  showConfirmationModal.value = false
  isIssuing.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  formData.append('recipientId', selectedStudentId.value)
  formData.append('title', title.value) 
  formData.append('description', description.value) 
  formData.append('department', department.value) 

  try {
    // Call the NEW async endpoint — returns jobId immediately
    const res = await fetch(`${API_BASE_URL}/api/nft/start-issue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token')}`
      },
      body: formData
    })

    const data = await res.json()
    
    if (res.ok && data.jobId) {
      // Open the progress tracker with the jobId
      activeJobId.value = data.jobId
      showProgressTracker.value = true
      isIssuing.value = false
    } else {
      throw new Error(data.error || 'Failed to start issuance')
    }
  } catch (err) {
    console.error('Issue error:', err)
    toast.error(`Error: ${err.message}`)
    isIssuing.value = false
  }
}

/** Called when ProgressTracker reports pipeline success */
function onPipelineComplete(result) {
  toast.success(`Record Registered!\nTx: ${result?.transactionHash || 'Success'}\nToken #${result?.tokenId || ''}`)
  resetForm()
}

/** Called when ProgressTracker reports pipeline failure */
function onPipelineError(error) {
  toast.error(`Pipeline Error: ${error || 'Unknown error'}`)
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

// Unsaved-form protection
const isDirty = computed(() => !!selectedStudentId.value || !!title.value || !!selectedFile.value)
function handleBeforeUnload(e) {
  if (isDirty.value) {
    e.preventDefault()
    e.returnValue = ''
  }
}
window.addEventListener('beforeunload', handleBeforeUnload)
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>


<style scoped>
.input-field {
  @apply w-full rounded-lg bg-transparent border border-gray-600 text-white px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all;
}
</style>
