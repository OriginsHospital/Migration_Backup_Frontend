import React from 'react'
import styles from './RevenueLegendTable.module.css'

/**
 * RevenueLegendTable
 * Props:
 *   items: Array<{ label: string, amount: number, percentage: string, color: string }>
 */
const RevenueLegendTable = ({ items = [] }) => {
  // Sort items alphabetically by label (case-insensitive, strict A→Z order)
  const sortedItems = [...items].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, {
      sensitivity: 'base',
      numeric: true,
    }),
  )

  if (sortedItems.length === 0) {
    return (
      <div className={styles.wrapper}>
        <div className={styles.empty}>No data available</div>
      </div>
    )
  }

  // Distribute items sequentially across 3 columns
  const itemsPerColumn = Math.ceil(sortedItems.length / 3)
  const column1 = sortedItems.slice(0, itemsPerColumn)
  const column2 = sortedItems.slice(itemsPerColumn, itemsPerColumn * 2)
  const column3 = sortedItems.slice(itemsPerColumn * 2)

  const renderColumn = columnItems => (
    <div className={styles.column}>
      {columnItems.map(item => (
        <div key={item.label} className={styles.item}>
          <div className={styles.header}>
            <span
              className={styles.dot}
              style={{ backgroundColor: item.color }}
            />
            <span className={styles.name}>{item.label}</span>
          </div>
          <div className={styles.value}>
            ₹
            {item.amount.toLocaleString('en-IN', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{' '}
            ({item.percentage})
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <div className={styles.wrapper}>
      {renderColumn(column1)}
      {renderColumn(column2)}
      {renderColumn(column3)}
    </div>
  )
}

export default RevenueLegendTable
