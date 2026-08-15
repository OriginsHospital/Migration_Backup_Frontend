import { getEmbryologyHistoryByPatientId } from '@/constants/apis'
import { useQuery } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  Card,
  CardContent,
  Chip,
  ImageList,
  ImageListItem,
  Tabs,
  Tab,
  Box,
  Button,
  IconButton,
} from '@mui/material'
import { ExpandMore, Download, Close } from '@mui/icons-material'
import { closeModal } from '@/redux/modalSlice'
import dayjs from 'dayjs'
import noImage from '@/assets/no-image.png'

function EmbryologyHistory({ patientId }) {
  const user = useSelector((store) => store.user)
  const [selectedType, setSelectedType] = useState(0)
  const [expandedAccordion, setExpandedAccordion] = useState(false)
  const dispatch = useDispatch()
  const { data: embryologyHistory } = useQuery({
    queryKey: ['embryologyHistory', patientId],
    queryFn: () =>
      getEmbryologyHistoryByPatientId(user?.accessToken, patientId),
    enabled: !!patientId,
  })

  const handleTypeChange = (event, newValue) => {
    setSelectedType(newValue)
  }
  const handleOpenTemplate = (template) => {
    if (!template) return

    // Create a new window/tab
    const newWindow = window.open()

    // Write the HTML template to the new window
    newWindow.document.write(template)
    newWindow.document.close()
  }

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedAccordion(isExpanded ? panel : false)
    setSelectedType(0)
  }

  const getReportNamesLabel = (embryologyDetails) =>
    embryologyDetails
      ?.map((type) => type.embryologyName)
      .filter(Boolean)
      .join(', ')

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Typography variant="h5" className="mb-4 text-gray-800 font-semibold">
          Embryology
        </Typography>
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
      </div>

      {embryologyHistory?.data ? (
        embryologyHistory?.data?.map((record, index) => (
          <Accordion
            key={record.appointmentId + '-' + index}
            className="mb-4 shadow-md"
            expanded={expandedAccordion === `panel${index}`}
            onChange={handleAccordionChange(`panel${index}`)}
          >
            <AccordionSummary
              expandIcon={<ExpandMore />}
              className="bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex w-full items-center gap-3 flex-wrap pr-2">
                <Typography className="font-medium shrink-0">
                  {dayjs(record.appointmentDate).format('DD/MM/YYYY')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  className="shrink-0"
                >
                  {record.doctorName}
                </Typography>
                <Chip
                  label={record.type}
                  className="bg-secondary text-white shrink-0"
                  size="small"
                />
                {getReportNamesLabel(record.embryologyDetails) ? (
                  <Typography
                    variant="body2"
                    className="font-medium text-gray-800 capitalize"
                  >
                    {getReportNamesLabel(record.embryologyDetails)}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.disabled">
                    No reports
                  </Typography>
                )}
              </div>
            </AccordionSummary>

            <AccordionDetails className="p-4">
              {record.embryologyDetails?.length > 0 ? (
                <div>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                    <Tabs
                      value={selectedType}
                      onChange={handleTypeChange}
                      variant="scrollable"
                      scrollButtons="auto"
                    >
                      {record.embryologyDetails.map((type, idx) => (
                        <Tab
                          key={idx}
                          label={`${type.embryologyName}`}
                          className="capitalize"
                        />
                      ))}
                    </Tabs>
                  </Box>

                  {record.embryologyDetails.map((type, typeIdx) => (
                    <div
                      key={typeIdx}
                      role="tabpanel"
                      hidden={selectedType !== typeIdx}
                    >
                      {selectedType === typeIdx && (
                        <Card className="bg-gray-50">
                          <CardContent>
                            <Typography variant="h6" className="mb-4">
                              {type.embryologyName}
                            </Typography>

                            <ImageList cols={3} gap={16}>
                              {type.details.map((detail, detailIdx) => (
                                <ImageListItem
                                  key={detailIdx}
                                  className="rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                                >
                                  <img
                                    src={detail.imageLink || noImage.src}
                                    alt={detail.categoryType}
                                    loading="lazy"
                                    className="w-full h-48 object-cover bg-white border-b-2"
                                  />
                                  <div className="p-2 bg-white">
                                    <div className="flex justify-between items-center">
                                      <Typography variant="subtitle2">
                                        {detail.categoryType}
                                      </Typography>
                                      <Button
                                        size="small"
                                        startIcon={<Download />}
                                        onClick={() =>
                                          handleOpenTemplate(detail.template)
                                        }
                                      >
                                        View Report
                                      </Button>
                                    </div>
                                  </div>
                                </ImageListItem>
                              ))}
                            </ImageList>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Typography color="text.secondary" className="text-center py-4">
                  No Embryology or Andrology details available
                </Typography>
              )}
            </AccordionDetails>
          </Accordion>
        ))
      ) : (
        <div>
          <Typography color="text.secondary" className="text-center py-4">
            No Embryology or Andrology history found
          </Typography>
        </div>
      )}

      {!embryologyHistory?.data?.length && (
        <Card className="text-center p-8 bg-gray-50">
          <Typography color="text.secondary">
            No Embryology or Andrology history found
          </Typography>
        </Card>
      )}
    </div>
  )
}

export default EmbryologyHistory
