<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
    <AppHeader />

    <div class="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <!-- Background -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100"></div>
        <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100"></div>
      </div>

      <div class="relative z-10 w-full max-w-md px-4">
        <div class="auth-card">
          <div class="text-center mb-6">
            <div class="w-16 h-16 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-4">
              <span class="text-3xl">🔐</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Two-Factor Authentication</h1>
            <p class="text-gray-500 dark:text-gray-400 text-sm mt-2">Enter the 6-digit code from your authenticator app</p>
          </div>

          <!-- TOTP Code Input -->
          <div v-if="!useRecovery" class="space-y-6">
            <div class="flex justify-center gap-2">
              <input
                v-for="(_, i) in 6"
                :key="i"
                :ref="el => { if (el) digitRefs[i] = el }"
                type="text"
                inputmode="numeric"
                maxlength="1"
                class="digit-input"
                @input="handleDigitInput(i, $event)"
                @keydown="handleKeydown(i, $event)"
                @paste="handlePaste($event)"
              />
            </div>

            <button
              @click="submitCode"
              :disabled="isLoading || digits.join('').length < 6"
              class="btn-primary w-full"
            >
              {{ isLoading ? 'Verifying...' : 'Verify Code' }}
            </button>

            <button
              @click="useRecovery = true"
              class="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-400 transition-colors text-center"
            >
              Use a recovery code instead
            </button>
          </div>

          <!-- Recovery Code Input -->
          <div v-else class="space-y-6">
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Recovery Code</label>
              <input
                v-model="recoveryCode"
                type="text"
                placeholder="e.g. A1B2C3D4"
                class="input-field text-center font-mono tracking-widest uppercase"
              />
            </div>

            <button
              @click="submitRecovery"
              :disabled="isLoading || !recoveryCode.trim()"
              class="btn-primary w-full"
            >
              {{ isLoading ? 'Verifying...' : 'Use Recovery Code' }}
            </button>

            <button
              @click="useRecovery = false"
              class="w-full text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-400 transition-colors text-center"
            >
              ← Back to authenticator code
            </button>
          </div>

          <!-- Error -->
          <div v-if="errorMessage" class="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 text-sm text-center">
            {{ errorMessage }}
          </div>

          <div class="mt-6 text-center">
            <router-link to="/login" class="text-xs text-gray-500 hover:text-gray-400 transition-colors">
              Cancel and return to login
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import { API_BASE_URL } from '../apiConfig'

const API_BASE = `${API_BASE_URL}/api/auth`

const router = useRouter()
const route = useRoute()

const digits = ref(['', '', '', '', '', ''])
const digitRefs = ref([])
const useRecovery = ref(false)
const recoveryCode = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

// The tempToken is passed via query param or sessionStorage
const tempToken = ref('')
const csrfToken = ref('')

onMounted(async () => {
  tempToken.value = sessionStorage.getItem('2fa_temp_token') || ''
  if (!tempToken.value) {
    router.push('/login')
  }

  // Fetch CSRF token for 2FA validation
  try {
    const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include'
    })
    const data = await res.json()
    csrfToken.value = data.csrfToken
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err)
  }

  // Focus first digit
  if (digitRefs.value[0]) digitRefs.value[0].focus()
})

function handleDigitInput(index, event) {
  const val = event.target.value.replace(/\D/g, '')
  digits.value[index] = val
  event.target.value = val

  // Auto-advance to next
  if (val && index < 5) {
    digitRefs.value[index + 1]?.focus()
  }

  // Auto-submit when all filled
  if (digits.value.every(d => d) && digits.value.join('').length === 6) {
    submitCode()
  }
}

function handleKeydown(index, event) {
  if (event.key === 'Backspace' && !digits.value[index] && index > 0) {
    digitRefs.value[index - 1]?.focus()
  }
}

function handlePaste(event) {
  event.preventDefault()
  const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
  for (let i = 0; i < 6; i++) {
    digits.value[i] = pasted[i] || ''
    if (digitRefs.value[i]) digitRefs.value[i].value = pasted[i] || ''
  }
  if (pasted.length === 6) submitCode()
}

async function submitCode() {
  const code = digits.value.join('')
  if (code.length !== 6) return
  await validate({ code })
}

async function submitRecovery() {
  if (!recoveryCode.value.trim()) return
  await validate({ recoveryCode: recoveryCode.value.trim() })
}

async function validate(body) {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch(`${API_BASE}/2fa/validate`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken.value
      },
      credentials: 'include',
      body: JSON.stringify({
        tempToken: tempToken.value,
        ...body
      })
    })

    const data = await res.json()

    if (res.ok) {
      // Store real auth data
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      sessionStorage.removeItem('2fa_temp_token')

      // 1. Check for student-specific PIN setup (not for admins)
      const isStudent = data.user.role !== 'admin'
      const needsPin = isStudent && data.user.has_passkeys && !data.user.wallet_pin_set;

      if (needsPin) {
        router.push('/passkey-setup')
      } else if (data.user.role === 'admin') {
        router.push('/admin-dashboard')
      } else {
        router.push('/student-dashboard')
      }
    } else {
      throw new Error(data.error || 'Verification failed')
    }
  } catch (err) {
    errorMessage.value = err.message
    // Reset digits on error
    digits.value = ['', '', '', '', '', '']
    if (digitRefs.value[0]) digitRefs.value[0].focus()
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-card {
  @apply bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 p-8 transition-all duration-300;
}

.digit-input {
  @apply w-12 h-14 text-center text-2xl font-mono font-bold rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all;
}

.input-field {
  @apply w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all;
}

.btn-primary {
  @apply py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors;
}
</style>
