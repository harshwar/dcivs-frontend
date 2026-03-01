<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { isDark, toggleTheme } from '../services/theme';
import ThemeToggle from '../components/ThemeToggle.vue';
import { Wallet } from 'ethers'; // Ethers.js for local wallet management
import AudioService from '../services/audio';
import { useToast } from '../composables/useToast.js';
import { generateLinkedInCertUrl } from '../utils/linkedinUrlGenerator';

const toast = useToast();

const router = useRouter();

import { API_BASE_URL } from '../apiConfig'; 

// --- State Variables ---
const status = ref('loading'); // Current State: 'loading' | 'no-wallet' | 'locked' | 'unlocked' | 'unauthorized' | 'onboarding'
const isBusy = ref(false); // UI blocker for async operations (loading spinners)
const error = ref(''); // Stores error messages

// Form Inputs
const password = ref('');
const walletAddress = ref('');
const encryptedJson = ref(''); // The encrypted keystore string fetched from DB

// Data Display
const assets = ref([]); // Stores the list of NFTs owned by the user

// --- Onboarding State ---
const onboardingStep = ref(1); // 1=intro, 2=seed phrase reveal, 3=set PIN
const seedPhrase = ref('');
const newPin = ref('');
const confirmPin = ref('');
const seedCopied = ref(false);

// --- Auth Utilities ---
const token = computed(() => localStorage.getItem('token') || ''); 
const currentUser = computed(() => {
  try {
    return JSON.parse(localStorage.getItem('user') || '{}');
  } catch (e) { return {}; }
});
const isPinEnabled = computed(() => currentUser.value.wallet_pin_set === true);
const needsPinUpgrade = computed(() => currentUser.value.has_passkeys && !currentUser.value.wallet_pin_set);

// Computes headers for authenticated requests
const apiHeaders = computed(() => {
  const headers = {
    'Content-Type': 'application/json',
  };
  if (token.value) {
    headers['Authorization'] = `Bearer ${token.value}`;
  }
  return headers;
});

// --- Lifecycle Actions ---

/**
 * onMounted:
 * Automatically runs when the component loads.
 * Attempts to fetch the user's wallet from the backend.
 */
onMounted(() => {
  console.log('[WalletDashboard] currentUser:', currentUser.value);
  console.log('[WalletDashboard] needsPinUpgrade:', needsPinUpgrade.value);
  loadWallet();
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  router.push('/login');
}

// --- Wallet Management Functions ---

/**
 * 1. Load User's Wallet
 * Checks if the user already has a wallet stored in the DB.
 */
async function loadWallet() {
  if (!token.value) {
    status.value = 'unauthorized';
    return;
  }

  status.value = 'loading';
  error.value = '';
  // Reset fields
  password.value = '';
  walletAddress.value = '';
  encryptedJson.value = '';
  assets.value = [];

  try {
    const res = await fetch(`${API_BASE_URL}/api/wallet/me`, {
      method: 'GET',
      headers: apiHeaders.value,
    });

    // 401 = Not Logged In
    if (res.status === 401 || res.status === 403) {
      status.value = 'unauthorized';
      return;
    }

    // 404 = No Wallet Created Yet
    if (res.status === 404) {
      status.value = 'no-wallet';
      return;
    }

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to load wallet.');
    }

    // Success: We retrieved the Encrypted JSON
    const data = await res.json();
    encryptedJson.value = data.encrypted_json;
    walletAddress.value = data.public_address;

    // Check if wallet needs onboarding (PIN not set = still encrypted with temp key)
    if (!currentUser.value.wallet_pin_set) {
      status.value = 'onboarding';
      onboardingStep.value = 1;
    } else {
      status.value = 'locked'; // Normal PIN unlock
    }
  } catch (err) {
    console.error('Error loading wallet:', err);
    error.value = err.message;
    status.value = 'no-wallet'; // Fallback
  }
}

/**
 * 2. Create New Wallet
 * Generates a key pair server-side (or client-side logic handled by backend service in this architecture)
 * and saves it.
 */
