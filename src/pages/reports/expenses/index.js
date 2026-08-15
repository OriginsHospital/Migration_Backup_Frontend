import React, { useState, useEffect, useMemo } from 'react'
import { DataGrid } from '@mui/x-data-grid'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  IconButton,
} from '@mui/material'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addExpense,
  deleteExpense,
  deleteReceipt,
  editExpense,
  getExpenses,
  getSubCategoryListByCategoryId,
} from '@/constants/apis'
import { useDispatch, useSelector } from 'react-redux'
import Breadcrumb from '@/components/Breadcrumb'
import { closeModal, openModal } from '@/redux/modalSlice'
import Modal from '@/components/Modal'
import { DatePicker } from '@mui/x-date-pickers'
import dayjs from 'dayjs'
import {
  Edit,
  EditAttributes,
  EditNote,
  CloudUpload,
  Delete,
  FilePresentOutlined,
  OpenInNew,
  Close,
  DocumentScanner,
  Add,
} from '@mui/icons-material'
import ReportExportToolbar from '@/components/ReportExportToolbar'
import ExpensesFilter from '@/components/ExpensesFilter'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import Link from 'next/link'
import { Autocomplete } from '@mui/material'
import { FaFileCircleExclamation } from 'react-icons/fa6'
import { getBranchName } from '@/utils/branchMapping'
import { hasExpenseDeleteAccess } from '@/utils/expenseDeleteAccess'
import BranchDataTest from '@/components/BranchDataTest'

const normalizeInvoiceReceipts = (invoiceReceipt) => {
  if (!invoiceReceipt) return []

  let receipts = invoiceReceipt
  if (typeof receipts === 'string') {
    try {
      receipts = JSON.parse(receipts)
    } catch {
      return [{ receiptUrl: receipts }]
    }
  }

  if (!Array.isArray(receipts)) return []

  return receipts
    .map((item) => {
      if (!item) return null
      if (typeof item === 'string') return { receiptUrl: item }
      if (item.receiptUrl) return item
      return null
    })
    .filter(Boolean)
}

const getReceiptUrl = (file) =>
  typeof file === 'string' ? file : file?.receiptUrl

const isPersistedReceipt = (file) =>
  typeof file === 'string' ||
  (file &&
    typeof file === 'object' &&
    file.receiptUrl &&
    !(file instanceof File))

