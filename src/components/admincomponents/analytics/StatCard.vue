<template>
  <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-white/20">
    <div class="flex justify-between items-start mb-4">
      <div>
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{{ label }}</p>
        <h3 class="text-3xl font-bold text-gray-900 dark:text-white mt-1">{{ value }}</h3>
      </div>
      <div 
        class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110"
        :class="iconBgClass"
      >
        <span>{{ icon }}</span>
      </div>
    </div>
    
    <div v-if="trend || subtext" class="flex items-center gap-2 text-sm">
      <span 
        v-if="trend"
        class="px-2 py-0.5 rounded-full text-xs font-bold"
        :class="trend > 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'"
      >
        {{ trend > 0 ? '↑' : '↓' }} {{ Math.abs(trend) }}%
      </span>
      <span class="text-gray-400">{{ subtext }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  label: String,
  value: [String, Number],
  icon: String,
  trend: Number, // Optional percentage
  subtext: String, // Optional "vs last month"
  color: {
    type: String,
    default: 'indigo'
  }
});

const iconBgClass = computed(() => {
  const map = {
    indigo: 'bg-indigo-500/10 text-indigo-500',
    purple: 'bg-purple-500/10 text-purple-500',
    green: 'bg-green-500/10 text-green-500',
    red: 'bg-red-500/10 text-red-500',
    amber: 'bg-amber-500/10 text-amber-500',
    blue: 'bg-blue-500/10 text-blue-500',
    rose: 'bg-rose-500/10 text-rose-500'
  };
  return map[props.color] || map.indigo;
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
