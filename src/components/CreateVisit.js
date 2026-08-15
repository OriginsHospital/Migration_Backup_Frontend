import { TextField } from '@mui/material'
import React from 'react'
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material'
import { useSelector } from 'react-redux'
import dayjs from 'dayjs'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
export default function CreateVisit({
  handleClose,
  visitForm,
  setVisitForm,
  handleFormChange,
  handleSubmit,
}) {
  const dropdowns = useSelector(store => store.dropdowns)

  const handleCreate = () => {
    console.log(visitForm)
  }
  return (
    <>
      {/* <DialogContent className='flex flex-col pt-3'> */}
      <div className="p-4 flex flex-col gap-4 ">
        <FormControl className="">
          <InputLabel id="demo-simple-select-label">Visit Type</InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="bg-white rounded-lg"
            value={visitForm?.type}
            name="type"
            label="Visit Type"
            onChange={handleFormChange}

            // disabled={isEdit == 'noneditable'}
          >
            {dropdowns?.visitTypes?.map(each => (
              <MenuItem key={each.id} value={each.id}>
                {each.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Visit Start Date"
            // disabled={isEdit == 'noneditable'}
            format="DD/MM/YYYY"
            className="bg-white rounded-lg w-full"
            value={visitForm?.visitDate ? dayjs(visitForm?.visitDate) : null}
            name="visitDate"
            view={['year', 'day', 'month']}
            onChange={newValue =>
              setVisitForm({
                ...visitForm,
                visitDate: dayjs(newValue).format('YYYY-MM-DD'),
              })
            }
          />
        </LocalizationProvider>
        {/* <FormControl>
          <InputLabel id="demo-simple-select-label">Package </InputLabel>
          <Select
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            className="bg-white rounded-lg"
            value={visitForm?.packageChosen}
            name="packageChosen"
            label="Package"
            onChange={handleFormChange}
            // disabled={isEdit == 'noneditable'}
          >
            {dropdowns?.packagesChosen?.map(each => (
              <MenuItem key={each.id} value={each.id}>
                {each.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl> */}
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit}>
            Create
          </Button>
        </DialogActions>
      </div>

      {/* </DialogContent> */}
    </>
  )
}
