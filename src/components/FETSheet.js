import React, { useCallback } from 'react'
import { Button, IconButton, Typography } from '@mui/material'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import { DatePicker } from '@mui/x-date-pickers'
import { useDispatch } from 'react-redux'
import { closeModal } from '@/redux/modalSlice'
import MedicationSheet from './MedicationSheet'
import ScanSheet from './ScanSheet'
import { Close } from '@mui/icons-material'

dayjs.extend(customParseFormat)

const remapSheetKeysByColumns = (data, oldCols, newCols) => {
  if (
    !data ||
    typeof data !== 'object' ||
    !oldCols?.length ||
    !newCols?.length
  ) {
    return data
  }

  const remapped = {}
  Object.entries(data).forEach(([key, value]) => {
    let newKey = key
    for (let i = 0; i < oldCols.length; i++) {
      const oldCol = oldCols[i]
      const newCol = newCols[i]
      if (!oldCol || !newCol || oldCol === newCol) continue
      if (key === `${oldCol}-note` || String(key).startsWith(`${oldCol}-`)) {
        newKey = `${newCol}${String(key).slice(oldCol.length)}`
        break
      }
    }
    remapped[newKey] = value
  })
  return remapped
}

const parseSheetDate = (value) => {
  if (!value) return null
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null
  const parsed = dayjs(value, 'DD/MM')
  if (!parsed.isValid()) return null
  if (parsed.diff(dayjs(), 'day') > 45) return parsed.subtract(1, 'year')
  return parsed
}

const FETSheet = ({
  fetFormData,
  setFETFormData,
  fetTemplate,
  handleUpdateTreatmentFETSheet,
  patientInfo,
  setFETTemplate,
  canUpdate,
  medicationOptions,
  allBillTypeValues,
  onPersistStartDate,
}) => {
  const dispatch = useDispatch()
  // Define medications from the image
  // const medications = [
  //     { id: 'endofert', label: 'TAB ENDOFERT-H 2MG' },
  //     { id: 'estrobet', label: 'ESTROBET GEL' },
  //     { id: 'ecospirin', label: 'TAB. ECOSPIRIN 150 MG' },
  //     { id: 'asvit', label: 'TAB.ASVIT E' },
  //     { id: 'nicardia', label: 'TAB.NICARDIA' },
  //     { id: 'bifolate', label: 'TAB.BIFOLATE-OD' },
  //     { id: 'pregnasur', label: 'TAB.PREGNASUR E-HS' },
  //     { id: 'dolonex', label: 'TAB. DOLONEX DT ½ TID' },
  //     { id: 'susten', label: 'INJ.SUSTEN 100MG IM' },
  //     { id: 'michelle', label: 'CAP.MICHELLE 200MG' },
  //     { id: 'dydropreg', label: 'TAB.DYDROPREG' },
  // ]

  // Handle input changes
  const handleInputChange = useCallback(
    (day, medication, value) => {
      console.log(day, medication, value, fetFormData)
      // Validate input if needed
      setFETFormData((prevData) => ({
        ...prevData,
        [`${day}-${medication}`]: value,
      }))
    },
    [setFETFormData],
  )

  // Generate array of days 1-15
  const days = Array.from({ length: 15 }, (_, i) => i + 1)

  // Add handleAddColumn function
  const handleAddColumn = useCallback(() => {
    if (!fetTemplate?.columns) return

    const lastDate = fetTemplate.columns[fetTemplate.columns.length - 1]
    const nextDate = dayjs(lastDate, 'DD/MM').add(1, 'day').format('DD/MM')

    setFETTemplate((prev) => ({
      ...prev,
      columns: [...prev.columns, nextDate],
    }))
  }, [fetTemplate, setFETTemplate])

  const handleDay1DateChange = useCallback(
    (newValue) => {
      const start = parseSheetDate(newValue)
      const oldCols = fetTemplate?.columns
      if (!start || !Array.isArray(oldCols) || oldCols.length === 0) return

      const newCols = oldCols.map((_, index) =>
        start.add(index, 'day').format('DD/MM'),
      )
      if (oldCols.join('|') === newCols.join('|')) return

      if (onPersistStartDate) {
        onPersistStartDate(start.format('YYYY-MM-DD'))
        return
      }

      setFETFormData((prev) => remapSheetKeysByColumns(prev, oldCols, newCols))
      setFETTemplate((prev) => ({
        ...(prev || {}),
        columns: newCols,
      }))
    },
    [fetTemplate?.columns, onPersistStartDate, setFETFormData, setFETTemplate],
  )

  return (
    <div className="w-full p-4">
      {/* Header Section */}
      {/* <div className="flex justify-between">
        <Typography variant="h6" className="text-gray-800 mb-2">
          FET Sheet
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div> */}
      {/* Action Buttons */}
      <div className="flex justify-between items-end p-3 gap-3">
        {canUpdate && (
          <DatePicker
            label="FET start date"
            value={parseSheetDate(fetTemplate?.columns?.[0])}
            format="DD/MM/YYYY"
            onChange={handleDay1DateChange}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                size: 'small',
                title: 'Change FET start date',
              },
            }}
          />
        )}
        {canUpdate && (
          <div className="flex gap-2">
            <Button
              variant="outlined"
              onClick={handleAddColumn}
              className="bg-white text-secondary border-secondary hover:bg-secondary hover:text-white"
            >
              Add Column
            </Button>
            <Button
              variant="contained"
              className="bg-secondary text-white"
              onClick={() => handleUpdateTreatmentFETSheet('update')}
            >
              Update Sheet
            </Button>
          </div>
        )}
      </div>

      {/* FET Sheet Table */}
      {/* <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 bg-secondary text-white">DATE</th>
            {fetTemplate?.columns?.map(day => (
              <th key={day} className="border p-2 bg-secondary text-white">
                {day}
              </th>
            ))}
          </tr>
          <tr>
            <th className="border p-2 bg-secondary text-white">
              DAY OF STIMULATION
            </th>
            {fetTemplate?.columns.map((day, index) => (
              <th key={`stim-${day}`} className="border p-2">
                {index + 1}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fetTemplate?.rows?.map((med, index) => (
            <tr key={med.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="border p-2 font-medium">{med.label}</td>
              {fetTemplate?.columns?.map(day => (
                <td key={`${med.label}-${day}`} className="border p-2">
                  <input
                    type="text"
                    className="w-full h-8 text-center border rounded"
                    value={fetFormData[`${day}-${med.value}`] || ''}
                    onChange={e =>
                      handleInputChange(day, med.value, e.target.value)
                    }
                  // disabled={day !== dayjs(new Date()).format('DD/MM')} // Only allow editing for current date
                  />
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <td className="border p-2 font-medium">SCAN FINDINGS</td>
            {fetTemplate?.columns?.map(day => (
              <td key={`scan-${day}`} className="border p-2">
                <input
                  type="text"
                  className="w-full h-8 text-center border rounded"
                  value={fetFormData[`${day}-scan`] || ''}
                  onChange={e => handleInputChange(day, 'scan', e.target.value)}
                  disabled={day !== dayjs(new Date()).format('DD/MM')}
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table> */}
      <MedicationSheet
        medicationFormData={fetFormData}
        setMedicationFormData={setFETFormData}
        allBillTypeValues={allBillTypeValues}
        columns={fetTemplate?.columns}
        medicationOptions={medicationOptions}
        autofillOnly
      />
      {/* <ScanSheet
        scanFormData={fetFormData}
        setScanFormData={setFETFormData}
        allBillTypeValues={allBillTypeValues}
        columns={fetTemplate?.columns}
      /> */}
    </div>
  )
}

export default FETSheet
