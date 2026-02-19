<template>
  <div class="h-full flex flex-col">
      <header class="flex items-center justify-between px-4 md:px-8 py-5 pt-[calc(1.25rem+env(safe-area-inset-top))] md:pt-5 border-b border-transparent glass-header transition-colors duration-300">
        <h2 class="text-xl font-bold text-gray-800 dark:text-white transition-colors">Settings</h2>
        <div class="flex items-center gap-4">
          <ThemeToggle />
          <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-md"></div>
        </div>
      </header>

      <div class="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        <!-- Tabs -->
        <div class="flex gap-4 border-b dark:border-[#30363d] border-gray-200 pb-1 overflow-x-auto no-scrollbar whitespace-nowrap">
          <button 
            @click="activeTab = 'profile'"
            :class="[
              'px-4 py-2 font-medium text-sm transition-colors relative',
              activeTab === 'profile' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Profile
            <div v-if="activeTab === 'profile'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
          </button>
          
          <button 
            @click="activeTab = 'security'"
            :class="[
              'px-4 py-2 font-medium text-sm transition-colors relative',
              activeTab === 'security' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Security
            <div v-if="activeTab === 'security'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
          </button>

          <button 
            @click="activeTab = 'appearance'"
            :class="[
              'px-4 py-2 font-medium text-sm transition-colors relative',
              activeTab === 'appearance' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            ]"
          >
            Appearance
            <div v-if="activeTab === 'appearance'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 rounded-t-full"></div>
          </button>
        </div>

        <!-- PROFILE TAB -->
        <section v-if="activeTab === 'profile'" class="animate-fade-in">
           <div class="bg-white dark:bg-[#161b22] border dark:border-[#30363d] border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
             <div class="flex items-center gap-6 mb-8">
               <div class="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl text-white font-bold shadow-xl">
                 {{ userInitials }}
               </div>
               <div>
                 <h3 class="text-2xl font-bold">{{ user?.full_name || 'Student' }}</h3>
                 <p class="text-gray-500 dark:text-gray-400">{{ user?.email }}</p>
                 <span class="inline-block mt-2 px-3 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                   Active Student
                 </span>
               </div>
             </div>

             <div class="grid md:grid-cols-2 gap-6">
               <div class="p-4 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200">
                 <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Student ID</label>
                 <p class="font-mono text-lg mt-1">{{ user?.student_id_number || 'N/A' }}</p>
               </div>
               <div class="p-4 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200">
                 <label class="text-xs font-bold text-gray-500 uppercase tracking-wider">Wallet Address</label>
                 <p class="font-mono text-sm mt-1 truncate" :title="user?.ethereum_address">{{ user?.ethereum_address || 'Not Connected' }}</p>
               </div>
             </div>
           </div>
        </section>

        <!-- SECURITY TAB -->
        <section v-if="activeTab === 'security'" class="animate-fade-in">
          <div class="bg-white dark:bg-[#161b22] border dark:border-[#30363d] border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 class="text-xl font-bold mb-6 flex items-center gap-2">
              🔒 Change Password
            </h3>

            <!-- Reuse logic from previous implementation -->
            <form @submit.prevent="handleChangePassword" class="space-y-6 max-w-lg">
              
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                <input 
                  v-model="form.oldPassword"
                  type="password" 
                  required
                  class="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition dark:text-white"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                <input 
                  v-model="form.newPassword"
                  type="password" 
                  required
                  minlength="6"
                  class="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition dark:text-white"
                  placeholder="At least 6 characters"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                <input 
                  v-model="form.confirmPassword"
                  type="password" 
                  required
                  minlength="6"
                  class="w-full bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition dark:text-white"
                  placeholder="Re-enter new password"
                />
              </div>

              <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                ⚠️ {{ error }}
              </div>
              
              <div v-if="success" class="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm">
                ✅ {{ success }}
              </div>

              <button 
                type="submit" 
                :disabled="isLoading"
                class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50"
              >
                {{ isLoading ? 'Updating...' : 'Update Password' }}
              </button>
            </form>
          </div>

          <!-- Two-Factor Authentication Section -->
          <div class="bg-white dark:bg-[#161b22] border dark:border-[#30363d] border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
            <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
              🔐 Two-Factor Authentication
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Add an extra layer of security using a TOTP authenticator app (Google Authenticator, Authy, etc).
            </p>

            <!-- 2FA Enabled Status -->
            <div v-if="twoFA.enabled" class="space-y-4">
              <div class="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
                <span class="text-green-400 text-2xl">✓</span>
                <div>
                  <p class="text-green-400 font-semibold">2FA is enabled</p>
                  <p class="text-xs text-gray-500">Your account is protected with two-factor authentication</p>
                </div>
              </div>

              <div class="space-y-3">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Enter password to disable</label>
                <input
                  v-model="twoFA.disablePassword"
                  type="password"
                  placeholder="Your current password"
                  class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none"
                />
                <button
                  @click="handleDisable2FA"
                  :disabled="twoFA.isLoading || !twoFA.disablePassword"
                  class="px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 text-white text-sm font-medium rounded-xl transition"
                >
                  {{ twoFA.isLoading ? 'Disabling...' : 'Disable 2FA' }}
                </button>
              </div>
            </div>

            <!-- Setup Flow -->
            <div v-else>
              <!-- Step 1: Start -->
              <div v-if="twoFA.step === 'idle'">
                <button
                  @click="handleSetup2FA"
                  :disabled="twoFA.isLoading"
                  class="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/20"
                >
                  {{ twoFA.isLoading ? 'Setting up...' : 'Enable 2FA' }}
                </button>
              </div>

              <!-- Step 2: QR Code -->
              <div v-if="twoFA.step === 'qr'" class="space-y-4">
                <div class="bg-white dark:bg-[#0d1117] rounded-xl p-6 text-center border dark:border-[#30363d]">
                  <p class="text-sm text-gray-500 mb-4">Scan this QR code with your authenticator app:</p>
                  <img v-if="twoFA.qrCode" :src="twoFA.qrCode" alt="QR Code" class="mx-auto w-48 h-48 rounded-lg" />
                  <div class="mt-3">
                    <p class="text-xs text-gray-500">Manual entry key:</p>
                    <code class="text-xs text-indigo-400 font-mono select-all">{{ twoFA.secret }}</code>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Enter the 6-digit code from your app</label>
                  <input
                    v-model="twoFA.verifyCode"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    placeholder="000000"
                    class="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-center font-mono text-xl tracking-widest placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                </div>
                <button
                  @click="handleVerifySetup"
                  :disabled="twoFA.isLoading || twoFA.verifyCode.length < 6"
                  class="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-600 text-white font-semibold rounded-xl transition"
                >
                  {{ twoFA.isLoading ? 'Verifying...' : 'Verify & Enable' }}
                </button>
              </div>

              <!-- Step 3: Recovery Codes -->
              <div v-if="twoFA.step === 'recovery'" class="space-y-4">
                <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <p class="text-amber-300 text-sm font-semibold mb-1">⚠ Save these recovery codes</p>
                  <p class="text-amber-400/70 text-xs">Each code can only be used once. Store them somewhere safe.</p>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  <code
                    v-for="code in twoFA.recoveryCodes"
                    :key="code"
                    class="block p-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-center font-mono text-sm text-white select-all"
                  >{{ code }}</code>
                </div>
                <button
                  @click="twoFA.step = 'idle'"
                  class="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl transition"
                >
                  I've saved my codes ✓
                </button>
              </div>
            </div>

            <!-- 2FA Error/Success -->
            <div v-if="twoFA.error" class="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/20 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 text-sm">
              {{ twoFA.error }}
            </div>
            <div v-if="twoFA.success" class="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-500/20 border border-green-200 dark:border-green-500/30 text-green-600 dark:text-green-200 text-sm">
              {{ twoFA.success }}
            </div>
          </div>

          <!-- Passkey Management Section -->
          <div v-if="passkeySupported" class="bg-white dark:bg-[#161b22] border dark:border-[#30363d] border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
            <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
              🔑 Passkeys
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Passkeys let you sign in using your fingerprint, face, or device PIN — no password needed.
            </p>

            <!-- Passkeys List -->
            <div v-if="passkeys.length > 0" class="space-y-3 mb-6">
              <div 
                v-for="pk in passkeys" 
                :key="pk.id"
                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200 group hover:border-indigo-400 dark:hover:border-indigo-500/30 transition-all"
              >
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-lg shadow-md">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                    </svg>
                  </div>
                  <div>
                    <p class="font-medium text-gray-800 dark:text-white">{{ pk.friendly_name || 'Passkey' }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      Added {{ formatDate(pk.created_at) }}
                      <span v-if="pk.backed_up" class="ml-2 inline-flex items-center gap-1 text-green-500">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                        Synced
                      </span>
                    </p>
                  </div>
                </div>
                <button
                  @click="handleDeletePasskey(pk.id, pk.friendly_name)"
                  class="px-3 py-1.5 text-xs font-medium text-red-500 hover:text-white hover:bg-red-500 border border-red-200 dark:border-red-500/30 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  Delete
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-else class="p-6 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200 text-center mb-6">
              <div class="w-12 h-12 mx-auto mb-3 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center">
                <svg class="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">No passkeys registered yet.</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Add one to enable passwordless sign-in.</p>
            </div>

            <!-- Register Button -->
            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <input
                v-model="newPasskeyName"
                type="text"
                class="flex-1 w-full sm:w-auto bg-gray-50 dark:bg-[#0d1117] border border-gray-300 dark:border-[#30363d] rounded-xl px-4 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition dark:text-white text-sm"
                placeholder="Passkey name (e.g., MacBook Touch ID)"
              />
              <button
                @click="handleRegisterPasskey"
                :disabled="isPasskeyLoading"
                class="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 text-sm whitespace-nowrap flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                {{ isPasskeyLoading ? 'Registering...' : 'Register New Passkey' }}
              </button>
            </div>

            <!-- Passkey Success/Error Messages -->
            <div v-if="passkeyError" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
              ⚠️ {{ passkeyError }}
            </div>
            <div v-if="passkeySuccess" class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-500/30 rounded-xl text-green-600 dark:text-green-400 text-sm">
              ✅ {{ passkeySuccess }}
            </div>

            <!-- Info Box -->
            <div class="mt-6 p-4 bg-indigo-50 dark:bg-indigo-900/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm flex gap-3">
              <span>💡</span>
              <p>Passkeys are stored securely on your device. They use biometrics (fingerprint, face) or your device PIN — your biometric data is never sent to our servers.</p>
            </div>
          </div>

          <!-- Wallet PIN Management Section -->
          <div class="bg-white dark:bg-[#161b22] border dark:border-[#30363d] border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm mt-6">
            <h3 class="text-xl font-bold mb-2 flex items-center gap-2">
              🔢 Wallet Security (PIN)
            </h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Use a 6-digit PIN to secure your wallet actions. This is separate from your account password.
            </p>

            <div class="flex items-center justify-between p-6 bg-gray-50 dark:bg-[#0d1117] rounded-xl border dark:border-[#30363d] border-gray-200">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-2xl">
                  {{ user.wallet_pin_set ? '🛡️' : '🔓' }}
                </div>
                <div>
                  <p class="font-bold text-gray-900 dark:text-white">
                    {{ user.wallet_pin_set ? 'PIN Protection Active' : 'PIN Protection Inactive' }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ user.wallet_pin_set ? 'Your wallet is encrypted with a PIN.' : 'Your wallet is currently encrypted with your password.' }}
                  </p>
                </div>
              </div>
              <button 
                @click="router.push('/passkey-setup')"
                class="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-purple-500/20"
              >
                {{ user.wallet_pin_set ? 'Change PIN' : 'Set Up PIN' }}
              </button>
            </div>

            <div v-if="!user.wallet_pin_set && user.has_passkeys" class="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl flex gap-3">
              <span class="text-amber-500">⚠️</span>
              <p class="text-sm text-amber-700 dark:text-amber-400">
                <strong>Recommended:</strong> You have a passkey set up! We recommend setting a Wallet PIN for faster and more secure access to your achievements.
              </p>
            </div>
          </div>
        </section>

        <!-- APPEARANCE TAB -->
        <section v-if="activeTab === 'appearance'" class="animate-fade-in">
          <div class="bg-white dark:bg-[#161b22] border dark:border-[#30363d] border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
            <h3 class="text-xl font-bold mb-6">🎨 Interface Theme</h3>
            
            <div class="flex gap-6">
              <button 
                @click="setTheme(false)"
                class="flex-1 p-6 border-2 rounded-2xl transition-all relative overflow-hidden group text-center"
                :class="!isDark ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500/50'"
              >
                <div class="w-16 h-16 mx-auto bg-white rounded-full shadow-md flex items-center justify-center text-3xl mb-4 text-orange-400 border border-gray-100">
                  ☀️
                </div>
                <h4 class="font-bold text-gray-900 dark:text-white">Light Mode</h4>
                <p class="text-sm text-gray-500 mt-2">Clean, crisp, and bright.</p>
                <div v-if="!isDark" class="absolute top-4 right-4 text-indigo-500">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                </div>
              </button>

              <button 
                @click="setTheme(true)"
                class="flex-1 p-6 border-2 rounded-2xl transition-all relative overflow-hidden group text-center"
                :class="isDark ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-200 dark:border-gray-700 hover:border-indigo-500/50'"
              >
                <div class="w-16 h-16 mx-auto bg-[#0d1117] rounded-full shadow-md flex items-center justify-center text-3xl mb-4 text-indigo-400 border border-gray-700">
                  🌙
                </div>
                <h4 class="font-bold text-gray-900 dark:text-white">Dark Mode</h4>
                <p class="text-sm text-gray-500 mt-2">Sleek, immersive, and easy on eyes.</p>
                <div v-if="isDark" class="absolute top-4 right-4 text-indigo-500">
                  <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
                </div>
              </button>
            </div>

            <div class="mt-8 p-4 bg-orange-50 dark:bg-orange-900/10 text-orange-600 dark:text-orange-400 rounded-xl text-sm flex gap-3">
              <span>💡</span>
              <p>Your theme preference is saved automatically and will persist across all pages.</p>
            </div>
          </div>
        </section>

      </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { isDark, toggleTheme } from '../services/theme'
