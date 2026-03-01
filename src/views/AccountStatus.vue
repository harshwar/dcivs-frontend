<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
    <AppHeader />

    <div class="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <!-- Background Decorations (Dark Mode Only) -->
      <div class="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div class="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
        <div class="absolute bottom-20 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-0 dark:opacity-100 transition-opacity duration-500"></div>
      </div>

      <div class="relative z-10 w-full max-w-md px-4">
        <div class="status-card p-8 md:p-10 text-center">

          <!-- PENDING EMAIL -->
          <template v-if="status === 'PENDING_EMAIL'">
            <div class="icon-circle bg-amber-500/15 border-amber-500/30">
              <span class="text-5xl">✉️</span>
            </div>
            <h1 class="status-title">Verify Your Email</h1>
            <p class="status-desc">
              We've sent a verification link to your email address. Please check your inbox
              (and spam folder) and click the link to proceed.
            </p>
            <div class="info-box bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
              💡 The verification link expires in 24 hours. Once verified, your account will be reviewed by administration.
            </div>
            <button
              @click="resendVerification"
              :disabled="resendLoading || resendSent"
              class="mt-4 w-full py-3 text-sm font-medium rounded-2xl transition-all border"
              :class="resendSent ? 'border-green-500/30 text-green-500 cursor-default' : 'border-indigo-500/30 text-indigo-500 hover:bg-indigo-500/10'"
            >
              {{ resendSent ? '✅ New link sent — check your inbox' : resendLoading ? 'Sending...' : '↻ Resend verification email' }}
            </button>
          </template>

          <!-- PENDING APPROVAL -->
          <template v-else-if="status === 'PENDING_APPROVAL'">
            <div class="icon-circle bg-indigo-500/15 border-indigo-500/30">
              <span class="text-5xl">🕰️</span>
            </div>
            <h1 class="status-title">Awaiting Admin Approval</h1>
            <p class="status-desc">
              Your email has been verified successfully! Our administrative team is now
              reviewing your registration.
            </p>
            <div class="info-box bg-indigo-500/10 border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              📧 You will receive an activation email once your account is approved and your custodial wallet is ready. No further action is needed from your side.
            </div>
          </template>

          <!-- REJECTED -->
          <template v-else-if="status === 'REJECTED'">
            <div class="icon-circle bg-red-500/15 border-red-500/30">
              <span class="text-5xl">❌</span>
            </div>
            <h1 class="status-title">Registration Declined</h1>
            <p class="status-desc">
              Unfortunately, your registration application was not approved by the administration.
            </p>
            <div class="info-box bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400">
              If you believe this is a mistake, please contact your institution's administration for assistance.
            </div>
          </template>

          <!-- FALLBACK -->
          <template v-else>
            <div class="icon-circle bg-gray-500/15 border-gray-500/30">
              <span class="text-5xl">❓</span>
            </div>
            <h1 class="status-title">Unknown Status</h1>
            <p class="status-desc">We couldn't determine your account status.</p>
          </template>

          <!-- Back to Login -->
          <div class="mt-8 pt-6 border-t border-gray-200 dark:border-white/10">
            <router-link
              to="/login"
              class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 text-sm font-medium transition-colors"
            >
              ← Back to Login
            </router-link>
          </div>
        </div>
      </div>
    </div>

    <AppFooter />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '../components/AppHeader.vue'
import AppFooter from '../components/AppFooter.vue'
import { API_BASE_URL } from '../apiConfig'

const route = useRoute()
const status = computed(() => route.query.status || '')
const email = computed(() => route.query.email || '')

// Resend verification
const resendLoading = ref(false)
const resendSent = ref(false)
async function resendVerification() {
  if (!email.value) return
  resendLoading.value = true
  try {
    await fetch(`${API_BASE_URL}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.value })
    })
    resendSent.value = true
  } catch (e) { /* silent */ } finally {
    resendLoading.value = false
  }
}
</script>

<style scoped>
.status-card {
  @apply bg-white dark:bg-transparent border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl dark:shadow-2xl transition-all duration-300;
}

.icon-circle {
  @apply w-24 h-24 rounded-full flex items-center justify-center border mx-auto mb-6;
}

.status-title {
  @apply text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors;
}

.status-desc {
  @apply text-gray-600 dark:text-gray-400 leading-relaxed mb-6 transition-colors;
}

.info-box {
  @apply p-4 rounded-xl border text-sm leading-relaxed text-left;
}
</style>
