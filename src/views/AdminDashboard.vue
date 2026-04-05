<script setup>
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import CertificateIssuance from '../components/admincomponents/CertificateIssuance.vue'
import BatchOperations from '../components/admincomponents/BatchOperations.vue'
import { isDark, toggleTheme } from '../services/theme'
import ThemeToggle from '../components/ThemeToggle.vue'
import ParticleBackground2 from '../components/ParticleBackground2.vue'
import AudioService from '../services/audio'
import AnalyticsChart from '../components/admincomponents/AnalyticsChart.vue'
import { exportToCSV, exportToJSON } from '../services/exportService'
import { useTour } from '../composables/useTour'
import { useToast } from '../composables/useToast.js'
import { useConfirm } from '../composables/useConfirm.js'
import StatCard from '../components/admincomponents/analytics/StatCard.vue'
import IssuanceTrendChart from '../components/admincomponents/analytics/IssuanceTrendChart.vue'
import StudentsList from '../components/admincomponents/StudentsList.vue'
import CertificatesList from '../components/admincomponents/CertificatesList.vue'
import DepartmentChart from '../components/admincomponents/analytics/DepartmentChart.vue'
import StatusDonutChart from '../components/admincomponents/analytics/StatusDonutChart.vue'
import StudentFunnelChart from '../components/admincomponents/analytics/StudentFunnelChart.vue'
import HealthMonitor from '../components/admincomponents/HealthMonitor.vue'
import ApproveStudents from '../components/admincomponents/ApproveStudents.vue'
import PaginationControls from '../components/ui/PaginationControls.vue'
import { registerPasskey, getPasskeys, deletePasskey as deletePasskeyService, isPasskeySupported } from '../services/passkeyService.js'

// Demo Mode Imports
import { useDemoMode } from '../composables/useDemoMode'
import { getDemoAnalytics, getDemoAuditLogs, getDemoCertificates, getDemoStudents } from '../utils/demoDataGenerator'

const toast = useToast()
const { confirm } = useConfirm()
const tour = useTour()
const { isDemoMode, toggleDemoMode } = useDemoMode()

// Initialize router instance
const router = useRouter()

function playClick() {
  AudioService.playClick()
}

// State to track the currently selected tab in the UI
const activeTab = ref('dashboard')
const searchQuery = ref('') // Search state
// Reactive arrays to hold fetched data
const students = ref([])
const certificates = ref([])
const logs = ref([])
const logFilter = ref('all')
const pendingCount = ref(0) // Approval queue badge count

// Utility: Relative time formatter
function relativeTime(dateStr) {
  if (!dateStr) return '-'
  // Append 'Z' to force UTC parsing if not already present, so browser converts to local time
  const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`
  const date = new Date(utcDateStr)
  
  if (isNaN(date.getTime())) return dateStr

  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  
  if (diffSec < 60) return 'Just now'
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`
  
  const hrs = Math.floor(diffSec / 3600)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}

