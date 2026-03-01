<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] relative overflow-hidden">
    <!-- Background effects -->
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <div class="relative z-10 w-full max-w-lg mx-4">
      
      <!-- Success State -->
      <div v-if="setupComplete" class="text-center space-y-6 animate-fade-in">
        <div class="w-24 h-24 mx-auto rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
          <span class="text-5xl">✓</span>
        </div>
        <h1 class="text-3xl font-bold text-white">Passkey Ready!</h1>
        <p class="text-gray-400">
          You can now sign in instantly with biometrics. 
          <strong>Next: Secure your wallet for passwordless access.</strong>
        </p>
        <button
          @click="router.push('/student/wallet')"
          class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20"
        >
          Secure Wallet with PIN →
        </button>
      </div>

      <!-- Setup Prompt -->
      <div v-else class="space-y-8">
        <!-- Header -->
        <div class="text-center space-y-3">
          <div class="w-20 h-20 mx-auto rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-6">
            <span class="text-4xl">🔑</span>
          </div>
          <h1 class="text-3xl font-bold text-white">Set Up a Passkey</h1>
          <p class="text-gray-400 max-w-sm mx-auto">
            Sign in faster next time using your fingerprint, face, or device PIN — no password to remember.
          </p>
        </div>

        <!-- Passkey explainer -->
        <div class="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">⚡</span>
            </div>
            <div>
              <h3 class="text-white font-semibold text-sm">Instant Sign-In</h3>
              <p class="text-gray-500 text-xs mt-0.5">No typing passwords — just tap and you're in</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-green-500/15 border border-green-500/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">🛡️</span>
            </div>
            <div>
              <h3 class="text-white font-semibold text-sm">Phishing Resistant</h3>
              <p class="text-gray-500 text-xs mt-0.5">Passkeys can't be stolen or reused on fake sites</p>
            </div>
          </div>
          <div class="flex items-start gap-4">
            <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">📱</span>
            </div>
            <div>
              <h3 class="text-white font-semibold text-sm">Works Everywhere</h3>
              <p class="text-gray-500 text-xs mt-0.5">Syncs across your devices via iCloud, Google, or Windows Hello</p>
            </div>
          </div>
        </div>

        <!-- Not supported warning -->
        <div v-if="!passkeySupported" class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
          <span class="text-amber-400">⚠</span>
          <div>
            <p class="text-amber-300 text-sm font-medium">Browser doesn't support passkeys</p>
            <p class="text-amber-400/60 text-xs mt-1">Try Chrome, Safari, or Edge on a modern device.</p>
          </div>
        </div>

        <!-- Error message -->
        <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {{ error }}
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            v-if="passkeySupported"
            @click="handleSetupPasskey"
            :disabled="isLoading"
            class="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-wait text-white font-semibold rounded-xl transition-all transform hover:scale-[1.02] shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
          >
            <svg v-if="isLoading" class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
            <span v-if="!isLoading">🔑 Set Up Passkey</span>
            <span v-else>Setting up...</span>
          </button>

          <button
            @click="goToDashboard"
            class="w-full py-3 text-gray-400 hover:text-gray-200 font-medium text-sm transition-colors"
          >
            Skip for now →
          </button>
        </div>

        <p class="text-center text-gray-600 text-xs">
          You can always set up passkeys later in Settings → Security.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { registerPasskey, isPasskeySupported } from '../services/passkeyService.js'
import { API_BASE_URL } from '../apiConfig'
import { useToast } from '../composables/useToast.js'
import { Wallet } from 'ethers'

const router = useRouter()
const toast = useToast()

const passkeySupported = ref(false)
const isLoading = ref(false)
const error = ref('')
const setupComplete = ref(false)

onMounted(() => {
  passkeySupported.value = isPasskeySupported()
  
  // If not logged in, redirect to login
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  if (!token) {
    router.replace('/login')
    return
  }

  // If user already has a passkey but NO pin, jump straight to wallet onboarding
  if (user.has_passkeys && !user.wallet_pin_set) {
    router.replace('/student/wallet')
    return
  }
})

async function handleSetupPasskey() {
  isLoading.value = true
  error.value = ''

  try {
    await registerPasskey('My Passkey')
    setupComplete.value = true
    toast.success('Passkey registered successfully!')
  } catch (err) {
    if (err.name === 'NotAllowedError') {
      error.value = 'Setup was cancelled. You can try again or skip.'
    } else {
      error.value = err.message || 'Failed to set up passkey. You can try again or skip.'
    }
  } finally {
    isLoading.value = false
  }
}

function goToDashboard() {
  router.push('/student/dashboard')
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
