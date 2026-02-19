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

          <!-- Success State -->
          <div v-if="resetComplete" class="text-center space-y-4">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <span class="text-4xl">✓</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Password Reset!</h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              Your password has been changed successfully. You can now sign in.
            </p>
            <router-link to="/login"
              class="inline-block px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
            >
              Go to Login →
            </router-link>
          </div>

          <!-- Reset Form -->
          <div v-else>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Set New Password</h1>
            <p class="text-gray-600 dark:text-gray-400 text-center mb-8 text-sm">
              Enter your new password below.
            </p>

            <form @submit.prevent="handleReset" class="space-y-5">
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">New Password</label>
                <input
                  v-model="newPassword"
                  type="password"
                  required
                  minlength="6"
                  placeholder="At least 6 characters"
                  class="input-field"
                />
              </div>

              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Confirm Password</label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  required
                  placeholder="Repeat your password"
                  class="input-field"
                />
              </div>

              <!-- Validation -->
              <div v-if="newPassword && confirmPassword && newPassword !== confirmPassword"
                class="text-red-400 text-xs">
                Passwords do not match
              </div>

              <button
                type="submit"
                :disabled="isLoading || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6"
                class="btn-primary w-full"
              >
                {{ isLoading ? 'Resetting...' : 'Reset Password' }}
              </button>
            </form>

            <!-- Error -->
            <div v-if="errorMessage" class="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 text-sm text-center">
              {{ errorMessage }}
              <router-link v-if="isTokenError" to="/forgot-password" class="block mt-2 text-indigo-400 hover:text-indigo-300 text-xs font-medium">
                Request a new reset link →
              </router-link>
            </div>

            <div class="mt-6 text-center">
              <router-link to="/login" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
                ← Back to Login
              </router-link>
            </div>
          </div>

        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import { API_BASE_URL } from '../apiConfig'

const API_BASE = `${API_BASE_URL}/api/auth`

const route = useRoute()
const token = route.params.token

const newPassword = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const resetComplete = ref(false)
const isTokenError = ref(false)

async function handleReset() {
  if (newPassword.value !== confirmPassword.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  isTokenError.value = false

  try {
    const res = await fetch(`${API_BASE}/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token,
        newPassword: newPassword.value
      })
    })

    const data = await res.json()

    if (res.ok) {
      resetComplete.value = true
    } else {
      if (data.error && (data.error.includes('expired') || data.error.includes('Invalid'))) {
        isTokenError.value = true
      }
      throw new Error(data.error || 'Failed to reset password')
    }
  } catch (err) {
    errorMessage.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.auth-card {
  @apply bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 p-8 transition-all duration-300;
}

.input-field {
  @apply w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all;
}

.btn-primary {
  @apply py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors;
}
</style>
