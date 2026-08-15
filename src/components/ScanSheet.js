import React, { useCallback, useEffect, useState } from 'react'
import { Autocomplete, Button, TextField } from '@mui/material'
import dayjs from 'dayjs'
import DeleteIcon from '@mui/icons-material/Delete'
import IconButton from '@mui/material/IconButton'
import NoteAltIcon from '@mui/icons-material/NoteAlt'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'

function ScanSheet({
  scanFormData,
  setScanFormData,
  allBillTypeValues,
  columns,
}) {
  const handleAddScan = () => {
    setScanFormData(prevData => ({
      ...prevData,
      rows: [...(prevData?.rows || []), { label: '' }],
    }))
  }

  const [scanOptions, setScanOptions] = useState([])
  useEffect(() => {
    console.log(allBillTypeValues)
    if (allBillTypeValues) {
      setScanOptions(allBillTypeValues['Lab Test']?.map(item => item.name))
    }
  }, [allBillTypeValues])
  const handleInputChange = (day, scan, value) => {
    // const newValue = value === '' ? '' : parseFloat(value)
    // if (isNaN(newValue) || newValue < 0 || newValue > 99) return
    console.log(scanFormData)
    if (value.length > 5) return

    setScanFormData(prevData => ({
      ...prevData,
      [`${day}-${scan}`]: value,
    }))
  }

  const handleScanChange = useCallback(
    (index, newValue) => {
      setScanFormData(prevData => ({
        ...prevData,
        rows: prevData.rows.map((row, i) =>
          i === index ? { ...row, label: newValue, value: newValue } : row,
        ),
      }))
    },
    [setScanFormData],
  )

  const handleDeleteScan = index => {
    setScanFormData(prevData => ({
      ...prevData,
      rows: prevData.rows.filter((_, i) => i !== index),
    }))
  }

  const [noteModal, setNoteModal] = useState({
    open: false,
    day: null,
    scan: null,
  })

  const handleNoteChange = (day, scan, note) => {
    setScanFormData(prevData => ({
      ...prevData,
      [`${day}-${scan}-note`]: note,
    }))
  }

  const handleNoteClick = (day, scan) => {
    setNoteModal({
      open: true,
      day,
      scan,
    })
  }

  return (
    <div className="w-full mt-10">
      <table className=" border-collapse">
        <thead>
          <tr>
            <th className="w-12"></th>
            <th className="bg-secondary text-white p-2 border">
              Investigation
            </th>
            {columns?.map((day, index) => (
              <th
                key={'scan' + day}
                className="bg-secondary text-white p-2 border text-center"
              >
                <div>{`Day ${index + 1}`}</div>
                <div className="text-xs">{day}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {scanFormData.rows?.map((scan, index) => (
            <tr
              key={'scan' + scan.value}
              className={index % 2 === 0 ? 'bg-gray-100' : ''}
            >
              <td className="border p-2 w-12 bg-white">
                <IconButton
                  onClick={() => handleDeleteScan(index)}
                  size="small"
                  color="error"
                  aria-label="delete scan"
                >
                  <DeleteIcon />
                </IconButton>
              </td>
              <td className="p-2 border font-medium min-w-32">
                {scan.value ? (
                  scan.value
                ) : (
                  <Autocomplete
                    options={scanOptions}
                    value={scan.value}
                    onChange={(event, newValue) =>
                      handleScanChange(index, newValue)
                    }
                    renderInput={params => (
                      <TextField {...params} variant="outlined" size="small" />
                    )}
                    freeSolo
                    fullWidth
                  />
                )}
              </td>
              {columns?.map((day, dayIndex) => (
                <td
                  key={`scan-${day}-${scan.value}-${dayIndex}`}
                  className="border"
                >
                  <div className="flex items-center justify-center gap-2">
                    <input
                      disabled={false}
                      value={scanFormData[`${day}-${scan.value}`] || ''}
                      onChange={e =>
                        handleInputChange(day, scan.value, e.target.value)
                      }
                      className="w-20 h-8 text-center border m-2"
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleNoteClick(day, scan.value)}
                    >
                      <NoteAltIcon
                        color={
                          scanFormData[`${day}-${scan.value}-note`]
                            ? 'primary'
                            : 'action'
                        }
                      />
                    </IconButton>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <Button color="primary" onClick={handleAddScan} sx={{ marginTop: 2 }}>
        Add Investigation
      </Button>

      <Dialog
        open={noteModal.open}
        onClose={() => setNoteModal({ open: false, day: null, scan: null })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Add Note for {noteModal.scan} - Day{' '}
          {columns?.indexOf(noteModal.day) + 1}
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={4}
            fullWidth
            value={
              scanFormData[`${noteModal.day}-${noteModal.scan}-note`] || ''
            }
            onChange={e =>
              handleNoteChange(noteModal.day, noteModal.scan, e.target.value)
            }
            placeholder="Enter your notes here..."
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setNoteModal({ open: false, day: null, scan: null })}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default ScanSheet
