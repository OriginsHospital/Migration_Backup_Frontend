import { createVisit } from '@/constants/apis'
import {
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Table,
} from '@mui/material'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import Modal from './Modal'
import CreateVisit from './CreateVisit'
import { toast } from 'react-toastify'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Close } from '@mui/icons-material'

export default function VisitDetail({
  formData,
  visits,
  selectedVisit,
  handleChangeVisit,
  setSelectedVisit,
}) {
  const userDetails = useSelector(store => store.user)
  const QueryClient = useQueryClient()
  const dispatch = useDispatch()
  const dropdowns = useSelector(store => store.dropdowns)
  // const modal = useSelector((store) => store.modal)

  function getPackageNameById(id) {
    const chosenPackage = dropdowns.packagesChosen.filter(pkg => pkg.id === id)
    return chosenPackage ? chosenPackage[0].name : null
  }
  function getVisitById(id) {
    const visit = dropdowns.visitTypes.filter(vst => vst.id === id)
    // console.log('getVisitById', id, visit);
    return visit ? visit[0].name : null
  }
  // const [open, setOpen] = useState(false)

  const [visitForm, setVisitForm] = useState()
  useEffect(() => {
    setVisitForm({
      patientId: formData?.id,
      type: '',
      visitDate: '',
    })
  }, [formData])
  const handleFormChange = event => {
    setVisitForm({ ...visitForm, [event.target.name]: event.target.value })
  }
  const handleClose = () => {
    console.log('close called')
    setVisitForm({
      patientId: formData?.id,
      type: '',
      visitDate: '',
      packageChosen: '',
    })
    // setOpen(false);
    dispatch(closeModal())
  }
  const validateMutate = useMutation({
    mutationFn: async payload => {
      const res = await createVisit(userDetails.accessToken, payload)
      console.log('under mutation fn', res)
      if (res.status === 400) {
        toast.error(res.message)
      } else if (res.status === 200) {
        //set newly created visit to selectedVisit
        setSelectedVisit(res.data)
      }
      handleClose()
      // setIsValidUsers(1)
    },
    onSuccess: () => {
      QueryClient.invalidateQueries(
        'visits',
        // {
        //     queryKey: ['visits']
        // }
      )
    },
  })

  const handleSubmit = () => {
    console.log(visitForm)
    const mut = validateMutate.mutate(visitForm)

    console.log(mut)
  }

  return (
    <div className="flex justify-end mb-5">
      <FormControl>
        <InputLabel id="visit-label">
          {selectedVisit ? '' : 'New Visit'}
        </InputLabel>
        <Select
          value={
            visits?.data?.length === 0
              ? 'No Visits Available'
              : selectedVisit
              ? selectedVisit.id
              : ''
          }
          labelId="visit-label"
          label={selectedVisit ? '' : 'New Visit'}
          name="visit"
          className={`bg-white rounded-lg min-w-48 h-12 outline-none border-none`}
          onChange={handleChangeVisit}
        >
          {visits?.data?.length === 0 ? (
            <MenuItem value="No Visits Available" selected>
              No Visits Available
            </MenuItem>
          ) : (
            visits?.data?.map((each, index) => (
              <MenuItem key={each.id} value={each.id}>
                {each.isActive === 1 ? (
                  <span className="flex flex-row-reverse items-center gap-3">
                    <span className="bg-[#dcfce7] rounded-3xl px-2 py-1.5 text-[#22c55e]">
                      active
                    </span>
                    <span>
                      {index + 1}.{getVisitById(each.type)}
                      {/* {getPackageNameById(each.packageChosen)} */}
                    </span>
                  </span>
                ) : (
                  <span>
                    {index + 1}. {getVisitById(each.type)}
                    {/* {getPackageNameById(each.packageChosen)} */}
                  </span>
                )}
              </MenuItem>
            ))
          )}
          <MenuItem
            className="text-secondary flex float-end px-3 py-2 cursor-pointer"
            value="createVisit"
          >
            Create new Visit
          </MenuItem>
        </Select>
      </FormControl>

      <Modal
        // open={true}
        // title={'Create new visit'}
        uniqueKey="createVisit"
        closeOnOutsideClick={true}
        maxWidth={'xs'}
        // handleClose={handleClose}
        // handleSubmit={handleSubmit}
      >
        <div className="flex justify-between">
          <span className="text-xl font-semibold text-secondary flex items-center py-5 gap-4">
            Create New Visit
          </span>
          <IconButton onClick={() => dispatch(closeModal())}>
            <Close />
          </IconButton>
        </div>
        <CreateVisit
          handleClose={handleClose}
          setVisitForm={setVisitForm}
          visitForm={visitForm}
          handleFormChange={handleFormChange}
          handleSubmit={handleSubmit}
        />
      </Modal>
    </div>
  )
}
