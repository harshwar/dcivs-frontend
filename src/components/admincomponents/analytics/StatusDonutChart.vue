<template>
  <div class="glass-panel p-6 rounded-2xl relative">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Governance Health</h3>
    <div class="relative h-64 w-full flex items-center justify-center">
      <Doughnut :data="chartData" :options="chartOptions" />
      
      <!-- Center Text -->
      <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ validPercentage }}%</span>
        <span class="text-xs text-gray-500 uppercase tracking-wider">Valid</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { isDark } from '../../../services/theme';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps({
  data: {
    type: Object, // { Valid: 10, Revoked: 1 }
    default: () => ({ Valid: 0, Revoked: 0 })
  }
});

const validPercentage = computed(() => {
  const total = (props.data.Valid || 0) + (props.data.Revoked || 0);
  if (!total) return 0;
  return Math.round((props.data.Valid / total) * 100);
});

const chartData = computed(() => {
  return {
    labels: ['Valid', 'Revoked'],
    datasets: [
      {
        backgroundColor: ['#10b981', '#ef4444'],
        borderWidth: 0,
        hoverOffset: 4,
        data: [props.data.Valid, props.data.Revoked]
      }
    ]
  };
});

const chartOptions = computed(() => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '75%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark.value ? '#cbd5e1' : '#64748b',
          usePointStyle: true,
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: isDark.value ? '#1e293b' : '#fff',
        bodyColor: isDark.value ? '#cbd5e1' : '#334155',
        borderColor: isDark.value ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10
      }
    }
  };
});
</script>
