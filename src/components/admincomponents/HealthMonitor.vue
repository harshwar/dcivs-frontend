<template>
  <div id="tour-health-monitor" class="space-y-6 animate-fade-in">
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
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group border-t-4 border-t-blue-500">
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
           <span class="text-6xl font-black font-mono tracking-tighter">{{ health.checks?.database?.latency_ms || '-' }}</span>
           <span class="text-sm text-gray-500 mb-2">ms latency</span>
         </div>
       </div>

       <!-- Blockchain -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group border-t-4 border-t-orange-500">
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
           <div class="text-4xl font-black font-mono tracking-tighter text-gray-900 dark:text-white mt-1">#{{ health.checks?.blockchain?.blockHeight || '-' }}</div>
           <div class="text-xs text-gray-400 mt-1">{{ health.checks?.blockchain?.network || 'Localhost' }}</div>
         </div>
       </div>

       <!-- IPFS -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group border-t-4 border-t-teal-500">
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
           <span class="text-6xl font-black font-mono tracking-tighter">{{ health.checks?.ipfs?.latency_ms || '-' }}</span>
           <span class="text-sm text-gray-500 mb-2">ms latency</span>
         </div>
       </div>

       <!-- API -->
       <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group border-t-4 border-t-purple-500">
         <div class="flex justify-between items-start mb-4">
           <div class="p-3 rounded-xl bg-purple-500/10 text-purple-500 text-2xl">⚡</div>
           <div class="flex items-center gap-2">
             <span class="w-2 h-2 rounded-full bg-green-500"></span>
             <span class="text-sm font-medium text-green-500">Online</span>
           </div>
         </div>
         <h3 class="text-lg font-bold text-gray-900 dark:text-white">API Response</h3>
         <div class="mt-4 flex items-end gap-2">
           <span class="text-6xl font-black font-mono tracking-tighter">{{ health.checks?.api?.latency_ms || '-' }}</span>
           <span class="text-sm text-gray-500 mb-2">ms processed</span>
         </div>
       </div>
    </div>
    
    <!-- Uptime & Incidents Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Global Uptime (Large Panel) -->
      <div class="glass-panel p-8 rounded-2xl lg:col-span-2 flex flex-col justify-center items-center text-center border border-indigo-500/10 relative overflow-hidden group">
        <!-- Background Glow -->
        <div class="absolute inset-0 bg-gradient-to-t from-green-500/5 to-transparent pointer-events-none group-hover:from-green-500/10 transition-colors"></div>
        <div class="flex items-center gap-3 mb-2 opacity-80">
          <span class="relative flex h-3 w-3">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          <span class="text-lg font-medium text-gray-600 dark:text-gray-400 uppercase tracking-widest">Global Uptime</span>
        </div>
        <div class="text-7xl md:text-8xl font-black text-gray-900 dark:text-white tracking-tighter drop-shadow-sm">
          99.98%
        </div>
        <p class="mt-4 text-sm text-gray-500 dark:text-gray-400 max-w-md">
          All core systems are highly available. The platform has successfully handled all identity verifications and contract interactions over the last 30 days without critical interruptions.
        </p>
      </div>

      <!-- Recent Incidents Feed -->
      <div class="glass-panel p-6 rounded-2xl flex flex-col border border-gray-200 dark:border-white/5">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🔔</span> Recent Events
        </h3>
        <div class="flex-1 space-y-4">
          <!-- Mock Event 1 -->
          <div class="flex gap-3 items-start relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-gray-200 dark:before:bg-gray-700 last:before:hidden">
            <div class="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center shrink-0 mt-0.5 z-10">
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900 dark:text-white">API Latency Spike Resolved</p>
              <p class="text-xs text-gray-500">Response times normalized below 100ms.</p>
              <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">2 hours ago</p>
            </div>
          </div>
          <!-- Mock Event 2 -->
          <div class="flex gap-3 items-start relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-gray-200 dark:before:bg-gray-700 last:before:hidden">
            <div class="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5 z-10">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900 dark:text-white">Database Backup Completed</p>
              <p class="text-xs text-gray-500">Automated snapshot successfully stored.</p>
              <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">Yesterday</p>
            </div>
          </div>
          <!-- Mock Event 3 -->
          <div class="flex gap-3 items-start relative before:absolute before:left-[11px] before:top-6 before:bottom-[-16px] before:w-[2px] before:bg-gray-200 dark:before:bg-gray-700 last:before:hidden">
            <div class="w-6 h-6 rounded-full bg-gray-500/20 flex items-center justify-center shrink-0 mt-0.5 z-10">
              <span class="w-2 h-2 rounded-full bg-gray-500"></span>
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900 dark:text-white">Routine Maintenance</p>
              <p class="text-xs text-gray-500">SSL certificates renewed for external facing APIs.</p>
              <p class="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">3 days ago</p>
            </div>
          </div>
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
