<template>
  <div class="glass-panel p-6 rounded-2xl relative">
    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Issuance Trend</h3>
    <div class="relative h-64 w-full">
      <Line :data="chartData" :options="chartOptions" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { isDark } from '../../../services/theme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const props = defineProps({
  data: {
    type: Array, // [{ date: 'Jan 2024', count: 10 }, ...]
    default: () => []
  }
});

const chartData = computed(() => {
  return {
    labels: props.data.map(d => d.date),
    datasets: [
      {
        label: 'Certificates Issued',
        backgroundColor: (ctx) => {
          const canvas = ctx.chart.ctx;
          const gradient = canvas.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, isDark.value ? 'rgba(99, 102, 241, 0.5)' : 'rgba(99, 102, 241, 0.2)');
          gradient.addColorStop(1, isDark.value ? 'rgba(99, 102, 241, 0)' : 'rgba(99, 102, 241, 0)');
          return gradient;
        },
        borderColor: '#6366f1',
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#6366f1',
        fill: true,
        tension: 0.4,
        data: props.data.map(d => d.count)
      }
    ]
  };
});

const chartOptions = computed(() => {
  const textColor = isDark.value ? '#cbd5e1' : '#64748b';
  const gridColor = isDark.value ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: isDark.value ? '#1e293b' : '#fff',
        titleColor: isDark.value ? '#fff' : '#0f172a',
        bodyColor: isDark.value ? '#cbd5e1' : '#334155',
        borderColor: isDark.value ? '#334155' : '#e2e8f0',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
        callbacks: {
          label: (context) => ` Issued: ${context.parsed.y}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: textColor }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, precision: 0 },
        beginAtZero: true
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };
});
</script>
