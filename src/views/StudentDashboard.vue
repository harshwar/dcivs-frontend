<template>
  <div class="h-full flex flex-col">
    <header class="flex items-center justify-between px-4 md:px-8 py-5 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-5 border-b border-transparent glass-header transition-colors duration-300">
      <!-- Time-based greeting (Feature 9) -->
      <div>
        <h2 class="text-xl font-bold text-gray-800 dark:text-white transition-colors">{{ greeting }}, {{ student.full_name?.split(' ')[0] || 'Student' }} {{ greetingEmoji }}</h2>
        <p class="text-xs text-gray-400 mt-0.5">{{ todayStr }}</p>
      </div>
      <div class="flex items-center gap-4">
        <ThemeToggle />
        <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md flex items-center justify-center text-white font-bold text-sm">
          {{ initials }}
        </div>
      </div>
    </header>

    <div class="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1">

      <!-- Profile + Academic Details -->
      <section class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div v-if="loading" class="lg:col-span-2 p-6 glass-panel rounded-2xl flex items-center gap-6">
          <SkeletonCard type="profile" class="w-full" />
        </div>
        <div v-else class="lg:col-span-2 p-6 glass-panel rounded-2xl flex items-center gap-6 transition-all duration-300">
          <div class="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold shadow-lg shadow-indigo-500/20 shrink-0">
            {{ initials }}
          </div>
          <div class="min-w-0">
            <h3 class="text-2xl font-bold text-gray-900 dark:text-white truncate transition-colors">{{ student.full_name || 'Loading...' }}</h3>
            <p class="text-gray-500 dark:text-gray-400 mt-1 text-sm truncate transition-colors">{{ student.email }}</p>
            <div class="flex flex-wrap gap-2 mt-3">
              <span class="px-3 py-1 rounded-full bg-indigo-50 dark:bg-[#283039] text-xs font-mono text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30 font-medium">
                ID: {{ student.student_id_number || '---' }}
              </span>
              <span class="px-3 py-1 rounded-full bg-emerald-50 dark:bg-[#283039] text-xs text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-medium">
                ✅ Active Student
              </span>
            </div>
          </div>
        </div>

        <div v-if="loading" class="p-6 glass-panel rounded-2xl">
          <SkeletonCard type="text" />
        </div>
        <div v-else class="p-6 glass-panel rounded-2xl flex flex-col justify-center transition-all duration-300">
          <h4 class="text-gray-400 text-xs font-bold uppercase tracking-wider mb-4">Academic Details</h4>
          <div class="space-y-3">
            <div class="flex justify-between border-b border-gray-100 dark:border-[#283039] pb-2">
              <span class="text-gray-500 dark:text-gray-400 text-sm">Course</span>
              <span class="font-semibold text-gray-900 dark:text-white text-sm">{{ student.course_name || '---' }}</span>
            </div>
            <div class="flex justify-between border-b border-gray-100 dark:border-[#283039] pb-2">
              <span class="text-gray-500 dark:text-gray-400 text-sm">Year</span>
              <span class="font-semibold text-gray-900 dark:text-white text-sm">{{ student.year || '---' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-500 dark:text-gray-400 text-sm">Semester</span>
              <span class="font-semibold text-gray-900 dark:text-white text-sm">Current</span>
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Stats Row (Feature 5) -->
      <section class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <!-- Total Certificates -->
        <div class="glass-panel rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-indigo-400/30 border border-transparent">
          <div class="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-2xl shrink-0">🏆</div>
          <div>
            <p class="text-2xl font-black text-gray-900 dark:text-white">{{ certCount ?? '—' }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Certificates Earned</p>
          </div>
        </div>
        <!-- Member Since -->
        <div class="glass-panel rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-purple-400/30 border border-transparent">
          <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl shrink-0">📅</div>
          <div>
            <p class="text-lg font-black text-gray-900 dark:text-white leading-tight">{{ memberSince }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Member Since</p>
          </div>
        </div>
        <!-- Security Score -->
        <div class="glass-panel rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-amber-400/30 border border-transparent">
          <div class="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-2xl shrink-0">🔐</div>
          <div>
            <div class="flex items-center gap-1 mt-0.5">
              <span v-for="i in 3" :key="i" class="text-lg" :class="i <= securityScore ? 'opacity-100' : 'opacity-20'">⭐</span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">Security Score ({{ securityScore }}/3)</p>
          </div>
        </div>
      </section>

      <!-- Wallet Widget (Feature 8) + Security Checklist (Feature 6) -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <!-- Wallet Status Widget -->
        <div class="glass-panel rounded-2xl p-6 border border-transparent transition-all">
          <h4 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">🔗 Blockchain Wallet</h4>
          <div v-if="student.ethereum_address" class="space-y-4">
            <div class="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50 animate-pulse shrink-0"></div>
              <p class="text-emerald-700 dark:text-emerald-400 text-sm font-semibold">Wallet Active</p>
            </div>
            <div class="p-3 bg-gray-50 dark:bg-[#0d1117] rounded-xl border border-gray-200 dark:border-[#283039]">
              <p class="text-xs text-gray-400 mb-1 font-medium uppercase tracking-wider">Public Address</p>
              <p class="font-mono text-sm text-gray-700 dark:text-gray-300 truncate" :title="student.ethereum_address">
                {{ student.ethereum_address }}
              </p>
            </div>
            <button @click="$router.push('/student/wallet')" class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-sm">
              🎓 View My Achievements →
            </button>
          </div>
          <div v-else class="space-y-4">
            <div class="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl">
              <div class="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0"></div>
              <p class="text-amber-700 dark:text-amber-400 text-sm font-semibold">Wallet Not Set Up</p>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Your blockchain wallet will be created by the administration once your account is approved.</p>
            <button @click="$router.push('/student/wallet')" class="w-full py-3 bg-gray-100 dark:bg-[#1b2127] hover:bg-gray-200 dark:hover:bg-[#283039] text-gray-700 dark:text-gray-300 font-semibold rounded-xl transition-all text-sm border border-gray-200 dark:border-[#283039]">
              Learn About Your Wallet →
            </button>
          </div>
        </div>

        <!-- Security Checklist (Feature 6) -->
        <div class="glass-panel rounded-2xl p-6 border border-transparent transition-all">
          <h4 class="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">🛡️ Account Security</h4>
          <div class="space-y-2.5">
            <div v-for="item in securityChecklist" :key="item.label"
              class="flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:border-indigo-400/30"
              :class="item.done ? 'bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20' : 'bg-gray-50 dark:bg-[#1b2127]/50 border-gray-200 dark:border-[#283039]'"
              @click="item.link && $router.push(item.link)"
            >
              <span class="text-lg shrink-0">{{ item.done ? '✅' : '⬜' }}</span>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ item.label }}</p>
                <p class="text-xs text-gray-400 truncate">{{ item.desc }}</p>
              </div>
              <span v-if="!item.done && item.link" class="text-indigo-500 text-xs font-medium shrink-0">Fix →</span>
            </div>
          </div>
        </div>

      </section>

      <!-- Quick Actions -->
      <section>
        <h3 class="text-lg font-bold mb-4 text-gray-800 dark:text-white transition-colors">Quick Actions</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <button @click="$router.push('/student/wallet')" class="group p-5 glass-card rounded-2xl text-left transition-all hover:border-indigo-400/40 border border-transparent">
            <div class="w-11 h-11 rounded-xl bg-indigo-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-indigo-500/30 text-xl">📜</div>
            <h4 class="font-bold text-gray-900 dark:text-white text-sm">View Achievements</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Unlock & browse your certificates.</p>
          </button>
          <button @click="$router.push('/student/settings')" class="group p-5 glass-card rounded-2xl text-left transition-all hover:border-purple-400/40 border border-transparent">
            <div class="w-11 h-11 rounded-xl bg-purple-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30 text-xl">⚙️</div>
            <h4 class="font-bold text-gray-900 dark:text-white text-sm">Settings</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Password, 2FA, passkeys & theme.</p>
          </button>
          <button @click="$router.push('/verify')" class="group p-5 glass-card rounded-2xl text-left transition-all hover:border-sky-400/40 border border-transparent">
            <div class="w-11 h-11 rounded-xl bg-sky-500 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-sky-500/30 text-xl">🔍</div>
            <h4 class="font-bold text-gray-900 dark:text-white text-sm">Verify a Certificate</h4>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Check any certificate's authenticity.</p>
          </button>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import ThemeToggle from '../components/ThemeToggle.vue'
import SkeletonCard from '../components/ui/SkeletonCard.vue'
import { API_BASE_URL } from '../apiConfig'

const API_BASE = `${API_BASE_URL}/api`

const router = useRouter()
const student = ref({})
const loading = ref(true)
const certCount = ref(null)

// --- Greeting (Feature 9) ---
const now = new Date()
const hour = now.getHours()
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
const greetingEmoji = hour < 12 ? '🌅' : hour < 17 ? '☀️' : '🌙'
const todayStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

// --- Computed ---
const initials = computed(() => {
  const name = student.value.full_name || ''
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?'
})

const memberSince = computed(() => {
  const d = student.value.created_at
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
})

// Security score: 1 point each for wallet_pin_set, totp_enabled, has_passkeys
const securityScore = computed(() => {
  let score = 0
  if (student.value.wallet_pin_set) score++
  if (student.value.totp_enabled) score++
  if (student.value.has_passkeys) score++
  return score
})

const securityChecklist = computed(() => [
  {
    label: 'Email Verified',
    desc: 'Your account email is confirmed.',
    done: student.value.is_verified,
    link: null
  },
  {
    label: 'Wallet Set Up',
    desc: 'Blockchain wallet is active.',
    done: !!student.value.ethereum_address,
    link: '/student/wallet'
  },
  {
    label: 'Wallet PIN Enabled',
    desc: 'Faster & more secure wallet access.',
    done: student.value.wallet_pin_set,
    link: '/passkey-setup'
  },
  {
    label: 'Two-Factor Authentication',
    desc: 'Extra login protection with TOTP.',
    done: student.value.totp_enabled,
    link: '/student/settings'
  },
  {
    label: 'Passkey Registered',
    desc: 'Sign in with fingerprint or face.',
    done: student.value.has_passkeys,
    link: '/student/settings'
  }
])

// --- Data Fetching ---
async function fetchProfile() {
  const token = localStorage.getItem('token')
  if (!token) { router.push('/login'); return }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      student.value = await res.json()
    } else {
      localStorage.removeItem('token')
      router.push('/login')
    }
  } catch (err) {
    console.error('Profile fetch error:', err)
  } finally {
    loading.value = false
  }
}

async function fetchCertCount() {
  const token = localStorage.getItem('token')
  if (!token) return
  try {
    const res = await fetch(`${API_BASE}/wallet/assets`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (res.ok) {
      const data = await res.json()
      certCount.value = (data.assets || []).length
    }
  } catch { /* non-critical */ }
}

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

onMounted(() => {
  fetchProfile()
  fetchCertCount()
})
</script>
