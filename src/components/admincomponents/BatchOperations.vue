<script setup>
import { ref, reactive, computed } from 'vue'
import { useToast } from '../../composables/useToast.js'
import JSZip from 'jszip'
import Tesseract from 'tesseract.js'

const toast = useToast()
import { API_BASE_URL } from '../../apiConfig'
const API_BASE = `${API_BASE_URL}/api`

// --- State ---
const activeTab = ref('registration') // 'registration' | 'issuance'
const isProcessing = ref(false)
const progress = ref({ current: 0, total: 0, status: '' })

// Registration State
const regFile = ref(null)
const regResults = reactive({ show: false, success: 0, failed: 0, data: [], errors: [] })
const showRegConfirmModal = ref(false)
const regPreviewRecords = ref([])
const expandedRow = ref(null)

// --- Issuance State
const issueCsvFile = ref(null)
const issueZipFile = ref(null)
const parsedRecords = ref([]) // { data: row, image: blob, status: 'pending'|'verified'|'mismatch', message: '' }
const zipImages = ref({}) // filename -> blob
const walletInfo = ref(null)

// --- Helpers ---
const getToken = () => localStorage.getItem('authToken')

const downloadTemplate = (type) => {
  let content = ''
  let filename = ''
  
  if (type === 'registration') {
    content = 'email,full_name,student_id_number,course_name,year\nstudent@example.com,John Doe,ST12345,B.Sc IT,2024'
    filename = 'student_registration_template.csv'
  } else if (type === 'issuance') {
    content = 'student_id,title,description,department,issue_date,image_filename\nST12345,Bachelor of Science,Graduated with First Class Honors,Information Technology,2024-05-20,student_12345_marksheet.png'
    filename = 'batch_issuance_template.csv'
  }

  const blob = new Blob([content], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.setAttribute('href', url)
  a.setAttribute('download', filename)
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)
}

const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text)
  toast.success('Copied to clipboard!')
}

// --- Registration Logic ---
const handleRegFile = (e) => {
  const file = e.target.files[0]
  if (file?.name.endsWith('.csv')) regFile.value = file
  else toast.error('CSV required')
}

const previewRegistration = async () => {
  if (!regFile.value) return
  
  try {
    const text = await regFile.value.text()
    const rows = text.split('\n').map(r => r.trim()).filter(r => r)
    const headers = rows[0].split(',').map(h => h.trim())
    
    regPreviewRecords.value = rows.slice(1).map(row => {
      const vals = row.split(',')
      const rec = {}
      headers.forEach((h, i) => rec[h] = vals[i]?.trim() || '')
      
      // Calculate generated password (mock backend logic)
      rec.generatedPassword = rec.password || `Welcome${rec.student_id_number.replace(/[^a-zA-Z0-9]/g, '')}`
      
      return rec
    })
    
    showRegConfirmModal.value = true
  } catch (err) {
    toast.error('Failed to parse CSV for preview.')
  }
}

