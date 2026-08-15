import React from 'react'
import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Title, Tooltip, Legend)

function InjectionMedicationChart({ data }) {
  // Generate professional color function with good contrast
  const generateRandomColor = (index, total) => {
    // Use golden ratio to create well-distributed hues
    const goldenRatio = 0.618033988749895
    const hue = (index * goldenRatio * 360) % 360

    // More muted saturation and controlled lightness for professional look
    const saturation = 65 // Fixed saturation for consistency
    const lightness = 55 // Fixed lightness for better readability

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // Process data to aggregate dosages by medication
  const getMedicationData = () => {
    if (!data) return { labels: [], dosages: [] }

    const medicationDosages = data.reduce((acc, item) => {
      const medication = item.medicationName
      if (!medication) return acc

      // Extract numeric value from dosage string
      const dosageMatch = item.dosage?.match(/(\d+(\.\d+)?)/g)
      const dosageValue = dosageMatch ? parseFloat(dosageMatch[0]) : 0

      if (!acc[medication]) {
        acc[medication] = {
          totalDosage: dosageValue,
          count: 1,
          unit: item.dosage?.replace(/[\d.]/g, '').trim() || 'units',
        }
      } else {
        acc[medication].totalDosage += dosageValue
        acc[medication].count += 1
      }
      return acc
    }, {})

    // Sort by total dosage
    const sortedMedications = Object.entries(medicationDosages)
      .sort(([, a], [, b]) => b.totalDosage - a.totalDosage)
      .slice(0, 7) // Limit to top 7 medications

    // Generate colors using index for better distribution
    const colors = sortedMedications.map((_, index) =>
      generateRandomColor(index, sortedMedications.length),
    )

    return {
      labels: sortedMedications.map(([name]) => name),
      dosages: sortedMedications.map(([, data]) => data.totalDosage),
      units: sortedMedications.map(([, data]) => data.unit),
      counts: sortedMedications.map(([, data]) => data.count),
      colors,
    }
  }

  const { labels, dosages, units, counts, colors } = getMedicationData()

  const chartData = {
    labels,
    datasets: [
      {
        data: dosages,
        backgroundColor: colors, // Use the generated colors
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
            return chart.data.labels.map((label, index) => ({
              text: `${label} - ${dosages[index].toFixed(1)} ${units[index]} (${
                counts[index]
              } times)`,
              fillStyle: datasets[0].backgroundColor[index],
              index: index,
            }))
          },
        },
      },
      title: {
        display: true,
        text: 'Medication vs Dosage',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: context => {
            const index = context.dataIndex
            return `${context.label}: ${context.raw.toFixed(1)} ${
              units[index]
            } (${counts[index]} times)`
          },
        },
      },
    },
  }

  return (
    <div className="h-full">
      {labels.length > 0 ? (
        <Pie data={chartData} options={options} />
      ) : (
        <div className="h-full flex justify-center items-center text-gray-500">
          No medication data available
        </div>
      )}
    </div>
  )
}

export default InjectionMedicationChart
