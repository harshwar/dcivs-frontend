<template>
  <div class="min-h-screen flex items-center justify-center bg-[#0d1117] relative overflow-hidden py-12 px-4">
    <!-- Background effects -->
    <div class="absolute inset-0">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-3xl animate-pulse"></div>
      <div class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-sky-600/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 1s;"></div>
    </div>

    <div class="relative z-10 w-full max-w-lg">
      
      <!-- Back Button -->
      <button @click="router.back()" class="absolute -top-12 left-0 text-gray-400 hover:text-white flex items-center gap-2 transition-colors text-sm font-medium">
        ← Back to Login
      </button>

      <div class="bg-[#161b22]/80 backdrop-blur-xl border border-[#30363d] rounded-3xl p-8 shadow-2xl">
        
        <!-- Header -->
        <div class="text-center space-y-3 mb-8">
          <div class="w-16 h-16 mx-auto rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-4">
            <span class="text-3xl">🔑</span>
          </div>
          <h1 class="text-3xl font-bold text-white tracking-tight">Recover Wallet PIN</h1>
          <p class="text-gray-400 text-sm max-w-sm mx-auto">
            Use your 12-word recovery phrase to restore access and set a new 6-digit PIN.
          </p>
        </div>

        <div v-if="success" class="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center animate-fadeIn">
          <div class="text-4xl mb-4">✅</div>
          <h3 class="text-green-400 font-bold mb-2">Wallet Recovered!</h3>
          <p class="text-green-300/80 text-sm">Your new PIN has been saved successfully. Redirecting to your dashboard...</p>
        </div>

        <div v-else class="space-y-6">
          
          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm animate-fadeIn">
            {{ error }}
          </div>

          <!-- Step 1: Recovery Phrase Input -->
          <div>
            <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Recovery Phrase (12 Words)</label>
            <textarea
              v-model="recoveryPhrase"
              placeholder="word1 word2 word3 ..."
              class="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all h-24 text-sm resize-none"
              :disabled="isBusy"
            ></textarea>
            <div class="flex justify-between mt-2">
              <p class="text-[10px] text-gray-500">Separate words with spaces.</p>
              <p class="text-[10px]" :class="phraseWordCount === 12 ? 'text-green-500' : 'text-amber-500'">{{ phraseWordCount }} / 12 words</p>
            </div>
          </div>

          <!-- Step 2: New PIN Input -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">New PIN</label>
              <input
                v-model="newPin"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="●●●●●●"
                class="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                @input="onPinInput('new')"
                :disabled="isBusy"
              />
            </div>
            <div>
              <label class="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Confirm PIN</label>
              <input
                v-model="confirmPin"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="●●●●●●"
                class="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest text-white focus:ring-2 focus:ring-red-500/50 outline-none transition-all"
                @input="onPinInput('confirm')"
                :disabled="isBusy"
              />
            </div>
          </div>

          <button
            @click="handleRecovery"
            :disabled="!isValidForm || isBusy"
            class="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-red-900/40 disabled:text-red-300/50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all transform hover:-translate-y-0.5 shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 mt-4"
          >
            <span v-if="isBusy" class="animate-spin inline-block h-5 w-5 border-2 border-white/40 border-t-white rounded-full"></span>
            <span>{{ isBusy ? 'Recovering Wallet...' : 'Restore Wallet & Set PIN' }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Wallet } from 'ethers';
import { API_BASE_URL } from '../apiConfig';
import { useToast } from '../composables/useToast.js';

const router = useRouter();
const toast = useToast();

const recoveryPhrase = ref('');
const newPin = ref('');
const confirmPin = ref('');
const isBusy = ref(false);
const error = ref('');
const success = ref(false);

const phraseWordCount = computed(() => {
  if (!recoveryPhrase.value.trim()) return 0;
  return recoveryPhrase.value.trim().split(/\s+/).length;
});

const isValidForm = computed(() => {
  return phraseWordCount.value === 12 && 
         newPin.value.length === 6 && 
         confirmPin.value.length === 6 &&
         newPin.value === confirmPin.value;
});

function onPinInput(field) {
  if (field === 'new') {
    newPin.value = newPin.value.replace(/\D/g, '');
  } else {
    confirmPin.value = confirmPin.value.replace(/\D/g, '');
  }
}

async function handleRecovery() {
  if (!isValidForm.value) return;
  
  isBusy.value = true;
  error.value = '';
  
  try {
    const token = localStorage.getItem('token');
    if (!token) throw new Error('You must be logged in to recover your wallet. Please log in first.');

    // 1. Recreate wallet from phrase
    let wallet;
    try {
      wallet = Wallet.fromPhrase(recoveryPhrase.value.trim());
    } catch (e) {
      throw new Error("Invalid recovery phrase. Please check for typos and try again.");
    }

    // 2. Encrypt with new PIN
    const newEncryptedJson = await wallet.encrypt(newPin.value);

    // 3. Save to backend via the standard update endpoint
    const res = await fetch(`${API_BASE_URL}/api/wallet/update`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        address: wallet.address,
        encryptedJson: newEncryptedJson,
        walletPinSet: true
      }),
    });
    
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update wallet on the server.");
    }

    // 4. Update local state
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.wallet_pin_set = true;
    localStorage.setItem('user', JSON.stringify(user));

    success.value = true;
    toast.success('Wallet successfully recovered and secured with new PIN!');
    
    // Redirect to dashboard
    setTimeout(() => {
      router.push('/student/wallet');
    }, 2000);

  } catch (err) {
    error.value = err.message;
  } finally {
    isBusy.value = false;
  }
}
</script>

<style scoped>
.animate-fadeIn {
  animation: fadeIn 0.4s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
