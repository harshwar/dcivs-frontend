<template>
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Security Settings</h2>
      <p class="text-gray-500 mt-1">Manage your password, wallet PIN, and secondary authentication methods.</p>
    </div>

    <!-- 1. Change Password Section -->
    <div class="bg-white dark:bg-[#1b2127] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🔑</span> Account Password
        </h3>
        <p class="text-sm text-gray-500 mt-1">Update the password used to log in to your student portal.</p>
      </div>
      <div class="p-6">
        <form @submit.prevent="changePassword" class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
            <input 
              v-model="pwdForm.oldPassword" 
              type="password" 
              required
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
            <input 
              v-model="pwdForm.newPassword" 
              type="password" 
              required
              minlength="6"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
            <input 
              v-model="pwdForm.confirmPassword" 
              type="password" 
              required
              minlength="6"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
          </div>
          
          <div v-if="pwdMessage.text" :class="pwdMessage.isError ? 'text-red-500' : 'text-green-500'" class="text-sm font-medium">
            {{ pwdMessage.text }}
          </div>

          <button 
            type="submit" 
            :disabled="isPwdLoading"
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span v-if="isPwdLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            Update Password
          </button>
        </form>
      </div>
    </div>

    <!-- 2. Wallet PIN Section -->
    <div class="bg-white dark:bg-[#1b2127] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="p-6 border-b border-gray-200 dark:border-gray-800">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <span>🛡️</span> Wallet PIN
        </h3>
        <p class="text-sm text-gray-500 mt-1">Your 6-digit PIN is required to unlock your blockchain wallet to view or transfer certificates.</p>
      </div>
      <div class="p-6">
        <div v-if="hasWalletPin" class="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-start gap-3">
          <span class="text-green-500 text-xl">✅</span>
          <div>
            <h4 class="font-bold text-green-800 dark:text-green-300">PIN Configured</h4>
            <p class="text-sm text-green-700 dark:text-green-400 mt-1">Your wallet is secured with a PIN. You can update it below.</p>
          </div>
        </div>
        <div v-else class="mb-6 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
          <span class="text-yellow-500 text-xl">⚠️</span>
          <div>
            <h4 class="font-bold text-yellow-800 dark:text-yellow-300">No PIN Set</h4>
            <p class="text-sm text-yellow-700 dark:text-yellow-400 mt-1">Your wallet is currently unlocked. Please set a PIN immediately for transaction security.</p>
          </div>
        </div>

        <form @submit.prevent="updateWalletPin" class="space-y-4 max-w-md">
           <!-- Note: To change a PIN, they must first unlock the wallet with their existing password/PIN (which is handled in WalletDashboard currently). 
                For Settings, we'll prompt for the current login password to verify identity, then set the new PIN on their encrypted wallet. -->
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Verify Account Password</label>
            <input 
              v-model="pinForm.accountPassword" 
              type="password" 
              required
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow"
            />
            <p class="text-xs text-gray-500 mt-1">Required to decrypt your current wallet.</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New 6-Digit PIN</label>
            <input 
              v-model="pinForm.newPin" 
              type="password" 
              required
              pattern="\d{6}"
              maxlength="6"
              title="Must be exactly 6 digits"
              class="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none tracking-[0.5em] font-mono text-center"
            />
          </div>

          <div v-if="pinMessage.text" :class="pinMessage.isError ? 'text-red-500' : 'text-green-500'" class="text-sm font-medium">
            {{ pinMessage.text }}
          </div>

          <button 
            type="submit" 
            :disabled="isPinLoading"
            class="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span v-if="isPinLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
            {{ hasWalletPin ? 'Update Wallet PIN' : 'Set Wallet PIN' }}
          </button>
        </form>
      </div>
    </div>

    <!-- 3. Passkey Section (Future Expansion / Visibility) -->
    <div class="bg-white dark:bg-[#1b2127] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      <div class="p-6 flex items-center justify-between">
        <div>
           <h3 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
             <span>🤳</span> Biometric Passkeys (WebAuthn)
           </h3>
           <p class="text-sm text-gray-500 mt-1">Log in instantly using Fingerprint, FaceID, or Windows Hello.</p>
        </div>
        <router-link to="/passkey-setup" class="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 font-medium transition-colors">
            Manage Passkeys
        </router-link>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { API_BASE_URL } from '../../apiConfig';
