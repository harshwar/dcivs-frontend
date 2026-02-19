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
          <div v-if="emailSent" class="text-center space-y-4">
            <div class="w-20 h-20 mx-auto rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center">
              <span class="text-4xl">✉️</span>
            </div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Check Your Email</h1>
            <p class="text-gray-600 dark:text-gray-400 text-sm">
              If an account exists for <strong class="text-gray-900 dark:text-white">{{ email }}</strong>, 
              we've sent a password reset link.
            </p>
            <div class="bg-gray-100 dark:bg-[#21262d] rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400">
              💡 Check your spam folder if you don't see it within a few minutes.
            </div>
            <router-link to="/login" class="inline-block mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 text-sm font-medium">
              ← Back to Login
            </router-link>
          </div>

          <!-- Request Form -->
          <div v-else>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">Forgot Password?</h1>
            <p class="text-gray-600 dark:text-gray-400 text-center mb-8 text-sm">
              Enter your email and we'll send you a reset link.
            </p>

            <form @submit.prevent="handleSubmit" class="space-y-5">
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
                <input
                  v-model="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="you@university.edu"
                  class="input-field"
                />
              </div>

              <button
                type="submit"
                :disabled="isLoading || !email"
                class="btn-primary w-full"
              >
                {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </form>

            <!-- Error -->
            <div v-if="errorMessage" class="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 text-sm text-center">
              {{ errorMessage }}
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
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import { API_BASE_URL } from '../apiConfig'

const API_BASE = `${API_BASE_URL}/api/auth`

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const emailSent = ref(false)

async function handleSubmit() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    const res = await fetch(`${API_BASE}/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })

    const data = await res.json()

    if (res.ok) {
      emailSent.value = true
    } else {
      throw new Error(data.error || 'Something went wrong')
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
