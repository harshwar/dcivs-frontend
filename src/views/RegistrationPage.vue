<template>
  <div class="min-h-screen bg-gray-50 dark:bg-[#0d1117] transition-colors duration-300">
    <AppHeader />
    
    <div class="relative min-h-screen flex items-center justify-center px-6 overflow-hidden pt-20">
      <!-- Background decorations (Dark only) -->
      <div class="absolute -top-40 -left-40 w-96 h-96 bg-indigo-500/30 blur-3xl rounded-full opacity-0 dark:opacity-100 transition-opacity"></div>
      <div class="absolute -bottom-40 -right-40 w-96 h-96 bg-fuchsia-500/20 blur-3xl rounded-full opacity-0 dark:opacity-100 transition-opacity"></div>

      <div class="relative z-10 w-full max-w-4xl">
        <div v-if="!registrationSuccess" class="auth-card overflow-hidden" data-particle-target="frame">
          <div class="md:flex">
            <div class="w-full p-6 md:p-8">
              <div class="flex items-center justify-between mb-6">
                <h1 class="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white transition-colors" data-particle-target="detail">
                  Create Student Account
                </h1>
              </div>

              <form @submit.prevent="handleRegister" class="space-y-6">
                <!-- FORM GROUPS -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <!-- Full Name -->
                  <div class="md:col-span-2">
                    <label class="label">Full Name</label>
                    <input v-model="formData.fullName" required type="text" class="input-field" placeholder="John Doe" />
                  </div>

                  <!-- Email -->
                  <div>
                    <label class="label">Email</label>
                    <input v-model="formData.email" required type="email" class="input-field" placeholder="john@example.com" />
                  </div>

                  <!-- Password -->
                  <div>
                    <label class="label">Password</label>
                    <input v-model="formData.password" required type="password" minlength="6" class="input-field" placeholder="••••••••" />
                  </div>

                  <!-- Student ID -->
                  <div>
                    <label class="label">Student ID / Roll No</label>
                    <input v-model="formData.rollNumber" required type="text" class="input-field" placeholder="e.g. 25tbscit006" />
                  </div>

                  <!-- Course Name -->
                  <div>
                    <label class="label">Course Name</label>
                    <CustomSelect v-model="formData.courseName" :options="courseOptions" placeholder="Select Course" searchable />
                  </div>

                  <!-- Year -->
                  <div class="md:col-span-2">
                    <label class="label">Year</label>
                    <CustomSelect v-model="formData.year" :options="yearOptions" placeholder="Select Year" />
                  </div>
                </div>

                <!-- Submit -->
                <button type="submit" :disabled="isLoading" class="btn-primary w-full py-4 text-lg">
                  {{ isLoading ? 'Processing...' : 'Register Account' }}
                </button>

                <div class="text-center mt-4 border-t border-gray-100 dark:border-white/5 pt-4">
                  <p class="text-sm text-gray-600 dark:text-gray-400">Already have an account? <router-link to="/login" class="text-indigo-600 dark:text-indigo-400 font-medium">Login</router-link></p>
                </div>

                <div v-if="errorMessage" class="alert-error mt-4">
                  {{ errorMessage }}
                </div>
              </form>
            </div>
          </div>
        </div>

        <!-- SUCCESS STATE -->
        <div v-else class="auth-card p-12 text-center animate-fade-in">
           <div class="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 mx-auto mb-8 shadow-inner shadow-indigo-500/10">
             <span class="text-5xl">✉️</span>
           </div>
           <h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Verification Sent!</h2>
           <p class="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed max-w-lg mx-auto">
             We've sent an email to <strong class="text-indigo-500">{{ formData.email }}</strong>. <br>
             Please click the verification link to proceed with your identity review.
           </p>
           <div class="p-5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm mb-8 text-left flex gap-4">
             <span class="text-2xl">💡</span>
             <p>Our administrative team will review your application once your email is verified. You'll receive a final activation email once your custodial wallet is ready.</p>
           </div>
           <router-link to="/login" class="btn-primary inline-block px-12 py-4">
             Continue to Login
           </router-link>
        </div>
      </div>
    </div>
    
    <AppFooter />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import AppFooter from '../components/AppFooter.vue';