const confirmRegistration = async () => {
  if (!regFile.value) return
  isProcessing.value = true
  showRegConfirmModal.value = false // Hide modal while processing
  
  try {
    const formData = new FormData()
    formData.append('file', regFile.value)
    
    const res = await fetch(`${API_BASE_URL}/api/batch/students`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${getToken()}` },
      body: formData
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    regResults.success = data.results.success
    regResults.failed = data.results.failed
    regResults.data = data.results.registered
    regResults.errors = data.results.errors
    regResults.show = true
    toast.success(`Successfully registered ${data.results.success} students.`)
  } catch (err) {
    toast.error(err.message)
  } finally {
    isProcessing.value = false
    regFile.value = null
    regPreviewRecords.value = []
  }
}

// --- Issuance Logic ---
const handleIssueCsv = (e) => {
  const file = e.target.files[0]
  if (file?.name.endsWith('.csv')) issueCsvFile.value = file
}

const handleIssueZip = (e) => {
  const file = e.target.files[0]
  if (file?.name.endsWith('.zip')) issueZipFile.value = file
}

/**
 * 1. Parse CSV & Unzip Images
 */
const prepareBatch = async () => {
  if (!issueCsvFile.value || !issueZipFile.value) return toast.error('Both CSV and ZIP are required')
  
  isProcessing.value = true
  progress.value = { current: 0, total: 100, status: 'Unzipping images...' }
  parsedRecords.value = []
  zipImages.value = {}

  try {
    // A. Unzip
    const zip = await JSZip.loadAsync(issueZipFile.value)
    const imagePromises = []
    
    zip.forEach((path, entry) => {
      if (!entry.dir && (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.jpeg'))) {
        imagePromises.push(
          entry.async('blob').then(blob => {
            // Store by basename (e.g. "image.png" -> blob)
            const filename = path.split('/').pop()
            zipImages.value[filename] = blob
          })
        )
      }
    })
    await Promise.all(imagePromises)
    
    // B. Parse CSV (Client-side simple parse)
    const text = await issueCsvFile.value.text()
    const rows = text.split('\n').map(r => r.trim()).filter(r => r)
    const headers = rows[0].split(',').map(h => h.trim())
    
    // Validate Headers
    const reqHeaders = ['student_id', 'title', 'image_filename']
    const missing = reqHeaders.filter(h => !headers.includes(h))
    if (missing.length) throw new Error(`Missing columns: ${missing.join(', ')}`)

    // Create Records
    rows.slice(1).forEach((row, idx) => {
      const vals = row.split(',')
      const rec = {}
      headers.forEach((h, i) => rec[h] = vals[i]?.trim())
      
      // Match Image
      const imgBlob = zipImages.value[rec.image_filename]
      
      parsedRecords.value.push({
        id: idx,
        data: rec,
        image: imgBlob,
        status: imgBlob ? 'pending' : 'error',
        message: imgBlob ? 'Ready to verify' : 'Image not found in ZIP'
      })
    })

    toast.success(`Loaded ${parsedRecords.value.length} records. Images matched: ${Object.keys(zipImages.value).length}`)
    
    // Fetch estimated gas
    try {
      const res = await fetch(`${API_BASE_URL}/api/nft/wallet-info`, {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (res.ok) {
        walletInfo.value = await res.json();
      }
    } catch (e) {
      console.warn("Could not fetch gas estimate:", e);
    }

  } catch (err) {
    console.error(err)
    toast.error(`Prep failed: ${err.message}`)
  } finally {
    isProcessing.value = false
  }
}

/**
 * 2. Run API Verify & AI Extraction
 */
const verifyBatch = async () => {
  const pending = parsedRecords.value.filter(r => r.status === 'pending')
  if (!pending.length) return
  
  isProcessing.value = true
  progress.value = { current: 0, total: pending.length, status: 'Verifying Documents via AI...' }
  
  for (let i = 0; i < pending.length; i++) {
    const rec = pending[i]
    progress.value.current = i + 1
    
    try {
      const formData = new FormData()
      formData.append('file', rec.image, rec.data.image_filename)
      formData.append('studentName', '') // Cannot be 100% sure from CSV, omit name
      formData.append('studentRoll', rec.data.student_id) // We use their student ID as roll
      
      const res = await fetch(`${API_BASE_URL}/api/ai/verify-document`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: formData
      })
      
      if (res.ok) {
        const data = await res.json()
        
        // Use Gemini generated title, dept, desc if they exist, to override the empty/bad template CSV ones
        if (data.title) rec.data.title = data.title
        if (data.department) rec.data.department = data.department
        if (data.description) rec.data.description = data.description
        
        if (data.match) {
          rec.status = 'verified'
          rec.message = 'AI Match Found ✅'
        } else {
          rec.status = 'warning'
          rec.message = 'No perfect ID match, AI extracted ✅'
        }
      } else {
        throw new Error('API request failed')
      }

    } catch (e) {
      console.error(e)
      rec.status = 'error'
      rec.message = 'AI Server Error'
    }
  }
  isProcessing.value = false
}

/**
 * 3. Issue Verified Records
 */
const issueBatch = async () => {
  const toIssue = parsedRecords.value.filter(r => r.status === 'verified' || r.status === 'warning')
  if (!toIssue.length) return
  
  isProcessing.value = true
  progress.value = { current: 0, total: toIssue.length, status: 'Minting NFTs...' }
  
  for (let i = 0; i < toIssue.length; i++) {
    const rec = toIssue[i]
    progress.value.current = i + 1
    
    try {
      const formData = new FormData()
      formData.append('file', rec.image, rec.data.image_filename)
      formData.append('recipientId', rec.data.student_id) // Assuming ID is DB index or we handle lookup backend?
      // Wait, backend expects 'recipientId' as DB ID usually. 
      // If CSV has 'student_id_number' (e.g. ST123), backend needs to look it up.
      // Let's pass it as 'studentIdNumber' if backend supports it.
      // For now, I'll pass it as recipientId and handle lookup in backend if it's not a UUID.
      
      formData.append('title', rec.data.title)
      formData.append('description', rec.data.description || 'Batch Issued')
      formData.append('department', rec.data.department || 'General')
      
      // If date is provided in CSV
      if (rec.data.issue_date) {
         // Pass as attribute? The backend controller doesn't explicit logic for custom date override yet.
         // I should add `issueDate` to body.
         formData.append('issueDate', rec.data.issue_date) 
      }

      const res = await fetch(`${API_BASE}/nft/issue`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${getToken()}` },
        body: formData
      })
      
      if (res.ok) {
        rec.status = 'success'
        rec.message = 'Issued! 🚀'
      } else {
        const d = await res.json()
        throw new Error(d.error)
      }
    } catch (err) {
      rec.status = 'error'
      rec.message = err.message
    }
  }
  isProcessing.value = false
  toast.success('Batch Processing Complete')
}

