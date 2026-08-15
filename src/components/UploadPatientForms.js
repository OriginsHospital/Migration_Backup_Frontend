import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material'
import { UploadFile, Delete, Download, OpenInNew } from '@mui/icons-material'
import Link from 'next/link'
import { PATIENT_FORMS_TYPES } from '@/constants/consentTypes'
import {
  deleteFormFForm,
  downloadSampleFormF,
  getFormFTemplatesByPatientId,
  getFormFTemplatesByScanAppointment,
  uploadFormFForm,
} from '@/constants/apis'
import { useSelector } from 'react-redux'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bounce, toast } from 'react-toastify'

const toastconfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}

const UploadPatientForms = ({ formType, formDetails }) => {
  const QueryClient = useQueryClient()
  const userDetails = useSelector(store => store.user)
  const [selectedForm, setSelectedForm] = useState('FormF')

  const { data: formFHistoryByScanAppointment, isLoading } = useQuery({
    queryKey: ['getFormFHistoryByScanAppointment', formDetails],
    queryFn: () =>
      getFormFTemplatesByScanAppointment(
        userDetails.accessToken,
        formDetails?.appointmentId,
        formDetails?.scanId,
        formDetails?.type,
      ),
    enabled: !!formDetails,
    refetchOnWindowFocus: true,
    refetchInterval: false,
  })

  const downloadFormFMutate = useMutation({
    mutationFn: async id => {
      const res = await downloadSampleFormF(
        userDetails.accessToken,
        formDetails?.appointmentId,
        formDetails?.scanId,
        formDetails?.type,
      )
    },
  })

  const handleFileUpload = async acceptedFiles => {
    try {
      const response = await uploadFormFForm(
        userDetails.accessToken,
        parseInt(formDetails?.appointmentId),
        acceptedFiles[0],
        formDetails?.scanId,
        formDetails?.type,
      )

      if (response.status === 200) {
        toast.success('Successfully Uploaded', toastconfig)
        QueryClient.invalidateQueries('getFormFHistoryByScanAppointment')
      } else {
        console.error('Upload failed with status:', response.status)
        toast.error('Failed to Upload', toastconfig)
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Error Uploading file', toastconfig)
    }
  }

  const handleDeleteFormF = async () => {
    try {
      const delResponse = await deleteFormFForm(userDetails?.accessToken, {
        appointmentId: formDetails?.appointmentId,
        scanId: formDetails?.scanId,
        type: formDetails?.type,
      })

      if (delResponse?.status === 200) {
        toast.success('Successfully Deleted', toastconfig)
        QueryClient.invalidateQueries('getFormFHistoryByScanAppointment')
      } else {
        console.error('Delete failed with status:', delResponse.status)
        toast.error('Failed to Delete', toastconfig)
      }
    } catch (err) {
      console.error('Error Deleting file:', err)
      toast.error('Error Deleting file', toastconfig)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        handleFileUpload(acceptedFiles)
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  })

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-6 overflow-scroll">
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border-b">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Form F Form
            </h2>

            <div
              {...getRootProps()}
              className={`
                relative p-8 border-2 border-dashed rounded-lg cursor-pointer
                transition-all duration-300 ease-in-out
                ${
                  isDragActive
                    ? 'border-secondary bg-blue-50'
                    : 'border-gray-300 hover:border-secondary/5 hover:bg-gray-50'
                }
              `}
            >
              <input {...getInputProps()} />
              <div className="flex flex-row items-center gap-6 h-[20px] justify-center">
                <div className="p-2 rounded-full bg-primary">
                  <UploadFile className="h-8 w-8 text-secondary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive
                      ? 'Drop your file here'
                      : 'Drag & drop your file here'}
                  </p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Supports PDF only (max 10MB)
                  </p> */}
                </div>
                <Button variant="outlined" className="mt-2" size="small">
                  Browse Files
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm border-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Uploaded Form F Forms
            </h2>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-pulse text-gray-500">Loading...</div>
              </div>
            ) : formFHistoryByScanAppointment?.data &&
              formFHistoryByScanAppointment?.data?.formFUploadLink ? (
              <div className="divide divide-gray-200 border-radius-2">
                <div
                  key={formFHistoryByScanAppointment?.data?.scanId}
                  className="flex items-center justify-between py-2 border-2 border-b-0 last:border-b-2 border-gray-200"
                >
                  <Link
                    href={formFHistoryByScanAppointment?.data?.formFUploadLink}
                    target="_blank"
                    className="flex-1"
                  >
                    <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                      <div className="p-2 rounded-lg bg-primary">
                        <OpenInNew className="h-5 w-5 text-secondary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          {formFHistoryByScanAppointment?.data?.formFUploadKey
                            ?.split('/')
                            ?.pop()
                            ?.split('_')
                            .slice(1)
                            .join('_')}
                        </p>
                        <p className="text-xs text-gray-500">
                          Click to view document
                        </p>
                      </div>
                    </div>
                  </Link>

                  <IconButton
                    className="opacity-100 group-hover:opacity-100 transition-opacity"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Are you sure you want to delete this consent form?',
                        )
                      ) {
                        handleDeleteFormF()
                      }
                    }}
                  >
                    <Delete className="h-5 w-5 text-red-500 hover:text-red-600" />
                  </IconButton>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No Form F uploaded yet
              </div>
            )}
          </div>
        </div>

        <div className="col-span-1">
          <div className="bg-white rounded-lg p-4 shadow-sm sticky top-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Download Consent Forms
            </h2>

            <FormControl fullWidth variant="outlined">
              <InputLabel>Select Form Template</InputLabel>
              <Select
                value={selectedForm}
                onChange={e => setSelectedForm(e.target.value)}
                label="Select Form Template"
              >
                <MenuItem key={'FormF'} value={'FormF'} selected>
                  {'Sample Form-F Template'}
                </MenuItem>
              </Select>

              <Button
                disabled={!selectedForm}
                variant="contained"
                onClick={() => downloadFormFMutate.mutate(selectedForm)}
                className="mt-4 w-full bg-secondary hover:bg-secondary/80 text-white"
                startIcon={<Download />}
              >
                Download Template
              </Button>
            </FormControl>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadPatientForms
