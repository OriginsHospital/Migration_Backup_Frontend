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
import { useMutation } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { downloadConsentFormById } from '@/constants/apis'
import { CONSENT_TYPES } from '@/constants/consentTypes'
import Link from 'next/link'
const ConsentCRUD = ({
  consentType,
  consentFormsList,
  useConsentOperations,
  downloadConsentFormMutate,
}) => {
  const [selectedForm, setSelectedForm] = useState('')
  const {
    consents,
    isLoading,
    uploadConsent,
    deleteConsent,
  } = useConsentOperations(consentType)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        uploadConsent(acceptedFiles[0])
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg p-4 shadow-sm border-b">
        <h1 className="text-2xl font-semibold text-gray-900">
          {CONSENT_TYPES[consentType].label}
        </h1>
        {/* <p className="text-sm text-gray-500 mt-1">
            Upload, manage and download consent forms for {consentType.toLowerCase()} procedures
          </p> */}
      </div>

      <div className="grid grid-cols-3 gap-6 overflow-scroll">
        {/* Main Content - Upload & List */}
        <div className="col-span-2 space-y-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border-b">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Upload Consent Form
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

          {/* Uploaded Forms Section */}
          <div className="bg-white rounded-lg p-4 shadow-sm border-2">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Uploaded Consent Forms
            </h2>

            {isLoading ? (
              <div className="flex justify-center p-8">
                <div className="animate-pulse text-gray-500">Loading...</div>
              </div>
            ) : consents?.data?.length > 0 ? (
              <div className="divide divide-gray-200 border-radius-2">
                {consents.data.map((each, index) => (
                  <div
                    key={index + each.id}
                    className="flex items-center justify-between py-2 border-2 border-b-0 last:border-b-2 border-gray-200 group"
                  >
                    <Link href={each.link} target="_blank" className="flex-1">
                      <div className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className="p-2 rounded-lg bg-primary">
                          <OpenInNew className="h-5 w-5 text-secondary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            {each.key
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
                          deleteConsent(each.id)
                        }
                      }}
                    >
                      <Delete className="h-5 w-5 text-red-500 hover:text-red-600" />
                    </IconButton>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                No consent forms uploaded yet
              </div>
            )}
          </div>
        </div>

        {/* Download Forms Section */}
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
                {consentFormsList?.data?.map((each, index) => (
                  <MenuItem key={index} value={each.id}>
                    {each.name}
                  </MenuItem>
                ))}
              </Select>

              <Button
                disabled={!selectedForm}
                variant="contained"
                onClick={() => downloadConsentFormMutate.mutate(selectedForm)}
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

export default ConsentCRUD
