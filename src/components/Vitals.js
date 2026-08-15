import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Button, InputAdornment, TextField, Typography } from '@mui/material'
import { CheckCircleSharp, PendingActions } from '@mui/icons-material'
import Modal from './Modal'
import { closeModal, openModal } from '@/redux/modalSlice'
import { getAppointmentCompositeId } from '@/utils/appointmentKeys'

function Vitals({
  patientDetails,
  vitalsData,
  setVitalsData,
  createVitalsMutation,
  editVitalsMutation,
}) {
  const dispatch = useDispatch()
  const user = useSelector((store) => store.user)
  const [isEditing, setIsEditing] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (vitalsData?.id) {
      editVitalsMutation.mutate({ ...vitalsData, initials: user?.userName })
      setIsEditing(false)
    } else {
      createVitalsMutation.mutate({
        ...vitalsData,
        doctorId: patientDetails?.doctorId,
        patientId: patientDetails?.patientId,
        appointmentId: patientDetails?.appointmentId,
        type: patientDetails?.type,
        appointmentDate: patientDetails?.appointmentDate,
        initials: user?.userName,
      })
      setIsEditing(false)
    }
  }

  const handleVitalsChange = (e) => {
    setVitalsData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setIsEditing(true)
  }
  useEffect(() => {
    if (vitalsData?.weight && vitalsData?.height) {
      calculateBMI()
    }
  }, [vitalsData?.weight, vitalsData?.height])
  const calculateBMI = () => {
    const bmi =
      vitalsData?.weight / ((vitalsData?.height * vitalsData?.height) / 10000)
    setVitalsData((prev) => ({ ...prev, bmi: bmi.toFixed(2) }))
  }

  useEffect(() => {
    if (vitalsData?.spouseWeight && vitalsData?.spouseHeight) {
      calculateSpouseBMI()
    }
  }, [vitalsData?.spouseWeight, vitalsData?.spouseHeight])

  const calculateSpouseBMI = () => {
    const bmi =
      vitalsData?.spouseWeight /
      ((vitalsData?.spouseHeight * vitalsData?.spouseHeight) / 10000)
    setVitalsData((prev) => ({ ...prev, spouseBmi: bmi.toFixed(2) }))
  }

  return (
    <Modal
      maxWidth={'sm'}
      uniqueKey={`${getAppointmentCompositeId(patientDetails)}vitals`}
      // onOutsideClick={() => {
      //     dispatch(closeModal(patientDetails?.appointmentId + 'vitals'))
      //     setIsEditing(false)
      //     setVitalsData({
      //         weight: '',
      //         height: '',
      //         temperature: '',
      //         bp: '',
      //         pulse: '',
      //         respiration: '',
      //         notes: '',
      //         initials: user?.userName,
      //         bmi: ''

      //     })
      //     console.log('vitalsData', vitalsData)
      // }}
      closeOnOutsideClick={false}
      // onOutsideClick={() => {
      //     dispatch(closeModal(patientDetails?.id + 'vitals'))
      //     setIsEditing(false)
      //     setVitalsData({})
      // }}
    >
      <div>
        <Typography variant="h5" className="text-center mb-5">
          Vitals
        </Typography>

        <form className="grid grid-cols-3 gap-4" onSubmit={handleSubmit}>
          <TextField
            label="Weight"
            value={vitalsData?.weight || ''}
            name="weight"
            type="number"
            onChange={handleVitalsChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              // readOnly: vitalsData?.id && !isEditing,
            }}
            required
          />
          {/* height */}
          <TextField
            label="Height"
            value={vitalsData?.height || ''}
            name="height"
            type="number"
            onChange={handleVitalsChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
            required
          />
          {/* calculate bmi */}
          <TextField
            label="BMI"
            value={vitalsData?.bmi || ''}
            name="bmi"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">kg/m²</InputAdornment>
              ),
            }}
          />
          {/* <TextField
                        label="Temperature"
                        value={vitalsData?.temperature || ''}
                        name="temperature"
                        type='number'
                        onChange={handleVitalsChange}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">°F</InputAdornment>,
                        }}
                        required
                    /> */}
          <TextField
            label="BP"
            value={vitalsData?.bp || ''}
            name="bp"
            // type="number"
            onChange={handleVitalsChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">mm of hg</InputAdornment>
              ),
            }}
            required
          />
          <TextField
            label="Spouse Weight"
            value={vitalsData?.spouseWeight || ''}
            name="spouseWeight"
            // type="number"
            onChange={handleVitalsChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
          />
          <TextField
            label="Spouse Height"
            value={vitalsData?.spouseHeight || ''}
            name="spouseHeight"
            // type="number"
            onChange={handleVitalsChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
          />
          <TextField
            label="Spouse BMI"
            value={vitalsData?.spouseBmi || ''}
            name="spouseBmi"
            // type="number"
            onChange={handleVitalsChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">kg/m²</InputAdornment>
              ),
            }}
          />
          {/* <TextField
                        label="Pulse"
                        value={vitalsData?.pulse || ''}
                        type='number'
                        name="pulse"
                        onChange={handleVitalsChange}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                        }}
                        required
                    /> */}
          {/* <TextField
                        label="Respiration"
                        value={vitalsData?.respiration || ''}
                        name="respiration"
                        onChange={handleVitalsChange}
                        InputProps={{
                            endAdornment: <InputAdornment position="end">bpm</InputAdornment>,
                        }}
                        required
                    /> */}
          {/* <TextField
                        label="Pain"
                        value={vitalsData?.pain || ''}
                        name='pain'
                        onChange={handleVitalsChange}
                        required
                    /> */}

          <TextField
            label="Notes"
            value={vitalsData?.notes || ''}
            name="notes"
            className="col-span-2"
            onChange={handleVitalsChange}
            required
            multiline
            // rows={2}
          />
          <TextField
            label="Initials"
            value={vitalsData?.initials || user?.userName}
            name="initials"
            // onChange={handleVitalsChange}
            InputProps={{
              endAdornment: <InputAdornment position="end"></InputAdornment>,
            }}
            // required
            readOnly={true}
          />
          <div className="col-span-3 flex justify-end gap-2 mt-4">
            <Button
              variant="outlined"
              onClick={() => {
                dispatch(closeModal(patientDetails?.id + 'vitals'))
                setIsEditing(false)
                // setVitalsData({

                // })
              }}
            >
              Close
            </Button>
            {vitalsData?.id ? (
              isEditing && (
                <Button
                  variant="contained"
                  color="primary"
                  type="submit"
                  className="text-white"
                  disabled={!isEditing}
                >
                  Save Changes
                </Button>
              )
            ) : (
              <Button variant="contained" className="text-white" type="submit">
                Create
              </Button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  )
}

export default Vitals
