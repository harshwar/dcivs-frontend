<template>
  <Transition name="fade">
    <div v-if="isActive" class="fixed inset-0 z-[9999] pointer-events-none">
      
      <!-- The Global Dark/Blur Backdrop with a Cutout Hole (Spotlight) -->
      <!-- We achieve this by using a gigantic box-shadow on a specifically positioned div that leaves its inner area transparent -->
      <div 
        class="absolute rounded-lg transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] pointer-events-auto"
        :style="spotlightStyle"
      >
        <!-- The interactive "glow" border around the spotlight -->
        <div class="absolute inset-0 rounded-lg ring-2 ring-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.6)] animate-pulse-slow"></div>
      </div>

      <!-- The Information SaaS Card (Floats near the spotlight) -->
      <div 
        class="absolute w-[400px] bg-[#1e2329] border border-gray-700 rounded-xl shadow-2xl p-6 pointer-events-auto transition-all duration-700 ease-[cubic-bezier(0.25,1,0.5,1)] flex flex-col gap-4 text-left"
        :style="cardStyle"
      >
        <div class="flex items-center justify-between border-b border-gray-700/50 pb-3">
          <h3 class="text-lg font-bold text-white flex items-center gap-2">
            <span class="text-indigo-400">Step {{ currentStepIndex + 1 }}</span>
            <span class="text-gray-400 text-sm font-normal px-2 bg-gray-800 rounded-full border border-gray-700">{{ currentStep.title }}</span>
          </h3>
          <button @click="closeTour" class="text-gray-500 hover:text-white transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        
        <p class="text-sm text-gray-300 leading-relaxed font-light">
          {{ currentStep.content }}
        </p>

        <!-- Progress Bar (Visual only) -->
        <div class="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden mt-1">
          <div class="bg-indigo-500 h-full rounded-full transition-all duration-500" :style="{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }"></div>
        </div>

        <div class="flex justify-between items-center mt-2">
          <button 
            @click="tour.prevStep"
            :disabled="currentStepIndex === 0"
            class="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <button 
            @click="handleNext"
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-lg shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all flex items-center gap-2"
          >
            <span>{{ isLastStep ? 'Finish Demo' : 'Next' }}</span>
            <svg v-if="!isLastStep" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useTour } from '../../composables/useTour'

const tour = useTour()
const isActive = tour.isActive
const currentStepIndex = tour.currentStepIndex
const totalSteps = tour.tourScript.length

const currentStep = computed(() => tour.tourScript[currentStepIndex.value])
const isLastStep = computed(() => currentStepIndex.value === totalSteps - 1)

// Targeting & Positioning State
const targetRect = ref({ top: 0, left: 0, width: 0, height: 0 })
const windowSize = ref({ width: window.innerWidth, height: window.innerHeight })
let recalculateInterval = null

// Calculate the Spotlight CSS
// We use a massive box-shadow (0 0 0 9999px rgba(0,0,0,0.85)) to create the dark backdrop, leaving the div itself transparent.
const spotlightStyle = computed(() => {
  if (!currentStep.value.targetId || targetRect.value.width === 0) {
    // If no target, center a small invisible dot and just show the blur
    return {
      top: '50%',
      left: '50%',
      width: '0px',
      height: '0px',
      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)'
    }
  }

  // Add 8px padding around the target
  const padding = 12;
  return {
    top: `${targetRect.value.top - padding}px`,
    left: `${targetRect.value.left - padding}px`,
    width: `${targetRect.value.width + padding * 2}px`,
    height: `${targetRect.value.height + padding * 2}px`,
    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.85)'
  }
})

// Calculate where the Dialog Card should float
const cardStyle = computed(() => {
  const margin = 20
  const cardWidth = 400 // approx max width
  const cardHeight = 280 // approx max height
  
  if (!currentStep.value.targetId || targetRect.value.width === 0) {
    // Center screen if no target
    return {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '90%',
      maxWidth: `${cardWidth}px`
    }
  }

  // Determine best placement relative to targetRect
  let top, left
  const padding = 24
  
  // 1. Try Bottom
  const spaceBelow = windowSize.value.height - (targetRect.value.top + targetRect.value.height)
  if (spaceBelow > cardHeight + padding) {
    top = targetRect.value.top + targetRect.value.height + padding
    left = targetRect.value.left
  } 
  // 2. Try Top
  else if (targetRect.value.top > cardHeight + padding) {
    top = targetRect.value.top - cardHeight - padding
    left = targetRect.value.left
  }
  // 3. Try Right (if target is small)
  else if (windowSize.value.width - (targetRect.value.left + targetRect.value.width) > cardWidth + padding) {
    top = targetRect.value.top
    left = targetRect.value.left + targetRect.value.width + padding
  }
  // 4. Fallback: Center screen but avoid spotlight if possible
  else {
    top = windowSize.value.height / 2 - cardHeight / 2
    left = windowSize.value.width / 2 - cardWidth / 2
  }

  // Clamp to viewport
  const finalTop = Math.max(margin, Math.min(top, windowSize.value.height - cardHeight - margin))
  const finalLeft = Math.max(margin, Math.min(left, windowSize.value.width - cardWidth - margin))

  return {
    top: `${finalTop}px`,
    left: `${finalLeft}px`,
    width: '90%',
    maxWidth: `${cardWidth}px`,
    transition: 'all 0.3s ease-out'
  }
})

