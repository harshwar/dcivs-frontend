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

// Issuance State
const issueCsvFile = ref(null)
const issueZipFile = ref(null)
const parsedRecords = ref([]) // { data: row, image: blob, status: 'pending'|'verified'|'mismatch', message: '' }
const zipImages = ref({}) // filename -> blob

// --- Helpers ---
const getToken = () => localStorage.getItem('authToken')

// --- Registration Logic ---
const handleRegFile = (e) => {
  const file = e.target.files[0]
  if (file?.name.endsWith('.csv')) regFile.value = file
  else toast.error('CSV required')
}

const processRegistration = async () => {
  if (!regFile.value) return
  isProcessing.value = true
  
  try {
    const formData = new FormData()
    formData.append('file', regFile.value)
    
    const res = await fetch(`${API_BASE}/batch/students`, {
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
  } catch (err) {
    toast.error(err.message)
  } finally {
    isProcessing.value = false
    regFile.value = null
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

  } catch (err) {
    console.error(err)
    toast.error(`Prep failed: ${err.message}`)
  } finally {
    isProcessing.value = false
  }
}

/**
 * 2. Run OCR Check
 */
const verifyBatch = async () => {
  const pending = parsedRecords.value.filter(r => r.status === 'pending')
  if (!pending.length) return
  
  isProcessing.value = true
  progress.value = { current: 0, total: pending.length, status: 'Verifying Documents...' }
  
  for (let i = 0; i < pending.length; i++) {
    const rec = pending[i]
    progress.value.current = i + 1
    
    try {
      const { data: { text } } = await Tesseract.recognize(rec.image, 'eng')
      const lowerText = text.toLowerCase()
      
      // Simple verify: Check if Student ID is inside text
      if (lowerText.includes(rec.data.student_id.toLowerCase())) {
        rec.status = 'verified'
        rec.message = 'Match Confirmed ✅'
      } else {
        rec.status = 'warning'
        rec.message = 'Possible Mismatch (ID not found) ⚠️'
      }
    } catch (e) {
      rec.status = 'warning'
      rec.message = 'OCR Failed (Manual Review)'
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
          <h3 class="text-white font-bold mb-2">Upload Student CSV</h3>
          <p class="text-gray-400 text-sm mb-4">Required: email, full_name, student_id_number, course_name, year</p>
          
          <input type="file" accept=".csv" @change="handleRegFile" class="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"/>
          
          <button 
            @click="processRegistration"
            :disabled="!regFile || isProcessing"
            class="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50"
          >
             {{ isProcessing ? 'Registering...' : 'Upload & Register' }}
          </button>

          <!-- Results -->
          <div v-if="regResults.show" class="mt-6 p-4 bg-gray-900 rounded-lg">
             <div class="flex gap-4 text-sm font-bold">
               <span class="text-green-400">Success: {{ regResults.success }}</span>
               <span class="text-red-400">Failed: {{ regResults.failed }}</span>
             </div>
             <div v-if="regResults.errors.length" class="mt-2 text-xs text-red-300 max-h-32 overflow-y-auto">
                <div v-for="(e, i) in regResults.errors" :key="i">{{ e.error }} (Row {{ e.row }})</div>
             </div>
          </div>
       </div>
    </div>

    <!-- 2. ISSUANCE -->
    <div v-if="activeTab === 'issuance'" class="animate-fade-in space-y-6">
       
       <!-- Setup -->
       <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-gray-800/50 p-6 rounded-xl border border-gray-700">
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
             <button @click="issueBatch" :disabled="isProcessing" class="px-6 py-3 bg-green-600 rounded-xl font-bold text-white hover:bg-green-500 disabled:opacity-50">
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
