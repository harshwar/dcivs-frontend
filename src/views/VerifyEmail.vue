<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { API_BASE_URL } from '../apiConfig'
import ParticleBackground2 from '../components/ParticleBackground2.vue'

const route = useRoute()
const router = useRouter()
const status = ref('verifying') // 'verifying', 'success', 'error'
const message = ref('')

async function verifyToken() {
  const token = route.query.token
  if (!token) {
    status.value = 'error'
    message.value = 'Verification token is missing. Please check your email link again.'
    return
  }

  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/verify-email?token=${token}`)
    const data = await res.json()

    if (res.ok) {
      status.value = 'success'
      message.value = data.message
    } else {
      status.value = 'error'
      message.value = data.error || 'Verification failed.'
    }
  } catch (err) {
    status.value = 'error'
    message.value = 'Connection error. Please try again later.'
  }
}

onMounted(verifyToken)
</script>

<template>
  <div class="min-h-screen bg-[#0d1117] text-white flex items-center justify-center p-6 relative overflow-hidden">
    <ParticleBackground2 />
    
    <div class="max-w-md w-full glass-panel p-8 rounded-3xl border border-white/10 relative z-10 shadow-2xl text-center">
      <!-- Icon Header -->
      <div class="mb-6 flex justify-center">
        <div v-if="status === 'verifying'" class="w-20 h-20 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
          <div class="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div v-else-if="status === 'success'" class="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/30 animate-bounce">
          <span class="text-4xl">✅</span>
        </div>
        <div v-else class="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30">
          <span class="text-4xl">⚠️</span>
        </div>
      </div>

      <h1 class="text-2xl font-bold mb-4 tracking-tight">
        {{ status === 'verifying' ? 'Verifying Your Email...' : status === 'success' ? 'Email Verified!' : 'Verification Error' }}
      </h1>

      <p class="text-gray-400 mb-8 leading-relaxed">
        {{ message }}
      </p>

      <div v-if="status === 'success'" class="space-y-4">
        <div class="p-4 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-300 text-sm">
          💡 Our administrators have been notified. Once they approve your identity, you'll receive an activation email!
        </div>
        <button @click="router.push('/login')" class="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/20">
          Return to Login
        </button>
      </div>

      <div v-else-if="status === 'error'" class="space-y-4">
        <button @click="router.push('/login')" class="w-full py-4 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-2xl transition-all">
          Back to Login
        </button>
        <p class="text-xs text-gray-500">Need help? Contact support@university.edu</p>
      </div>

      <div v-else class="text-xs text-gray-600 animate-pulse">
        Communicating with validation server...
      </div>
    </div>
  </div>
</template>

<style scoped>
.glass-panel {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
}
</style>
