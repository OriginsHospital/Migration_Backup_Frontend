import { closeModal } from '@/redux/modalSlice'
import { Button } from '@mui/material'
import {
  DatePicker,
  DateTimePicker,
  renderTimeViewClock,
} from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import React, { useCallback, useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import NoteAltIcon from '@mui/icons-material/NoteAlt'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import TextField from '@mui/material/TextField'

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
      if (key === `${oldCol}-note` || key.startsWith(`${oldCol}-`)) {
        newKey = `${newCol}${key.slice(oldCol.length)}`
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
  return parsed.isValid() ? parsed : null
}

const FollicularScanForm = ({
  folicularFormData,
  setFolicularFormData,
  follicularTemplate,
  handleUpdateTreatmentSheet,
  setFolicularTemplate,
  canUpdate,
  showEraStartTime = false,
  eraStartTime = null,
  onEraStartTimeChange,
  onUpdateEraStartTime,
  isUpdatingEraStartTime = false,
  onDay1DateChange,
}) => {
  const dispatch = useDispatch()
  const handleInputChange = useCallback(
    (day, side, size, value) => {
      const newValue = value === '' ? '' : parseFloat(value)
      if (isNaN(newValue) || newValue < 0 || newValue > 99) return

      setFolicularFormData((prevData) => ({
        ...prevData,
        [`${day}-${side}-${size}`]: newValue,
      }))
    },
    [setFolicularFormData],
  )
  // useEffect(() => {
  //   console.log(folicularFormData)
  // }, [folicularFormData])

  // Add new function to handle adding column
  const handleAddColumn = useCallback(() => {
    setFolicularTemplate((prev) => {
      const columns = Array.isArray(prev?.columns) ? prev.columns : []
      if (columns.length === 0) {
        return {
          ...prev,
          columns: [dayjs().format('DD/MM')],
        }
      }

      const lastDate = columns[columns.length - 1]
      const parsed = dayjs(lastDate, 'DD/MM')
      const nextDate = (parsed.isValid() ? parsed : dayjs())
        .add(1, 'day')
        .format('DD/MM')

      return {
        ...prev,
        columns: [...columns, nextDate],
      }
    })
  }, [setFolicularTemplate])

  const handleDay1DateChange = useCallback(
    (newValue) => {
      const start = parseSheetDate(newValue)
      const oldCols = follicularTemplate?.columns
      if (!start || !Array.isArray(oldCols) || oldCols.length === 0) return

      const newCols = oldCols.map((_, index) =>
        start.add(index, 'day').format('DD/MM'),
      )
      if (oldCols.join('|') === newCols.join('|')) return

      setFolicularFormData((prev) =>
        remapSheetKeysByColumns(prev, oldCols, newCols),
      )
      setFolicularTemplate((prev) => ({
        ...(prev || {}),
        columns: newCols,
      }))
      onDay1DateChange?.(oldCols, newCols)
    },
    [
      follicularTemplate?.columns,
      onDay1DateChange,
      setFolicularFormData,
      setFolicularTemplate,
    ],
  )

  const [noteModal, setNoteModal] = useState({
    open: false,
    day: null,
  })

  const handleNoteChange = (day, note) => {
    setFolicularFormData((prevData) => ({
      ...prevData,
      [`${day}-note`]: note,
    }))
  }

  const handleNoteClick = (day) => {
    setNoteModal({
      open: true,
      day,
    })
  }

  // Add function to check if a column date matches today
  const isCurrentDate = useCallback((columnDate) => {
    const today = dayjs().format('DD/MM')
    return columnDate === today
  }, [])

  return (
    <div className="w-full">
      {showEraStartTime && (
        <div className="flex flex-wrap items-end gap-3 p-3 border-b">
          <DateTimePicker
            label="ERA Start Time"
            className="bg-white rounded-lg"
            format="DD/MM/YY hh:mm A"
            value={eraStartTime ? dayjs(eraStartTime) : null}
            onChange={(newValue) => {
              if (newValue && onEraStartTimeChange) {
                onEraStartTimeChange(newValue)
              }
            }}
            disabled={!canUpdate}
            viewRenderers={{
              hours: renderTimeViewClock,
              minutes: renderTimeViewClock,
            }}
          />
          {canUpdate && (
            <Button
              variant="contained"
              className="bg-secondary text-white capitalize"
              onClick={onUpdateEraStartTime}
              disabled={!eraStartTime || isUpdatingEraStartTime}
            >
              {isUpdatingEraStartTime ? 'Saving...' : 'Set ERA Start Time'}
            </Button>
          )}
          {!eraStartTime && canUpdate && (
            <p className="text-sm text-gray-500">
              ERA start date and time can be set here after starting treatment.
            </p>
          )}
        </div>
      )}
      <div className="flex justify-end p-3">
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
              onClick={() => handleUpdateTreatmentSheet('update')}
              variant="contained"
              className="bg-secondary text-white"
            >
              Update Sheet
            </Button>
          </div>
        )}
      </div>
      {/* <div className="flex justify-end pb-10">
                <DatePicker
                    // className='w-full bg-white'
                    value={dayjs(treatmentStartDate.split('T')[0])}
                    className="max-w-48"
                    label="Treatment Start Date"
                    format=" DD/MM/YYYY"
                    onChange={e => {
                        setTreatmentStartDate(dayjs(e).format('YYYY-MM-DD'))
                    }}
                    disabled={treatmentStatus?.currentStage == 'START'}
                />
            </div> */}
      <table className=" border-collapse overflow-hidden">
        <thead>
          <tr>
            <th className="bg-secondary text-white  border min-w-32">
              <p className="">{`Follicular Scan`}</p>
              <p className="text-xs">{`(in mm)`}</p>
            </th>
            {follicularTemplate?.columns?.map((day, index) => (
              <th
                key={'folicular' + day + '-' + index}
                className={`bg-secondary text-white p-2 border text-center ${
                  isCurrentDate(day) ? 'ring-2 ring-green-400' : ''
                }`}
                colSpan={2}
              >
                <div>{`Day ${index + 1}`}</div>
                {index === 0 && canUpdate ? (
                  <div className="mt-1 flex justify-center">
                    <DatePicker
                      value={parseSheetDate(day)}
                      format="DD/MM"
                      onChange={handleDay1DateChange}
                      slotProps={{
                        textField: {
                          size: 'small',
                          variant: 'standard',
                          title: 'Change Day 1 date',
                          sx: {
                            minWidth: 72,
                            input: {
                              color: 'white',
                              textAlign: 'center',
                              fontSize: '0.75rem',
                              padding: '2px 0',
                              cursor: 'pointer',
                            },
                            '& .MuiInput-underline:before': {
                              borderBottomColor: 'rgba(255,255,255,0.55)',
                            },
                            '& .MuiInput-underline:hover:before': {
                              borderBottomColor: 'white',
                            },
                            '& .MuiInput-underline:after': {
                              borderBottomColor: 'white',
                            },
                            '& .MuiSvgIcon-root': {
                              color: 'white',
                              fontSize: '1rem',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-xs">{day}</div>
                )}
              </th>
            ))}
          </tr>
          <tr>
            <th></th>
            {follicularTemplate?.columns?.flatMap((day) => [
              <th
                key={`'folicular'${day}-R`}
                className={`p-2 border text-center ${
                  isCurrentDate(day) ? 'bg-green-50' : ''
                }`}
              >
                R
              </th>,
              <th
                key={`'folicular'${day}-L`}
                className={`p-2 border text-center ${
                  isCurrentDate(day) ? 'bg-green-50' : ''
                }`}
              >
                L
              </th>,
            ])}
          </tr>
        </thead>
        <tbody>
          {follicularTemplate?.rows?.map(({ value }, size) => (
            <tr
              key={'folicular' + size}
              className={size % 2 === 0 ? 'bg-slate-100' : ''}
            >
              <td
                className={`p-2 border-green-500 border text-center font-medium ${
                  size < 5
                    ? 'bg-green-200 text-green-900'
                    : size <= 10
                      ? 'bg-green-300 text-green-800'
                      : size === 21
                        ? 'bg-violet-300 text-white'
                        : 'bg-green-400 text-white'
                }`}
              >
                {value}
              </td>
              {follicularTemplate?.columns?.flatMap((day) => [
                <td
                  key={`'folicular'${day}-R-${size}`}
                  className={`border ${
                    isCurrentDate(day) ? 'bg-green-100' : ''
                  }`}
                  colSpan={size === 21 ? 2 : 1}
                >
                  {size === 21 ? (
                    <Button
                      className="w-full"
                      onClick={() => handleNoteClick(day)}
                    >
                      <NoteAltIcon
                        color={
                          folicularFormData[`${day}-note`]
                            ? 'primary'
                            : 'action'
                        }
                      />
                    </Button>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      max="999"
                      step="0.1"
                      value={folicularFormData[`${day}-R-${size}`] || ''}
                      disabled={false}
                      onChange={(e) =>
                        handleInputChange(day, 'R', size, e.target.value)
                      }
                      className="w-10 h-8 text-center border m-1"
                    />
                  )}
                </td>,
                // Only render L column if not the last row (ET row is at index 21)
                ...(size !== 21
                  ? [
                      <td
                        key={`'folicular'${day}-L-${size}`}
                        className={`border ${
                          isCurrentDate(day) ? 'bg-green-100' : ''
                        }`}
                      >
                        <input
                          type="number"
                          min="0"
                          max="99"
                          step="0.1"
                          disabled={false}
                          value={folicularFormData[`${day}-L-${size}`] || ''}
                          onChange={(e) =>
                            handleInputChange(day, 'L', size, e.target.value)
                          }
                          className="w-10 h-8 text-center border m-1"
                        />
                      </td>,
                    ]
                  : []),
              ])}
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={noteModal.open}
        onClose={() => setNoteModal({ open: false, day: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Note for Day{' '}
          {follicularTemplate?.columns?.indexOf(noteModal.day) + 1}
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={folicularFormData[`${noteModal.day}-note`] || ''}
            onChange={(e) => handleNoteChange(noteModal.day, e.target.value)}
            placeholder="Enter your notes here..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteModal({ open: false, day: null })}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default FollicularScanForm