async function createWallet() {
  if (!password.value) {
    error.value = 'Please enter a password.';
    return;
  }

  if (!token.value) {
    error.value = 'You must be logged in.';
    return;
  }

  isBusy.value = true;
  error.value = '';

  try {
    const res = await fetch(`${API_BASE_URL}/api/wallet/create`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: JSON.stringify({ password: password.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to create wallet.');
    }

    // Reload the wallet to switch state to 'locked'
    await loadWallet();
  } catch (err) {
    console.error('Error creating wallet:', err);
    error.value = err.message;
  } finally {
    isBusy.value = false;
  }
}

/**
 * 3. Unlock Wallet
 * Uses Ethers.js to decrypt the JSON with the user's 6-digit PIN.
 * This happens entirely in the browser (Client-Side Decryption).
 */
async function unlockWallet() {
  if (!password.value) {
    error.value = 'Please enter your 6-digit PIN.';
    return;
  }

  if (!encryptedJson.value) {
    error.value = 'No encrypted wallet found.';
    return;
  }

  isBusy.value = true;
  error.value = '';

  try {
    // heavy computation: Decrypts the wallet using PIN
    const wallet = await Wallet.fromEncryptedJson(encryptedJson.value, password.value);

    walletAddress.value = wallet.address;
    status.value = 'unlocked'; // State change to show assets

    // Now fetch the NFTs
    await loadAssets();
  } catch (err) {
    console.error('Error unlocking wallet:', err);
    error.value = 'Incorrect PIN or corrupted wallet.';
  } finally {
    isBusy.value = false;
  }
}

/**
 * Onboarding Step 2: Decrypt with temporary key and extract seed phrase
 */
async function startOnboarding() {
  isBusy.value = true;
  error.value = '';
  try {
    const wallet = await Wallet.fromEncryptedJson(encryptedJson.value, 'temporary-secure-wallet-key');
    seedPhrase.value = wallet.mnemonic?.phrase || '';
    if (!seedPhrase.value) {
      error.value = 'Could not extract recovery phrase from this wallet.';
      return;
    }
    walletAddress.value = wallet.address;
    onboardingStep.value = 2;
  } catch (err) {
    console.error('Onboarding decrypt failed:', err);
    error.value = 'Failed to decrypt wallet. Please contact support.';
  } finally {
    isBusy.value = false;
  }
}

/**
 * Onboarding Step 3: Re-encrypt with new PIN and save
 */
async function completeOnboarding() {
  if (newPin.value.length !== 6 || !/^\d{6}$/.test(newPin.value)) {
    error.value = 'PIN must be exactly 6 digits.';
    return;
  }
  if (newPin.value !== confirmPin.value) {
    error.value = 'PINs do not match.';
    return;
  }

  isBusy.value = true;
  error.value = '';
  try {
    // Decrypt with temp key
    const wallet = await Wallet.fromEncryptedJson(encryptedJson.value, 'temporary-secure-wallet-key');
    // Re-encrypt with user's chosen PIN
    const newEncryptedJson = await wallet.encrypt(newPin.value);

    // Save to backend
    const res = await fetch(`${API_BASE_URL}/api/wallet/update`, {
      method: 'POST',
      headers: apiHeaders.value,
      body: JSON.stringify({ 
        address: wallet.address,
        encryptedJson: newEncryptedJson, 
        walletPinSet: true 
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to save wallet.');
    }

    // Update local user object
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    user.wallet_pin_set = true;
    localStorage.setItem('user', JSON.stringify(user));

    toast.success('Wallet secured with your PIN! 🎉');

    // Clean up onboarding state
    seedPhrase.value = '';
    newPin.value = '';
    confirmPin.value = '';
    password.value = '';

    // Reload wallet into locked state
    await loadWallet();
  } catch (err) {
    console.error('Onboarding save failed:', err);
    error.value = err.message;
  } finally {
    isBusy.value = false;
  }
}

function copySeedPhrase() {
  navigator.clipboard.writeText(seedPhrase.value).then(() => {
    seedCopied.value = true;
    toast.success('Recovery phrase copied!');
  }).catch(() => {
    toast.error('Failed to copy. Please select and copy manually.');
  });
}

/**
 * 4. Load Assets (NFTs)
 * Fetches the list of NFTs from the backend, then fetches their Metadata from IPFS.
 */
async function loadAssets() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/wallet/assets`, {
      method: 'GET',
      headers: apiHeaders.value,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to load assets.');
    }

    const rawAssets = data.assets || [];
    
    // --- Metadata Resolution Strategy ---
    // The DB gives us the 'ipfsCid' (metadata file).
    // We need to fetch that file to get the real 'image' URL.
    assets.value = await Promise.all(rawAssets.map(async (asset) => {
       let resolvedImage = null;
       
       // Check if we have a CID to resolve
       if (asset.ipfsCid) { 
          try {
             // A. Construct Gateway URL for Metadata
             const metadataUrl = getIpfsUrl(asset.ipfsCid);
             
             // B. Fetch the JSON file
             const metaRes = await fetch(metadataUrl);
             const metaJson = await metaRes.json();
             
             // C. Extract the 'image' field from JSON
             if (metaJson.image) {
                resolvedImage = getIpfsUrl(metaJson.image);
             }
          } catch (e) {
             console.error("Failed to resolve metadata for token " + asset.tokenId, e);
          }
       }
       
       // Return asset with the 'imageUrl' property correctly populated
       return {
          ...asset,
          imageUrl: resolvedImage || getIpfsUrl(asset.imageUrl || asset.ipfsCid),
          isMetadataResolved: !!resolvedImage 
       };
    }));

  } catch (err) {
    console.error('Error loading assets:', err);
    error.value = err.message;
  }
}

// --- Helpers ---

function copyAddress() {
  if (!walletAddress.value) return;
  navigator.clipboard.writeText(walletAddress.value).catch(() => {});
}

// Format address (0x1234...5678)
const shortAddress = computed(() => {
  if (!walletAddress.value) return '';
  const addr = walletAddress.value;
  return addr.length > 10 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr;
});

// --- Modal Logic ---
const selectedAsset = ref(null);

function openModal(asset) {
  AudioService.playClick();
  selectedAsset.value = asset;
}

function closeModal() {
  selectedAsset.value = null;
}

// Backup/Recovery removed — seed phrase is shown during onboarding only.
// Forgot PIN recovery is handled by ForgotPin.vue.

function openVerification(hash) {
  if (!hash) return;
  // Opens the Etherscan transaction page
  window.open(`https://sepolia.etherscan.io/tx/${hash}`, '_blank');
}

// --- QR Code Modal ---
const qrModal = reactive({
  show: false,
  loading: false,
  qrCode: null,
  tokenId: null
});

async function showQRCode(asset) {
  qrModal.show = true;
  qrModal.loading = true;
  qrModal.tokenId = asset.tokenId;
  
  try {
    const res = await fetch(`${API_BASE_URL}/api/verify/qr/${asset.tokenId}`);
    if (res.ok) {
      const data = await res.json();
      qrModal.qrCode = data.qrCode;
    } else {
      throw new Error('Failed to generate QR');
    }
  } catch (err) {
    console.error('QR error:', err);
    toast.error('Failed to generate QR code');
    qrModal.show = false;
  } finally {
    qrModal.loading = false;
  }
}

async function copyVerificationLink(tokenId) {
  const link = `${window.location.origin}/verify/${tokenId}`;
  try {
    await navigator.clipboard.writeText(link);
    toast.success('Verification link copied to clipboard!');
  } catch {
    prompt('Copy this link:', link);
  }
}

const canNativeShare = typeof navigator.share === 'function';

async function nativeShareCertificate(tokenId, title) {
  const url = `${window.location.origin}/verify/${tokenId}`;
  try {
    await navigator.share({
      title: `Certificate: ${title || 'Achievement'}`,
      text: 'View and verify my blockchain certificate:',
      url
    });
  } catch (e) {
    if (e.name !== 'AbortError') toast.error('Could not share.');
  }
}

// --- IPFS Helper ---
/**
 * Converts an 'ipfs://' URI to a HTTP Gateway URL.
 * Using Backend Proxy to bypass CORS.
 */
function getIpfsUrl(cid) {
  if (!cid) return '';
  // If it's already a http link, return it
  if (cid.startsWith('http')) return cid;
  
  // Strip 'ipfs://' protocol if present
  const clean = cid.replace('ipfs://', '');
  return `${API_BASE_URL}/api/ipfs/${clean}`;
}

function onPasswordInput() {
  // PIN is always numeric
  const prevLen = password.value.length;
  password.value = password.value.replace(/\D/g, '');
  
  // Vibrate on new digit entry for a premium mobile feel
  if (password.value.length > prevLen || (password.value.length === 6 && prevLen === 6)) {
    if (navigator.vibrate) navigator.vibrate(10);
  }
}

function onPinInput(field) {
  if (field === 'new') {
    newPin.value = newPin.value.replace(/\D/g, '');
  } else {
    confirmPin.value = confirmPin.value.replace(/\D/g, '');
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
      <!-- Top Bar -->
      <header class="flex items-center justify-between px-4 md:px-8 py-5 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-5 border-b border-transparent glass-header transition-colors duration-300">
        <h2 class="text-xl font-bold text-gray-800 dark:text-white transition-colors">Wallet Dashboard</h2>
        <div class="flex items-center gap-4">
          <ThemeToggle />
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md"></div>
        </div>
      </header>

      <div class="p-4 md:p-8 mx-auto w-full flex-1">
          <!-- Top Banner for PIN Migration -->
          <div v-if="needsPinUpgrade" class="mb-8 p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                🔐
              </div>
              <div>
                <h3 class="text-indigo-900 dark:text-indigo-100 font-semibold text-left">Security Upgrade Recommended</h3>
                <p class="text-indigo-700 dark:text-indigo-300 text-sm text-left">You're using Passkeys! Set a 6-digit PIN for faster wallet access.</p>
              </div>
            </div>
            <button 
              @click="router.push('/passkey-setup')"
              class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-all shadow-lg shadow-indigo-500/20"
            >
              Secure with PIN →
            </button>
          </div>

          <div
            v-if="error"
            class="mb-4 rounded-lg border border-red-200 dark:border-red-500 bg-red-50 dark:bg-red-900/30 px-4 py-2 text-red-600 dark:text-red-300 text-sm max-w-2xl mx-auto transition-colors"
          >
            {{ error }}
          </div>

          <div v-if="status === 'unauthorized'" class="text-center text-gray-500 dark:text-gray-300 transition-colors">
            Please log in to access your wallet.
          </div>

          <div v-else-if="status === 'no-wallet' && !recoveryMode" class="max-w-2xl mx-auto glass-panel rounded-2xl p-8 shadow-xl transition-all duration-300">
            <h2 class="text-gray-900 dark:text-white tracking-tight text-3xl font-bold text-center mb-4 transition-colors">
              Secure Your Digital Identity
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-center mb-6 transition-colors">
              Create an encrypted blockchain wallet to safely store your achievement records. Your
              private key never leaves your device.
            </p>

            <label class="flex flex-col w-full mb-4">
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 transition-colors">Wallet Password</span>
              <input
                v-model="password"
                type="password"
                placeholder="Enter a strong password"
                class="flex w-full rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 border border-gray-300 dark:border-[#3b4754] bg-gray-50 dark:bg-transparent h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-base font-normal transition-all"
              />
            </label>

            <button
              @click="createWallet"
              :disabled="isBusy"
              class="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-sky-600 hover:bg-sky-700 text-white text-base font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sky-500/30"
            >
              <span v-if="!isBusy">Create My Wallet</span>
              <span v-else>Creating...</span>
            </button>
          </div>

          <!-- ONBOARDING MODE: First-time wallet setup -->
          <div v-else-if="status === 'onboarding'" class="max-w-lg mx-auto glass-panel rounded-2xl p-8 mt-10 shadow-xl transition-all duration-300 animate-fadeIn">

            <!-- Step 1: Introduction -->
            <template v-if="onboardingStep === 1">
              <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-3xl mx-auto mb-4">🔐</div>
                <h2 class="text-gray-900 dark:text-white tracking-tight text-3xl font-bold transition-colors">Secure Your Wallet</h2>
                <p class="text-gray-500 dark:text-gray-400 mt-3 transition-colors">
                  Your blockchain wallet has been created! Let's secure it with a <strong>6-digit PIN</strong> and save your <strong>recovery phrase</strong>.
                </p>
              </div>
              <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 rounded-xl p-4 mb-6 text-sm text-amber-800 dark:text-amber-200">
                <strong>⚠️ Important:</strong> This is a one-time setup. You will see your 12-word recovery phrase on the next screen. Save it somewhere safe — it's the only way to recover your wallet if you forget your PIN.
              </div>
              <button
                @click="startOnboarding"
                :disabled="isBusy"
                class="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                <span v-if="!isBusy">Continue →</span>
                <span v-else>Decrypting wallet...</span>
              </button>
            </template>

            <!-- Step 2: Show Seed Phrase -->
            <template v-else-if="onboardingStep === 2">
              <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl mx-auto mb-4">🌱</div>
                <h2 class="text-gray-900 dark:text-white tracking-tight text-2xl font-bold transition-colors">Your Recovery Phrase</h2>
                <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm transition-colors">
                  Write down these 12 words in order. This is the <strong>only</strong> way to recover your wallet.
                </p>
              </div>

              <div class="bg-gray-50 dark:bg-[#161b22] border border-gray-200 dark:border-[#30363d] rounded-xl p-4 mb-4">
                <div class="grid grid-cols-3 gap-2">
                  <div
                    v-for="(word, i) in seedPhrase.split(' ')"
                    :key="i"
                    class="flex items-center gap-2 bg-white dark:bg-[#0d1117] rounded-lg px-3 py-2 border border-gray-100 dark:border-[#21262d]"
                  >
                    <span class="text-xs text-gray-400 font-mono w-4 text-right">{{ i + 1 }}</span>
                    <span class="text-sm font-mono text-gray-900 dark:text-white font-medium">{{ word }}</span>
                  </div>
                </div>
              </div>

              <button
                @click="copySeedPhrase"
                class="w-full mb-4 py-2 rounded-xl border border-gray-300 dark:border-[#30363d] text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#21262d] transition-colors"
              >
                {{ seedCopied ? '✅ Copied!' : '📋 Copy to Clipboard' }}
              </button>

              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl p-3 mb-6 text-xs text-red-700 dark:text-red-300">
                <strong>🚨 Never share this phrase.</strong> Anyone with these words can access your wallet and all your certificates.
              </div>

              <button
                @click="onboardingStep = 3"
                :disabled="!seedCopied"
                class="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-indigo-600 hover:bg-indigo-500 text-white text-base font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                I've Saved My Phrase → Set PIN
              </button>
            </template>

            <!-- Step 3: Set PIN -->
            <template v-else-if="onboardingStep === 3">
              <div class="text-center mb-6">
                <div class="w-16 h-16 rounded-2xl bg-sky-500/20 flex items-center justify-center text-3xl mx-auto mb-4">🔢</div>
                <h2 class="text-gray-900 dark:text-white tracking-tight text-2xl font-bold transition-colors">Set Your Wallet PIN</h2>
                <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm transition-colors">
                  Choose a 6-digit PIN to unlock your wallet quickly.
                </p>
              </div>

              <label class="flex flex-col w-full mb-4">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 transition-colors">New PIN</span>
                <input
                  v-model="newPin"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="● ● ● ● ● ●"
                  class="flex w-full rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-[#3b4754] bg-gray-50 dark:bg-transparent h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-center font-mono tracking-[0.5em] text-xl transition-all"
                  @input="onPinInput('new')"
                />
              </label>

              <label class="flex flex-col w-full mb-6">
                <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 transition-colors">Confirm PIN</span>
                <input
                  v-model="confirmPin"
                  type="text"
                  inputmode="numeric"
                  maxlength="6"
                  placeholder="● ● ● ● ● ●"
                  class="flex w-full rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-gray-300 dark:border-[#3b4754] bg-gray-50 dark:bg-transparent h-14 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-center font-mono tracking-[0.5em] text-xl transition-all"
                  @input="onPinInput('confirm')"
                />
              </label>

              <button
                @click="completeOnboarding"
                :disabled="isBusy || newPin.length !== 6 || confirmPin.length !== 6"
                class="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-green-600 hover:bg-green-500 text-white text-base font-bold transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-green-500/20"
              >
                <span v-if="!isBusy">Secure My Wallet ✅</span>
                <span v-else>Encrypting...</span>
              </button>

              <div class="text-center mt-4">
                <button @click="onboardingStep = 2" class="text-gray-500 hover:underline text-sm font-medium">← Back to Recovery Phrase</button>
              </div>
            </template>
          </div>

          <!-- LOCKED STATE: PIN Unlock -->
          <div v-else-if="status === 'locked'" class="max-w-md mx-auto glass-panel rounded-2xl p-8 mt-10 shadow-xl transition-all duration-300">
            <h2 class="text-gray-900 dark:text-white tracking-tight text-3xl font-bold text-center mb-4 transition-colors">
              Welcome Back
            </h2>
            <p class="text-gray-500 dark:text-gray-400 text-center mb-6 transition-colors">
              Enter your 6-digit Wallet PIN to unlock your achievements.
            </p>

            <div class="mb-4 text-center text-sm text-gray-500 dark:text-gray-400 transition-colors">
              Linked Address:
              <span class="font-mono text-gray-700 dark:text-gray-200">{{ shortAddress }}</span>
            </div>

            <label class="flex flex-col w-full mb-4">
              <span class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 transition-colors">Wallet PIN</span>
              <input
                v-model="password"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="Enter 6-digit PIN"
                class="flex w-full rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 border border-gray-300 dark:border-[#3b4754] bg-gray-50 dark:bg-transparent h-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 px-4 text-center font-mono tracking-[0.5em] text-xl transition-all"
                @input="onPasswordInput"
              />
            </label>

            <button
              @click="unlockWallet"
              :disabled="isBusy"
              class="flex w-full cursor-pointer items-center justify-center rounded-xl h-12 px-6 bg-sky-600 hover:bg-sky-700 text-white text-base font-bold transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-sky-500/30 mb-4"
            >
              <span v-if="!isBusy">Unlock</span>
              <span v-else>Unlocking...</span>
            </button>

            <div class="text-center">
              <router-link to="/forgot-pin" class="text-sky-600 hover:underline text-sm font-medium">Forgot PIN?</router-link>
            </div>
          </div>


          <div v-else-if="status === 'unlocked'" class="max-w-7xl mx-auto">
            <div class="flex items-center justify-between mb-6 glass-panel p-4 rounded-xl shadow-sm dark:shadow-none transition-all duration-300">
              <div>
                <h2 class="text-gray-900 dark:text-white text-xl font-bold transition-colors">My Wallet</h2>
                <p class="text-gray-500 dark:text-gray-400 text-sm transition-colors">
                  Manage your achievement records.
                </p>
              </div>
              <div class="flex items-center gap-2">
                <span
                  class="font-mono text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-transparent border border-gray-200 dark:border-[#3b4754] rounded-lg px-3 py-1 transition-colors"
                >
                  {{ shortAddress }}
                </span>
                <button
                  @click="copyAddress"
                  class="p-2 rounded-lg bg-gray-100 dark:bg-[#283039] hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-200 transition-colors"
                  title="Copy address"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2M9 5a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v6M9 5h6a2 2 0 0 1 2 2v6"
                    />
                  </svg>
                </button>
                <button
                  @click="startBackup"
                  class="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-700/50 hover:bg-amber-200 transition-colors flex items-center gap-2"
                >
                  <span>🛡️</span> Backup
                </button>
              </div>
            </div>

            <div>
              <h3 class="text-gray-900 dark:text-white text-lg font-semibold mb-3 transition-colors">My Achievements</h3>

              <div v-if="assets.length === 0" class="text-gray-500 dark:text-gray-400 text-sm transition-colors">
                No achievements found yet. Once your institution anchors records to this wallet, they
                will appear here.
              </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div
                  v-for="asset in assets"
                  :key="asset.tokenId"
                  @click="openModal(asset)"
                  class="glass-card rounded-xl overflow-hidden shadow-lg cursor-pointer transition-all duration-300 group"
                >
                  <div class="relative">
                    <img
                      v-if="asset.imageUrl"
                      :src="asset.imageUrl"
                      :alt="asset.title"
                      class="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div class="absolute inset-0 bg-black/5 dark:bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                  </div>
                  
                  <div class="p-4">
                    <h4 class="text-gray-900 dark:text-white font-bold mb-1 truncate text-lg transition-colors">
                      {{ asset.title }}
                    </h4>
                    <p class="text-gray-500 dark:text-gray-400 text-xs mb-2 transition-colors">
                      Issued: {{ asset.issueDate ? new Date(asset.issueDate).toLocaleDateString() : 'N/A' }}
                    </p>
                    <div class="flex items-center gap-2 mt-3">
                         <span 
                           v-if="!asset.isRevoked"
                           class="text-[10px] bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50 px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-colors"
                         >
                            Verified
                         </span>
                         <span 
                           v-else
                           class="text-[10px] bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-700/50 px-2 py-0.5 rounded uppercase font-bold tracking-wider transition-colors"
                         >
                            ⚠️ Revoked
                         </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
      </div>



    <!-- MODAL OVERLAY -->
    <div v-if="selectedAsset" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm" @click.self="closeModal">
      <div class="bg-white dark:bg-[#1b2127] border border-gray-200 dark:border-[#3b4754] w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative animate-fadeIn transition-colors duration-300">
        
        <!-- Close Button -->
        <button @click="closeModal" class="absolute top-4 right-4 text-white hover:text-red-400 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full backdrop-blur-md transition-colors">
           <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
           </svg>
        </button>

        <!-- Certificate Image -->
        <div class="w-full h-64 bg-gray-100 dark:bg-black flex items-center justify-center relative">
           <img 
              :src="selectedAsset.imageUrl" 
              class="w-full h-full object-contain"
           />
        </div>

        <!-- Content -->
        <div class="p-6">
            <div class="mb-4">
               <div v-if="selectedAsset.isRevoked" class="mb-3 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-900/30 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-xs uppercase tracking-widest">
                  <span>⚠️</span> CERTIFICATE REVOKED BY INSTITUTION
               </div>
               <p class="text-sky-600 dark:text-sky-400 text-xs font-bold uppercase tracking-wider mb-1 transition-colors">{{ selectedAsset.department || 'University Achievement' }}</p>
               <h2 class="text-gray-900 dark:text-white text-2xl font-bold leading-tight transition-colors">{{ selectedAsset.title }}</h2>
               <p class="text-gray-500 dark:text-gray-400 text-sm mt-1 transition-colors">Issued to You on {{ selectedAsset.issueDate ? new Date(selectedAsset.issueDate).toLocaleDateString() : 'Unknown Date' }}</p>
            </div>
           
           <div class="bg-gray-50 dark:bg-[#111418] rounded-xl p-4 mb-4 border border-gray-200 dark:border-[#283039] transition-colors">
              <h4 class="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-2 transition-colors">Description</h4>
              <p class="text-gray-600 dark:text-gray-400 text-sm leading-relaxed transition-colors">
                 {{ selectedAsset.description || 'No description provided for this certificate.' }}
              </p>
           </div>

           <!-- Certificate Timeline -->
           <div class="mb-6">
             <h4 class="text-gray-700 dark:text-gray-300 text-sm font-semibold mb-3 transition-colors">📅 Certificate History</h4>
             <ol class="relative border-l-2 border-gray-200 dark:border-[#283039] ml-2 space-y-4">
               <!-- Issued -->
               <li class="ml-4">
                 <span class="absolute -left-[9px] w-4 h-4 rounded-full bg-green-500 border-2 border-white dark:border-[#1b2127]"></span>
                 <p class="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Issued</p>
                 <p class="text-xs text-gray-500 dark:text-gray-400">{{ selectedAsset.issueDate ? new Date(selectedAsset.issueDate).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : 'Date unknown' }}</p>
                 <p v-if="selectedAsset.transactionHash" class="font-mono text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 truncate">Tx: {{ selectedAsset.transactionHash?.slice(0,18) }}…</p>
               </li>
               <!-- Revoked -->
               <li v-if="selectedAsset.isRevoked" class="ml-4">
                 <span class="absolute -left-[9px] w-4 h-4 rounded-full bg-red-500 border-2 border-white dark:border-[#1b2127]"></span>
                 <p class="text-xs font-bold text-red-500 dark:text-red-400 uppercase tracking-wide">Revoked by Institution</p>
                 <p class="text-xs text-gray-500 dark:text-gray-400">Certificate is no longer valid for public verification.</p>
               </li>
               <!-- Current status (if not revoked) -->
               <li v-else class="ml-4">
                 <span class="absolute -left-[9px] w-4 h-4 rounded-full bg-sky-400 border-2 border-white dark:border-[#1b2127] animate-pulse"></span>
                 <p class="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wide">Currently Valid</p>
                 <p class="text-xs text-gray-500 dark:text-gray-400">Verifiable on-chain at any time.</p>
               </li>
             </ol>
           </div>

           <!-- Action Buttons -->
           <div class="space-y-3">
             <!-- Add to LinkedIn Button -->
             <a 
               :href="generateLinkedInCertUrl(selectedAsset)"
               target="_blank"
               rel="noopener noreferrer"
               class="w-full bg-[#0a66c2] hover:bg-[#004182] text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-10h3v10zm-1.5-11.27c-.96 0-1.5-.63-1.5-1.42 0-.8.55-1.42 1.53-1.42.97 0 1.5.62 1.5 1.42 0 .79-.53 1.42-1.53 1.42zm11.5 11.27h-3v-5.6c0-1.42-.5-2.39-1.78-2.39-.97 0-1.55.65-1.8 1.28-.09.23-.11.55-.11.87v5.84h-3s.04-8.1 0-8.9h3v1.26c.4-.61 1.1-1.48 2.68-1.48 1.96 0 3.43 1.28 3.43 4.02v5.1z"/></svg>
               Add to LinkedIn
             </a>

             <!-- Share QR Button -->
             <button 
               @click="showQRCode(selectedAsset)"
               class="w-full bg-purple-600 hover:bg-purple-700 dark:hover:bg-purple-500 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
             >
               <span>📱</span>
               Share QR Code
             </button>

             <!-- Inspect on Blockchain Button -->
             <button 
               @click="openVerification(selectedAsset.transactionHash)"
               class="w-full bg-white dark:bg-white text-slate-900 font-bold py-3 rounded-xl border border-gray-200 dark:border-transparent hover:bg-gray-50 dark:hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
               </svg>
               Inspect on Blockchain
             </button>
           </div>
        </div>

      </div>
    </div>

    <!-- QR Code Modal -->
    <div v-if="qrModal.show" class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 dark:bg-black/90 backdrop-blur-sm" @click.self="qrModal.show = false">
      <div class="bg-white dark:bg-[#1b2127] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl border border-gray-200 dark:border-[#3b4754] p-6 transition-colors duration-300">
        <h3 class="text-gray-900 dark:text-white text-lg font-bold mb-4 text-center transition-colors">Share Access</h3>
        
        <div v-if="qrModal.loading" class="text-center py-8">
          <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-500 mx-auto"></div>
          <p class="text-gray-500 dark:text-gray-400 mt-3 text-sm transition-colors">Generating QR...</p>
        </div>
        
        <div v-else>
          <!-- Tap QR to open link -->
          <a 
            :href="`/verify/${qrModal.tokenId}`" 
            target="_blank"
            class="block cursor-pointer"
          >
            <img v-if="qrModal.qrCode" :src="qrModal.qrCode" alt="QR Code" class="mx-auto rounded-lg mb-2 border border-gray-200 dark:border-gray-700 hover:border-sky-500 transition-colors" />
          </a>
          <p class="text-gray-500 text-xs text-center mb-4">
            Tap QR to open inspection page
          </p>
          <div class="space-y-2">
            <!-- Open Link Button (for mobile) -->
            <a 
              :href="`/verify/${qrModal.tokenId}`"
              target="_blank"
              class="w-full px-4 py-3 bg-green-600 hover:bg-green-700 dark:hover:bg-green-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              🔗 Open Inspection Page
            </a>
            <button 
              @click="copyVerificationLink(qrModal.tokenId)"
              class="w-full px-4 py-3 bg-sky-600 hover:bg-sky-700 dark:hover:bg-sky-500 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              📋 Copy Link
            </button>
            <button
              v-if="canNativeShare"
              @click="nativeShareCertificate(qrModal.tokenId, selectedAsset?.title)"
              class="w-full px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              📤 Share via...
            </button>
            <button 
              @click="qrModal.show = false"
              class="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl text-sm transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
    <!-- WALLET BACKUP MODAL -->
    <div v-if="showBackup" class="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" @click.self="showBackup = false">
      <div class="bg-white dark:bg-[#1b2127] w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-amber-200 dark:border-amber-900/30 p-8 transition-colors">
        <h3 class="text-amber-600 dark:text-amber-400 text-xl font-bold mb-2 flex items-center gap-2">
          <span>🛡️</span> Secret Recovery Phrase
        </h3>
        <p class="text-gray-500 dark:text-gray-400 text-sm mb-6 uppercase tracking-widest font-bold">
          Store this securely. Never share it.
        </p>

        <div v-if="!revealMnemonic" class="bg-gray-100 dark:bg-black rounded-xl p-8 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-800">
           <p class="text-gray-400 text-xs text-center mb-4 italic">Pressing this will reveal your 12-word recovery phrase. Ensure no one is watching.</p>
           <button @click="revealMnemonic = true" class="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-transform hover:scale-105">
             Reveal Phrase
           </button>
        </div>

        <div v-else class="animate-fadeIn">
           <div class="grid grid-cols-3 gap-2 mb-6">
              <div v-for="(word, i) in backupPhrase.split(' ')" :key="i" class="bg-gray-50 dark:bg-[#111418] p-2 rounded-lg border border-gray-200 dark:border-[#283039] text-center">
                 <span class="text-[10px] text-gray-400 block">{{ i + 1 }}</span>
                 <span class="font-mono text-sm text-gray-900 dark:text-white font-bold">{{ word }}</span>
              </div>
           </div>
           
           <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 mb-6">
              <p class="text-red-600 dark:text-red-400 text-xs leading-relaxed">
                <strong>WARNING:</strong> Anyone with these words can steal your entire wallet. Write them down on paper and hide them. Do not save them on your computer or phone.
              </p>
           </div>
        </div>

        <button 
          @click="showBackup = false; revealMnemonic = false" 
          class="w-full py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl transition-colors mt-2"
        >
          Finished & Secured
        </button>
      </div>
    </div>
  </div>
</template>


