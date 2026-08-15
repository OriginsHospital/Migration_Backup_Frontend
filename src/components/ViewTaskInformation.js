import { closeModal, openModal } from '@/redux/modalSlice'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from './Modal'
import {
  Avatar,
  Button,
  IconButton,
  Skeleton,
  TextareaAutosize,
  Tooltip,
} from '@mui/material'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import {
  createTaskComment,
  deleteTaskImage,
  getTaskDetailsByTaskId,
  uploadTaskImage,
} from '@/constants/apis'
import { Close } from '@mui/icons-material'
import dayjs from 'dayjs'
import { FaPaperPlane, FaPlus, FaTimes } from 'react-icons/fa'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { useDropzone } from 'react-dropzone'

const ViewTaskInformation = ({ taskInfo }) => {
  const userDetails = useSelector(store => store.user)
  const dispatch = useDispatch()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleOpenModal = () => {
    setIsModalOpen(true)
    dispatch(openModal(taskInfo?.id))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    dispatch(closeModal())
  }

  const { data: getTaskInfo, isLoading, refetch } = useQuery({
    queryKey: ['getTaskInfoByTaskId', taskInfo?.id],
    queryFn: () =>
      getTaskDetailsByTaskId(taskInfo?.id, userDetails?.accessToken),
    enabled: !!userDetails?.accessToken && !!taskInfo?.id && isModalOpen,
  })

  const colors = [
    '#FFB6C1',
    '#FF6347',
    '#FFD700',
    '#98FB98',
    '#87CEFA',
    '#FFA07A',
    '#DA70D6',
    '#20B2AA',
    '#FF69B4',
    '#4169E1',
  ]

  const getColorForName = name => {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
  }

  const ShowTaskInfo = ({ taskId }) => {
    const queryClient = useQueryClient()
    const [commentText, setCommentText] = useState('')
    const [isAddingComment, setIsAddingComment] = useState(false)
    const [isUploadingImages, setIsUploadingImages] = useState(false)
    const [selectedFiles, setSelectedFiles] = useState([])

    const handleSendComment = async () => {
      if (!commentText.trim()) return

      try {
        const sendCommentPayload = {
          taskId,
          commentText: commentText.trim(),
        }
        const response = await createTaskComment(
          userDetails?.accessToken,
          sendCommentPayload,
        )

        if (response.status === 200) {
          setCommentText('')
          setIsAddingComment(false)
          refetch()
          queryClient.invalidateQueries(['getTaskInfoByTaskId', taskId])
        }
      } catch (error) {
        console.error('Failed to send comment', error)
      }
    }

    const handleUploadImages = async () => {
      if (selectedFiles.length === 0) {
        toast.error('Please select files to upload', toastconfig)
        return
      }

      try {
        const formData = new FormData()

        selectedFiles.forEach((file, index) => {
          formData.append('referenceImages', file)
        })

        const response = await uploadTaskImage(
          userDetails?.accessToken,
          formData,
          taskId,
        )

        if (response.status === 200) {
          setSelectedFiles([])
          setIsUploadingImages(false)
          refetch()
          queryClient.invalidateQueries(['getTaskInfoByTaskId', taskId])
          toast.success('Images uploaded successfully', toastconfig)
        } else {
          toast.error(
            response.message || 'Failed to upload images',
            toastconfig,
          )
        }
      } catch (error) {
        console.error('Failed to upload images', error)
        toast.error('Failed to upload images', toastconfig)
      }
    }

    const handleCancelUpload = () => {
      setSelectedFiles([])
      setIsUploadingImages(false)
    }

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
      onDrop: acceptedFiles => {
        setSelectedFiles(prev => [...prev, ...acceptedFiles])
      },
      accept: {
        'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.bmp', '.webp'],
      },
      multiple: true,
      maxSize: 5 * 1024 * 1024, // 5MB limit
    })

    const handleDeleteImage = async imageId => {
      if (window.confirm('Are you sure you want to delete this image?')) {
        try {
          console.log(imageId)
          const response = await deleteTaskImage(
            userDetails?.accessToken,
            imageId,
          )
          if (response.status === 200) {
            refetch()
            toast.success('Image deleted successfully')
            queryClient.invalidateQueries(['getTaskInfoByTaskId', taskId])
          } else if (response.status === 400) {
            toast.error(response.data.message)
          } else {
            toast.error('Failed to delete image')
          }
        } catch (error) {
          console.error('Failed to delete image', error)
        }
      }
    }

    return (
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg border border-gray-300 p-6">
        <div className="border-b pb-4 mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Task Information</h2>
        </div>

        <div className="grid grid-cols-2 gap-6 text-gray-800">
          <div>
            <span className="font-semibold">Branch:</span>{' '}
            {getTaskInfo?.data?.branchName}
          </div>
          <div>
            <span className="font-semibold">Department:</span>{' '}
            {getTaskInfo?.data?.departmentName}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Description:</span>
            <p className="text-gray-700 bg-gray-100 p-3 rounded mt-1">
              {getTaskInfo?.data?.description}
            </p>
          </div>
          <div>
            <span className="font-semibold">Assigned By:</span>{' '}
            {getTaskInfo?.data?.assignedByName}
          </div>
          <div>
            <span className="font-semibold">Assigned To:</span>{' '}
            {getTaskInfo?.data?.assignedToName}
          </div>
          <div>
            <span className="font-semibold">Assigned Date:</span>{' '}
            {dayjs(getTaskInfo?.data?.assignedDate).format('DD/MM/YYYY')}
          </div>
          <div>
            <span className="font-semibold">Due Date:</span>{' '}
            {dayjs(getTaskInfo?.data?.dueDate).format('DD/MM/YYYY')}
          </div>
          <div className="col-span-2">
            <span className="font-semibold">Status:</span>{' '}
            <span
              className={`px-3 py-1 rounded-lg font-semibold text-sm ${
                getTaskInfo?.data?.status === 'pending'
                  ? 'bg-yellow-200 text-yellow-800'
                  : 'bg-green-200 text-green-800'
              }`}
            >
              {getTaskInfo?.data?.status?.charAt(0).toUpperCase() +
                getTaskInfo?.data?.status?.slice(1).toLowerCase()}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Reference Images
            </h3>
            <Tooltip title="Upload Reference Image">
              <button
                className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-green-700 transition flex items-center gap-2 text-sm font-medium"
                aria-label="Upload Reference Image"
                onClick={() => setIsUploadingImages(true)}
              >
                <FaPlus size={14} />
                Upload Image
              </button>
            </Tooltip>
          </div>

          {isUploadingImages && (
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 mb-4">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive
                    ? 'border-blue-400 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {isDragActive
                      ? 'Drop images here'
                      : 'Drag & drop images here, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Supports: JPG, PNG, GIF, BMP, WebP (max 5MB each)
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Selected Files:
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded"
                      >
                        <span className="text-sm text-gray-600 truncate">
                          {file.name}
                        </span>
                        <button
                          onClick={() =>
                            setSelectedFiles(prev =>
                              prev.filter((_, i) => i !== index),
                            )
                          }
                          className="text-red-500 hover:text-red-700"
                        >
                          <FaTimes size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUploadImages}
                  disabled={selectedFiles.length === 0}
                  className="text-white"
                >
                  Upload Images
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={handleCancelUpload}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {getTaskInfo?.data?.referenceImages?.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {getTaskInfo?.data?.referenceImages.map(image => (
                  <div
                    key={image.ImageId}
                    className="group relative bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition cursor-pointer overflow-hidden"
                    onClick={() => window.open(image.ImageUrl, '_blank')}
                  >
                    <div className="aspect-square hover:bg-blue-100 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center relative">
                      <div className="text-center p-2">
                        <div className="w-12 h-12 mx-auto mb-1 bg-blue-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-6 h-6 text-blue-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                        <p className="text-xs text-gray-600 font-medium">
                          View Image
                        </p>
                      </div>

                      <button
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600 z-10"
                        onClick={e => {
                          e.stopPropagation()
                          handleDeleteImage(image.ImageId)
                        }}
                        title="Delete Image"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>

                    <div className="p-2">
                      <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs text-gray-600 font-medium">
                          by
                        </span>
                        <span className="text-xs font-semibold text-gray-700 truncate">
                          {image.uploadedByName}
                        </span>
                      </div>
                      <Tooltip
                        title={dayjs(image.createdAt).format('DD-MM-YYYY')}
                      >
                        <span className="text-xs mx-2 text-right text-gray-500 block">
                          {dayjs(image.createdAt).format('DD-MM-YYYY')}
                        </span>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-3 bg-gray-200 rounded-full flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">
                  No reference images available
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Click &quot;Upload Image&quot; to add reference images
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          {isAddingComment ? (
            <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200">
              <TextareaAutosize
                minRows={3}
                placeholder="Write a comment..."
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
              <div className="mt-3 flex justify-end gap-2">
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSendComment}
                >
                  <FaPaperPlane color="white" />
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  onClick={() => setIsAddingComment(false)}
                >
                  <FaTimes />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Tooltip title="Add Comment">
                <button
                  className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition flex items-center justify-center"
                  aria-label="Add Comment"
                  onClick={() => setIsAddingComment(true)}
                >
                  <FaPlus size={20} />
                </button>
              </Tooltip>
            </div>
          )}
        </div>

        <div className="mt-2">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comments</h3>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            {getTaskInfo?.data?.comments?.length > 0 ? (
              <div className="space-y-4">
                {getTaskInfo?.data?.comments.map(comment => (
                  <div
                    key={comment.commentId}
                    className="flex items-start gap-4 p-3 bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition"
                  >
                    <Avatar
                      sx={{
                        bgcolor: getColorForName(comment.commentedByName),
                        width: 40,
                        height: 40,
                        fontSize: 18,
                      }}
                    >
                      {comment.commentedByName.charAt(0).toUpperCase()}
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-gray-700">
                          {comment.commentedByName}
                        </span>
                        <Tooltip
                          title={dayjs(comment.createdAt).format(
                            'dddd, MMM D, YYYY h:mm A',
                          )}
                        >
                          <span className="text-xs text-gray-500">
                            {dayjs(comment.createdAt).format(
                              'DD-MM-YYYY h:mm A',
                            )}
                          </span>
                        </Tooltip>
                      </div>
                      <p className="mt-2 text-gray-800">
                        {comment.commentText}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center">
                No comments available.
              </p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <span
        className="text-green-500 bg-green-100 p-2 rounded-md font-medium cursor-pointer"
        onClick={handleOpenModal}
      >
        View
      </span>
      {isModalOpen && (
        <Modal
          uniqueKey={taskInfo?.id}
          closeOnOutsideClick={false}
          maxWidth="md"
        >
          <div className="flex justify-end">
            <IconButton variant="outlined" onClick={handleCloseModal}>
              <Close />
            </IconButton>
          </div>

          {isLoading && (
            <div className="mt-2 gap-2">
              <Skeleton variant="rectangular" height={15} className="mb-2" />
              <Skeleton
                variant="rectangular"
                width={'250px'}
                height={15}
                className="mb-2"
              />
              <Skeleton
                variant="rectangular"
                width={'100px'}
                height={15}
                className="mb-2"
              />
            </div>
          )}
          {!isLoading &&
            (!getTaskInfo?.data ? (
              <>No Task Information Found</>
            ) : (
              <ShowTaskInfo taskId={getTaskInfo?.data?.id} />
            ))}
        </Modal>
      )}
    </>
  )
}

export default ViewTaskInformation
