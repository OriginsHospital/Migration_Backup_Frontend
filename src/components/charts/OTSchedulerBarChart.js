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

function OTSchedulerBarChart({ data }) {
  // Process data to count records by branch
  const getBranchData = () => {
    if (!data) return { labels: [], counts: [] }

    const branchCounts = data.reduce((acc, item) => {
      const branch = item.branchName
      acc[branch] = (acc[branch] || 0) + 1
      return acc
    }, {})

    return {
      labels: Object.keys(branchCounts),
      counts: Object.values(branchCounts),
    }
  }

  const { labels, counts } = getBranchData()

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Number of Procedures',
        data: counts,
        backgroundColor: 'rgba(53, 162, 235, 0.8)',
        borderColor: 'rgba(53, 162, 235, 1)',
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
        text: 'Procedures by Branch',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: context => `${context.parsed.y} procedures`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Number of Procedures',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Branches',
        },
      },
    },
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 w-full h-[400px]">
      {labels.length > 0 ? (
        <Bar data={chartData} options={options} />
      ) : (
        <div className="h-full flex justify-center items-center text-gray-500">
          No branch data available
        </div>
      )}
    </div>
  )
}

export default OTSchedulerBarChart