import ThemeToggle from '../components/ThemeToggle.vue'
import { registerPasskey, getPasskeys, deletePasskey, isPasskeySupported } from '../services/passkeyService.js'
import { useConfirm } from '../composables/useConfirm.js'
import { API_BASE_URL } from '../apiConfig'

const { confirm } = useConfirm()

const router = useRouter()
const activeTab = ref('profile') // Default tab
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

// Computed
const userInitials = computed(() => {
  const name = user.value.full_name || 'Student'
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
})

// Theme Handling
function setTheme(dark) {
  if (isDark.value !== dark) {
    toggleTheme()
  }
}

// Password Form State
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const isLoading = ref(false)
const error = ref('')
const success = ref('')

// Passkey State
const passkeySupported = ref(false)
const passkeys = ref([])
const newPasskeyName = ref('')
const isPasskeyLoading = ref(false)
const passkeyError = ref('')
const passkeySuccess = ref('')

// 2FA State
const twoFA = reactive({
  enabled: false,
  step: 'idle', // 'idle' | 'qr' | 'recovery'
  qrCode: '',
  secret: '',
  verifyCode: '',
  recoveryCodes: [],
  disablePassword: '',
  isLoading: false,
  error: '',
  success: ''
})

function logout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

function formatDate(dateStr) {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

// Fetch fresh user data and passkeys on mount
onMounted(async () => {
    passkeySupported.value = isPasskeySupported()

    const token = localStorage.getItem('token')
    if (token) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                user.value = data
                localStorage.setItem('user', JSON.stringify(data))
            }
        } catch (e) {
            console.error(e)
        }

        // Load passkeys
        if (passkeySupported.value) {
            await fetchPasskeys()
        }

        // Check if 2FA is enabled
        twoFA.enabled = data?.totp_enabled || false
    }
})