const Expenses = () => {
  const user = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches } = dropdowns
  const canDeleteExpense = hasExpenseDeleteAccess(user)

  // Filter out specific branches from dropdown
  const filteredBranches = useMemo(() => {
    const excludedBranchNames = ['OBH', '02', 'kmm03', 'HYD-KKT']
    return (branches || []).filter(
      (branch) => !excludedBranchNames.includes(branch.name),
    )
  }, [branches])

  const paymentMode = [
    { id: 1, name: 'CASH' },
    { id: 2, name: 'ONLINE' },
  ]
  //useQuery for dat fetchin,g
  const queryClient = useQueryClient()

  console.log('dropdowns', dropdowns?.expenseCategories)
  console.log('branches dropdown:', dropdowns?.branches)

  // Filter state
  const [filters, setFilters] = useState({
    categoryId: '',
    subCategoryId: '',
    branchId: '',
    paymentMode: '',
    startDate: dayjs().subtract(30, 'days'), // Default to last 30 days
    endDate: dayjs(),
  })

  const { data: expencesData } = useQuery({
    queryKey: ['expenses', filters],
    queryFn: async () => {
      console.log('Fetching expenses with filters:', filters)
      const res = await getExpenses(user?.accessToken, filters)
      console.log('API response:', res)
      if (res.status === 200) {
        // Transform data to ensure branch information is properly mapped
        const transformedData = res.data?.map((expense) => ({
          ...expense,
          // Ensure branch data is properly structured
          branch: expense.branch || {
            id: expense.branchId,
            name:
              dropdowns?.branches?.find((b) => b.id === expense.branchId)
                ?.name || 'Unknown Branch',
          },
        }))
        console.log('Transformed data:', transformedData)
        return transformedData
      } else {
        throw new Error('Error fetching expenses')
      }
    },
  })

  // Debug logging after data is available
  useEffect(() => {
    if (expencesData) {
      console.log('expenses data structure:', expencesData)
      console.log('first expense item:', expencesData?.[0])
    }
  }, [expencesData])

  // Debug logging for filters
  useEffect(() => {
    console.log('Filters state changed:', filters)
  }, [filters])
  const expenseModel = {
    // expenseName: '',
    branchId: '',
    category: '',
    subCategory: '',
    amount: '',
    paymentMode: '',
    description: '',
    paymentDate: dayjs(new Date()).format('YYYY-MM-DD'),
    invoiceReceipt: null,
  }
  const [modalType, setModal] = useState()
  //expenseForm
  const [expenseForm, setExpenseForm] = useState(expenseModel)
  const addExpenseMutation = useMutation({
    mutationKey: ['addExpense'],
    mutationFn: async (expenseData) => {
      const formData = new FormData()
      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key]) {
          if (key === 'invoiceReceipt') {
            // Handle multiple files
            expenseData[key].forEach((file, index) => {
              formData.append(`invoiceReceipt`, file)
            })
          } else {
            formData.append(key, expenseData[key])
          }
        }
      })

      const res = await addExpense(user?.accessToken, formData)
      if (res.status === 200) {
        dispatch(closeModal('Expense'))
        setExpenseForm(expenseModel)
        queryClient.invalidateQueries(['expenses'])
        return res.data
      } else {
        throw new Error('Error adding expense')
      }
    },
  })
  const editExpenseMutation = useMutation({
    mutationKey: ['editExpense'],
    mutationFn: async (expenseData) => {
      const formData = new FormData()
      Object.keys(expenseData).forEach((key) => {
        if (expenseData[key]) {
          if (key === 'invoiceReceipt') {
            expenseData[key].forEach((file) => {
              if (file instanceof File) {
                formData.append(`invoiceReceipt`, file)
              }
            })
          } else {
            formData.append(key, expenseData[key])
          }
        }
      })

      const res = await editExpense(user?.accessToken, formData)
      if (res.status === 200) {
        dispatch(closeModal('Expense'))
        setExpenseForm(expenseModel)
        queryClient.invalidateQueries(['expenses'])
        return res.data
      } else {
        throw new Error('Error editing expense')
      }
    },
  })
  const { data: subCategories } = useQuery({
    queryKey: ['subcategories', expenseForm.category],
    queryFn: async () => {
      const res = await getSubCategoryListByCategoryId(
        user.accessToken,
        expenseForm.category,
      )
      if (res.status === 200) {
        console.log('ress', res)
        return res.data
      } else {
        throw new Error('Error fetching subcategories')
      }
    },
    enabled: !!expenseForm.category,
  })
  const handleExpenseFormChange = (e) => {
    setExpenseForm({ ...expenseForm, [e.target.name]: e.target.value })
  }
  const dispatch = useDispatch()
  const columns = [
    // { field: 'id', headerName: 'ID', width: 70 },
    {
      field: 'paymentDate',
      headerName: 'Payment Date',
      width: 120,
      flex: 0.5,
      // type: 'date',
      renderCell: (params) => {
        return <span>{dayjs(params.value).format('DD-MM-YYYY')}</span>
      },

      // valueGetter: params => new Date(params),
      // renderCell: (params) => {
      //     return <DatePicker value={dayjs(params.value)} />
      // }
    },
    // Added Branch column - copied from Orders report structure
    {
      field: 'branch',
      headerName: 'Branch',
      width: 120,
      flex: 0.6,
      renderCell: (params) => {
        // Use utility function to get branch name
        const branchName = getBranchName(params.row, dropdowns?.branches || [])

        return (
          <Tooltip title={branchName}>
            <span className="truncate">{branchName}</span>
          </Tooltip>
        )
      },
    },
    // { field: 'expenseName', headerName: 'Expense Name', width: 200 },
    {
      field: 'categoryName',
      headerName: 'Category',
      width: 250,
      flex: 0.7,
      renderCell: (params) => {
        // console.log(params)
        return (
          <Tooltip title={params?.row.category?.categoryName}>
            <span
              className="truncate"
              // title={params?.row.category?.categoryName}
            >
              {params?.row.category?.categoryName}
            </span>
          </Tooltip>
        )
      },
    },
    {
      field: 'subCategoryName',
      headerName: 'Sub Category',
      width: 250,
      flex: 0.7,
      renderCell: (params) => {
        // console.log(params)
        return (
          <Tooltip title={params?.row.subCategory?.subCategoryName}>
            <span
              className="truncate"
              // title={params?.row.subCategory?.subCategoryName}
            >
              {params?.row.subCategory?.subCategoryName}
            </span>
          </Tooltip>
        )
      },
    },
    {
      field: 'amount',
      headerName: 'Amount',
      width: 100,
      flex: 0.5,
      type: 'number',
    },
    {
      field: 'paymentMode',
      headerName: 'Payment Mode',
      width: 120,
      flex: 0.5,
      renderCell: (params) => {
        const mode = params?.row.paymentMode?.toLowerCase() || ''
        return <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
      },
    },
    {
      field: 'description',
      headerName: 'Description',
      width: 300,
      flex: 3,
      minWidth: 250,
      renderCell: (params) => {
        return (
          <Tooltip title={params.row.description || 'No description'}>
            <div
              className="text-sm leading-relaxed"
              style={{
                maxWidth: '100%',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap',
                overflow: 'visible',
              }}
            >
              {params.row.description || 'No description'}
            </div>
          </Tooltip>
        )
      },
    },

    {
      field: 'actions',
      headerName: 'Actions',
      width: canDeleteExpense ? 180 : 120,
      flex: 1,
      renderCell: (params) => (
        <div className="flex items-center gap-1">
          <Button
            variant="outlined"
            color="primary"
            size="small"
            startIcon={<EditNote />}
            onClick={() => handleEdit(params.row)}
          >
            Edit
          </Button>
          {canDeleteExpense && (
            <Tooltip title="Delete expense">
              <IconButton
                color="error"
                size="small"
                aria-label="delete expense"
                onClick={() => handleDeleteExpense(params.row)}
              >
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </div>
      ),
    },
  ]

  const handleEdit = (row) => {
    console.log('Edit clicked for row:', row)
    const {
      id,
      category,
      subCategory,
      amount,
      description,
      paymentDate,
      branch,
      invoiceReceipt,
    } = row

    const newObject = {
      id,
      category: category.id,
      subCategory: subCategory.id,
      amount,
      description,
      paymentDate,
      branchId: branch.id,
      invoiceReceipt: normalizeInvoiceReceipts(invoiceReceipt),
    }
    setExpenseForm(newObject)
    dispatch(openModal('Expense'))
    setModal('edit')
  }

  const handleDeleteExpense = (row) => {
    if (
      !window.confirm(
        'Are you sure you want to delete this expense? This action cannot be undone.',
      )
    ) {
      return
    }

    deleteExpenseMutation.mutate({ id: row.id })
  }

  const handleNewExpence = () => {
    dispatch(openModal('Expense'))
    setModal('add')
  }
  const handleDateChange = (value) => {
    setExpenseForm({
      ...expenseForm,
      paymentDate: dayjs(value).format('YYYY-MM-DD'),
    })
  }
  const handleClose = () => {
    dispatch(closeModal('Expense'))
    setExpenseForm(expenseModel)
  }

  // Filter handlers
  const handleFilterChange = (newFilters) => {
    console.log('Expenses Page: handleFilterChange called with:', newFilters)
    setFilters(newFilters)
  }

  const handleClearFilters = () => {
    console.log('Expenses Page: handleClearFilters called')
    setFilters({
      categoryId: '',
      subCategoryId: '',
      branchId: '',
      paymentMode: '',
      startDate: '',
      endDate: '',
    })
  }

  // Add this mutation for deleting invoiceReceipt
  const deleteReceiptMutation = useMutation({
    mutationKey: ['deleteReceipt'],
    mutationFn: async (data) => {
      const res = await deleteReceipt(user?.accessToken, data)

      if (res.status === 200) {
        toast.success('Receipt deleted successfully', toastconfig)
        setExpenseForm((prev) => ({
          ...prev,
          invoiceReceipt: prev.invoiceReceipt.filter((file) => {
            if (data.receiptId && file?.id) {
              return file.id !== data.receiptId
            }
            return getReceiptUrl(file) !== data.receiptUrl
          }),
        }))
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
      } else {
        throw new Error(res.message || 'Error deleting receipt')
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete receipt', toastconfig)
    },
  })

  const deleteExpenseMutation = useMutation({
    mutationKey: ['deleteExpense'],
    mutationFn: async (data) => {
      const res = await deleteExpense(user?.accessToken, data)

      if (res.status === 200) {
        toast.success('Expense deleted successfully', toastconfig)
        queryClient.invalidateQueries({ queryKey: ['expenses'] })
        return res.data
      }

      throw new Error(res.message || 'Error deleting expense')
    },
    onSuccess: (_, variables) => {
      if (expenseForm?.id === variables.id) {
        dispatch(closeModal('Expense'))
        setExpenseForm(expenseModel)
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete expense', toastconfig)
    },
  })

  return (
    <div style={{ height: 600, width: '100%' }} className="p-5">
      <div className="flex justify-between m-3">
        <div>
          <Breadcrumb />
        </div>
        <Button
          onClick={handleNewExpence}
          variant="contained"
          className="text-white"
        >
          Add New
        </Button>
      </div>

      {/* Expenses Filter Component */}
      <ExpensesFilter
        onFilterChange={handleFilterChange}
        onClearFilters={handleClearFilters}
        filters={filters}
      />

      {/* Temporary debug component - remove in production */}
      <BranchDataTest
        data={expencesData || []}
        branches={dropdowns?.branches || []}
      />

      {/* Data Grid */}
      <DataGrid
        rows={expencesData || []}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[5, 10, 25]}
        disableRowSelectionOnClick
        slots={{
          toolbar: ReportExportToolbar,
        }}
        slotProps={{
          toolbar: {
            data: expencesData || [],
            columns,
            reportName: 'Expenses_Report',
            reportType: 'expenses',
            branchName: 'All_Branches',
            filters: filters,
          },
        }}
        sx={{ height: 600 }}
      />

      <Modal
        uniqueKey={'Expense'}
        closeOnOutsideClick={false}
        maxWidth={'sm'}
        // handleClose={handleClose}
      >
        <div className="flex justify-between">
          <span className="text-2xl font-semibold text-secondary">
            Add Expense
          </span>
          <IconButton onClick={handleClose}>
            <Close />
          </IconButton>
        </div>
        <div className="flex flex-col mt-3 gap-3">
          {/* <TextField
            name="expenseName"
            label="Expense Name"
            variant="outlined"
            value={expenseForm?.expenseName}
            onChange={handleExpenseFormChange}
          /> */}
          <FormControl>
            <Autocomplete
              options={dropdowns?.expenseCategories || []}
              getOptionLabel={(option) => option.name}
              value={
                dropdowns?.expenseCategories?.find(
                  (cat) => cat.id === expenseForm?.category,
                ) || null
              }
              onChange={(_, value) => {
                setExpenseForm({
                  ...expenseForm,
                  category: value?.id || '',
                })
              }}
              renderInput={(params) => (
                <TextField {...params} label="Expense Category" />
              )}
            />
          </FormControl>
          <FormControl>
            <Autocomplete
              options={subCategories || []}
              getOptionLabel={(option) => option.ledgerName}
              value={
                subCategories?.find(
                  (sub) => sub.id === expenseForm?.subCategory,
                ) || null
              }
              onChange={(_, value) => {
                setExpenseForm({
                  ...expenseForm,
                  subCategory: value?.id || '',
                })
              }}
              renderInput={(params) => (
                <TextField {...params} label="Expense Sub Category" />
              )}
            />
          </FormControl>
          <FormControl>
            <Autocomplete
              options={filteredBranches}
              getOptionLabel={(option) => option.name}
              value={
                filteredBranches?.find(
                  (branch) => branch.id === expenseForm?.branchId,
                ) || null
              }
              onChange={(_, value) => {
                setExpenseForm({
                  ...expenseForm,
                  branchId: value?.id || '',
                })
              }}
              renderInput={(params) => <TextField {...params} label="Branch" />}
            />
          </FormControl>
          <TextField
            label="Amount"
            type="number"
            variant="outlined"
            value={expenseForm?.amount}
            name="amount"
            onChange={handleExpenseFormChange}
          />
          <FormControl>
            <Autocomplete
              options={paymentMode || []}
              getOptionLabel={(option) => option.name}
              value={
                paymentMode?.find(
                  (pay) => pay.name === expenseForm?.paymentMode,
                ) || null
              }
              onChange={(_, value) => {
                setExpenseForm({
                  ...expenseForm,
                  paymentMode: value?.name,
                })
              }}
              renderInput={(params) => (
                <TextField {...params} label="Payment Mode" />
              )}
            />
          </FormControl>
          <TextField
            multiline={true}
            rows={3}
            label="Description"
            variant="outlined"
            value={expenseForm?.description}
            name="description"
            onChange={handleExpenseFormChange}
          />
          <DatePicker
            className=" bg-white"
            value={dayjs(expenseForm?.paymentDate)}
            format="DD/MM/YYYY"
            onChange={handleDateChange}
            name="paymentDate"
          />
          <div className="flex flex-col gap-2">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              className="hidden"
              id="invoice-upload"
              multiple
              onChange={(e) => {
                const files = Array.from(e.target.files || [])
                const validFiles = files.filter((file) => {
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error(
                      `File ${file.name} is larger than 5MB`,
                      toastconfig,
                    )
                    return false
                  }
                  return true
                })

                setExpenseForm((prev) => ({
                  ...prev,
                  invoiceReceipt: [
                    ...(prev.invoiceReceipt || []),
                    ...validFiles,
                  ],
                }))
              }}
            />
            <div className="flex flex-wrap gap-2">
              {!expenseForm?.invoiceReceipt?.length ? (
                <Button
                  variant="outlined"
                  startIcon={<CloudUpload />}
                  onClick={() =>
                    document.getElementById('invoice-upload').click()
                  }
                  className="capitalize"
                >
                  Upload Invoice/Receipt
                </Button>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 items-center">
                    {expenseForm.invoiceReceipt.map((file, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex items-center font-bold  gap-2 text-secondary rounded border p-1">
                          <span className="flex items-center gap-2">
                            <DocumentScanner />
                            <Button
                              variant="text"
                              className="truncate"
                              onClick={() => {
                                const receiptUrl = getReceiptUrl(file)
                                if (receiptUrl) {
                                  window.open(receiptUrl, '_blank')
                                }
                              }}
                            >
                              {isPersistedReceipt(file)
                                ? `Receipt ${index + 1}`
                                : file.name}
                            </Button>
                          </span>
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            color="error"
                            onClick={() => {
                              if (isPersistedReceipt(file)) {
                                if (
                                  window.confirm(
                                    'Are you sure you want to delete this receipt?',
                                  )
                                ) {
                                  deleteReceiptMutation.mutate({
                                    expenseId: expenseForm.id,
                                    receiptId: file?.id,
                                    receiptUrl: getReceiptUrl(file),
                                  })
                                }
                              } else {
                                setExpenseForm((prev) => ({
                                  ...prev,
                                  invoiceReceipt: prev.invoiceReceipt.filter(
                                    (_, i) => i !== index,
                                  ),
                                }))
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() =>
                      document.getElementById('invoice-upload').click()
                    }
                    className="capitalize mt-2"
                  >
                    Receipt
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="flex justify-end">
            {modalType == 'add' ? (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => addExpenseMutation?.mutate(expenseForm)}
              >
                Add
              </Button>
            ) : (
              <Button
                variant="outlined"
                color="primary"
                onClick={() => editExpenseMutation.mutate(expenseForm)}
              >
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Expenses
