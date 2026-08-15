import Breadcrumb from '@/components/Breadcrumb'
import Modal from '@/components/Modal'
import {
  deleteGrnStockReportItem,
  deleteGrnStockReportLine,
  getGrnStockReportTab,
  grnStockReport,
  updateGrnStockReportItemSummary,
  updateGrnStockReportLine,
} from '@/constants/apis'
import { isGrnStockReportAdmin } from '@/constants/grnStockReportAdmins'
import { closeModal, openModal } from '@/redux/modalSlice'
import {
  Autocomplete,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  TextField,
} from '@mui/material'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import React, { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import FilteredDataGrid from '@/components/FilteredDataGrid'
import { stockReportfilterData } from '@/constants/filters'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import dayjs from 'dayjs'
import { DataGrid } from '@mui/x-data-grid'
import { exportReport } from '@/utils/reportExport'

function parseGrnDetails(raw) {
  if (raw == null) return []
  const normalize = (value) =>
    Array.isArray(value)
      ? value.filter((entry) => entry && typeof entry === 'object')
      : []
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      return normalize(parsed)
    } catch {
      return []
    }
  }
  return normalize(raw)
}

/** Sentinel value for branch filter state (all branches in dropdown). */
const ALL_BRANCHES_VALUE = 'all'
const ALL_BRANCHES_OPTION = {
  id: ALL_BRANCHES_VALUE,
  branchCode: 'All',
  name: 'All branches',
}

