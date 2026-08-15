import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Modal from './Modal'
import { Button, IconButton, TextareaAutosize, TextField } from '@mui/material'
import { Close } from '@mui/icons-material'
import { FaPlus } from 'react-icons/fa'
import { createNewTask, getValidUsersList } from '@/constants/apis'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { closeModal, openModal } from '@/redux/modalSlice'
import { Autocomplete } from '@mui/material'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers'

const CreateTask = () => {
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const userDetails = useSelector(store => store.user)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskData, setTaskData] = useState({
    branchId: null,
    departmentId: null,
    assignedBy: null,
    assignedTo: null,
    assignedDate: dayjs(),
    dueDate: null,
    description: '',
  })

  const dropdowns = useSelector(store => store.dropdowns)
  const { branches, departmentList } = dropdowns

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['usersList', userDetails?.accessToken, 1],
    queryFn: () => getValidUsersList(userDetails?.accessToken, 1),
    enabled: !!userDetails?.accessToken && isModalOpen,
  })
  const { data: users } = usersData || []

  const handleOpenModal = () => {
    setIsModalOpen(true)
    dispatch(openModal('createTaskModal'))
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    dispatch(closeModal())
    resetForm()
  }

  const resetForm = () => {
    setTaskData({
      branchId: null,
      departmentId: null,
      assignedBy: null,
      assignedTo: null,
      assignedDate: dayjs(),
      dueDate: null,
      description: '',
    })
  }

  const handleInputChange = (field, value) => {
    setTaskData(prevState => ({
      ...prevState,
      [field]: value,
    }))
  }

  const handleCreateTask = async () => {
    if (
      !taskData.branchId ||
      !taskData.departmentId ||
      !taskData.assignedBy ||
      !taskData.assignedTo ||
      !taskData.description.trim()
    ) {
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      const response = await createNewTask(userDetails?.accessToken, taskData)
      if (response.status === 200) {
        toast.success('Task created successfully!')
        handleCloseModal()
        queryClient.invalidateQueries('getAllTasks')
      }
    } catch (error) {
      console.error('Error creating task:', error)
      toast.error('Failed to create task.')
    }
  }

  return (
    <>
      <Button
        onClick={handleOpenModal}
        variant="contained"
        className="capitalize text-white"
        color="primary"
        startIcon={<FaPlus size={18} />}
      >
        Create New Task
      </Button>

      {isModalOpen && (
        <Modal
          uniqueKey="createTaskModal"
          closeOnOutsideClick={false}
          maxWidth="sm"
        >
          <div className="flex justify-between items-center border-b pb-4 mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              Create New Task
            </h2>
            <IconButton onClick={handleCloseModal}>
              <Close />
            </IconButton>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium">
                  Branch
                </label>
                <Autocomplete
                  options={branches || []}
                  getOptionLabel={option => option.name}
                  value={
                    branches?.find(branch => branch.id === taskData.branchId) ||
                    null
                  }
                  onChange={(_, value) =>
                    handleInputChange('branchId', value?.id || null)
                  }
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium">
                  Department
                </label>
                <Autocomplete
                  options={departmentList || []}
                  getOptionLabel={option => option.name}
                  value={
                    departmentList?.find(
                      dept => dept.id === taskData.departmentId,
                    ) || null
                  }
                  onChange={(_, value) =>
                    handleInputChange('departmentId', value?.id || null)
                  }
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium">
                  Assigned By
                </label>
                <Autocomplete
                  options={users}
                  getOptionLabel={option => option.fullName}
                  value={
                    users?.find(user => user.id === taskData.assignedBy) || null
                  }
                  onChange={(_, value) =>
                    handleInputChange('assignedBy', value?.id || null)
                  }
                  renderInput={params => <TextField {...params} fullWidth />}
                  loading={usersLoading}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium">
                  Assigned To
                </label>
                <Autocomplete
                  options={users}
                  getOptionLabel={option => option.fullName}
                  value={
                    users?.find(user => user.id === taskData.assignedTo) || null
                  }
                  onChange={(_, value) =>
                    handleInputChange('assignedTo', value?.id || null)
                  }
                  renderInput={params => <TextField {...params} fullWidth />}
                  loading={usersLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium">
                  Assigned Date
                </label>
                <DatePicker
                  className="w-full"
                  value={taskData.assignedDate}
                  onChange={value => handleInputChange('assignedDate', value)}
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium">
                  Due Date
                </label>
                <DatePicker
                  className="w-full"
                  value={taskData.dueDate}
                  onChange={value => handleInputChange('dueDate', value)}
                  renderInput={params => <TextField {...params} fullWidth />}
                />
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-medium">
                Description
              </label>
              <TextareaAutosize
                minRows={3}
                placeholder="Enter task description..."
                value={taskData.description}
                onChange={e => handleInputChange('description', e.target.value)}
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <Button
              variant="contained"
              color="error"
              className="capitalize"
              onClick={handleCloseModal}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              className="capitalize text-white"
              onClick={handleCreateTask}
            >
              Create Task
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

export default CreateTask
