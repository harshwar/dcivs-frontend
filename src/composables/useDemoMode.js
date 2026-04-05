import { ref, watch } from 'vue'

const DEMO_STORAGE_KEY = 'nft_admin_demo_mode'
const isDemoMode = ref(localStorage.getItem(DEMO_STORAGE_KEY) === 'true')

// Watch for changes and persist immediately
watch(isDemoMode, (newVal) => {
  localStorage.setItem(DEMO_STORAGE_KEY, newVal)
})

export function useDemoMode() {
  const toggleDemoMode = () => {
    isDemoMode.value = !isDemoMode.value
  }

  return {
    isDemoMode,
    toggleDemoMode
  }
}
