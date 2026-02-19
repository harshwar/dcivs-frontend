<template>
  <div class="glass-panel p-6 rounded-2xl relative">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Student Onboarding Funnel</h3>
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
    type: Object, // { registered: 100, wallet_created: 80, cert_received: 50 }
    default: () => ({ registered: 0, wallet_created: 0, cert_received: 0 })
  }
});

const chartData = computed(() => {
  return {
    labels: ['Registered Students', 'Wallet Active', 'Certificate Received'],
    datasets: [
      {
        label: 'Students',
        data: [props.data.registered, props.data.wallet_created, props.data.cert_received],
        backgroundColor: [
          'rgba(99, 102, 241, 0.5)', 
          'rgba(16, 185, 129, 0.5)', 
          'rgba(245, 158, 11, 0.5)'  
        ],
        borderColor: [
          '#6366f1',
          '#10b981',
          '#f59e0b'
        ],
        borderWidth: 2,
        borderRadius: 8,
        barPercentage: 0.6
      }
    ]
  };
});

const chartOptions = computed(() => {
  const textColor = isDark.value ? '#cbd5e1' : '#64748b';
  return {
    indexAxis: 'y', // Horizontal bar chart
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
        grid: { color: isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: textColor },
        beginAtZero: true
      },
      y: {
        grid: { display: false },
        ticks: { color: textColor, font: { weight: 'bold' } }
      }
    }
  };
});
</script>
