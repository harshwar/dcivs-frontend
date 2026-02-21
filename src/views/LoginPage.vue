<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
    <AppHeader />
    
    <div class="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <!-- Background Decorations (Dark Mode Only) -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
        <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
      </div>

      <!-- Login Card -->
      <div class="relative z-10 w-full max-w-md px-4">
        <div class="auth-card" data-particle-target="frame">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2 transition-colors" data-particle-target="detail">Student Login</h1>
          <p class="text-gray-600 dark:text-gray-400 text-center mb-8 transition-colors">Access your academic wallet</p>

          <form @submit.prevent="handleLogin" class="space-y-6">
            
            <!-- Email -->
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Email</label>
              <input
                v-model="email"
                type="email"
                required
                class="input-field"
                placeholder="student@university.edu"
                data-particle-target="detail"
              />
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors">Password</label>
              <input
                v-model="password"
                type="password"
                required
                class="input-field"
                placeholder="••••••••"
                data-particle-target="detail"
              />
            </div>

            <!-- Action -->
            <button
              type="submit"
              :disabled="isLoading || isPasskeyLoading"
              class="btn-primary w-full"
              data-particle-target="detail"
            >
              {{ isLoading ? 'Logging in...' : 'Sign In' }}
            </button>
          </form>

          <!-- Passkey Divider -->
          <div v-if="passkeySupported" class="relative my-6">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200 dark:border-white/10"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-4 bg-white dark:bg-transparent text-gray-400 dark:text-gray-500 text-xs uppercase tracking-wider">or</span>
            </div>
          </div>

          <!-- Passkey Login Button -->
          <button
            v-if="passkeySupported"
            @click="handlePasskeyLogin"
            :disabled="isPasskeyLoading || isLoading"
            class="passkey-btn w-full group"
          >
            <div class="flex items-center justify-center gap-3">
              <svg class="w-5 h-5 text-indigo-500 dark:text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
              </svg>
              <span>{{ isPasskeyLoading ? 'Authenticating...' : 'Sign in with Passkey' }}</span>
            </div>
          </button>

          <!-- Footer -->
          <div class="mt-6 text-center">
               <p class="text-sm text-gray-600 dark:text-gray-400 transition-colors">
                 Don't have an account? 
                 <router-link to="/register" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-medium">Register</router-link>
               </p>
               <p class="mt-2">
                 <router-link to="/forgot-password" class="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors font-medium">
                   Forgot your password?
                 </router-link>
               </p>
               <p class="mt-1">
                 <router-link to="/view-gallery" class="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                   Public Gallery Search
                 </router-link>
               </p>
          </div>

          <!-- Lockout Warning -->
          <div v-if="isLockedOut" class="mt-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
            <div class="text-amber-400 text-3xl font-mono font-bold mb-1">🔒 {{ lockoutCountdown }}</div>
            <p class="text-amber-300 text-sm font-medium">Account temporarily locked</p>
            <p class="text-amber-400/60 text-xs mt-1">Too many failed attempts. Please wait.</p>
          </div>

          <!-- Attempts Warning -->
          <div v-else-if="attemptsRemaining !== null && attemptsRemaining <= 3 && attemptsRemaining > 0" 
            class="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-sm text-center">
            ⚠ {{ attemptsRemaining }} attempt{{ attemptsRemaining !== 1 ? 's' : '' }} remaining before lockout
          </div>

          <!-- Error Message -->
          <div v-if="errorMessage && !isLockedOut" class="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 text-sm text-center transition-colors">
            {{ errorMessage }}
          </div>

          <!-- Success Message -->
          <div v-if="successMessage" class="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-200 text-sm text-center transition-colors">
            {{ successMessage }}
          </div>

          <!-- Pending/Identity Blocking State -->
          <div v-if="pendingState" class="mt-6 p-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/5 transition-all animate-fade-in">
            <div class="flex flex-col items-center text-center">
              <div class="text-3xl mb-3">
                <span v-if="pendingState.code === 'PENDING_EMAIL'">✉️</span>
                <span v-else-if="pendingState.code === 'PENDING_APPROVAL'">🕰️</span>
                <span v-else-if="pendingState.code === 'REJECTED'">❌</span>
              </div>
              <h3 class="font-bold text-gray-900 dark:text-white mb-1">
                {{ pendingState.code === 'PENDING_EMAIL' ? 'Verify Your Email' : pendingState.code === 'PENDING_APPROVAL' ? 'Identity Under Review' : 'Account Rejected' }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                {{ pendingState.message }}
              </p>
              <button @click="pendingState = null" class="text-xs font-bold text-indigo-500 hover:text-indigo-400 underline uppercase tracking-widest">
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import { loginWithPasskey, isPasskeySupported } from '../services/passkeyService.js'
import { API_BASE_URL } from '../apiConfig'

const router = useRouter()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const isPasskeyLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')
const pendingState = ref(null) // { code, message }
const csrfToken = ref('')
const passkeySupported = ref(false)

// Lockout state
const attemptsRemaining = ref(null)
const lockoutEndTime = ref(null)
const lockoutCountdown = ref('')
let lockoutTimer = null

const isLockedOut = computed(() => lockoutEndTime.value && lockoutEndTime.value > Date.now())

function startLockoutTimer(remainingMs) {
  lockoutEndTime.value = Date.now() + remainingMs
  updateCountdown()
  lockoutTimer = setInterval(() => {
    updateCountdown()
    if (lockoutEndTime.value <= Date.now()) {
      clearInterval(lockoutTimer)
      lockoutTimer = null
      lockoutEndTime.value = null
      lockoutCountdown.value = ''
      errorMessage.value = ''
      attemptsRemaining.value = null
    }
  }, 1000)
}

function updateCountdown() {
  const remaining = Math.max(0, lockoutEndTime.value - Date.now())
  const min = Math.floor(remaining / 60000)
  const sec = Math.floor((remaining % 60000) / 1000)
  lockoutCountdown.value = `${min}:${sec.toString().padStart(2, '0')}`
}

onBeforeUnmount(() => { if (lockoutTimer) clearInterval(lockoutTimer) })

// Check passkey support and fetch CSRF token on mount
onMounted(async () => {
  passkeySupported.value = isPasskeySupported()
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include'
    })
    const data = await res.json()
    csrfToken.value = data.csrfToken
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err)
  }
})