// Per-action color classes
function actionColorClass(action) {
  if (action === 'LOGIN') return 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  if (action === 'LOGIN_PASSKEY') return 'bg-teal-500/15 text-teal-400 border-teal-500/30'
  if (action.includes('REGISTER') && action.includes('PASSKEY')) return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'
  if (action.includes('REGISTER')) return 'bg-purple-500/15 text-purple-400 border-purple-500/30'
  if (action.includes('MINT') || action.includes('ISSUE')) return 'bg-green-500/15 text-green-400 border-green-500/30'
  if (action.includes('REVOKE')) return 'bg-red-500/15 text-red-400 border-red-500/30'
  if (action.includes('REINSTATE')) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  if (action.includes('DELETE_PASSKEY')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30'
  if (action.includes('PASSWORD_RESET')) return 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30'
  if (action.includes('PASSWORD')) return 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  if (action === 'LOGIN_FAILED') return 'bg-rose-500/15 text-rose-400 border-rose-500/30'
  if (action === 'ACCOUNT_LOCKED') return 'bg-red-600/15 text-red-400 border-red-600/30'
  return 'bg-gray-500/15 text-gray-400 border-gray-600/30'
}

// Filtered logs
const filteredLogs = computed(() => {
  if (logFilter.value === 'all') return logs.value
  if (logFilter.value === 'logins') return logs.value.filter(l => l.action.includes('LOGIN'))
  if (logFilter.value === 'certs') return logs.value.filter(l => l.action.includes('MINT') || l.action.includes('ISSUE') || l.action.includes('REVOKE') || l.action.includes('REINSTATE'))
  if (logFilter.value === 'passkeys') return logs.value.filter(l => l.action.includes('PASSKEY'))
  if (logFilter.value === 'system') return logs.value.filter(l => !l.action.includes('LOGIN') && !l.action.includes('MINT') && !l.action.includes('PASSKEY') && !l.action.includes('REGISTER'))
  return logs.value
})

// Pagination for Logs
const currentLogPage = ref(1)
const logsPerPage = 5

const totalLogPages = computed(() => Math.ceil(filteredLogs.value.length / logsPerPage))

const paginatedLogs = computed(() => {
  const start = (currentLogPage.value - 1) * logsPerPage
  const end = start + logsPerPage
  return filteredLogs.value.slice(start, end)
})

watch(logFilter, () => {
  currentLogPage.value = 1
})

// QR Modal state
const qrModal = reactive({
  show: false,
  loading: false,
  qrCode: null,
  tokenId: null,
  title: ''
})



// Analytics State
const analytics = ref(null)
const analyticsLoading = ref(false)
const walletInfo = ref(null)
const walletLoading = ref(false)
const walletError = ref(null)

const settingsForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const settingsState = reactive({
  loading: false,
  error: '',
  success: ''
})

// Computed properties for dashboard summary statistics
const totalStudents = computed(() => students.value.length)
const totalIssued = computed(() => certificates.value.length)

import { API_BASE_URL } from '../apiConfig'
const API_BASE = `${API_BASE_URL}/api`

/**
 * fetchDashboardData:
 * Retrieves system-wide data (students and all issued certificates) for the admin overview.
 * Requires a valid admin token.
 */
async function fetchDashboardData() {
  const token = localStorage.getItem('adminToken')
  // Security Redirect: If no admin token is found, send user to login page
  if (!token) {
    router.push('/admin-login')
    return
  }

  if (isDemoMode.value) {
    analyticsLoading.value = true
    walletLoading.value = true
    setTimeout(() => {
      // Use the refined analytics generator
      analytics.value = getDemoAnalytics()
      
      // Populate student and certificate lists for the tabs
      students.value = getDemoStudents()
      certificates.value = getDemoCertificates()
      
      // Set wallet
      walletInfo.value = {
        balanceEth: '7.45',
        network: 'sepolia',
        gasPrice: '14.2'
      }
      
      analyticsLoading.value = false
      walletLoading.value = false
      
      // Also get logs immediately
      logs.value = getDemoAuditLogs()
    }, 400)
    return
  }

  try {
    // 1. Fetch Students List
    const resStudents = await fetch(`${API_BASE}/students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resStudents.ok) students.value = await resStudents.json()

    // 1.1 Fetch Wallet Info
    walletLoading.value = true
    walletError.value = null
    try {
      const resWallet = await fetch(`${API_BASE}/nft/wallet-info`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resWallet.ok) {
        walletInfo.value = await resWallet.json()
      } else {
        const errData = await resWallet.json()
        walletError.value = errData.error || 'Connection Failed'
        // toast.error(`Wallet Error: ${walletError.value}`)
      }
    } catch (e) {
      console.error('Wallet fetch error:', e)
      walletError.value = 'Blockchain Disconnected'
    } finally {
      walletLoading.value = false
    }

    // 1.5 Fetch Analytics
    analyticsLoading.value = true
    try {
      const resAnalytics = await fetch(`${API_BASE}/admin/analytics`, {
         headers: { 'Authorization': `Bearer ${token}` }
      })
      if (resAnalytics.ok) {
        analytics.value = await resAnalytics.json()
      }
    } catch (e) {
      console.error('Analytics fetch error:', e)
    } finally {
      analyticsLoading.value = false
    }

    // 2. Fetch Global Certificate History
    const resCerts = await fetch(`${API_BASE}/certificates`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (resCerts.ok) {
      const data = await resCerts.json()
      // Process each certificate to add tokenId and isRevoked
      for (const cert of data) {
        // Robust token_id resolving (handles both array and object responses from join)
        const nftData = Array.isArray(cert.nft) ? cert.nft[0] : cert.nft;
        cert.tokenId = nftData?.token_id || cert.token_id || null
        cert.isRevoked = false
        cert.processing = false
        
        // Check revocation status
        if (cert.tokenId) {
          try {
            const verifyRes = await fetch(`${API_BASE}/verify/${cert.tokenId}`)
            if (verifyRes.ok) {
              const verifyData = await verifyRes.json()
              cert.isRevoked = verifyData.isRevoked || false
            }
          } catch (e) {
            console.error('Verify error:', e)
          }
        }
      }
      certificates.value = data
    }
    
    // 3. Fetch Activity Logs
    fetchLogs()
    
  } catch (err) {
    console.error('Data fetch error:', err)
  }
}

/**
 * Handle student edits emitted from child components
 */
function handleStudentEdits(updatedStudent) {
  const index = students.value.findIndex(s => s.id === updatedStudent.id)
  if (index !== -1) {
    // Merge the updated DB fields into the mapped UI structural fields
    students.value[index] = {
      ...students.value[index],
      name: updatedStudent.full_name,
      roll: updatedStudent.student_id_number,
      course: updatedStudent.course_name,
      year: updatedStudent.year,
      // preserve other mapped fields like wallet which aren't editable
    }
  }
}

async function fetchLogs() {
  if (isDemoMode.value) {
    logs.value = getDemoAuditLogs()
    return
  }
  const token = localStorage.getItem('adminToken')
  if (!token) return

  try {
    const res = await fetch(`${API_BASE}/admin/logs`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      logs.value = await res.json()
    }
  } catch (err) {
    console.error('Logs fetch error:', err)
  }
}


/**
 * Show QR Code modal
 */
async function showQRCode(cert) {
  qrModal.show = true
  qrModal.loading = true
  qrModal.tokenId = cert.tokenId
  qrModal.title = cert.title
  
  try {
    const res = await fetch(`${API_BASE}/verify/qr/${cert.tokenId}`)
    if (res.ok) {
      const data = await res.json()
      qrModal.qrCode = data.qrCode
    } else {
      throw new Error('Failed to generate QR')
    }
  } catch (err) {
    console.error('QR error:', err)
    toast.error('Failed to generate QR code')
    qrModal.show = false
  } finally {
    qrModal.loading = false
  }
}

/**
 * Copy verification link
 */
async function copyVerificationLink(tokenId) {
  const link = `${window.location.origin}/verify/${tokenId}`
  try {
    await navigator.clipboard.writeText(link)
    toast.info('Verification link copied!')
  } catch {
    prompt('Copy this link:', link)
  }
}

/**
 * Toggle revocation status
 */
async function toggleRevocation(cert) {
  if (!cert.tokenId) return
  
  const action = cert.isRevoked ? 'reinstate' : 'revoke'
  const confirmed = await confirm(
    `${action === 'revoke' ? 'Revoke' : 'Reinstate'} Certificate`,
    `Are you sure you want to ${action} this certificate?`,
    { danger: action === 'revoke', confirmText: action === 'revoke' ? 'Revoke' : 'Reinstate' }
  )
  
  if (!confirmed) return
  
  cert.processing = true
  
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/verify/${action}/${cert.tokenId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    if (res.ok) {
      cert.isRevoked = !cert.isRevoked
      AudioService.playSuccess()
      toast.success(`Certificate ${action}d successfully!`)
    } else {
      const data = await res.json()
      throw new Error(data.error || `Failed to ${action}`)
    }
  } catch (err) {
    console.error(`${action} error:`, err)
    AudioService.playError()
    toast.error(`Failed to ${action} certificate: ${err.message}`)
  } finally {
    cert.processing = false
  }
}

/**
 * Change Admin Password
 */
async function changeAdminPassword() {
  settingsState.error = ''
  settingsState.success = ''

  if (settingsForm.newPassword !== settingsForm.confirmPassword) {
    settingsState.error = "New passwords do not match."
    return
  }

  settingsState.loading = true
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
         oldPassword: settingsForm.oldPassword,
         newPassword: settingsForm.newPassword
      })
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to update password')
    
    settingsState.success = 'Password updated successfully'
    settingsForm.oldPassword = ''
    settingsForm.newPassword = ''
    settingsForm.confirmPassword = ''
  } catch (e) {
    settingsState.error = e.message
  } finally {
    settingsState.loading = false
  }
}

const reissueState = ref({ loading: false, error: '', success: '' })

// ── 2FA State (Admin) ─────────────────────────────────────
const twoFA = reactive({
  enabled: false,
  step: 'idle', // 'idle' | 'qr' | 'recovery'
  qrCode: '',
  secret: '',
  verifyCode: '',
  recoveryCodes: [],
  disablePassword: '',
  isLoading: false,
  error: '',
  success: ''
})

async function handleSetup2FA() {
  twoFA.isLoading = true; twoFA.error = ''
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/auth/2fa/setup`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    twoFA.secret = data.secret
    twoFA.qrCode = data.qrCode
    twoFA.step = 'qr'
  } catch (err) { twoFA.error = err.message }
  finally { twoFA.isLoading = false }
}

async function handleVerifySetup2FA() {
  twoFA.isLoading = true; twoFA.error = ''
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/auth/2fa/verify-setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ token: twoFA.verifyCode })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    // Update local state
    twoFA.recoveryCodes = data.recoveryCodes
    twoFA.step = 'recovery'
    twoFA.enabled = true
    twoFA.success = '2FA enabled!'
    
    // Update stored user object so state persists on refresh
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    adminUser.totp_enabled = true
    localStorage.setItem('adminUser', JSON.stringify(adminUser))
    
  } catch (err) { twoFA.error = err.message }
  finally { twoFA.isLoading = false }
}