// Use ethers from window as initialized in WalletDashboard
const ethers = window.ethers;

const hasWalletPin = ref(false);

const pwdForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const isPwdLoading = ref(false);
const pwdMessage = ref({ text: '', isError: false });

const pinForm = ref({
  accountPassword: '', // used to try decrypting if it was just password
  newPin: ''
});
const isPinLoading = ref(false);
const pinMessage = ref({ text: '', isError: false });

onMounted(() => {
    // Check if user object has the flag
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            const user = JSON.parse(userData);
            hasWalletPin.value = !!user.wallet_pin_set;
        } catch (e) {}
    }
});

// --- CHANGE PASSWORD ---
async function changePassword() {
  pwdMessage.value = { text: '', isError: false };
  
  if (pwdForm.value.newPassword !== pwdForm.value.confirmPassword) {
    pwdMessage.value = { text: 'New passwords do not match.', isError: true };
    return;
  }

  isPwdLoading.value = true;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        oldPassword: pwdForm.value.oldPassword,
        newPassword: pwdForm.value.newPassword
      })
    });

    const data = await res.json();
    if (res.ok) {
      pwdMessage.value = { text: 'Password changed successfully! You will use it on your next login.', isError: false };
      pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' };
    } else {
      throw new Error(data.error || 'Failed to change password.');
    }
  } catch (err) {
    pwdMessage.value = { text: err.message, isError: true };
  } finally {
    isPwdLoading.value = false;
  }
}

// --- UPDATE WALLET PIN ---
async function updateWalletPin() {
    pinMessage.value = { text: '', isError: false };
    
    if (pinForm.value.newPin.length !== 6) {
        pinMessage.value = { text: 'PIN must be exactly 6 digits.', isError: true };
        return;
    }

    if (!ethers) {
        pinMessage.value = { text: 'Ethers.js library not loaded in window.', isError: true };
        return;
    }

    isPinLoading.value = true;
    try {
        // 1. Fetch current encrypted wallet from backend
        const res = await fetch(`${API_BASE_URL}/api/wallet/me`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (!res.ok) throw new Error('Could not fetch wallet data.');
        const walletData = await res.json();
        
        let wallet;
        try {
            // 2. Try decrypting with provided password. 
            // If they already have a PIN, they would need their current PIN here instead of password. 
            // For simplicity in this UI, we assume 'accountPassword' field is whatever their current encryption key is.
            wallet = await ethers.Wallet.fromEncryptedJson(walletData.encrypted_json, pinForm.value.accountPassword);
        } catch (decryptErr) {
            throw new Error('Incorrect current password (or PIN). Could not decrypt wallet.');
        }

        // 3. Re-encrypt with the new 6-digit PIN
        const newEncryptedJson = await wallet.encrypt(pinForm.value.newPin);

        // 4. Send updated JSON to backend
        const updateRes = await fetch(`${API_BASE_URL}/api/wallet/update`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                address: wallet.address,
                encryptedJson: newEncryptedJson
            })
        });

        if (!updateRes.ok) throw new Error('Failed to save new wallet configuration.');

        pinMessage.value = { text: 'Wallet PIN successfully updated! Use it to unlock your wallet on the dashboard.', isError: false };
        pinForm.value = { accountPassword: '', newPin: '' };
        hasWalletPin.value = true;
        
        // Update local storage flag
        const userData = localStorage.getItem('user');
        if (userData) {
            const user = JSON.parse(userData);
            user.wallet_pin_set = true;
            localStorage.setItem('user', JSON.stringify(user));
        }

    } catch (err) {
        pinMessage.value = { text: err.message, isError: true };
    } finally {
        isPinLoading.value = false;
    }
}
</script>
