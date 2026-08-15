import React, { useEffect, useRef, useState } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  CircularProgress,
  IconButton,
  Checkbox,
  FormControlLabel,
} from '@mui/material'
import {
  CameraAlt,
  Close,
  Download,
  Edit,
  Save,
  Delete,
} from '@mui/icons-material'
import dynamic from 'next/dynamic'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  downloadEmbryologyReport,
  uploadEmbryologyImage,
  deleteEmbryologyImage,
  SaveEmbryologyConsultation,
  SaveEmbryologyTreatment,
  downloadEmbryologyImagesReport,
} from '@/constants/apis'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { PrintPreview } from './PrintPreview'
import TextDisableJoeditor from './TextDisableJoeditor'
import { useDispatch } from 'react-redux'
import { openModal } from '@/redux/modalSlice'
// Dynamic import of JoditEditor for client-side rendering
const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false })

function EmbryologyModalContentNew({
  selectedRow,
  embryologyData,
  newData,
  setNewData,
  editData,
  setEditData,
  editEmbryologyMutation,
  // editEmbryologyMutation,
  // editEmbryologyMutation,
  // setImagePreview,
  // saveEmbryologyMutation,
  activeEmbryologyType,
  setActiveEmbryologyType,
  activeDayTab,
  setActiveDayTab,
  embryologyTypes,
  setEmbryologyTypes,
}) {
  const user = useSelector((state) => state.user)
  const queryClient = useQueryClient()
  // States

  // const [embryologyData, setEmbryologyData] = useState([])
  const [editMode, setEditMode] = useState(null)
  // const [imagePreview, setImagePreview] = useState(null)
  const [selectedImages, setSelectedImages] = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [editSelectedImages, setEditSelectedImages] = useState([])
  const [updateTemplateForAll, setUpdateTemplateForAll] = useState(false)
  const imgInputRef = useRef(null)
  const editorNew = useRef(null)
  const editorEdit = useRef(null)
  // const [html2pdf, setHtml2pdf] = useState(null)

  // useEffect(() => {
  //   import('html2pdf.js').then(module => {
  //     setHtml2pdf(() => module.default)
  //   })
  // }, [])

  // Get embryology types from selected row

  // Tab panel component
  // useEffect(() => {
  //   setActiveEmbryologyType(embryologyData?.[0]?.embryologyType)
  //   setActiveDayTab(0)
  // }, [])

  // Handlers
  const handleEmbryologyTypeChange = (_, newValue) => {
    console.log('newValue', _, newValue, newData)
    setActiveEmbryologyType(newValue)
    setActiveDayTab(0)
    setNewData({
      ...newData,
      template: '',
      embryologyImage: [],
      embryologyType: newValue,
      categoryType: '',
    })
  }

  const handleDayTabChange = (_, newValue) => {
    setActiveDayTab(newValue)
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    const isEdit = e.target.getAttribute('data-is-edit') === 'true'

    if (files.length > 0) {
      if (isEdit) {
        // For edit mode, append new files to existing editSelectedImages
        setEditSelectedImages((prev) => [...prev, ...files])
      } else {
        // For new mode, append new files to existing selectedImages
        setSelectedImages((prev) => [...prev, ...files])
      }
    }
  }
  const handleEdit = (data, index) => {
    setEditMode(index)
    setEditData({ ...data })
    setEditSelectedImages([]) // Clear edit selected images when entering edit mode
  }
  const handlePreviewReport = async () => {
    try {
      // Get report template with correct name swapping
      const reportResponse = await downloadEmbryologyReport(user.accessToken, {
        categoryType: activeEmbryologyType,
        id: selectedRow?.id,
        type: selectedRow?.type,
      })

      // Show preview modal
      dispatch(
        openModal({
          uniqueKey: 'print-preview-embryology',
          component: (
            <PrintPreview
              htmlContent={reportResponse.data}
              uniqueKey="embryology"
            />
          ),
        }),
      )
    } catch (error) {
      console.error('Error previewing report:', error)
      toast.error('Failed to preview report', toastconfig)
    }
  }

  const handleSaveChanges = () => {
    console.log('save changes', editData)

    // Get embryology type name to check if it's Semen Analysis
    // embryologyTypes contains objects with embryologyId and embryologyName
    const currentEmbryologyType = embryologyTypes?.find(
      (type) => type.embryologyId === activeEmbryologyType,
    )
    const isSemenAnalysis =
      currentEmbryologyType?.embryologyName?.toLowerCase().includes('semen') ||
      currentEmbryologyType?.embryologyName?.toLowerCase().includes('seman')

    let data = {
      categoryType: editData?.categoryType,
      template: editData?.template,
      id: editData?.id,
      type: selectedRow?.type,
      embryologyType: activeEmbryologyType,
      updateTemplateForAll: false, // Disabled: Always set to false
    }
    // console.log('handleSaveChanges payload', payload, selectedRow?.type, editData?.id)

    // Use edit API for template changes only
    editEmbryologyMutation.mutate(data)
    setEditMode(null)
    setUpdateTemplateForAll(false) // Reset checkbox after save
    // setEditData({})
    // setEditSelectedImages([]) // Clear selected images after saving
  }
  const handleDiscardChanges = () => {
    setEditMode(null)
    setEditData({})
    setEditSelectedImages([]) // Clear edit selected images when discarding changes
    toast.info('Changes discarded', toastconfig)
  }
  const handleEditInputChange = (field, value) => {
    // console.log(field, value)
    setEditData((prev) => ({ ...prev, [field]: value }))
  }
  const downloadMutate = useMutation({
    mutationKey: ['downloadEmbryologyImages'],
    mutationFn: async (payload) => {
      console.log('payload', payload)
      const response = await downloadEmbryologyImagesReport(
        user.accessToken,
        payload,
      )
      if (response.status !== 200) {
        throw new Error('Failed to download embryology images')
      } else {
        toast.success(
          'Embryology images report downloaded successfully',
          toastconfig,
        )
      }
      // console.log('response', response)
      return response
    },
  })
  const saveEmbryologyMutation = useMutation({
    mutationFn: async (payload) => {
      console.log('saveEmbryologyMutation payload', payload)
      let res
      if (selectedRow?.type === 'Consultation') {
        res = await SaveEmbryologyConsultation(user.accessToken, payload)
      } else {
        res = await SaveEmbryologyTreatment(user.accessToken, payload)
      }
      if (res.status !== 200) {
        throw new Error('Failed to save embryology treatment')
      }
      return res.data
    },
    onSuccess: () => {
      toast.success('Embryology record saved successfully', toastconfig)
      queryClient.invalidateQueries(['embryologyPatientsList'])
      setNewData({
        template: '',
        embryologyImage: [],
        embryologyType: activeEmbryologyType,
        categoryType: '',
      })
      setSelectedImages([])
    },
    onError: (error) => {
      console.error('Error saving treatment:', error)
      toast.error('Failed to save embryology record', toastconfig)
    },
  })
  // Image upload mutation
  const uploadImagesMutation = useMutation({
    mutationKey: ['uploadEmbryologyImages'],
    mutationFn: async (formData) => {
      console.log('Mutation called with formData:', formData)
      const response = await uploadEmbryologyImage(user.accessToken, formData)
      console.log('Upload response:', response)
      return response
    },
    onSuccess: (data) => {
      console.log('Upload success:', data)
      if (data.status === 200) {
        toast.success('Images uploaded successfully', toastconfig)
        setSelectedImages([])
        setEditSelectedImages([])
        setUploadingImages(false)
        // Refresh embryology data
        queryClient.invalidateQueries(['embryologyPatientsList'])
      } else {
        toast.error('Failed to upload images', toastconfig)
        setUploadingImages(false)
      }
    },
    onError: (error) => {
      console.error('Upload error:', error)
      toast.error('Failed to upload images', toastconfig)
      setUploadingImages(false)
    },
  })

  // Image delete mutation
  const deleteImageMutation = useMutation({
    mutationKey: ['deleteEmbryologyImage'],
    mutationFn: async (payload) => {
      const response = await deleteEmbryologyImage(user.accessToken, payload)
      return response
    },
    onSuccess: (data) => {
      toast.success('Image deleted successfully', toastconfig)
      // Refresh embryology data
      queryClient.invalidateQueries(['embryologyPatientsList'])
    },
    onError: (error) => {
      toast.error('Failed to delete image', toastconfig)
    },
  })
  const handleDownload = () => {
    downloadMutate.mutate({
      type: selectedRow?.type,
      id: selectedRow?.id,
      categoryType: selectedRow?.categoryType,
    })
    // toast.info('Feature not available yet', toastconfig)
    // console.log(
    //   'download',
    //   selectedRow?.type,
    //   selectedRow?.id,
    //   selectedRow?.categoryType,
    // )
  }

  const handleInputChange = (field, value) => {
    setNewData((prev) => ({ ...prev, [field]: value }))
  }
  const handlePhotoUpload = (isEdit = false) => {
    imgInputRef.current.click()
    if (isEdit) {
      imgInputRef.current.setAttribute('data-is-edit', 'true')
    } else {
      imgInputRef.current.removeAttribute('data-is-edit')
    }
  }

  const handleUploadImages = async (isEdit = false, embryologyData, type) => {
    // console.log('embryologyData', embryologyData, type)
    const imagesToUpload = isEdit ? editSelectedImages : selectedImages

    if (imagesToUpload.length === 0) {
      toast.error('Please select images to upload')
      return
    }

    setUploadingImages(true)

    try {
      const formData = new FormData()

      // Add multiple images to formData
      imagesToUpload.forEach((file, index) => {
        formData.append('embryologyImage', file)
      })

      // Add other required fields
      formData.append('embryologyId', embryologyData?.id || selectedRow?.id)
      formData.append('type', selectedRow?.type?.toLowerCase() || 'treatment')

      console.log('Uploading images with payload:', {
        embryologyId: embryologyData?.id || selectedRow?.id,
        type: selectedRow?.type?.toLowerCase() || 'treatment',
        imageCount: imagesToUpload.length,
      })

      uploadImagesMutation.mutate(formData)
    } catch (error) {
      console.error('Error uploading images:', error)
      toast.error('Failed to upload images')
      setUploadingImages(false)
    }
  }

  const handleDeleteImage = async (imageId) => {
    if (window.confirm('Are you sure you want to delete this image?')) {
      const payload = {
        embryologyImageId: imageId,
        type: selectedRow?.type?.toLowerCase() || 'treatment',
      }

      deleteImageMutation.mutate(payload)
    }
  }
  const handleSubmit = () => {
    if (!newData.template || !newData.categoryType) {
      toast.error('Please complete all fields before submitting.', toastconfig)
      return
    }
    let payload = {}
    if (selectedRow?.type == 'Consultation') {
      payload = {
        ...newData,
        consultationId: selectedRow?.id,
        embryologyImage: selectedImages,
      }
    } else {
      payload = {
        ...newData,
        treatmentCycleId: selectedRow?.id,
        embryologyImage: selectedImages,
      }
    }
    // console.log('handleSubmit payload', payload)
    saveEmbryologyMutation.mutate(payload)
  }
  // console.log('embryologyTypes', embryologyTypes)
  return (
    <Box sx={{ width: '100%', height: '70vh' }}>
      {/* First level tabs for embryology types */}
      <Tabs
        value={activeEmbryologyType}
        onChange={handleEmbryologyTypeChange}
        variant="scrollable"
      >
        {embryologyTypes?.map((type, index) => (
          <Tab
            key={`embryology-type-${type.embryologyId}`}
            label={type.embryologyName}
            value={type.embryologyId}
            disabled={editMode !== null && editMode !== index}
          />
        ))}
      </Tabs>

      {/* Content for each embryology type */}
      {embryologyTypes?.map((type, index) => (
        <TabPanel
          key={`embryology-type-${type.embryologyId}`}
          value={activeEmbryologyType}
          index={type.embryologyId}
        >
          {/* Second level tabs for days */}
          <Tabs value={activeDayTab} onChange={handleDayTabChange}>
            {embryologyData?.length > 0 &&
              embryologyData[index]?.embryologyDetails?.map((_, dayIndex) => (
                <Tab
                  key={`embryology-eachday-${dayIndex}`}
                  // label={`Day ${dayIndex + 1}`}
                  label={_.categoryType}
                  // value={dayIndex}
                  disabled={editMode !== null && editMode !== dayIndex}
                />
              ))}
            {embryologyData?.length > 0 && (
              // embryologyData[index]?.embryologyDetails?.length < 6 &&
              <Tab label="Add New" disabled={editMode !== null} />
            )}
          </Tabs>
          {embryologyData?.length > 0 &&
            embryologyData[index]?.embryologyDetails?.map((data, dayIndex) => (
              <TabPanel
                key={`embryology-eachday-${index}-${dayIndex}`}
                value={activeDayTab}
                index={dayIndex}
              >
                {editMode === dayIndex ? (
                  <Box
                    key={`embryology-eachday-${index}-${dayIndex}-edit`}
                    className="flex flex-col gap-3"
                  >
                    <div className="relative flex flex-col gap-3 items-start">
                      {/* {editData?.images?.length > 0 && (
                        <div className="flex gap-3 flex-wrap">
                          {editData?.images.map((image, index) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.imageUrl}
                                alt={editData.categoryType}
                                width={200}
                                height={200}
                                className="rounded-lg border border-gray-200"
                                style={{ marginBottom: '1rem' }}
                              />
                              <IconButton
                                size="small"
                                variant="contained"
                                color="error"
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleDeleteImage(image.id)}
                              >
                                <Delete />
                              </IconButton>
                            </div>
                          ))}
                        </div>
                      )} */}

                      <input
                        type="file"
                        accept=".png, .jpg, .jpeg"
                        multiple
                        className="hidden"
                        name="embryologyImage"
                        onChange={handleImageUpload}
                        ref={imgInputRef}
                      />

                      {/* Image Management Section */}
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <Typography variant="h6" className="mb-3">
                          Image Management
                        </Typography>

                        {/* Existing Images */}
                        {data?.images?.length > 0 && (
                          <div className="mb-4">
                            <Typography
                              variant="subtitle2"
                              className="mb-2 text-gray-600"
                            >
                              Existing Images ({data.images.length})
                            </Typography>
                            <div className="flex gap-3 flex-wrap">
                              {data?.images?.map((image, index) => (
                                <div
                                  key={image.id + '-' + index}
                                  className="relative group"
                                >
                                  <img
                                    src={image.imageUrl}
                                    alt={data.categoryType}
                                    width={150}
                                    height={150}
                                    className="object-cover rounded-lg border border-gray-200"
                                  />
                                  <IconButton
                                    size="small"
                                    color="error"
                                    className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDeleteImage(image.id)}
                                  >
                                    <Delete />
                                  </IconButton>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* New Images to Upload */}
                        {editSelectedImages.length > 0 && (
                          <div className="mb-4">
                            <Typography
                              variant="subtitle2"
                              className="mb-2 text-green-600"
                            >
                              New Images to Upload ({editSelectedImages.length})
                            </Typography>
                            <div className="flex gap-3 flex-wrap">
                              {editSelectedImages.map((file, index) => (
                                <div
                                  key={index}
                                  className="relative p-2 border border-green-200 rounded-lg bg-green-50"
                                >
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    width={120}
                                    height={120}
                                    className="object-cover rounded"
                                  />
                                  <IconButton
                                    size="small"
                                    className="absolute -top-1 -right-1"
                                    onClick={() => {
                                      setEditSelectedImages((prev) =>
                                        prev.filter((_, i) => i !== index),
                                      )
                                    }}
                                  >
                                    <Close />
                                  </IconButton>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Upload Controls */}
                        <div className="flex gap-3">
                          <Button
                            onClick={() => handlePhotoUpload(true)}
                            variant="outlined"
                            size="small"
                            startIcon={<CameraAlt />}
                          >
                            Add More Images
                          </Button>

                          {editSelectedImages.length > 0 && (
                            <Button
                              onClick={() =>
                                handleUploadImages(
                                  true,
                                  editData,
                                  selectedRow?.type,
                                )
                              }
                              variant="contained"
                              color="primary"
                              size="small"
                              disabled={uploadingImages}
                            >
                              {uploadingImages
                                ? 'Uploading...'
                                : `Upload ${editSelectedImages.length} Image${
                                    editSelectedImages.length > 1 ? 's' : ''
                                  }`}
                            </Button>
                          )}
                        </div>
                      </div>

                      <TextField
                        label="Category Type"
                        value={editData?.categoryType || ''}
                        onChange={(e) =>
                          handleEditInputChange('categoryType', e.target.value)
                        }
                      />
                    </div>

                    <div className="">
                      <div className="flex flex-row-reverse justify-start gap-3 mb-4">
                        <Button
                          onClick={handleDiscardChanges}
                          startIcon={<Close />}
                          variant="outlined"
                          color="error"
                          size="small"
                        >
                          Discard Changes
                        </Button>
                        <Button
                          onClick={handleSaveChanges}
                          startIcon={<Save />}
                          variant="contained"
                          color="primary"
                          size="small"
                          disabled={editEmbryologyMutation?.isPending}
                        >
                          {editEmbryologyMutation?.isPending
                            ? 'Saving...'
                            : 'Save Template'}
                        </Button>
                      </div>
                      {/* Show "Save for all formats" option only for Semen Analysis */}
                      {/* DISABLED: This option has been disabled as per requirement */}
                      {false &&
                        (() => {
                          // embryologyTypes contains objects with embryologyId and embryologyName
                          const currentEmbryologyType = embryologyTypes?.find(
                            (type) =>
                              type.embryologyId === activeEmbryologyType,
                          )
                          const isSemenAnalysis =
                            currentEmbryologyType?.embryologyName
                              ?.toLowerCase()
                              .includes('semen') ||
                            currentEmbryologyType?.embryologyName
                              ?.toLowerCase()
                              .includes('seman')

                          return isSemenAnalysis ? (
                            <Box className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={updateTemplateForAll}
                                    onChange={(e) =>
                                      setUpdateTemplateForAll(e.target.checked)
                                    }
                                    color="primary"
                                  />
                                }
                                label={
                                  <Typography
                                    variant="body2"
                                    className="font-medium"
                                  >
                                    Save for all formats - Update template for
                                    all Semen Analysis reports
                                  </Typography>
                                }
                              />
                              <Typography
                                variant="caption"
                                className="text-gray-600 ml-8 block mt-1"
                              >
                                When checked, this will update the base template
                                and apply changes to all existing Semen Analysis
                                reports
                              </Typography>
                            </Box>
                          ) : null
                        })()}
                      {
                        // <TextJoedit
                        //   contents={editData.template}
                        //   onBlur={content => {
                        //     handleEditInputChange('template', content)
                        //     // console.log('onblur', content);
                        //   }}
                        // />
                        <JoditEditor
                          ref={editorEdit}
                          value={editData?.template}
                          tabIndex={1}
                          onBlur={(content) => {
                            handleEditInputChange('template', content)
                          }}
                          config={{
                            readonly: false,
                            removeButtons: [
                              'video',
                              'table',
                              'code',
                              'link',
                              'speechRecognize',
                              'speech',
                            ],
                          }}
                        />
                      }
                    </div>
                  </Box>
                ) : (
                  <Box
                    key={`embryology-eachday-${index}-${dayIndex}-view`}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex justify-between items-center">
                      <Typography variant="h6" className="font-medium">
                        {data.categoryType}
                      </Typography>
                      <div className="flex gap-2">
                        {downloadMutate.isPending ? (
                          <CircularProgress size={20} />
                        ) : (
                          <Button
                            onClick={handleDownload}
                            startIcon={<Download />}
                            variant="outlined"
                            size="small"
                            disabled={downloadMutate.isPending}
                          >
                            {downloadMutate.isPending
                              ? 'Downloading...'
                              : 'Download'}
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEdit(data, dayIndex)}
                          startIcon={<Edit />}
                          variant="outlined"
                          size="small"
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                    {/* {data.imageLink && (
                      <img
                        src={data.imageLink}
                        alt={data.categoryType}
                        width={200}
                        height={200}
                        style={{ marginBottom: '1rem' }}
                      />
                    )} */}
                    {data?.images?.length > 0 && (
                      <div className="bg-gray-50 p-4 rounded-lg mb-4">
                        <Typography
                          variant="subtitle1"
                          className="mb-3 font-medium"
                        >
                          Images ({data.images.length})
                        </Typography>
                        <div className="flex gap-3 flex-wrap">
                          {data?.images?.map((image, index) => (
                            <div key={image.id} className="relative group">
                              <img
                                src={image.imageUrl}
                                alt={data.categoryType}
                                width={150}
                                height={150}
                                className="object-cover rounded-lg border border-gray-200"
                              />
                              {editMode === dayIndex && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleDeleteImage(image.id)}
                                >
                                  <Delete />
                                </IconButton>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* {console.log('data?.template', data?.template)} */}
                    <TextDisableJoeditor data={data?.template} />
                  </Box>
                )}
              </TabPanel>
            ))}
          {embryologyData?.length > 0 && (
            // embryologyData[index]?.embryologyDetails?.length < 6 &&
            <TabPanel
              value={activeDayTab}
              index={embryologyData[index]?.embryologyDetails?.length || 0}
            >
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  handleSubmit()
                }}
                className="flex flex-col gap-5"
              >
                <div className="flex justify-between items-center">
                  <TextField
                    label="Category Type"
                    value={newData?.categoryType || ''}
                    onChange={(e) =>
                      handleInputChange('categoryType', e.target.value)
                    }
                  />
                  <Button
                    type="submit"
                    variant="outlined"
                    color="primary"
                    disabled={saveEmbryologyMutation.isPending}
                    // sx={{ mt: 2 }}
                  >
                    {saveEmbryologyMutation.isPending
                      ? 'Saving...'
                      : 'Save Data'}
                  </Button>
                </div>

                {/* Image Upload Section */}
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <Typography variant="h6" className="mb-3">
                    Upload Images
                  </Typography>

                  <input
                    type="file"
                    accept=".png, .jpg, .jpeg"
                    multiple
                    className="hidden"
                    name="embryologyImage"
                    onChange={handleImageUpload}
                    ref={imgInputRef}
                  />

                  {/* Selected Images Preview */}
                  {selectedImages.length > 0 && (
                    <div className="mb-4">
                      <Typography
                        variant="subtitle2"
                        className="mb-2 text-blue-600"
                      >
                        Selected Images ({selectedImages.length})
                      </Typography>
                      <div className="flex gap-3 flex-wrap">
                        {selectedImages.map((file, index) => (
                          <div
                            key={index}
                            className="relative p-2 border border-blue-200 rounded-lg bg-blue-50"
                          >
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              width={120}
                              height={120}
                              className="object-cover rounded"
                            />
                            <IconButton
                              size="small"
                              className="absolute -top-1 -right-1"
                              onClick={() => {
                                setSelectedImages((prev) =>
                                  prev.filter((_, i) => i !== index),
                                )
                              }}
                            >
                              <Close />
                            </IconButton>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button
                      onClick={() => handlePhotoUpload()}
                      variant="outlined"
                      size="small"
                      startIcon={<CameraAlt />}
                    >
                      Select Images
                    </Button>

                    {/* {selectedImages.length > 0 && (
                      <Button
                        onClick={() => handleUploadImages(false, newData, selectedRow?.type)}
                        variant="contained"
                        color="primary"
                        size="small"
                        disabled={uploadingImages}
                      >
                        {uploadingImages ? 'Uploading...' : `Upload ${selectedImages.length} Image${selectedImages.length > 1 ? 's' : ''}`}
                      </Button>
                    )} */}
                  </div>
                </div>
                {/* {getEmbryologyTemplateData && ( */}
                <JoditEditor
                  ref={editorNew}
                  value={newData?.template}
                  tabIndex={1}
                  onBlur={(content) => handleInputChange('template', content)}
                  config={{
                    readonly: false,
                    removeButtons: [
                      'video',
                      'table',
                      'code',
                      'link',
                      'speechRecognize',
                      'speech',
                    ],
                  }}
                />
                {/* )} */}
              </Box>
            </TabPanel>
          )}
        </TabPanel>
      ))}
    </Box>
  )
}
const TabPanel = ({ children, value, index }) => (
  <div hidden={value !== index} role="tabpanel">
    {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
  </div>
)
export default EmbryologyModalContentNew