function StockReport({ breadcrumb = true }) {
  const userDetails = useSelector((store) => store.user)
  const dropdowns = useSelector((store) => store.dropdowns)
  const { branches } = dropdowns
  const dispatch = useDispatch()
  const queryClient = useQueryClient()
  const [branchId, setBranchId] = useState(branches[0]?.id ?? null)
  const [activeTab, setActiveTab] = useState('stock')
  const [reportFromDate, setReportFromDate] = useState(null)
  const [reportToDate, setReportToDate] = useState(null)
  const [reportBranchId, setReportBranchId] = useState(ALL_BRANCHES_VALUE)
  const [reportExportFormat, setReportExportFormat] = useState('excel')
  const [stockSearchText, setStockSearchText] = useState('')

  const branchOptions = useMemo(
    () => [ALL_BRANCHES_OPTION, ...(branches || [])],
    [branches],
  )

  const branchIdsForQuery = useMemo(() => {
    if (branchId === ALL_BRANCHES_VALUE) {
      return (branches || []).map((b) => b.id).filter((id) => id != null)
    }
    if (branchId != null && branchId !== ALL_BRANCHES_VALUE) {
      return [branchId]
    }
    return []
  }, [branchId, branches])

  const isAllBranches = branchId === ALL_BRANCHES_VALUE

  const formatRowBranchLabel = (row) => {
    if (!isAllBranches && typeof branchId === 'number') {
      const b = branches?.find((x) => x.id === branchId)
      if (b) {
        return [b.branchCode, b.name].filter(Boolean).join(' — ') || '—'
      }
      return '—'
    }
    const details = parseGrnDetails(row?.grnDetails)
    const names = [
      ...new Set(
        details
          .map((d) => d.branchName || d.branchId)
          .filter((x) => x != null && x !== '')
          .map((x) => String(x).trim())
          .filter(Boolean),
      ),
    ].sort()
    if (names.length === 0) {
      return '—'
    }
    return names.join(', ')
  }

  const [grnDetails, setGrnDetails] = useState(null)
  const [itemId, setItemId] = useState(null)
  const [editStockRow, setEditStockRow] = useState(null)
  const [editLines, setEditLines] = useState([])
  const [editHeaderItemId, setEditHeaderItemId] = useState('')
  const [editHeaderItemName, setEditHeaderItemName] = useState('')
  const [editHeaderTotalQty, setEditHeaderTotalQty] = useState('')
  const [savingItemSummary, setSavingItemSummary] = useState(false)

  const userEmail = userDetails?.email || userDetails?.userDetails?.email || ''
  const stockReportAdmin = isGrnStockReportAdmin(userEmail)

  const { data: grnStockData } = useQuery({
    queryKey: ['GRN_STOCK_REPORT', userDetails.accessToken, branchId],
    queryFn: async () => {
      const res = await grnStockReport(
        userDetails.accessToken,
        branchIdsForQuery,
      )
      if (res.status == 200) {
        return res.data
      }
    },
    enabled: branchIdsForQuery.length > 0,
  })

  const { data: grnStockReportTabData, isLoading: isGrnStockReportTabLoading } =
    useQuery({
      queryKey: [
        'GRN_STOCK_REPORT_TAB',
        userDetails.accessToken,
        reportFromDate?.format('YYYY-MM-DD') || null,
        reportToDate?.format('YYYY-MM-DD') || null,
        reportBranchId,
      ],
      enabled: activeTab === 'report',
      queryFn: async () => {
        const res = await getGrnStockReportTab(
          userDetails.accessToken,
          reportFromDate ? reportFromDate.format('YYYY-MM-DD') : null,
          reportToDate ? reportToDate.format('YYYY-MM-DD') : null,
          reportBranchId === ALL_BRANCHES_VALUE ? null : reportBranchId,
        )
        if (res?.status === 200) return res.data || []
        return []
      },
    })

  const invalidateStockReport = () => {
    queryClient.invalidateQueries({
      queryKey: ['GRN_STOCK_REPORT', userDetails.accessToken],
    })
  }

  const resolveLineBranchId = (line) => {
    const raw = line?.branchId
    if (raw != null && raw !== '') {
      const n = typeof raw === 'number' ? raw : parseInt(String(raw), 10)
      if (!Number.isNaN(n)) {
        return n
      }
    }
    if (typeof branchId === 'number' && !Number.isNaN(branchId)) {
      return branchId
    }
    return null
  }

  const handleViewGRNDetails = (row) => {
    setItemId(row.itemId)
    dispatch(openModal(`grnStockDetails-${row.itemId}`))
    setGrnDetails(row?.grnDetails || [])
  }

  const handleCloseViewModal = () => {
    dispatch(closeModal())
    setItemId(null)
    setGrnDetails(null)
  }

  const handleOpenEdit = (row) => {
    const lines = parseGrnDetails(row.grnDetails)
    setEditStockRow(row)
    setEditHeaderItemId(String(row.itemId ?? ''))
    setEditHeaderItemName(String(row.itemName ?? ''))
    setEditHeaderTotalQty(String(row.totalQuantity ?? ''))
    setEditLines(
      lines.map((l) => ({
        grnItemAssociationId: l.grnItemAssociationId,
        grnId: l.grnId,
        branchId: l.branchId,
        supplierName: l.supplierName,
        branchName: l.branchName,
        batchNo: l.batchNo,
        availableQuantity: String(l.availableQuantity ?? ''),
        expiryDate: l.expiryDate ? String(l.expiryDate).slice(0, 10) : '',
      })),
    )
    dispatch(openModal(`grnStockEdit-${row.itemId}`))
  }

  const handleCloseEditModal = () => {
    dispatch(closeModal())
    setEditStockRow(null)
    setEditLines([])
    setEditHeaderItemId('')
    setEditHeaderItemName('')
    setEditHeaderTotalQty('')
  }

  const handleSaveItemSummary = async () => {
    if (!editStockRow) return
    if (isAllBranches) {
      toast.error(
        'Select a single branch in the dropdown to save item and branch total.',
        toastconfig,
      )
      return
    }
    const newId = parseInt(editHeaderItemId, 10)
    if (Number.isNaN(newId)) {
      toast.error('Item ID must be a valid number.', toastconfig)
      return
    }
    const totalQty = Number(editHeaderTotalQty)
    if (Number.isNaN(totalQty) || totalQty < 0) {
      toast.error('Available quantity must be zero or greater.', toastconfig)
      return
    }
    setSavingItemSummary(true)
    try {
      const res = await updateGrnStockReportItemSummary(
        userDetails.accessToken,
        {
          branchId,
          itemId: editStockRow.itemId,
          itemName: editHeaderItemName,
          newItemId: newId,
          totalQuantity: Math.round(totalQty),
        },
      )
      if (res.status === 200) {
        toast.success(res.message || 'Item updated', toastconfig)
        invalidateStockReport()
        handleCloseEditModal()
      } else {
        toast.error(res.message || 'Update failed', toastconfig)
      }
    } finally {
      setSavingItemSummary(false)
    }
  }

  const updateEditLine = (index, field, value) => {
    setEditLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line)),
    )
  }

  const handleSaveLine = async (index) => {
    const line = editLines[index]
    if (!line?.grnItemAssociationId) {
      toast.error(
        'This row cannot be updated (refresh the report after deployment).',
        toastconfig,
      )
      return
    }
    const qty = parseInt(line.availableQuantity, 10)
    if (Number.isNaN(qty) || qty < 0) {
      toast.error('Enter a valid quantity.', toastconfig)
      return
    }
    const lineBranchId = resolveLineBranchId(line)
    if (lineBranchId == null) {
      toast.error(
        'Could not determine branch for this line. Refresh and try again.',
        toastconfig,
      )
      return
    }
    const res = await updateGrnStockReportLine(
      userDetails.accessToken,
      line.grnItemAssociationId,
      {
        branchId: lineBranchId,
        totalQuantity: qty,
        ...(line.expiryDate ? { expiryDate: line.expiryDate } : {}),
      },
    )
    if (res.status === 200) {
      toast.success(res.message || 'Updated', toastconfig)
      invalidateStockReport()
    } else {
      toast.error(res.message || 'Update failed', toastconfig)
    }
  }

  const handleDeleteLine = async (index) => {
    const line = editLines[index]
    if (!line?.grnItemAssociationId) {
      toast.error('This row cannot be removed.', toastconfig)
      return
    }
    const lineBranchId = resolveLineBranchId(line)
    if (lineBranchId == null) {
      toast.error(
        'Could not determine branch for this line. Refresh and try again.',
        toastconfig,
      )
      return
    }
    if (
      !window.confirm('Remove this GRN stock line for the selected branch?')
    ) {
      return
    }
    const res = await deleteGrnStockReportLine(
      userDetails.accessToken,
      line.grnItemAssociationId,
      lineBranchId,
    )
    if (res.status === 200) {
      toast.success(res.message || 'Line removed', toastconfig)
      setEditLines((prev) => prev.filter((_, i) => i !== index))
      invalidateStockReport()
    } else {
      toast.error(res.message || 'Delete failed', toastconfig)
    }
  }

  const handleDeleteItemStock = async (row) => {
    const idsToClear =
      isAllBranches && branches?.length
        ? branches.map((b) => b.id).filter((id) => id != null)
        : typeof branchId === 'number'
          ? [branchId]
          : []
    if (!idsToClear.length) {
      toast.error('Select at least one branch.', toastconfig)
      return
    }
    const scopeLabel = isAllBranches
      ? `ALL branches (${idsToClear.length})`
      : 'this branch'
    if (
      !window.confirm(
        `Remove all GRN stock lines for "${row.itemName}" at ${scopeLabel}? This cannot be undone.`,
      )
    ) {
      return
    }
    let removed = 0
    for (const bid of idsToClear) {
      const res = await deleteGrnStockReportItem(
        userDetails.accessToken,
        row.itemId,
        bid,
      )
      if (res.status === 200) {
        removed += res.data?.deletedRows ?? 0
      } else {
        toast.error(res.message || 'Delete failed', toastconfig)
        return
      }
    }
    toast.success(`Removed ${removed} line(s).`, toastconfig)
    invalidateStockReport()
  }

  const columns = [
    { field: 'itemId', headerName: 'Item ID', width: 100 },
    { field: 'itemName', headerName: 'Item Name', width: 320 },
    {
      field: 'branchDisplay',
      headerName: 'Branch',
      width: 220,
      minWidth: 140,
      sortable: true,
      valueGetter: (first, second) => {
        const row =
          second != null && typeof second === 'object' && 'itemId' in second
            ? second
            : first?.row
        return row ? formatRowBranchLabel(row) : '—'
      },
      renderCell: (params) => (
        <span className="text-sm leading-snug block py-1" title={params.value}>
          {params.value}
        </span>
      ),
    },
    {
      field: 'totalQuantity',
      headerName: 'Available Quantity',
      width: 250,
      renderCell: (row) => {
        return (
          <Chip
            variant="contained"
            color={`${row.row.totalQuantity > 30 ? 'success' : 'error'}`}
            label={row.row.totalQuantity}
          />
        )
      },
    },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: stockReportAdmin ? 420 : 250,
      flex: 0,
      renderCell: (row) => {
        return (
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              color="primary"
              className="text-white"
              size="small"
              onClick={() => handleViewGRNDetails(row.row)}
            >
              View GRN Details
            </Button>
            {stockReportAdmin && (
              <>
                <Button
                  variant="contained"
                  color="secondary"
                  size="small"
                  onClick={() => handleOpenEdit(row.row)}
                >
                  Edit
                </Button>
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={() => handleDeleteItemStock(row.row)}
                >
                  Delete
                </Button>
              </>
            )}
          </Stack>
        )
      },
    },
  ]

  const reportColumns = [
    {
      field: 'productName',
      headerName: 'Product Name',
      minWidth: 240,
      flex: 1.2,
    },
    {
      field: 'availableQuantity',
      headerName: 'Available Quantity',
      minWidth: 160,
      flex: 0.8,
    },
    {
      field: 'price',
      headerName: 'Price',
      minWidth: 120,
      flex: 0.7,
      renderCell: (params) => {
        const safe = Number(params?.row?.price || 0)
        return Number.isFinite(safe) ? safe.toFixed(2) : '0.00'
      },
    },
    {
      field: 'soldQuantity',
      headerName: 'Sold Quantity',
      minWidth: 140,
      flex: 0.8,
    },
    { field: 'batchNo', headerName: 'Batch No', minWidth: 140, flex: 0.8 },
    { field: 'branch', headerName: 'Branch', minWidth: 130, flex: 0.7 },
  ]

  const customFilters = [
    {
      field: 'itemName',
      label: 'Item Name',
      type: 'text',
    },
    {
      field: 'totalQuantity',
      label: 'Available Quantity',
      type: 'number',
    },
  ]

  const filteredStockRows = useMemo(() => {
    const rows = grnStockData || []
    const term = stockSearchText.trim().toLowerCase()
    if (!term) return rows

    return rows.filter((row) => {
      const itemId = String(row?.itemId ?? '').toLowerCase()
      const itemName = String(row?.itemName ?? '').toLowerCase()
      const branchLabel = String(formatRowBranchLabel(row) ?? '').toLowerCase()
      return (
        itemId.includes(term) ||
        itemName.includes(term) ||
        branchLabel.includes(term)
      )
    })
  }, [grnStockData, stockSearchText, branchId, branches])

  const getUniqueValues = (field) => {
    if (!grnStockData) return []
    const values = new Set(grnStockData.map((row) => row[field]))
    return Array.from(values).filter(Boolean)
  }

  const viewDetailsList = parseGrnDetails(grnDetails)
  const reportFormatOptions = [
    { id: 'excel', label: 'Excel' },
    { id: 'pdf', label: 'PDF' },
  ]

  const handleExportReport = () => {
    exportReport(
      grnStockReportTabData || [],
      reportColumns,
      reportExportFormat,
      {
        reportName: 'GRN_Stock_Report',
        branchName:
          reportBranchId === ALL_BRANCHES_VALUE
            ? 'ALL'
            : (branches?.find((b) => b.id === reportBranchId)?.branchCode ??
              'ALL'),
      },
    )
  }

  return (
    <div className="m-5">
      <div
        className={`mb-5 flex items-center ${
          breadcrumb ? 'justify-between' : 'justify-end'
        }`}
      >
        {breadcrumb && <Breadcrumb />}
        {activeTab === 'stock' ? (
          <Autocomplete
            className="min-w-[140px] w-[160px]"
            options={branchOptions}
            getOptionLabel={(option) =>
              option?.id === ALL_BRANCHES_VALUE
                ? 'All'
                : option?.branchCode || option?.name || ''
            }
            isOptionEqualToValue={(option, value) => option?.id === value?.id}
            value={
              branchId === ALL_BRANCHES_VALUE
                ? ALL_BRANCHES_OPTION
                : (branches?.find((b) => b.id === branchId) ?? null)
            }
            onChange={(_, value) => {
              if (!value) {
                setBranchId(branches?.[0]?.id ?? null)
                return
              }
              setBranchId(
                value.id === ALL_BRANCHES_VALUE ? ALL_BRANCHES_VALUE : value.id,
              )
            }}
            renderInput={(params) => <TextField {...params} fullWidth />}
            clearIcon={null}
          />
        ) : null}
      </div>
      <div className="mb-3">
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab value="stock" label="Stock" />
          <Tab value="report" label="Report" />
        </Tabs>
      </div>
      {activeTab === 'stock' ? (
        <div>
          <div className="flex justify-end mb-3">
            <TextField
              size="small"
              placeholder="Search by Item ID, Item Name, Branch"
              className="w-full max-w-sm"
              value={stockSearchText}
              onChange={(e) => setStockSearchText(e.target.value)}
            />
          </div>
          <FilteredDataGrid
            key={String(branchId)}
            rows={filteredStockRows}
            columns={columns}
            getRowId={(row) => row.itemId}
            customFilters={customFilters}
            filterData={stockReportfilterData}
            getUniqueValues={getUniqueValues}
          />
        </div>
      ) : (
        <div className="bg-white rounded border p-3">
          <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
            <div className="flex gap-3 flex-wrap items-center">
              <DatePicker
                label="From Date"
                value={reportFromDate}
                format="DD/MM/YYYY"
                onChange={(value) =>
                  setReportFromDate(value ? dayjs(value) : null)
                }
              />
              <DatePicker
                label="To Date"
                value={reportToDate}
                format="DD/MM/YYYY"
                onChange={(value) =>
                  setReportToDate(value ? dayjs(value) : null)
                }
              />
              <Autocomplete
                className="min-w-[180px]"
                options={branchOptions}
                getOptionLabel={(option) =>
                  option?.id === ALL_BRANCHES_VALUE
                    ? 'All Branches'
                    : option?.branchCode || option?.name || ''
                }
                value={
                  reportBranchId === ALL_BRANCHES_VALUE
                    ? ALL_BRANCHES_OPTION
                    : (branches?.find((b) => b.id === reportBranchId) ?? null)
                }
                onChange={(_, value) => {
                  setReportBranchId(value?.id ?? ALL_BRANCHES_VALUE)
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Branch" />
                )}
                clearIcon={null}
              />
            </div>
            <div className="flex gap-2 items-center">
              <Autocomplete
                className="w-36"
                options={reportFormatOptions}
                getOptionLabel={(option) => option.label}
                value={
                  reportFormatOptions.find(
                    (opt) => opt.id === reportExportFormat,
                  ) || reportFormatOptions[0]
                }
                onChange={(_, value) =>
                  setReportExportFormat(value?.id || reportFormatOptions[0].id)
                }
                renderInput={(params) => (
                  <TextField {...params} label="Format" />
                )}
                disableClearable
              />
              <Button
                variant="contained"
                onClick={handleExportReport}
                disabled={!grnStockReportTabData?.length}
              >
                Export
              </Button>
            </div>
          </div>
          <div style={{ height: '68vh', width: '100%' }}>
            <DataGrid
              rows={grnStockReportTabData || []}
              columns={reportColumns}
              loading={isGrnStockReportTabLoading}
              getRowId={(row) =>
                `${row.grnId}-${row.itemId}-${row.batchNo}-${row.branchId}`
              }
              disableRowSelectionOnClick
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: { paginationModel: { page: 0, pageSize: 25 } },
              }}
            />
          </div>
        </div>
      )}
      <Modal
        uniqueKey={`grnStockDetails-${itemId}`}
        title="GRN Details"
        maxWidth="md"
        closeOnOutsideClick={false}
        showCloseButton
        onOutsideClick={handleCloseViewModal}
      >
        <div className="flex flex-col gap-4 mt-1">
          {viewDetailsList.length > 0 ? (
            viewDetailsList.map((item) => (
              <div
                key={
                  item.grnItemAssociationId != null
                    ? `${item.grnItemAssociationId}-${item.branchId ?? ''}`
                    : `${item.grnId}-${item.branchId ?? ''}-${item.batchNo ?? ''}-${item.expiryDate ?? ''}`
                }
                className="border p-4 rounded-lg"
              >
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <p className="text-sm text-gray-600">GRN ID</p>
                    <p className="font-medium">{item.grnId ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Invoice Number</p>
                    <p className="font-medium">
                      {item.invoiceNumber || item.invoiceNo || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Branch</p>
                    <p className="font-medium">{item.branchName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Supplier</p>
                    <p className="font-medium">{item.supplierName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Available Quantity</p>
                    <p className="font-medium">{item.availableQuantity ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Expiry Date</p>
                    <p className="font-medium">{item.expiryDate || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-600">No GRN Details Found</p>
          )}
        </div>
      </Modal>

      {editStockRow ? (
        <Modal
          uniqueKey={`grnStockEdit-${editStockRow.itemId}`}
          title={`Edit stock — ${editStockRow.itemName} (ID ${editStockRow.itemId})`}
          maxWidth="md"
          closeOnOutsideClick={false}
          showCloseButton
          onOutsideClick={handleCloseEditModal}
        >
          <div className="border border-gray-200 rounded-lg p-4 mb-5 bg-gray-50">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              Item and branch total
            </p>
            {isAllBranches ? (
              <p className="text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded px-3 py-2 mb-3">
                Branch filter is <strong>All</strong>. Choose one branch in the
                dropdown to edit item name, item ID move, or branch total.
                Per-line edits below still use each line&apos;s branch.
              </p>
            ) : null}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ mb: 2 }}
            >
              <TextField
                label="Item ID"
                size="small"
                type="number"
                fullWidth
                disabled={isAllBranches}
                value={editHeaderItemId}
                onChange={(e) => setEditHeaderItemId(e.target.value)}
                helperText="Change to another existing item ID to move all GRN lines for this branch to that item."
              />
              <TextField
                label="Item name"
                size="small"
                fullWidth
                disabled={isAllBranches}
                value={editHeaderItemName}
                onChange={(e) => setEditHeaderItemName(e.target.value)}
              />
              <TextField
                label="Available quantity (branch total)"
                size="small"
                type="number"
                fullWidth
                disabled={isAllBranches}
                value={editHeaderTotalQty}
                onChange={(e) => setEditHeaderTotalQty(e.target.value)}
                inputProps={{ min: 0 }}
                helperText="Distributes across GRN lines (proportional if several lines)."
              />
            </Stack>
            <Button
              variant="contained"
              color="primary"
              disabled={savingItemSummary || isAllBranches}
              onClick={handleSaveItemSummary}
            >
              {savingItemSummary ? 'Saving…' : 'Save item & branch total'}
            </Button>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Below: adjust quantity or expiry per GRN line. Save applies that
            line only. Remove line deletes that GRN line; use Delete on the grid
            to clear lines for this item (
            {isAllBranches
              ? 'all branches when filter is All'
              : 'current branch'}
            ).
          </p>
          {editLines.length === 0 ? (
            <p className="text-gray-600">No GRN lines for this item.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {editLines.map((line, index) => (
                <div
                  key={`${line.grnItemAssociationId ?? index}-${line.grnId}-${line.branchId ?? ''}`}
                  className="border p-4 rounded-lg space-y-3"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">GRN ID</span>
                      <p className="font-medium">{line.grnId}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Supplier</span>
                      <p className="font-medium">{line.supplierName || '—'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Batch</span>
                      <p className="font-medium">{line.batchNo || '—'}</p>
                    </div>
                    {isAllBranches ? (
                      <div className="md:col-span-3">
                        <span className="text-gray-600">Branch</span>
                        <p className="font-medium">
                          {line.branchName || line.branchId || '—'}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                      label="Available quantity"
                      type="number"
                      size="small"
                      value={line.availableQuantity}
                      onChange={(e) =>
                        updateEditLine(
                          index,
                          'availableQuantity',
                          e.target.value,
                        )
                      }
                      inputProps={{ min: 0 }}
                    />
                    <TextField
                      label="Expiry"
                      type="date"
                      size="small"
                      InputLabelProps={{ shrink: true }}
                      value={line.expiryDate}
                      onChange={(e) =>
                        updateEditLine(index, 'expiryDate', e.target.value)
                      }
                    />
                  </Stack>
                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleSaveLine(index)}
                    >
                      Save line
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={() => handleDeleteLine(index)}
                    >
                      Remove line
                    </Button>
                  </Stack>
                </div>
              ))}
            </div>
          )}
        </Modal>
      ) : null}
    </div>
  )
}

export default StockReport
