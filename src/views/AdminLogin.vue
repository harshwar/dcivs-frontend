<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
    <AppHeader />
    
    <div class="relative min-h-screen w-full flex items-center justify-center overflow-x-hidden pt-20">
      <!-- CONTENT -->
      <div class="relative z-10 w-full max-w-sm px-4">
        <div class="card mx-auto w-full overflow-hidden" data-particle-target="frame">
          <!-- HEADER -->
          <div class="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-white/10 bg-transparent text-center transition-colors">
            <div class="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
              <span class="text-2xl">🏛️</span>
            </div>
            <h1 class="text-xl font-semibold text-gray-900 dark:text-slate-50 transition-colors">
              Institution Login
            </h1>
            <p class="text-xs text-gray-500 dark:text-slate-300 mt-1 transition-colors">
              Registry administrator access
            </p>
          </div>

          <!-- FORM -->
          <form
             id="tour-login-form"
            @submit.prevent="handleAdminLogin"
            class="px-6 py-5 space-y-5"
          >
            <!-- Email -->
            <label class="field-label">
              <span class="field-title">Email</span>
              <input
                v-model="email"
                type="email"
                required
                class="input-base"
                placeholder="admin@institution.edu"
              />
            </label>

            <!-- Password -->
            <label class="field-label">
              <span class="field-title">Password</span>
              <div class="relative">
                <input
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  required
                  class="input-base pr-11 w-full"
                  placeholder="Enter password"
                />
                <button type="button" @click.prevent="showPassword = !showPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors focus:outline-none" tabindex="-1">
                  <svg v-if="!showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                  <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                </button>
              </div>
            </label>

            <!-- ACTION -->
            <button
               id="tour-login-btn"
              type="submit"
              :disabled="isLoading"
              class="btn-primary w-full"
            >
              {{ isLoading ? 'Logging in...' : 'Login as Admin' }}
            </button>
          </form>

          <!-- MESSAGES -->
          <div class="px-6 pb-4">
            <div v-if="errorMessage" class="alert-error text-center">
              {{ errorMessage }}
            </div>
          </div>
        </div>
        
        <!-- Back to home -->
        <div class="text-center mt-6">
          <router-link to="/" class="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm transition-colors">
            ← Back to Home
          </router-link>
        </div>
      </div>
    </div>
    
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import { API_BASE_URL } from '../apiConfig'

const API_BASE = `${API_BASE_URL}/api/auth`

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const csrfToken = ref('')

// Fetch CSRF token on mount
onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include' // Important for cookies
    })
    const data = await res.json()
    csrfToken.value = data.csrfToken
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err)
  }
})

async function handleAdminLogin() {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const res = await fetch(`${API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken.value
      },
      credentials: 'include',
      body: JSON.stringify({
        email: email.value,
        password: password.value,
        expectedRole: 'admin'
      })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')

    // 2FA required — redirect to challenge page
    if (data.requires2FA) {
      sessionStorage.setItem('2fa_temp_token', data.tempToken)
      sessionStorage.setItem('2fa_is_admin', 'true') // flag so 2FA challenge redirects to admin dashboard
      router.push('/2fa-challenge')
      return
    }

    // Save Admin Token
    localStorage.setItem('adminToken', data.token)
    localStorage.setItem('adminUser', JSON.stringify(data.user))

    // Redirect to admin dashboard
    router.push('/admin-dashboard')

  } catch (err) {
    errorMessage.value = err.message || 'Login failed'
  } finally {
    isLoading.value = false
  }
}


</script>

<style scoped>
/* CARD */
.card {
  @apply rounded-3xl bg-white dark:bg-black/20 border border-gray-200 dark:border-white/10 shadow-xl dark:shadow-2xl transition-all duration-300;
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.1);
}
.dark .card {
  box-shadow: 0 20px 55px rgba(0, 0, 0, 0.3);
}

/* FORM */
.field-label {
  display: flex;
  flex-direction: column;
}

.field-title {
  @apply text-[11px] text-gray-500 dark:text-gray-300 mb-1 font-medium uppercase tracking-wide transition-colors;
}

.input-base {
  @apply rounded-xl px-4 py-2.5 text-sm leading-relaxed text-gray-900 dark:text-slate-50 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-white/30;
}

.input-base:focus {
  @apply bg-white dark:bg-indigo-500/10 border-indigo-400 dark:border-indigo-400/50 ring-2 ring-indigo-500/20;
}

/* BUTTON */
.btn-primary {
  @apply rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 shadow-lg shadow-indigo-500/30;
  background: linear-gradient(to right, #6366f1, #8b5cf6);
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ALERT */
.alert-error {
  @apply text-[13px] text-red-600 dark:text-red-200 p-2 bg-red-50 dark:bg-red-500/10 rounded-lg border border-red-100 dark:border-red-500/20 transition-colors;
}
</style>
