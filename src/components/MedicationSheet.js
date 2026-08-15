import React, { useCallback, useEffect, useState } from 'react'
import {
  Autocomplete,
  Button,
  TextField,
  Select,
  MenuItem,
} from '@mui/material'
import dayjs from 'dayjs'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'

function MedicationSheet({
  medicationFormData,
  setMedicationFormData,
  allBillTypeValues,
  columns,
  medicationOptions,
  autofillOnly = false,
}) {
  // Add states for medication inputs
  const [medicationDays, setMedicationDays] = useState('')
  const [selectedMedication, setSelectedMedication] = useState('')
  const [medicationIntake, setMedicationIntake] = useState('')

  const intakeOptions = [
    'OD',
    'BID',
    'TID',
    'QID',
    '2OD',
    '2BID',
    '2TID',
    '2QID',
    'HS',
    '2HS',
    'WO',
    'WT',
    'Other',
  ]

  // Add state for custom intake
  const [customIntake, setCustomIntake] = useState('')

  const getQuantityFromIntake = (intake) => {
    switch (intake) {
      case 'OD':
        return 1
      case 'QID':
        return 4
      case 'BID':
        return 2
      case 'TID':
        return 3
      case '2OD':
        return 2
      case '2QID':
        return 8
      case '2BID':
        return 4
      case '2TID':
        return 6
      case '2HS':
        return 2
      case 'WO':
        return 1
      case 'WT':
        return 1
      case 'HS':
        return 1
      default:
        return 1
    }
  }

  const handleAutoFillMedication = useCallback(() => {
    if (!medicationDays || !medicationIntake || !selectedMedication) return

    // Use custom intake value if 'Other' is selected, otherwise use the selected intake
    const quantity =
      medicationIntake === 'Other' ? customIntake : medicationIntake
    // Match catalog when possible; freeSolo text must still define row + cell keys
    const selectedMedicationName =
      medicationOptions?.find((med) => med.itemName === selectedMedication)
        ?.itemName ?? selectedMedication

    const daysToFill = parseInt(medicationDays, 10)
    if (!Number.isFinite(daysToFill) || daysToFill < 1) return

    setMedicationFormData((prevData) => {
      const safeRows = Array.isArray(prevData?.rows) ? prevData.rows : []
      const medicationExists = safeRows.some(
        (row) => row.label === selectedMedicationName,
      )

      const newRows = medicationExists
        ? safeRows
        : [
            ...safeRows,
            { label: selectedMedicationName, value: selectedMedicationName },
          ]

      const newData = { ...(prevData || {}), rows: newRows }

      const normalizeDayMonth = (value) => {
        if (!value) return ''
        const [dayPart, monthPart] = String(value).split('/')
        const day = Number(dayPart)
        const month = Number(monthPart)
        if (!Number.isFinite(day) || !Number.isFinite(month)) return ''
        return `${day}/${month}`
      }

      const normalizedToday = normalizeDayMonth(dayjs().format('DD/MM'))
      const todayColumnIndex = Array.isArray(columns)
        ? columns.findIndex(
            (columnValue) => normalizeDayMonth(columnValue) === normalizedToday,
          )
        : -1
      const startColumnIndex = todayColumnIndex >= 0 ? todayColumnIndex : 0
      const availableColumnCount = Array.isArray(columns)
        ? Math.max(columns.length - startColumnIndex, 0)
        : 0
      const totalDaysToFill =
        availableColumnCount > 0
          ? Math.min(daysToFill, availableColumnCount)
          : daysToFill

      // Keys must use the same date strings as sheet column headers, or inputs won't bind.
      for (let i = 0; i < totalDaysToFill; i++) {
        const colDate = Array.isArray(columns)
          ? columns[startColumnIndex + i]
          : null
        const date =
          colDate != null && colDate !== ''
            ? colDate
            : dayjs().add(i, 'day').format('DD/MM')
        newData[`${date}-${selectedMedicationName}`] = quantity
      }

      return newData
    })

    setSelectedMedication('')
    setMedicationDays('')
    setMedicationIntake('')
    setCustomIntake('')
  }, [
    medicationDays,
    medicationIntake,
    customIntake,
    selectedMedication,
    medicationOptions,
    columns,
    setMedicationFormData,
  ])

  const handleAddMedication = () => {
    setMedicationFormData((prevData) => {
      const safeRows = Array.isArray(prevData?.rows) ? prevData.rows : []
      return {
        ...(prevData || {}),
        rows: [...safeRows, { label: '' }],
      }
    })
  }
  const [medications, setMedications] = useState([])
  useEffect(() => {
    console.log(medicationOptions)
    if (medicationOptions) {
      setMedications(medicationOptions.map((item) => item.itemName))
    }
  }, [medicationOptions])

  // const dosageOptions = ['OD', 'BID', 'TID', 'QID'];
  const handleInputChange = (day, medication, value) => {
    // const newValue = value === '' ? '' : parseFloat(value)
    // if (isNaN(newValue) || newValue < 0 || newValue > 99) return
    console.log(day, medication, value, medicationFormData)
    if (value.length > 5) return

    setMedicationFormData((prevData) => ({
      ...prevData,
      [`${day}-${medication}`]: value,
    }))
  }

  const handleMedicationChange = (index, newValue) => {
    setMedicationFormData((prevData) => {
      const safeRows = Array.isArray(prevData?.rows) ? prevData.rows : []
      return {
        ...(prevData || {}),
        rows: safeRows.map((row, i) =>
          i === index ? { ...row, label: newValue, value: newValue } : row,
        ),
      }
    })
  }

  const handleDeleteMedication = (index) => {
    setMedicationFormData((prevData) => {
      const safeRows = Array.isArray(prevData?.rows) ? prevData.rows : []
      return {
        ...(prevData || {}),
        rows: safeRows.filter((_, i) => i !== index),
      }
    })
  }

  return (
    <div className="w-full mt-10">
      {/* Add medication controls */}
      <div className="flex items-center gap-4 mb-4">
        <Autocomplete
          options={medications}
          value={selectedMedication}
          onChange={(e, v) => {
            setSelectedMedication(v)
            console.log(v)
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              label="Medication"
            />
          )}
          className="w-64"
          freeSolo
          variant="standard"
          fullWidth
        />
        {/* <Select
          // options={medications}
          value={selectedMedication}
          onChange={e => {
            setSelectedMedication(e.target.value)
            console.log(e.target.value)
          }}
        >
          <MenuItem value="" disabled>
            Select Medication
          </MenuItem>
          {medications?.map((med, idx) => (
            <MenuItem key={idx + '-' + med} value={med}>
              {med}
            </MenuItem>
          ))}
        </Select> */}

        <TextField
          className="w-24"
          size="small"
          type="number"
          label="Days"
          value={medicationDays}
          onChange={(e) => setMedicationDays(e.target.value)}
        />

        <div className="flex gap-2 items-center">
          <Autocomplete
            className="w-36"
            size="small"
            options={intakeOptions}
            value={medicationIntake}
            onChange={(e, v) => setMedicationIntake(v)}
            renderInput={(params) => (
              <TextField {...params} size="small" label="Intake" />
            )}
          />
          {medicationIntake === 'Other' && (
            <TextField
              className="w-24"
              size="small"
              label="Custom Intake"
              value={customIntake}
              onChange={(e) => setCustomIntake(e.target.value)}
            />
          )}
        </div>

        <Button
          variant="outlined"
          onClick={handleAutoFillMedication}
          className="bg-white text-secondary border-secondary hover:bg-secondary hover:text-white"
        >
          Auto Fill
        </Button>
      </div>

      <table className="border-collapse overflow-hidden">
        <thead>
          <tr>
            <th className="w-12"></th>
            <th className="bg-secondary text-white p-2 border">Medication</th>
            {columns?.map((day, index) => (
              <th
                key={'medication' + day}
                className="bg-secondary text-white p-2 border text-center"
              >
                <div>{`Day ${index + 1}`}</div>
                <div className="text-xs">{day}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {medicationFormData.rows?.map((medication, index) => (
            <tr
              key={'medication' + medication.value}
              className={index % 2 === 0 ? 'bg-slate-100' : ''}
            >
              <td className="border p-2 w-12 bg-white">
                <IconButton
                  onClick={() => handleDeleteMedication(index)}
                  size="small"
                  color="error"
                  aria-label="delete medication"
                >
                  <DeleteIcon />
                </IconButton>
              </td>
              {medication.value ? (
                <td className="p-2 border font-medium  min-w-32">
                  {medication?.value}
                </td>
              ) : (
                <Autocomplete
                  options={medications}
                  value={medication.value}
                  onChange={(event, newValue) =>
                    handleMedicationChange(index, newValue)
                  }
                  renderInput={(params) => (
                    <TextField {...params} variant="outlined" size="small" />
                  )}
                  className="w-32 h-8 text-center "
                  freeSolo
                  variant="standard"
                  fullWidth
                />
              )}
              {columns?.map((day, index) => (
                <td
                  key={`medication-${day}-${medication.value}-${index}`}
                  className=" border"
                >
                  <input
                    // type="number"
                    // min="0"
                    // max="99"
                    // step="0.1"
                    disabled={false}
                    value={
                      medicationFormData[`${day}-${medication.value}`] || ''
                    }
                    onChange={(e) =>
                      handleInputChange(day, medication.value, e.target.value)
                    }
                    className="w-20 h-8 text-center border m-2"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {!autofillOnly && (
        <Button
          color="primary"
          onClick={handleAddMedication}
          sx={{ marginTop: 2 }}
        >
          Add Medication
        </Button>
      )}
    </div>
  )
}

export default MedicationSheet
