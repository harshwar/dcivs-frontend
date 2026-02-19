<template>
  <div class="glass-panel p-6 rounded-2xl relative">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Certificates by Department</h3>
    <div class="relative h-64 w-full">
      <Bar :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { isDark } from '../../../services/theme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  data: {
    type: Array, // [{ name: 'CS', count: 10 }, ...]
    default: () => []
  }
});

const chartData = computed(() => {
  return {
    labels: props.data.map(d => d.name),
    datasets: [
      {
        label: 'Issued',
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(236, 72, 153, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(16, 185, 129, 0.8)'
        ],
        borderRadius: 8,
        data: props.data.map(d => d.count)
      }
    ]
  };
});

const chartOptions = computed(() => {
  const textColor = isDark.value ? '#cbd5e1' : '#64748b';
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: isDark.value ? '#1e293b' : '#fff',
        titleColor: isDark.value ? '#fff' : '#0f172a',
        bodyColor: isDark.value ? '#cbd5e1' : '#334155',
        borderColor: isDark.value ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor }
      },
      y: {
        grid: { color: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: textColor, precision: 0 },
        beginAtZero: true
      }
    }
  };
});
</script>
