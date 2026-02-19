<template>
  <div class="space-y-6 animate-fade-in">
    <!-- Header -->
    <div class="glass-panel p-6 rounded-2xl border border-indigo-500/20">
      <div class="flex items-center justify-between">
        <div>
           <h2 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
             <span class="text-3xl">🏥</span> System Health Monitor
           </h2>
           <p class="text-gray-500 dark:text-gray-400 mt-1">Real-time infrastructure status</p>
        </div>
        <div class="flex items-center gap-4">
           <span class="text-sm text-gray-400 font-mono">
             Last updated: {{ lastUpdated ? new Date(lastUpdated).toLocaleTimeString() : 'Never' }}
           </span>
           <button 
             @click="checkHealth" 
             :disabled="loading"
             class="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
             :class="loading ? 'animate-spin' : ''"
           >
             🔄
           </button>
        </div>
      </div>
    </div>

    <!-- Status Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
       <!-- Database -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
         <div class="flex justify-between items-start mb-4">
           <div class="p-3 rounded-xl bg-blue-500/10 text-blue-500 text-2xl">🗄️</div>
           <div class="flex items-center gap-2">
             <span class="w-2 h-2 rounded-full" :class="getStatusColor(health.checks?.database?.status)"></span>
             <span class="text-sm font-medium capitalize" :class="getTextColor(health.checks?.database?.status)">
               {{ health.checks?.database?.status || 'Unknown' }}
             </span>
           </div>
         </div>
         <h3 class="text-lg font-bold text-gray-900 dark:text-white">Database</h3>
         <div class="mt-4 flex items-end gap-2">
           <span class="text-3xl font-mono">{{ health.checks?.database?.latency_ms || '-' }}</span>
           <span class="text-sm text-gray-500 mb-1">ms latency</span>
         </div>
       </div>

       <!-- Blockchain -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
         <div class="flex justify-between items-start mb-4">
           <div class="p-3 rounded-xl bg-orange-500/10 text-orange-500 text-2xl">⛓️</div>
           <div class="flex items-center gap-2">
             <span class="w-2 h-2 rounded-full" :class="getStatusColor(health.checks?.blockchain?.status)"></span>
             <span class="text-sm font-medium capitalize" :class="getTextColor(health.checks?.blockchain?.status)">
               {{ health.checks?.blockchain?.status || 'Unknown' }}
             </span>
           </div>
         </div>
         <h3 class="text-lg font-bold text-gray-900 dark:text-white">Blockchain</h3>
         <div class="mt-4">
           <div class="text-sm text-gray-500">Block Height</div>
           <div class="text-xl font-mono font-bold text-gray-900 dark:text-white">#{{ health.checks?.blockchain?.blockHeight || '-' }}</div>
           <div class="text-xs text-gray-400 mt-1">{{ health.checks?.blockchain?.network || 'Localhost' }}</div>
         </div>
       </div>

       <!-- IPFS -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
         <div class="flex justify-between items-start mb-4">
           <div class="p-3 rounded-xl bg-teal-500/10 text-teal-500 text-2xl">📦</div>
           <div class="flex items-center gap-2">
             <span class="w-2 h-2 rounded-full" :class="getStatusColor(health.checks?.ipfs?.status)"></span>
             <span class="text-sm font-medium capitalize" :class="getTextColor(health.checks?.ipfs?.status)">
               {{ health.checks?.ipfs?.status || 'Unknown' }}
             </span>
           </div>
         </div>
         <h3 class="text-lg font-bold text-gray-900 dark:text-white">IPFS Gateway</h3>
         <div class="mt-4 flex items-end gap-2">
           <span class="text-3xl font-mono">{{ health.checks?.ipfs?.latency_ms || '-' }}</span>
           <span class="text-sm text-gray-500 mb-1">ms latency</span>
         </div>
       </div>

       <!-- API -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group">
         <div class="flex justify-between items-start mb-4">
           <div class="p-3 rounded-xl bg-purple-500/10 text-purple-500 text-2xl">⚡</div>
           <div class="flex items-center gap-2">
             <span class="w-2 h-2 rounded-full bg-green-500"></span>
             <span class="text-sm font-medium text-green-500">Online</span>
           </div>
         </div>
         <h3 class="text-lg font-bold text-gray-900 dark:text-white">API Response</h3>
         <div class="mt-4 flex items-end gap-2">
           <span class="text-3xl font-mono">{{ health.checks?.api?.latency_ms || '-' }}</span>
           <span class="text-sm text-gray-500 mb-1">ms processed</span>
         </div>
       </div>
    </div>
    
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const health = ref({});
const loading = ref(false);
const lastUpdated = ref(null);
import { API_BASE_URL } from '../../apiConfig'
const API_BASE = `${API_BASE_URL}/api`
let pollInterval = null;

const getStatusColor = (status) => {
  if (status === 'connected' || status === 'reachable' || status === 'healthy' || status === 'authenticated') return 'bg-green-500';
  if (status === 'degraded') return 'bg-yellow-500 animate-pulse';
  return 'bg-red-500';
};

const getTextColor = (status) => {
  if (status === 'connected' || status === 'reachable' || status === 'healthy' || status === 'authenticated') return 'text-green-500';
  if (status === 'degraded') return 'text-yellow-500';
  return 'text-red-500';
};

async function checkHealth() {
  loading.value = true;
  try {
    const token = localStorage.getItem('adminToken');
    const res = await fetch(`${API_BASE}/admin/health`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        health.value = await res.json();
        lastUpdated.value = new Date();
    }
  } catch (err) {
    console.error('Health check failed:', err);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  checkHealth();
  // Poll every 30 seconds
  pollInterval = setInterval(checkHealth, 30000);
});

onUnmounted(() => {
  if (pollInterval) clearInterval(pollInterval);
});
</script>

<style scoped>
.glass-panel {
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.7);
}
.dark .glass-panel {
  background: rgba(30, 41, 59, 0.4);
}
</style>