async function fetchPasskeys() {
  try {
    const data = await getPasskeys()
    passkeys.value = data
  } catch (e) {
    console.error('Failed to fetch passkeys:', e)
  }
}

async function handleRegisterPasskey() {
  passkeyError.value = ''
  passkeySuccess.value = ''
  isPasskeyLoading.value = true

  try {
    const name = newPasskeyName.value.trim() || 'My Passkey'
    await registerPasskey(name)
    passkeySuccess.value = `Passkey "${name}" registered successfully!`
    newPasskeyName.value = ''
    await fetchPasskeys() // Refresh the list
  } catch (err) {
    passkeyError.value = err.message
  } finally {
    isPasskeyLoading.value = false
  }
}

async function handleDeletePasskey(credentialId, name) {
  const ok = await confirm(
    'Delete Passkey',
    `Delete passkey "${name || 'Passkey'}"? You won't be able to use it to sign in anymore.`,
    { danger: true, confirmText: 'Delete' }
  )
  if (!ok) {
    return
  }

  passkeyError.value = ''
  passkeySuccess.value = ''

  try {
    await deletePasskey(credentialId)
    passkeySuccess.value = 'Passkey deleted successfully.'
    await fetchPasskeys() // Refresh the list
  } catch (err) {
    passkeyError.value = err.message
  }
}