// Stats
const stats = computed(() => {
  const s = { pending: 0, verified: 0, warning: 0, success: 0, error: 0 }
  parsedRecords.value.forEach(r => s[r.status]++)
  return s
})
</script>

<template>
  <div class="batch-ops p-6">
    <!-- Tabs -->
    <div class="flex gap-4 mb-6 border-b border-gray-700 pb-2">
       <button 
         @click="activeTab = 'registration'"
         :class="activeTab === 'registration' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'"
         class="px-4 py-2 font-medium transition-colors"
       >
         Student Registration
       </button>
       <button 
         @click="activeTab = 'issuance'"
         :class="activeTab === 'issuance' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400'"
         class="px-4 py-2 font-medium transition-colors"
       >
         Batch Issuance (Beta)
       </button>
    </div>

    <!-- 1. REGISTRATION -->
    <div v-if="activeTab === 'registration'" class="animate-fade-in">
       <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
          <div class="flex justify-between items-start mb-4">
            <div>
              <h3 class="text-white font-bold mb-2">Upload Student CSV</h3>
              <p class="text-gray-400 text-sm">Required: email, full_name, student_id_number, course_name, year</p>
            </div>
            <button @click="downloadTemplate('registration')" class="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 transition flex items-center gap-1">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Download Template
            </button>
          </div>
          
          <input type="file" accept=".csv" @change="handleRegFile" class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
          
          <button 
            @click="previewRegistration"
            :disabled="!regFile || isProcessing"
            class="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50"
          >
             {{ isProcessing ? 'Registering...' : 'Review & Register' }}
          </button>

          <!-- Confirmation Modal for Registration -->
          <div v-if="showRegConfirmModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div class="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
              <div class="p-6 border-b border-gray-800 flex justify-between items-center bg-gray-900 sticky top-0">
                <h3 class="text-xl font-bold text-white">Confirm Student Registration Batch</h3>
                <button @click="showRegConfirmModal = false" class="text-gray-400 hover:text-white transition">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
              
              <div class="p-6 overflow-y-auto bg-gray-900/50">
                <p class="text-gray-300 mb-4">You are about to register <strong>{{ regPreviewRecords.length }}</strong> students. Please review the parsed data below before confirming:</p>
                <div class="overflow-x-auto rounded-xl shadow-inner max-h-[50vh] pr-2 custom-scrollbar">
                  <div class="flex flex-col gap-2">
                    <div 
                      v-for="(rec, idx) in regPreviewRecords" 
                      :key="idx" 
                      class="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden transition-all duration-200"
                    >
                      <!-- Header Rule (Click to expand) -->
                      <button 
                        @click="expandedRow = expandedRow === idx ? null : idx"
                        class="w-full flex justify-between items-center p-4 hover:bg-gray-750 focus:outline-none transition-colors"
                      >
                        <div class="flex items-center gap-4 text-left">
                          <div class="w-10 h-10 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                            {{ idx + 1 }}
                          </div>
                          <div>
                            <h4 class="text-white font-bold">{{ rec.full_name }}</h4>
                            <span class="text-xs font-mono text-gray-400">{{ rec.student_id_number }}</span>
                          </div>
                        </div>
                        <svg 
                          class="w-5 h-5 text-gray-400 transform transition-transform duration-200" 
                          :class="expandedRow === idx ? 'rotate-180' : ''"
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </button>

                      <!-- Expandable Inner Content -->
                      <div v-if="expandedRow === idx" class="p-4 bg-gray-900/50 border-t border-gray-700 animate-fade-in grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                        <div class="flex flex-col">
                          <span class="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Email</span>
                          <span class="text-gray-300 break-all">{{ rec.email }}</span>
                        </div>
                        <div class="flex flex-col">
                          <span class="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Course</span>
                          <span class="text-gray-300">{{ rec.course_name }}</span>
                        </div>
                        <div class="flex flex-col">
                          <span class="text-gray-500 text-xs uppercase tracking-wider font-bold mb-1">Graduation Year</span>
                          <span class="text-gray-300 font-mono">{{ rec.year }}</span>
                        </div>
                        <div class="flex flex-col bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
                          <span class="text-indigo-400 text-xs uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
                             <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                             Generated Password
                          </span>
                          <span class="text-indigo-200 font-mono font-bold">{{ rec.generatedPassword }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="p-6 border-t border-gray-800 bg-gray-900 flex justify-end gap-3 sticky bottom-0">
                <button @click="showRegConfirmModal = false" class="px-6 py-2.5 rounded-xl font-medium text-gray-300 hover:text-white hover:bg-gray-800 transition">
                  Cancel
                </button>
                <button @click="confirmRegistration" :disabled="isProcessing" class="px-6 py-2.5 bg-green-600 rounded-xl font-bold text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-900/20 transition transform active:scale-95 flex items-center gap-2">
                  <svg v-if="!isProcessing" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
                  <svg v-else class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path></svg>
                  {{ isProcessing ? 'Registering Batch...' : `Confirm & Register ${regPreviewRecords.length} Students` }}
                </button>
              </div>
            </div>
          </div>

          <!-- Results -->
          <div v-if="regResults.show" class="mt-6 p-4 bg-gray-900 border border-gray-700 rounded-xl overflow-hidden animate-fade-in shadow-2xl">
             <div class="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
               <h4 class="text-white font-bold flex items-center gap-2">
                 <span>✅</span> Registration Results
               </h4>
               <div class="flex gap-4 text-xs font-bold uppercase tracking-wider">
                 <span class="px-2 py-1 bg-green-500/10 text-green-400 rounded border border-green-500/20">Success: {{ regResults.success }}</span>
                 <span v-if="regResults.failed > 0" class="px-2 py-1 bg-red-500/10 text-red-400 rounded border border-red-500/20">Failed: {{ regResults.failed }}</span>
               </div>
             </div>

             <!-- Success Table -->
             <div v-if="regResults.data.length > 0" class="mb-4">
                <p class="text-gray-500 text-[10px] uppercase font-bold mb-2">Registered Accounts & Credentials</p>
                <div class="max-h-60 overflow-y-auto rounded-lg border border-gray-800 custom-scrollbar">
                  <table class="w-full text-xs text-left">
                    <thead class="bg-gray-800 text-gray-400 uppercase tracking-tighter sticky top-0">
                      <tr>
                        <th class="px-4 py-2">Student Name</th>
                        <th class="px-4 py-2">Account Email</th>
                        <th class="px-4 py-2">Temp Password</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-800 bg-gray-900/40">
                      <tr v-for="std in regResults.data" :key="std.id" class="hover:bg-gray-800/30 transition-colors">
                        <td class="px-4 py-2 text-white font-medium">{{ std.name }}</td>
                        <td class="px-4 py-2 text-gray-400 font-mono">{{ std.email }}</td>
                        <td class="px-4 py-2">
                          <div class="flex items-center gap-2">
                            <code class="text-indigo-300 font-bold bg-indigo-500/10 px-1.5 py-0.5 rounded">{{ std.tempPassword }}</code>
                            <button @click="copyToClipboard(std.tempPassword)" class="text-gray-500 hover:text-white transition" title="Copy password">
                               <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 00 2 2h10a2 2 0 00 2-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
             </div>

             <div v-if="regResults.errors.length" class="text-xs text-red-300 border-t border-gray-800 pt-3">
                <p class="font-bold mb-1 uppercase tracking-tighter">Issues Encountered:</p>
                <div v-for="(e, i) in regResults.errors" :key="i" class="mb-1 py-1 px-2 rounded bg-red-900/10 border border-red-900/20">
                   Row {{ e.row }}: {{ e.error }}
                </div>
             </div>
             <button @click="regResults.show = false" class="mt-4 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-colors">
               Dismiss Results
             </button>
          </div>
       </div>
    </div>

    <!-- 2. ISSUANCE -->
    <div v-if="activeTab === 'issuance'" class="animate-fade-in space-y-6">
       
       <!-- Setup -->
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700 relative">
             <button @click="downloadTemplate('issuance')" class="absolute top-6 right-6 text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded border border-gray-600 transition flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Template
             </button>
             <h4 class="text-purple-300 font-bold mb-3">1. Data (CSV)</h4>
             <input type="file" accept=".csv" @change="handleIssueCsv" class="w-full text-sm text-gray-400"/>
             <p class="text-xs text-gray-500 mt-2">Cols: <code>student_id, title, description, department, issue_date, image_filename</code></p>
          </div>
          <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
             <h4 class="text-yellow-300 font-bold mb-3">2. Images (ZIP)</h4>
             <input type="file" accept=".zip" @change="handleIssueZip" class="w-full text-sm text-gray-400"/>
             <p class="text-xs text-gray-500 mt-2">Contains all images referenced in CSV.</p>
          </div>
       </div>

       <!-- Actions -->
       <div class="flex gap-4">
          <button v-if="!parsedRecords.length" @click="prepareBatch" :disabled="isProcessing" class="px-6 py-3 bg-indigo-600 rounded-xl font-bold text-white hover:bg-indigo-500 disabled:opacity-50">
             {{ isProcessing ? 'Unzipping...' : 'Load Batch' }}
          </button>
          
          <template v-else>
             <button @click="verifyBatch" :disabled="isProcessing" class="px-6 py-3 bg-blue-600 rounded-xl font-bold text-white hover:bg-blue-500 disabled:opacity-50">
                🔍 Verify Docs (OCR)
             </button>
             <button @click="issueBatch" :disabled="isProcessing || (walletInfo && Number(walletInfo.balanceEth) < (parseFloat(walletInfo.estimatedCostEth) * parsedRecords.length))" class="px-6 py-3 bg-green-600 rounded-xl font-bold text-white hover:bg-green-500 disabled:opacity-50 disabled:bg-gray-600 transition-colors">
                🚀 Issue Verified
             </button>
              <button @click="parsedRecords = []" class="px-6 py-3 bg-gray-600 rounded-xl font-bold text-white hover:bg-gray-500">
                Clear
             </button>
          </template>
       </div>

       <!-- Progress Bar -->
       <div v-if="isProcessing && progress.total" class="w-full bg-gray-700 rounded-full h-4 relative overflow-hidden">
          <div class="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all duration-300" :style="{ width: (progress.current / progress.total * 100) + '%' }"></div>
          <div class="absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow">
             {{ progress.status }} ({{ progress.current }}/{{ progress.total }})
          </div>
       </div>

       <!-- Estimated Gas Cost -->
       <div v-if="walletInfo && parsedRecords.length > 0" class="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 flex justify-between items-center transition-all">
          <div class="flex items-center gap-3">
             <span class="text-blue-500 text-2xl">⛽</span>
             <div>
                <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Estimated Total Gas ({{ parsedRecords.length }} mints)</h5>
                <p class="text-sm font-bold mt-1 text-blue-800 dark:text-blue-300">
                   ~{{ (parseFloat(walletInfo.estimatedCostEth) * parsedRecords.length).toFixed(6) }} ETH
                </p>
             </div>
          </div>
          <div class="text-right">
             <p class="text-xs text-gray-500 dark:text-gray-400">Admin Balance:</p>
             <p class="text-xs font-mono font-bold mt-1" :class="Number(walletInfo.balanceEth) < (parseFloat(walletInfo.estimatedCostEth) * parsedRecords.length) ? 'text-red-500' : 'text-green-500 dark:text-green-400'">
                {{ walletInfo.balanceEth }} ETH
             </p>
             <p v-if="Number(walletInfo.balanceEth) < (parseFloat(walletInfo.estimatedCostEth) * parsedRecords.length)" class="text-xs text-red-500 mt-1 font-bold animate-pulse">Insufficient Funds</p>
          </div>
       </div>

       <!-- Review Table -->
       <div v-if="parsedRecords.length" class="bg-gray-900 rounded-xl border border-gray-700 get overflow-hidden">
          <div class="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-800">
             <h3 class="font-bold text-white">Review Queue</h3>
             <div class="flex gap-3 text-xs">
                <span class="px-2 py-1 bg-green-900/50 text-green-400 rounded">Verified: {{ stats.verified }}</span>
                <span class="px-2 py-1 bg-yellow-900/50 text-yellow-400 rounded">Warning: {{ stats.warning }}</span>
                <span class="px-2 py-1 bg-green-600 text-white rounded shadow">Issued: {{ stats.success }}</span>
             </div>
          </div>
          
          <div class="overflow-x-auto max-h-96">
             <table class="w-full text-sm text-left">
                <thead class="text-xs text-gray-400 uppercase bg-gray-800 sticky top-0">
                   <tr>
                      <th class="px-4 py-3">Student ID</th>
                      <th class="px-4 py-3">Title</th>
                      <th class="px-4 py-3">Image</th>
                      <th class="px-4 py-3">Date</th>
                      <th class="px-4 py-3">Status</th>
                   </tr>
                </thead>
                <tbody class="divide-y divide-gray-700">
                   <tr v-for="rec in parsedRecords" :key="rec.id" class="hover:bg-gray-800/50">
                      <td class="px-4 py-3 font-mono text-gray-300">{{ rec.data.student_id }}</td>
                      <td class="px-4 py-3 text-gray-300">{{ rec.data.title }}</td>
                      <td class="px-4 py-3 text-gray-400">{{ rec.data.image_filename }}</td>
                      <td class="px-4 py-3 text-gray-400">{{ rec.data.issue_date || 'Now' }}</td>
                      <td class="px-4 py-3">
                         <span :class="{
                            'text-green-400': rec.status === 'verified' || rec.status === 'success',
                            'text-yellow-400': rec.status === 'warning' || rec.status === 'pending',
                            'text-red-400': rec.status === 'error'
                         }" class="font-bold">
                            {{ rec.message }}
                         </span>
                      </td>
                   </tr>
                </tbody>
             </table>
          </div>
       </div>

    </div>
  </div>
</template>