async function handleLogin() {
  if (isLockedOut.value) return
  isLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  attemptsRemaining.value = null

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken.value
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    })

    const data = await res.json()

    if (res.ok) {
      // 2FA required — redirect to challenge page
      if (data.requires2FA) {
        sessionStorage.setItem('2fa_temp_token', data.tempToken)
        router.push('/2fa-challenge')
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      const needsPin = data.user.has_passkeys && !data.user.wallet_pin_set;
      if (needsPin) {
        router.push('/passkey-setup');
      } else {
        router.push('/student-dashboard');
      }
    } else {
      // Handle pending/rejected states
      if (res.status === 403 && data.code) {
        pendingState.value = { code: data.code, message: data.message }
        return
      }

      // Handle lockout response
      if (data.locked && data.remainingMs) {
        startLockoutTimer(data.remainingMs)
      }
      // Show remaining attempts warning
      if (data.attemptsRemaining !== undefined) {
        attemptsRemaining.value = data.attemptsRemaining
      }
      throw new Error(data.error || 'Login failed')
    }
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}

async function handlePasskeyLogin() {
  isPasskeyLoading.value = true
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const result = await loginWithPasskey()
    
    // 1. Handle 2FA requirement
    if (result.requires2FA) {
      sessionStorage.setItem('2fa_temp_token', result.tempToken)
      router.push('/2fa-challenge')
      return
    }

    // 2. Store auth data (same as password login)
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))

    successMessage.value = 'Authenticated with passkey!'

    // 3. Check if PIN setup is needed
    const needsPin = result.user.has_passkeys && !result.user.wallet_pin_set;

    // Brief pause to show success, then redirect
    setTimeout(() => {
      if (needsPin) {
        router.push('/passkey-setup');
      } else {
        router.push('/student-dashboard');
      }
    }, 500)
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isPasskeyLoading.value = false
  }
}
</script>

<style scoped>
.auth-card {
  @apply bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 p-6 md:p-8 transition-all duration-300;
}

.input-field {
  @apply w-full bg-white dark:bg-transparent border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all;
}

.btn-primary {
  @apply bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed;
}

.passkey-btn {
  @apply bg-white dark:bg-white/5 border-2 border-gray-200 dark:border-white/10 hover:border-indigo-400 dark:hover:border-indigo-500/50 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed;
  @apply hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:shadow-md;
}
</style>