import CustomSelect from '../components/ui/CustomSelect.vue';
import { API_BASE_URL } from '../apiConfig';

const router = useRouter();

const yearOptions = [
  { value: 'FY', label: 'First Year (FY)' },
  { value: 'SY', label: 'Second Year (SY)' },
  { value: 'TY', label: 'Third Year (TY)' },
];

const courseOptions = [
  { value: 'BSCIT', label: 'B.Sc. IT' },
  { value: 'BSCCS', label: 'B.Sc. CS' },
];

const formData = ref({
  fullName: '',
  email: '',
  password: '',
  rollNumber: '',
  courseName: 'BSCIT',
  year: ''
});

const isLoading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const csrfToken = ref('');
const registrationSuccess = ref(false);

// Fetch CSRF token on mount
onMounted(async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/csrf-token`, {
      credentials: 'include'
    })
    const data = await res.json()
    csrfToken.value = data.csrfToken
  } catch (err) {
    console.error('Failed to fetch CSRF token:', err)
  }
})

function validateRollNumber(val) {
  // Format: [Year][FY/SY/TY][Dept][RollNo] e.g. 25tbscit006
  // Regex: 2 digits + (FY|SY|TY) + letters (dept) + 3 digits
  const regex = /^\d{2}(FY|SY|TY)[A-Z]+\d{3}$/i;
  return regex.test(val);
}

async function handleRegister() {
  isLoading.value = true;
  successMessage.value = '';
  errorMessage.value = '';

  // 1. Data Normalization
  const roll = formData.value.rollNumber.trim().toUpperCase().replace(/\s+/g, '');
  const course = formData.value.courseName.toUpperCase();
  
  // 2. Format Validation
  if (!validateRollNumber(roll)) {
    errorMessage.value = 'Invalid Student ID format. Expected: 25TYBSCIT001';
    isLoading.value = false;
    return;
  }

  if (!formData.value.year) {
    errorMessage.value = 'Please select your current year.';
    isLoading.value = false;
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken.value
      },
      credentials: 'include',
      body: JSON.stringify({
        full_name: formData.value.fullName.trim(),
        email: formData.value.email.trim(),
        password: formData.value.password,
        student_id_number: roll,
        course_name: course,
        year: formData.value.year,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      registrationSuccess.value = true;
      // Clear form
      formData.value = {
        fullName: '',
        email: '',
        password: '',
        rollNumber: '',
        courseName: '',
        year: '',
      };
    } else {
      throw new Error(data.error || 'Registration failed.');
    }
  } catch (err) {
    errorMessage.value = err.message || 'Registration failed';
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
/* Auth Card */
.auth-card {
  @apply bg-white dark:bg-transparent border border-gray-200 dark:border-white/20 rounded-3xl shadow-xl dark:shadow-2xl relative z-10 transition-all duration-300;
}

/* Labels */
.label {
  @apply block text-sm text-gray-700 dark:text-white/70 mb-1 font-medium transition-colors;
}

/* Inputs */
.input-field {
  @apply w-full rounded-lg
         bg-white dark:bg-transparent
         text-gray-900 dark:text-white
         px-4 py-2
         border border-gray-300 dark:border-white/20
         outline-none
         placeholder-gray-400 dark:placeholder-white/30
         transition-all
         focus:bg-gray-50 dark:focus:bg-white/20
         focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400
         focus:border-transparent;
}

/* Primary Button */
.btn-primary {
  @apply px-5 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 dark:hover:bg-indigo-500
         text-white font-medium transition disabled:opacity-50
         shadow-lg shadow-indigo-500/30;
}

/* Alerts */
.alert-success {
  @apply bg-emerald-100 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-400/40
         text-emerald-800 dark:text-emerald-200 p-3 rounded-xl text-center backdrop-blur-sm shadow-sm;
}

.alert-error {
  @apply bg-red-100 dark:bg-red-500/20 border border-red-200 dark:border-red-400/40
         text-red-800 dark:text-red-200 p-3 rounded-xl text-center backdrop-blur-sm shadow-sm;
}
</style>
