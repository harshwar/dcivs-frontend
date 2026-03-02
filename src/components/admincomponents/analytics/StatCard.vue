<template>
  <div class="glass-panel p-6 rounded-2xl relative overflow-hidden group transition-all duration-300 border border-white/20 border-t-4" :class="cardClasses">
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

const cardClasses = computed(() => {
  const map = {
    indigo: 'border-t-indigo-500 hover:shadow-[0_8px_30px_rgb(99,102,241,0.2)]', // glow effect
    purple: 'border-t-purple-500 hover:shadow-[0_8px_30px_rgb(168,85,247,0.2)]',
    green: 'border-t-green-500 hover:shadow-[0_8px_30px_rgb(34,197,94,0.2)]',
    red: 'border-t-red-500 hover:shadow-[0_8px_30px_rgb(239,68,68,0.2)]',
    amber: 'border-t-amber-500 hover:shadow-[0_8px_30px_rgb(245,158,11,0.2)]',
    blue: 'border-t-blue-500 hover:shadow-[0_8px_30px_rgb(59,130,246,0.2)]',
    rose: 'border-t-rose-500 hover:shadow-[0_8px_30px_rgb(244,63,94,0.2)]'
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
