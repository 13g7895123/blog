<template>
  <div class="w-full h-80">
    <Line :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  dailyData: Record<string, number>
}>()

const chartData = computed(() => {
  const labels = Object.keys(props.dailyData)
  const data = Object.values(props.dailyData)

  return {
    labels,
    datasets: [
      {
        label: '每日瀏覽量',
        backgroundColor: (ctx: any) => {
          const canvas = ctx.chart.ctx
          const gradient = canvas.createLinearGradient(0, 0, 0, 300)
          gradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)') // Blue-500
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.0)')
          return gradient
        },
        borderColor: '#3B82F6',
        pointBackgroundColor: '#3B82F6',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#3B82F6',
        fill: true,
        tension: 0.4, // 平滑曲線
        data
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      padding: 10,
      cornerRadius: 8,
      displayColors: false
    }
  },
  scales: {
    x: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        },
        color: '#9CA3AF',
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 7
      }
    },
    y: {
      grid: {
        color: '#E5E7EB',
        borderDash: [5, 5],
        drawBorder: false
      },
      ticks: {
        font: {
          size: 11
        },
        color: '#9CA3AF',
        padding: 10
      },
      beginAtZero: true
    }
  },
  interaction: {
    mode: 'nearest',
    axis: 'x',
    intersect: false
  }
}
</script>