async function handleSetup2FA() {
  twoFA.isLoading = true
  twoFA.error = ''
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE_URL}/api/auth/2fa/setup`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    twoFA.secret = data.secret
    twoFA.qrCode = data.qrCode
    twoFA.step = 'qr'
    
  } catch (err) {
    twoFA.error = err.message
  } finally {
    twoFA.isLoading = false
  }
}

async function handleVerifySetup() {
  twoFA.isLoading = true
  twoFA.error = ''
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE_URL}/api/auth/2fa/verify-setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token: twoFA.verifyCode })
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    twoFA.recoveryCodes = data.recoveryCodes
    twoFA.step = 'recovery'
    twoFA.enabled = true
    twoFA.success = '2FA enabled successfully!'
    
  } catch (err) {
    twoFA.error = err.message
  } finally {
    twoFA.isLoading = false
  }
}

async function handleDisable2FA() {
  const ok = await confirm(
    'Disable 2FA',
    'Are you sure you want to disable Two-Factor Authentication? Your account will be less secure.',
    { danger: true, confirmText: 'Disable 2FA' }
  )
  if (!ok) return

  twoFA.isLoading = true
  twoFA.error = ''
  
  try {
    const token = localStorage.getItem('token')
    const res = await fetch(`${API_BASE_URL}/api/auth/2fa/disable`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password: twoFA.disablePassword })
    })
    
    const data = await res.json()
    if (!res.ok) throw new Error(data.error)
    
    twoFA.enabled = false
    twoFA.step = 'idle'
    twoFA.disablePassword = ''
    twoFA.success = '2FA disabled successfully.'
    
  } catch (err) {
    twoFA.error = err.message
  } finally {
    twoFA.isLoading = false
  }
}

async function handleChangePassword() {
  error.value = ''
  success.value = ''

  if (form.newPassword !== form.confirmPassword) {
    error.value = "New passwords do not match."
    return
  }

  if (form.newPassword.length < 6) {
    error.value = "Password must be at least 6 characters."
    return
  }

  isLoading.value = true

  try {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        oldPassword: form.oldPassword,
        newPassword: form.newPassword
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error || 'Failed to update password')
    }

    success.value = "Password updated successfully!"
    
    // Clear form
    form.oldPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''

  } catch (err) {
    error.value = err.message
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
/* Simple fade animation for tab switching */
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