// Core function to locate the DOM element and scroll to it
const updateSpotlight = async () => {
  if (!isActive.value) return
  
  // Wait a moment for Vue route transitions or DOM renders
  await nextTick()
  setTimeout(() => {
    const id = currentStep.value.targetId
    if (!id) {
      targetRect.value = { top: 0, left: 0, width: 0, height: 0 }
      return
    }

    const el = document.getElementById(id)
    if (el) {
      // Smooth scroll if it's way out of view
      const rect = el.getBoundingClientRect()
      if (rect.top < 0 || rect.bottom > window.innerHeight) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      
      // Update coordinates
      const freshRect = el.getBoundingClientRect()
      targetRect.value = {
        top: freshRect.top,
        left: freshRect.left,
        width: freshRect.width,
        height: freshRect.height
      }
    } else {
      // Element not found on this page yet
      targetRect.value = { top: 0, left: 0, width: 0, height: 0 }
    }
  }, 300) // slight delay allows animations/renders to finish
}

// Watchers
watch([isActive, currentStepIndex], () => {
  updateSpotlight()
  executeStepAction()
})

// Window Resize Listener
const handleResize = () => {
  windowSize.value = { width: window.innerWidth, height: window.innerHeight }
  updateSpotlight()
}

// Watch for route changes to auto-advance if we land on the "next" page automatically (e.g. after login)
watch(() => router.currentRoute.value.path, (newPath) => {
  if (isActive.value) {
    const currentConfig = tour.tourScript[currentStepIndex.value]
    if (currentConfig && newPath !== currentConfig.route) {
       // Check if this new path matches the NEXT step
       const nextConfig = tour.tourScript[currentStepIndex.value + 1]
       if (nextConfig && newPath === nextConfig.route) {
          // slight delay to let the page settle
          setTimeout(() => tour.nextStep(), 500)
       }
    }
  }
})

// Action Handlers
const executeStepAction = async () => {
  if (!isActive.value) return
  
  const action = currentStep.value.action
  if (!action) return

  // Example: Fire custom events that the actual pages listen for, OR manipulate DOM directly.
  if (action === 'adminLogin') {
    const loginForm = document.getElementById('tour-login-btn')
    
    // Fill form if possible
    const emailInput = document.querySelector('input[type="email"]')
    const passInput = document.querySelector('input[type="password"]')
    
    if (emailInput && passInput) {
       emailInput.value = 'demo_admin@system.com'
       emailInput.dispatchEvent(new Event('input', { bubbles: true }))
       passInput.value = 'AdminDemo2026!'
       passInput.dispatchEvent(new Event('input', { bubbles: true }))
    }

    if (loginForm) {
      setTimeout(() => loginForm.click(), 500)
    }
  }
  else if (action === 'goToStudentLogin') {
    // Just logout and navigate
    document.dispatchEvent(new CustomEvent('tour-force-logout'))
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminUser')
    
    setTimeout(() => {
      tour.router.push('/login')
      // Auto-advance is handled by the route watcher
    }, 500)
  }
  else if (action === 'studentLoginExec') {
    // Expects to be on /login already
    const emailInput = document.querySelector('#tour-login-form-student input[type="email"]')
    const passInput = document.querySelector('#tour-login-form-student input[type="password"]')
    // Ensure we are selecting the general sign in button
    const loginBtn = document.querySelector('#tour-login-form-student button.btn-primary')
    
    if (emailInput && passInput && loginBtn) {
      emailInput.value = 'demo_student@system.com'
      emailInput.dispatchEvent(new Event('input', { bubbles: true }))
      
      passInput.value = 'StudentDemo2026!'
      passInput.dispatchEvent(new Event('input', { bubbles: true }))
      
      setTimeout(() => loginBtn.click(), 500)
    }
  }
  else if (action === 'goVerify') {
    const input = document.querySelector('#tour-verify-form input')
    const btn = document.querySelector('#tour-verify-form button')
    if (input && btn) {
      input.value = '1'
      input.dispatchEvent(new Event('input', { bubbles: true }))
      setTimeout(() => btn.click(), 500)
    }
  }
  else if (action.startsWith('setTab')) {
    // E.g. setTabHealth -> emit an event AdminDashboard.vue listens to to switch tabs
    const tabName = action.replace('setTab', '').toLowerCase()
    
    // Special case for approvals: we need to select students AFTER tab switch
    if (action === 'setTabApprovalsAndSelect') {
      document.dispatchEvent(new CustomEvent('tour-change-tab', { detail: 'approval' }))
      
      // Give it more time to render and fetch data
      let attempts = 0
      const checkAndClick = setInterval(() => {
        const checkbox = document.getElementById('select-all-students')
        if (checkbox) {
          checkbox.click()
          clearInterval(checkAndClick)
        }
        if (++attempts > 10) clearInterval(checkAndClick) // stop after 5s
      }, 500)
    } else {
      document.dispatchEvent(new CustomEvent('tour-change-tab', { detail: tabName }))
    }
  }
}

const handleNext = () => {
  tour.nextStep()
}

const closeTour = () => {
  tour.stopTour()
}

// Lifecycle Hooks
onMounted(() => {
  window.addEventListener('resize', handleResize)
  // Continuous recalculation just in case elements shift (e.g. charts rendering)
  recalculateInterval = setInterval(() => {
    if (isActive.value && currentStep.value.targetId) {
      const el = document.getElementById(currentStep.value.targetId)
      if (el) {
        const rect = el.getBoundingClientRect()
        // Only update if physically moved to prevent jitter
        if (Math.abs(rect.top - targetRect.value.top) > 5) {
          targetRect.value = { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
        }
      }
    }
  }, 1000)

  // Load state on boot
  tour.loadState()
  if (tour.isActive.value) {
    updateSpotlight()
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  clearInterval(recalculateInterval)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@keyframes pulse-slow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.02); }
}
.animate-pulse-slow {
  animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