async function handleDisable2FA() {
  const ok = await confirm('Disable 2FA', 'Are you sure? Your account will be less secure.', { danger: true, confirmText: 'Disable 2FA' })
  if (!ok) return
  twoFA.isLoading = true; twoFA.error = ''
  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/auth/2fa/disable`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ password: twoFA.disablePassword })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    // Update local state
    twoFA.enabled = false; twoFA.step = 'idle'; twoFA.disablePassword = ''
    twoFA.success = '2FA disabled.'
    
    // Update stored user object
    const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
    adminUser.totp_enabled = false
    localStorage.setItem('adminUser', JSON.stringify(adminUser))
    
  } catch (err) { twoFA.error = err.message }
  finally { twoFA.isLoading = false }
}

// ── Passkey State (Admin) ──────────────────────────────────
const passkeySupported = ref(false)
const adminPasskeys = ref([])
const newPasskeyName = ref('')
const passkeyLoading = ref(false)
const passkeyError = ref('')
const passkeySuccess = ref('')

async function fetchAdminPasskeys() {
  try { adminPasskeys.value = await getPasskeys() } catch (e) { console.error(e) }
}

async function handleRegisterPasskey() {
  passkeyError.value = ''; passkeySuccess.value = ''; passkeyLoading.value = true
  try {
    const name = newPasskeyName.value.trim() || 'Admin Passkey'
    await registerPasskey(name)
    passkeySuccess.value = `Passkey "${name}" registered!`
    newPasskeyName.value = ''
    await fetchAdminPasskeys()
  } catch (err) { passkeyError.value = err.message }
  finally { passkeyLoading.value = false }
}

async function handleDeletePasskey(credentialId, name) {
  const ok = await confirm('Delete Passkey', `Delete "${name || 'Passkey'}"?`, { danger: true, confirmText: 'Delete' })
  if (!ok) return
  passkeyError.value = ''; passkeySuccess.value = ''
  try {
    await deletePasskeyService(credentialId)
    passkeySuccess.value = 'Passkey deleted.'
    await fetchAdminPasskeys()
  } catch (err) { passkeyError.value = err.message }
}

function formatPasskeyDate(dateStr) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

async function reissueAllWallets() {
  reissueState.value.error = ''
  reissueState.value.success = ''

  if (!window.confirm('WARNING: This will reissue wallets for all accounts and send emails. Proceed?')) {
    return
  }
  
  reissueState.value.loading = true

  try {
    const token = localStorage.getItem('adminToken')
    const res = await fetch(`${API_BASE}/admin/reissue-wallets`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Failed to reissue wallets')
    
    reissueState.value.success = data.message || 'Wallets reissued successfully'
    toast.success(data.message || 'Wallets reissued successfully')
  } catch (e) {
    reissueState.value.error = e.message
    toast.error(e.message)
  } finally {
    reissueState.value.loading = false
  }
}

/**
 * logout:
 * Clears administrative session and redirects to the public-facing admin login page.
 */
function logout() {
  localStorage.removeItem('adminToken')
  localStorage.removeItem('adminUser')
  router.push('/admin-login')
}

// Utility: Formats date strings into a localized readable format (e.g., MM/DD/YYYY)
function formatDate(dateStr) {
  if (!dateStr) return '-'
  const utcDateStr = dateStr.endsWith('Z') ? dateStr : `${dateStr}Z`
  return new Date(utcDateStr).toLocaleDateString()
}

// Automatically fetch data when the component is mounted to the DOM
let pendingRefreshInterval = null

// Presentation Mode Tab Switcher Listener
const handleTourTabChange = (event) => {
  if (event.detail) {
    // Normalize to 'approval' if 'approvals' is passed
    const tabName = event.detail === 'approvals' ? 'approval' : event.detail
    activeTab.value = tabName
    if (tabName === 'approval') {
       fetchPendingCount()
    }
  }
}

onMounted(() => {
  fetchDashboardData()
  fetchPendingCount()
  pendingRefreshInterval = setInterval(fetchPendingCount, 60000)
  document.addEventListener('tour-change-tab', handleTourTabChange)
  // Check passkey support and load admin 2FA state
  passkeySupported.value = isPasskeySupported()
  const adminUser = JSON.parse(localStorage.getItem('adminUser') || '{}')
  twoFA.enabled = adminUser.totp_enabled || false
  if (passkeySupported.value) fetchAdminPasskeys()
})

onUnmounted(() => {
  if (pendingRefreshInterval) clearInterval(pendingRefreshInterval)
  document.removeEventListener('tour-change-tab', handleTourTabChange)
})

// Theme Helper
function setTheme(dark) {
  if (isDark.value !== dark) toggleTheme()
}

// Fetch pending approval count for sidebar badge
async function fetchPendingCount() {
  if (isDemoMode.value) {
    pendingCount.value = 8 // just a fixed number for demo
    return
  }
  try {
    const token = localStorage.getItem('adminToken')
    if (!token) return
    const res = await fetch(`${API_BASE}/admin/pending-students`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      pendingCount.value = Array.isArray(data) ? data.length : 0
    }
  } catch (e) { /* non-critical */ }
}
</script>


<template>
  <div class="relative min-h-screen bg-transparent dark:bg-transparent dark:text-white text-gray-900 flex overflow-hidden transition-colors duration-300">
    <ParticleBackground2 />
    <!-- Sidebar -->
    <aside class="w-64 glass-sidebar hidden md:flex flex-col p-6 relative z-30">
      <div class="flex items-center gap-3 mb-8">
        <div class="w-8 h-8 rounded-lg bg-indigo-600 shadow-lg shadow-indigo-500/30"></div>
        <h1 class="font-bold text-lg">Admin Panel</h1>
      </div>

      <nav class="flex-1 space-y-1 overflow-y-auto">

        <!-- Group: Overview -->
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-1">Overview</p>
        <button @click="playClick(); activeTab = 'dashboard'" :class="activeTab === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>📊</span> Dashboard
        </button>
        <button @click="playClick(); activeTab = 'health'" :class="activeTab === 'health' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>🏥</span> System Health
        </button>

        <!-- Divider -->
        <div class="my-2 border-t border-gray-200 dark:border-white/5"></div>

        <!-- Group: Students -->
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-1">Students</p>
        <button @click="playClick(); activeTab = 'approval'; fetchPendingCount()" :class="activeTab === 'approval' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>🛡️</span>
          <span class="flex-1">Approval Queue</span>
          <span v-if="pendingCount > 0" class="ml-auto text-[10px] font-bold bg-amber-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-tight">{{ pendingCount }}</span>
        </button>
        <button @click="playClick(); activeTab = 'students'" :class="activeTab === 'students' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>🎓</span> Students
        </button>

        <!-- Divider -->
        <div class="my-2 border-t border-gray-200 dark:border-white/5"></div>

        <!-- Group: Certificates -->
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-1">Certificates</p>
        <button @click="playClick(); activeTab = 'issue'" :class="activeTab === 'issue' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>✍️</span> Register Record
        </button>
        <button @click="playClick(); activeTab = 'batch'" :class="activeTab === 'batch' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>📤</span> Batch Operations
        </button>
        <button @click="playClick(); activeTab = 'records'" :class="activeTab === 'records' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>🗂️</span> Records
        </button>

        <!-- Divider -->
        <div class="my-2 border-t border-gray-200 dark:border-white/5"></div>

        <!-- Group: System -->
        <p class="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-600 px-3 mb-1">System</p>
        <button @click="playClick(); activeTab = 'logs'" :class="activeTab === 'logs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>📋</span> Activity Logs
        </button>
        <button @click="playClick(); activeTab = 'settings'" :class="activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1b2127]'" class="w-full text-left flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition-all text-sm">
          <span>⚙️</span> Settings
        </button>

      </nav>

      <button @click="logout" class="flex items-center gap-3 px-4 py-3 mt-4 text-red-500 hover:text-red-600 transition-colors bg-red-50 dark:bg-red-900/10 rounded-xl font-medium text-sm">
        <span>🚪</span> Logout
      </button>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col relative overflow-y-auto">
      <header class="flex items-center justify-between px-8 py-5 border-b border-transparent glass-header sticky top-0 z-20">
        <!-- Enhanced Header Content -->
        <div class="flex flex-col">
          <div id="tour-system-status" class="flex items-center gap-3">
            <h2 class="text-xl font-bold capitalize">{{ activeTab === 'issue' ? 'Register Record' : activeTab === 'health' ? 'System Health' : activeTab === 'approval' ? 'Approval Queue' : activeTab }}</h2>
            <div class="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
              <span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              <span class="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">All Systems Operational</span>
            </div>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 hidden sm:block">Blockchain Credential Monitoring System</p>
        </div>
        <div class="flex items-center gap-4">
          <!-- Demo Mode Toggle -->
          <button 
            @click="playClick(); toggleDemoMode(); fetchDashboardData()"
            class="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-bold transition-all duration-300"
            :class="isDemoMode ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-gray-100 dark:bg-[#1b2127] text-gray-400 border-gray-200 dark:border-gray-700/50 hover:bg-gray-200 dark:hover:bg-[#252b32] hover:text-gray-200'"
            title="Toggle mock data for presentations"
          >
            <div class="relative flex items-center justify-center w-4 h-4 rounded-full" :class="isDemoMode ? 'bg-indigo-500' : 'bg-gray-400'">
              <span v-if="isDemoMode" class="absolute w-4 h-4 rounded-full bg-indigo-500 animate-ping opacity-75"></span>
            </div>
            Demo Mode
          </button>

          <!-- Wallet Balance / Status -->
          <div class="hidden md:flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm border border-gray-200 dark:border-gray-700 shadow-inner group relative">
             <div v-if="walletLoading" class="flex items-center gap-2 text-gray-400">
                <div class="animate-spin h-3 w-3 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                <span class="text-xs font-medium">Syncing...</span>
             </div>
             
             <div v-else-if="walletError" class="flex items-center gap-2 text-red-500 group-hover:text-red-400 transition-colors">
                <span class="text-xs">⚠️</span>
                <span class="font-bold cursor-help" :title="walletError">Disconnected</span>
             </div>

             <div v-else-if="walletInfo" class="flex items-center gap-3 font-mono">
                <!-- Network Indicator -->
                <div class="flex items-center gap-1.5" title="Connected to Sepolia Testnet">
                  <span class="relative flex h-2 w-2">
                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span class="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span class="text-gray-500 dark:text-gray-400 text-xs hidden lg:inline font-sans">Connected to Sepolia</span>
                </div>
                <!-- Vertical Divider -->
                <div class="w-px h-4 bg-gray-300 dark:bg-gray-600 hidden lg:block"></div>
                <!-- Balance -->
                <span class="text-blue-600 font-bold dark:text-blue-400">{{ walletInfo.balanceEth }} ETH</span>
             </div>

             <div v-else class="text-gray-400 text-xs italic">
                Wait...
             </div>
          </div>

          <ThemeToggle />
          <button @click="fetchDashboardData" class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">↻ Refresh</button>
        </div>
      </header>

      <div class="p-8 max-w-7xl mx-auto w-full space-y-8 relative">
        <Transition name="fade-slide" mode="out-in">
          
          <!-- DASHBOARD TAB -->
          <div v-if="activeTab === 'dashboard'" key="dashboard" class="space-y-8">
          <!-- ANALYTICS GRID -->
          <div v-if="analytics" class="space-y-6">
            <!-- Row 1: Key Stats - Staggered Entry -->
            <div id="tour-stat-cards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard 
                 class="opacity-0 animate-fade-slide-up" style="animation-delay: 0.1s;"
                 label="Total Students" 
                 :value="analytics.stats.total_students" 
                 icon="👥" 
                 color="indigo" 
                 :subtext="`+${analytics.charts.student_funnel.registered} all time`"
               />
               <StatCard 
                 class="opacity-0 animate-fade-slide-up" style="animation-delay: 0.2s;"
                 label="Certificates Issued" 
                 :value="analytics.stats.total_certificates" 
                 icon="🎓" 
                 color="purple" 
                 :subtext="analytics.stats.avg_time_to_issue_days > 0 ? `~${analytics.stats.avg_time_to_issue_days} days to issue` : 'No data'"
               />
               <StatCard 
                 class="opacity-0 animate-fade-slide-up" style="animation-delay: 0.3s;"
                 label="Active Wallets" 
                 :value="analytics.stats.active_wallets" 
                 icon="🦊" 
                 color="green" 
                 :subtext="`${Math.round((analytics.stats.active_wallets / analytics.stats.total_students) * 100)}% activation`"
               />
               <StatCard 
                 class="opacity-0 animate-fade-slide-up" style="animation-delay: 0.4s;"
                 label="Revocations" 
                 :value="analytics.stats.revoked_certificates" 
                 icon="🚫" 
                 color="red" 
                 :trend="analytics.stats.total_certificates > 0 ? -Math.round((analytics.stats.revoked_certificates / analytics.stats.total_certificates) * 100) : 0"
                 subtext="Revocation Rate"
               />
            </div>

            <!-- Row 2: Trends & Health -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div class="lg:col-span-2">
                <IssuanceTrendChart :data="analytics.charts.issuance_trend" />
              </div>
              <div class="lg:col-span-1">
                <StatusDonutChart :data="analytics.charts.status_distribution" />
              </div>
            </div>

            <!-- Row 3: Demographics & Funnel -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <DepartmentChart :data="analytics.charts.department_distribution" />
               <StudentFunnelChart :data="analytics.charts.student_funnel" />
            </div>
          </div>

          <!-- Loading State (Pulse Skeleton) -->
          <div v-if="analyticsLoading" class="p-12 text-center text-gray-500 flex flex-col items-center justify-center min-h-[400px]">
             <!-- Skeleton Grid Row 1 -->
             <div class="grid grid-cols-1 md:grid-cols-4 gap-6 w-full mb-8">
               <div v-for="i in 4" :key="i" class="h-32 rounded-2xl bg-gray-200 dark:bg-[#161b22] animate-pulse-glow" :style="`animation-delay: ${i * 0.15}s;`"></div>
             </div>
             <!-- Skeleton Grid Row 2 -->
             <div class="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
               <div class="col-span-2 h-64 rounded-2xl bg-gray-200 dark:bg-[#161b22] animate-pulse-glow" style="animation-delay: 0.6s;"></div>
               <div class="col-span-1 h-64 rounded-2xl bg-gray-200 dark:bg-[#161b22] animate-pulse-glow" style="animation-delay: 0.7s;"></div>
             </div>
          </div>

        </div>

        <!-- RECORDS TAB -->
        <div v-else-if="activeTab === 'records'" key="records" class="px-4 md:px-8 py-6 w-full">
           <CertificatesList 
             :certificates="certificates" 
             v-model:searchQuery="searchQuery"
             @qr="showQRCode"
             @toggle-revocation="toggleRevocation"
           />
        </div>



        <!-- HEALTH TAB -->
        <div v-if="activeTab === 'health'" class="animate-fade-in">
          <HealthMonitor />
        </div>

        <!-- STUDENTS TAB -->
        <div v-if="activeTab === 'students'" class="animate-fade-in">
          <StudentsList :students="students" @edit-student="handleStudentEdits" />
        </div>

        <!-- APPROVAL TAB -->
        <div v-if="activeTab === 'approval'" class="animate-fade-in">
          <ApproveStudents />
        </div>

        <!-- ISSUE TAB -->
        <div v-if="activeTab === 'issue'" class="animate-fade-in">
          <CertificateIssuance />
        </div>

        <!-- BATCH OPERATIONS TAB -->
        <div v-if="activeTab === 'batch'" class="animate-fade-in">
          <BatchOperations />
        </div>

        <!-- ACTIVITY LOGS TAB -->
        <div v-if="activeTab === 'logs'" class="space-y-6 animate-fade-in">
          <div id="tour-activity-logs" class="bg-white dark:bg-[#1b2127] border border-gray-200 dark:border-[#283039] rounded-2xl overflow-hidden shadow-sm">
             <div class="px-6 py-4 border-b border-gray-200 dark:border-[#283039] flex flex-wrap justify-between items-center gap-3">
               <h3 class="font-bold text-gray-900 dark:text-white">System Activity Log</h3>
               <div class="flex items-center gap-2">
                 <!-- Filter buttons -->
                 <button v-for="f in [{key:'all',label:'All'},{key:'logins',label:'🔐 Logins'},{key:'certs',label:'📜 Certs'},{key:'passkeys',label:'🔑 Passkeys'},{key:'system',label:'⚙ System'}]" :key="f.key"
                   @click="logFilter = f.key"
                   :class="['text-xs px-2.5 py-1 rounded-lg border transition-all font-medium',
                     logFilter === f.key
                       ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40'
                       : 'bg-transparent text-gray-500 border-gray-300 dark:border-[#30363d] hover:border-gray-400 dark:hover:border-gray-500']"
                 >
                   {{ f.label }}
                 </button>
                 <button @click="fetchLogs" class="text-xs bg-gray-100 dark:bg-[#283039] hover:bg-gray-200 dark:hover:bg-[#30363d] px-3 py-1 rounded-lg transition text-gray-600 dark:text-gray-300 ml-1">↻</button>
               </div>
             </div>
             <div class="overflow-x-auto">
               <table class="w-full text-left">
                 <thead class="bg-gray-50 dark:bg-[#21262d] text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                   <tr>
                     <th class="px-6 py-3">When</th>
                     <th class="px-6 py-3">User</th>
                     <th class="px-6 py-3">Action</th>
                     <th class="px-6 py-3">Method</th>
                     <th class="px-6 py-3">Details</th>
                     <th class="px-6 py-3">IP</th>
                   </tr>
                 </thead>
                 <tbody class="divide-y divide-gray-200 dark:divide-[#283039]">
                   <tr v-for="log in paginatedLogs" :key="log.id" class="hover:bg-gray-50 dark:hover:bg-[#283039]/50 transition text-sm">
                     <td class="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap" :title="new Date(log.timestamp.endsWith('Z') ? log.timestamp : log.timestamp + 'Z').toLocaleString()">
                       {{ relativeTime(log.timestamp) }}
                     </td>
                     <td class="px-6 py-4 font-medium text-gray-900 dark:text-white text-sm">{{ log.user }}</td>
                     <td class="px-6 py-4">
                       <span :class="['px-2 py-1 rounded-md text-xs border font-mono font-semibold', actionColorClass(log.action)]">
                         {{ log.action }}
                       </span>
                     </td>
                     <td class="px-6 py-4">
                       <span v-if="log.auth_method === 'passkey'" class="inline-flex items-center gap-1 text-xs text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full font-medium">
                         🔑 Passkey
                       </span>
                       <span v-else-if="log.auth_method === 'password'" class="inline-flex items-center gap-1 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                         🔒 Password
                       </span>
                       <span v-else class="text-gray-600 text-xs">—</span>
                     </td>
                     <td class="px-6 py-4 text-gray-600 dark:text-gray-300 max-w-xs truncate text-sm" :title="log.details">{{ log.details }}</td>
                     <td class="px-6 py-4 font-mono text-gray-500 dark:text-gray-500 text-xs">{{ log.ip_address }}</td>
                   </tr>
                   <tr v-if="filteredLogs.length === 0">
                     <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                       {{ logFilter === 'all' ? 'No activity recorded yet.' : 'No matching activity for this filter.' }}
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
             <PaginationControls 
               v-model:currentPage="currentLogPage" 
               :totalPages="totalLogPages" 
             />
          </div>
        </div>

        <!-- SETTINGS TAB -->
        <div v-if="activeTab === 'settings'" class="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
           
           <!-- Appearance -->
           <div class="glass-panel rounded-2xl p-6 shadow-sm">
             <h3 class="font-bold text-gray-900 dark:text-white mb-6">🎨 Appearance</h3>
             <div class="grid grid-cols-2 gap-4">
                <button 
                @click="setTheme(false)"
                class="p-4 border rounded-xl transition-all text-center hover:bg-gray-50"
                :class="!isDark ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500/20' : 'border-gray-200 dark:border-[#30363d] text-gray-500 dark:text-gray-400'"
              >
                <div class="text-2xl mb-2">☀️</div>
                <div class="font-bold text-sm">Light Mode</div>
              </button>
              <button 
                @click="setTheme(true)"
                class="p-4 border rounded-xl transition-all text-center hover:bg-[#283039]"
                :class="isDark ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400 ring-2 ring-500/20' : 'border-gray-200 dark:border-[#30363d] text-gray-500 dark:text-gray-400'"
              >
                <div class="text-2xl mb-2">🌙</div>
                <div class="font-bold text-sm">Dark Mode</div>
              </button>
             </div>
           </div>

           <!-- Security -->
           <div class="glass-panel rounded-2xl p-6 shadow-sm">
             <h3 class="font-bold text-gray-900 dark:text-white mb-6">🔒 Security</h3>
             <form @submit.prevent="changeAdminPassword" class="space-y-4">
               <div>
                  <label class="text-xs font-bold text-gray-500 uppercase">Current Password</label>
                  <input v-model="settingsForm.oldPassword" type="password" required class="w-full mt-1 glass-input rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="••••••••" />
               </div>
               <div>
                  <label class="text-xs font-bold text-gray-500 uppercase">New Password</label>
                  <input v-model="settingsForm.newPassword" type="password" required minlength="6" class="w-full mt-1 glass-input rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="••••••••" />
               </div>
               <div>
                  <label class="text-xs font-bold text-gray-500 uppercase">Confirm Password</label>
                  <input v-model="settingsForm.confirmPassword" type="password" required minlength="6" class="w-full mt-1 bg-gray-50 dark:bg-[#0d1117] border border-gray-200 dark:border-[#30363d] rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="••••••••" />
               </div>
               
               <div v-if="settingsState.error" class="text-red-500 text-xs bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-200 dark:border-red-500/30">{{ settingsState.error }}</div>
               <div v-if="settingsState.success" class="text-green-500 text-xs bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-200 dark:border-green-500/30">{{ settingsState.success }}</div>

               <button type="submit" :disabled="settingsState.loading" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-sm transition disabled:opacity-50">
                 {{ settingsState.loading ? 'Updating...' : 'Update Password' }}
               </button>
             </form>
             
             <!-- Wallet Migration (Danger Zone) -->
             <div id="tour-settings-reissue" class="mt-8 pt-6 border-t border-gray-200 dark:border-[#30363d]">
               <h4 class="text-xs font-bold text-red-500 uppercase mb-4">Danger Zone</h4>
               <div class="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-500/30 rounded-xl">
                 <h5 class="font-bold text-red-900 dark:text-red-400 mb-2">Reissue Student Wallets (Test Only)</h5>
                 <p class="text-xs text-red-700 dark:text-red-300 mb-4">
                   Generates new wallets encrypted with a temporary key for test accounts and sends upgrade emails.
                 </p>
                 <button 
                   @click="reissueAllWallets" 
                   :disabled="reissueState.loading"
                   class="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-sm transition disabled:opacity-50"
                 >
                   {{ reissueState.loading ? 'Reissuing...' : 'Reissue Test Wallets' }}
                 </button>
                 <p v-if="reissueState.error" class="text-red-500 text-xs mt-2">{{ reissueState.error }}</p>
                 <p v-if="reissueState.success" class="text-green-500 text-xs mt-2">{{ reissueState.success }}</p>
               </div>
             </div>

           </div>

           <!-- 2FA Panel -->
           <div class="glass-panel rounded-2xl p-6 shadow-sm md:col-span-2">
             <h3 class="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">🔐 Two-Factor Authentication</h3>
             <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">Add TOTP-based 2FA for an extra layer of protection on your admin login.</p>

             <!-- Enabled state -->
             <div v-if="twoFA.enabled" class="space-y-4">
               <div class="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                 <span class="text-green-400 text-xl">✓</span>
                 <div><p class="text-green-400 font-semibold text-sm">2FA is enabled</p><p class="text-xs text-gray-500">Your admin account requires a TOTP code on each login</p></div>
               </div>
               <div class="space-y-2 max-w-sm">
                 <label class="text-xs font-bold text-gray-500 uppercase">Password to disable</label>
                 <input v-model="twoFA.disablePassword" type="password" placeholder="Current password" class="w-full mt-1 glass-input rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" />
                 <button @click="handleDisable2FA" :disabled="twoFA.isLoading || !twoFA.disablePassword" class="px-5 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition">{{ twoFA.isLoading ? 'Disabling...' : 'Disable 2FA' }}</button>
               </div>
             </div>

             <!-- Setup flow -->
             <div v-else>
               <div v-if="twoFA.step === 'idle'">
                 <button @click="handleSetup2FA" :disabled="twoFA.isLoading" class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/20 text-sm">{{ twoFA.isLoading ? 'Setting up...' : 'Enable 2FA' }}</button>
               </div>
               <div v-if="twoFA.step === 'qr'" class="space-y-4 max-w-sm">
                 <div class="bg-gray-50 dark:bg-[#0d1117] rounded-xl p-4 text-center border dark:border-[#30363d]">
                   <p class="text-xs text-gray-500 mb-3">Scan with Google Authenticator, Authy, etc.</p>
                   <img v-if="twoFA.qrCode" :src="twoFA.qrCode" alt="QR Code" class="mx-auto w-40 h-40 rounded-lg" />
                   <p class="text-xs text-gray-400 mt-2">Manual: <code class="text-indigo-400 select-all">{{ twoFA.secret }}</code></p>
                 </div>
                 <input v-model="twoFA.verifyCode" type="text" inputmode="numeric" maxlength="6" placeholder="Enter 6-digit code" class="w-full text-center font-mono text-xl tracking-widest px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none" />
                 <button @click="handleVerifySetup2FA" :disabled="twoFA.isLoading || twoFA.verifyCode.length < 6" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm">{{ twoFA.isLoading ? 'Verifying...' : 'Verify & Enable' }}</button>
               </div>
               <div v-if="twoFA.step === 'recovery'" class="space-y-3 max-w-sm">
                 <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                   <p class="text-amber-300 text-xs font-semibold">⚠ Save these recovery codes — each can only be used once.</p>
                 </div>
                 <div class="grid grid-cols-2 gap-1.5">
                   <code v-for="code in twoFA.recoveryCodes" :key="code" class="block p-2 bg-[#0d1117] border border-[#30363d] rounded text-center font-mono text-xs text-white select-all">{{ code }}</code>
                 </div>
                 <button @click="twoFA.step = 'idle'" class="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition text-sm">I've saved my codes ✓</button>
               </div>
             </div>

             <div v-if="twoFA.error" class="mt-3 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs">{{ twoFA.error }}</div>
             <div v-if="twoFA.success" class="mt-3 p-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-xs">{{ twoFA.success }}</div>
           </div>

           <!-- Passkeys Panel -->
           <div v-if="passkeySupported" class="glass-panel rounded-2xl p-6 shadow-sm md:col-span-2">
             <h3 class="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">🔑 Passkeys</h3>
             <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">Sign in with your fingerprint, face, or device PIN — no password needed.</p>

             <!-- List -->
             <div v-if="adminPasskeys.length > 0" class="space-y-2 mb-5">
               <div v-for="pk in adminPasskeys" :key="pk.id" class="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200 group hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-all">
                 <div class="flex items-center gap-3">
                   <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-sm">
                     <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                   </div>
                   <div>
                     <p class="font-medium text-sm text-gray-800 dark:text-white">{{ pk.friendly_name || 'Passkey' }}</p>
                     <p class="text-xs text-gray-400">Added {{ formatPasskeyDate(pk.created_at) }}<span v-if="pk.backed_up" class="ml-2 text-green-500">✓ Synced</span></p>
                   </div>
                 </div>
                 <button @click="handleDeletePasskey(pk.id, pk.friendly_name)" class="px-2.5 py-1 text-xs font-medium text-red-500 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-500/30 rounded-lg transition-all opacity-0 group-hover:opacity-100">Delete</button>
               </div>
             </div>
             <div v-else class="p-4 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200 text-center mb-5">
               <p class="text-sm text-gray-500">No passkeys registered yet.</p>
             </div>

             <!-- Register -->
             <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
               <input v-model="newPasskeyName" type="text" class="flex-1 w-full sm:w-auto glass-input rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="Passkey name (e.g., MacBook Touch ID)" />
               <button @click="handleRegisterPasskey" :disabled="passkeyLoading" class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm flex items-center gap-2">
                 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
                 {{ passkeyLoading ? 'Registering...' : 'Register Passkey' }}
               </button>
             </div>
             <div v-if="passkeyError" class="mt-3 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs">⚠️ {{ passkeyError }}</div>
             <div v-if="passkeySuccess" class="mt-3 p-2 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-xs">✅ {{ passkeySuccess }}</div>
           </div>
           
           <!-- Platform Demo -->
           <div class="glass-panel rounded-2xl p-6 shadow-sm md:col-span-2">
             <h3 class="font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
               🖥️ Platform Tour
             </h3>
             <p class="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-2xl">
               Run the interactive platform demo to see a guided walkthrough of the system's core features. This is useful for onboarding new administrators.
             </p>
             <button 
                @click="tour.startTour()"
               class="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 text-sm transition-all hover:-translate-y-0.5"
             >
               Start Interactive Demo
             </button>
           </div>
        </div>
        </Transition>

      </div>
    </main>

    <!-- QR Modal -->
    <div v-if="qrModal.show" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" @click.self="qrModal.show = false">
      <div class="bg-white dark:bg-[#1b2127] p-6 rounded-xl border border-gray-200 dark:border-gray-700 max-w-sm w-full shadow-2xl">
        <h3 class="text-gray-900 dark:text-white text-lg font-bold mb-4 text-center">Inspection QR Code</h3>
        <div v-if="qrModal.loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
        <div v-else>
          <a :href="`/verify/${qrModal.tokenId}`" target="_blank" class="block">
            <img v-if="qrModal.qrCode" :src="qrModal.qrCode" alt="QR Code" class="mx-auto rounded-lg mb-2 hover:opacity-90" />
          </a>
          <p class="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">Token #{{ qrModal.tokenId }} - {{ qrModal.title }}</p>
          <div class="space-y-2">
            <a 
              :href="`/verify/${qrModal.tokenId}`"
              target="_blank"
              class="w-full px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2"
            >
              🔗 Open Inspection Page
            </a>
            <button 
              @click="copyVerificationLink(qrModal.tokenId)"
              class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm"
            >
              📋 Copy Link
            </button>
            <button 
              @click="qrModal.show = false"
              class="w-full px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
