import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js'

// Register ChartJS components
ChartJS.register(ArcElement, Title, Tooltip, Legend)

function OTSchedulerChart({ data }) {
  const colors = [
    '#00C49F', // Teal
    '#0088FE', // Blue
    '#FFBB28', // Yellow
    '#FF8042', // Orange
    '#FF99E6', // Pink
    '#FF9999', // Light Red
    '#B3B7FF', // Light Purple
  ]

  // Process data to count procedures
  const getProcedureData = () => {
    if (!data) return { labels: [], counts: [] }

    const procedureCounts = data.reduce((acc, item) => {
      const procedure = item.procedureName
      acc[procedure] = (acc[procedure] || 0) + 1
      return acc
    }, {})

    return {
      labels: Object.keys(procedureCounts),
      counts: Object.values(procedureCounts),
    }
  }

  const { labels, counts } = getProcedureData()

  const chartData = {
    labels,
    datasets: [
      {
        data: counts,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 10,
          font: { size: 12 },
          generateLabels: chart => {
            const datasets = chart.data.datasets
            const meta = chart.getDatasetMeta(0)
            return chart.data.labels.map((label, index) => ({
              text: `${label} - ${datasets[0].data[index]}`,
              fillStyle: datasets[0].backgroundColor[index],
              hidden: meta.data[index] ? meta.data[index].hidden : false,
              index: index,
            }))
          },
        },
      },
      title: {
        display: true,
        text: 'Procedures',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      // tooltip: {
      //     callbacks: {
      //         label: context => `${context.label}: ${context.raw} procedures`
      //     }
      // }
    },
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 w-full h-[400px]">
      {labels.length > 0 ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="h-full flex justify-center items-center text-gray-500">
          No procedure data available
        </div>
      )}
    </div>
  )
}

export default OTSchedulerChart
