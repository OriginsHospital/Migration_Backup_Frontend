import React from 'react'
import { Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const StagesDurationChart = ({ stats }) => {
  const labels = ['1-15', '16-30', '31-45', '46-60', '60+']

  const data = {
    labels,
    datasets: [
      {
        label: 'Scan Duration',
        data: labels.map(
          label => stats.scan[label === '60+' ? '60-plus' : label] || 0,
        ),
        backgroundColor: 'rgba(0, 187, 222, 0.8)', // Primary blue
        borderColor: 'rgba(0, 187, 222, 1)',
        borderWidth: 1,
      },
      {
        label: 'Doctor Visit Duration',
        data: labels.map(
          label => stats.doctor[label === '60+' ? '60-plus' : label] || 0,
        ),
        backgroundColor: 'rgba(0, 196, 159, 0.8)', // Green
        borderColor: 'rgba(0, 196, 159, 1)',
        borderWidth: 1,
      },
      {
        label: 'Seen Duration',
        data: labels.map(
          label => stats.seen[label === '60+' ? '60-plus' : label] || 0,
        ),
        backgroundColor: 'rgba(255, 187, 40, 0.8)', // Yellow
        borderColor: 'rgba(255, 187, 40, 1)',
        borderWidth: 1,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Stage Duration Distribution (in minutes)',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: context => {
            return `${context.dataset.label}: ${context.raw} patients`
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Duration (minutes)',
        },
      },
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Number of Patients',
        },
        ticks: {
          stepSize: 1,
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 w-full h-[400px]">
      <Bar data={data} options={options} />
    </div>
  )
}

export default StagesDurationChart
