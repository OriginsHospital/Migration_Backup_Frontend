import React, { useEffect, useRef, useState } from 'react'
import {
  Tabs,
  Tab,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  Button,
  FormControl,
  InputLabel,
} from '@mui/material'
import Image from 'next/image'
import {
  CameraAlt,
  Close,
  Download,
  Edit,
  Save,
  UploadFile,
} from '@mui/icons-material'

import dynamic from 'next/dynamic'
import { useSelector } from 'react-redux'
// import html2pdf from 'html2pdf.js';
// const html2pdf = dynamic(() => import('html2pdf.js'), {
//     ssr: false,
// })
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
function TextJoedit({ placeholder, contents, onBlur }) {
  const editor = useRef(null)
  // const [content, setContent] = useState(contents)

  // const config = useMemo(
  //     {
  //         readonly: false, // all options from https://xdsoft.net/jodit/docs/,
  //         placeholder: placeholder || 'Start typings...'
  //     },
  //     [placeholder]
  // );
  // console.log(content)
  return (
    <JoditEditor
      ref={editor}
      value={contents}
      tabIndex={1} // tabIndex of textarea
      onBlur={onBlur} // preferred to use only this option to update the content for performance reasons
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
  )
}
const EmbryologyModalContent = ({
  selectedRow,
  embryologyData,
  onAddNewData,
  imagePreview,
  setImagePreview,
  editSaveMutate,
  getEmbryologyDefaultTemplateData,
  editEmbryologyTreatmentMutation,
  newData,
  setNewData,
  editData,
  setEditData,
}) => {
  const dropdowns = useSelector(store => store.dropdowns)
  const [activeTab, setActiveTab] = useState(0)
  const imgInput = useRef(null)
  const [editMode, setEditMode] = useState(null)

  const [html2pdf, setHtml2pdf] = useState(null)
  useEffect(() => {
    import('html2pdf.js').then(module => {
      setHtml2pdf(() => module.default)
    })
  }, [])
  const handleTabChange = (event, newValue) => {
    if (editMode === null) {
      setActiveTab(newValue)
    }
  }

  const handleInputChange = (field, value) => {
    setNewData(prev => ({ ...prev, [field]: value }))
  }

  const handleEditInputChange = (field, value) => {
    // console.log(field, value)
    setEditData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    console.log(newData)
    onAddNewData(newData)
    // setNewData({
    //   imageLink: '',
    //   treatmentCycleId: selectedRow?.treatmentCycleId,
    //   categoryType: `Day ${embryologyData?.length + 1}`,
    //   template: `<html><body><div>${getEmbryologyDefaultTemplateData}</div></body></html>`,
    // })
  }

  const handlePhotoUpload = (isEdit = false) => {
    imgInput.current.click()
    if (isEdit) {
      imgInput.current.setAttribute('data-is-edit', 'true')
    } else {
      imgInput.current.removeAttribute('data-is-edit')
    }
  }

  const handleImageUpload = e => {
    const file = e.target.files[0]
    const isEdit = e.target.getAttribute('data-is-edit') === 'true'
    if (file) {
      const reader = new FileReader()
      setImagePreview(file)
      reader.onloadend = () => {
        if (isEdit) {
          setEditData(prev => ({ ...prev, imageLink: reader.result }))
        } else {
          setNewData(prev => ({ ...prev, imageLink: reader.result }))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDownload = (template, categoryType) => {
    const element = document.createElement('div')
    const updatedTemplate = `
      <style>
        body { font-size: 14px; line-height: 1.2; } 
        table { width: 100%; }
      </style>
      ${template}
    `
    element.innerHTML = updatedTemplate
    element.style.paddingBottom = '5px'

    const opt = {
      margin: 0.5,
      filename: `embryology_report_${categoryType}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'A4', orientation: 'portrait' },
    }

    html2pdf()
      .set(opt)
      .from(element)
      .save()
  }

  const handleEdit = (data, index) => {
    setEditMode(index)
    setEditData({ ...data })
  }

  const handleSaveChanges = () => {
    // editSaveMutate(editData);
    console.log('save changes', editData, imagePreview)
    let payload = {
      categoryType: editData.categoryType,
      template: editData.template,
      id: editData.id,
      embryologyType: editData.embryologyType,
    }
    editEmbryologyTreatmentMutation.mutate(payload)
    setEditMode(null)
    setEditData({})
  }
  const handleDiscardChanges = () => {
    setEditMode(null)
    setEditData({})
  }
  console.log(embryologyData && embryologyData[0])
  // useEffect(() => {
  // }, [embryologyData])
  return (
    <Box sx={{ width: '100%' }}>
      <Tabs value={activeTab} onChange={handleTabChange}>
        {embryologyData?.map((data, index) => (
          <Tab
            key={index + 'tabs'}
            label={data.categoryType}
            disabled={editMode !== null && editMode !== index}
          />
        ))}
        {embryologyData?.length < 6 && (
          <Tab label="Add New" disabled={editMode !== null} />
        )}
      </Tabs>
      {embryologyData?.map((data, index) => (
        <TabPanel
          key={index + '-' + data.categoryType}
          value={activeTab}
          index={index}
        >
          {editMode === index ? (
            <Box key={data.updatedAt + 'edit'}>
              <div className="flex justify-between p-3">
                <Button
                  onClick={handleDiscardChanges}
                  startIcon={<Close />}
                  variant="outlined"
                  color="error"
                >
                  Discard Changes
                </Button>
                <Button onClick={handleSaveChanges} startIcon={<Save />}>
                  Save Changes
                </Button>
              </div>
              <div className="relative">
                <img
                  src={editData.imageLink || data.imageLink}
                  alt={data.categoryType}
                  width={400}
                  height={200}
                  style={{ marginBottom: '1rem' }}
                />
                <input
                  type="file"
                  accept=".png, .jpg, .jpeg"
                  className="hidden"
                  name="imageLink"
                  onChange={handleImageUpload}
                  ref={imgInput}
                />
                <Button className="" onClick={() => handlePhotoUpload(true)}>
                  Change Image
                </Button>
              </div>

              <div className="">
                {
                  <TextJoedit
                    contents={editData.template}
                    onBlur={content => {
                      handleEditInputChange('template', content)
                      // console.log('onblur', content);
                    }}
                  />
                }
              </div>
            </Box>
          ) : (
            <Box key={data.updatedAt + 'view'} className="flex flex-col gap-5">
              <FormControl className="w-96">
                <InputLabel labelId="demo-simple-select-label">
                  Embryology or Andrology List
                </InputLabel>
                <Select
                  labelId="demo-simple-select-label"
                  label="Embryology or Andrology List"
                  value={data?.embryologyType}
                  // onChange={e =>
                  //   handleInputChange('embryologyType', e.target.value)
                  // }
                  readOnly
                >
                  {dropdowns.embryologyList.map(each => (
                    <MenuItem value={each.id} key={each.id + 'embryologyType'}>
                      {each?.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <img
                src={data.imageLink}
                alt={data.categoryType}
                width={200}
                height={200}
                style={{ marginBottom: '1rem' }}
              />
              <div className="flex gap-3">
                <Button
                  onClick={() =>
                    handleDownload(data.template, data.categoryType)
                  }
                  startIcon={<Download />}
                  variant="outlined"
                >
                  Download Report
                </Button>
                <Button
                  onClick={() => handleEdit(data, index)}
                  startIcon={<Edit />}
                  variant="outlined"
                >
                  Edit
                </Button>
              </div>
            </Box>
          )}
        </TabPanel>
      ))}
      {embryologyData?.length < 6 && (
        <TabPanel value={activeTab} index={embryologyData?.length}>
          <Box
            component="form"
            onSubmit={e => {
              e.preventDefault()
              handleSubmit()
            }}
            className="flex flex-col gap-5"
          >
            <Typography>{`${newData?.categoryType} `}</Typography>
            <FormControl className="w-96">
              <InputLabel labelId="demo-simple-select-label">
                Embryology or Andrology List
              </InputLabel>
              <Select
                labelId="demo-simple-select-label"
                label="Embryology or Andrology List"
                value={editData?.embryologyType}
                onChange={e =>
                  handleInputChange('embryologyType', e.target.value)
                }
              >
                {dropdowns.embryologyList.map(each => (
                  <MenuItem value={each.id} key={each.id + 'embryologyType'}>
                    {each?.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <div className="">
              <input
                type="file"
                accept=".png, .jpg, .jpeg"
                className="hidden"
                name="imageLink"
                onChange={handleImageUpload}
                ref={imgInput}
              />
              {newData?.imageLink ? (
                <img
                  src={newData?.imageLink}
                  alt="Preview"
                  width={250}
                  height={250}
                  className="object-cover aspect-square shrink-0 grow-0"
                />
              ) : null}
              <Button className="" onClick={() => handlePhotoUpload()}>
                Upload Image
              </Button>
            </div>
            {getEmbryologyDefaultTemplateData && (
              <TextJoedit
                contents={newData?.template}
                onBlur={content => handleInputChange('template', content)}
              />
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Add New Data
            </Button>
          </Box>
        </TabPanel>
      )}
    </Box>
  )
}

const TabPanel = props => {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`embryology-tabpanel-${index}`}
      aria-labelledby={`embryology-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  )
}

export default EmbryologyModalContent
