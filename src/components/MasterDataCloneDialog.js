import React, { useEffect, useMemo, useState } from 'react'
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  cloneMasterData,
  getPharmacyMasterData,
  previewCloneMasterData,
} from '@/constants/apis'
import { API_ROUTES } from '@/constants/constants'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'

export const MASTER_DATA_CLONE_TYPES = [
  {
    key: 'labTests',
    label: 'Lab Tests',
    description:
      'Test names, amounts, groups, sample types and outsourced flags',
  },
  {
    key: 'scans',
    label: 'Scans',
    description: 'Scan names, amounts and Form-F settings',
  },
  {
    key: 'embryology',
    label: 'Embryology',
    description: 'Embryology procedures and branch amounts',
  },
  {
    key: 'appointmentCharges',
    label: 'Appointment Charges',
    description: 'Branch-wise charges for appointment reasons',
  },
  {
    key: 'defaultOtPersons',
    label: 'Default OT Persons',
    description: 'Default OT staff by designation for the branch',
  },
  {
    key: 'layouts',
    label: 'Master Layouts',
    description:
      'Buildings, floors, rooms and beds. Occupied beds are not copied',
  },
]

export const TAB_TO_CLONE_TYPE = {
  labTests: 'labTests',
  scans: 'scans',
  embryology: 'embryology',
  AppointmentReasons: 'appointmentCharges',
  DefaultOTPersons: 'defaultOtPersons',
}

export const DEFAULT_CLONE_TYPES = ['labTests', 'scans', 'embryology']

const getBranchLabel = (branch) => {
  if (!branch) return ''
  const code = branch.branchCode || branch.branch_code
  return code ? `${branch.name} (${code})` : branch.name
}

const MasterDataCloneDialog = ({
  open,
  onClose,
  accessToken,
  defaultCloneTypes = DEFAULT_CLONE_TYPES,
  onSuccess,
}) => {
  const [sourceBranch, setSourceBranch] = useState(null)
  const [targetBranch, setTargetBranch] = useState(null)
  const [selectedTypes, setSelectedTypes] = useState(DEFAULT_CLONE_TYPES)
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [preview, setPreview] = useState(null)

  const { data: branchesResponse, isLoading: loadingBranches } = useQuery({
    queryKey: ['masterDataCloneBranches'],
    queryFn: () =>
      getPharmacyMasterData(accessToken, API_ROUTES.GET_ALL_BRANCHES_MASTER),
    enabled: Boolean(open && accessToken),
  })

  const branches = useMemo(() => {
    const list = branchesResponse?.data || []
    return Array.isArray(list)
      ? [...list].sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || '')),
        )
      : []
  }, [branchesResponse])

  useEffect(() => {
    if (!open) return
    setSourceBranch(null)
    setTargetBranch(null)
    setSelectedTypes(
      defaultCloneTypes?.length ? defaultCloneTypes : DEFAULT_CLONE_TYPES,
    )
    setOverwriteExisting(false)
    setPreview(null)
  }, [open])

  const clonePayload = useMemo(
    () => ({
      sourceBranchId: sourceBranch?.id,
      targetBranchId: targetBranch?.id,
      cloneTypes: selectedTypes,
      overwriteExisting,
    }),
    [sourceBranch, targetBranch, selectedTypes, overwriteExisting],
  )

  const canPreview =
    Boolean(sourceBranch?.id) &&
    Boolean(targetBranch?.id) &&
    sourceBranch?.id !== targetBranch?.id &&
    selectedTypes.length > 0

  const previewMutation = useMutation({
    mutationFn: () => previewCloneMasterData(accessToken, clonePayload),
    onSuccess: (response) => {
      if (response?.status === 200) {
        setPreview(response.data)
        return
      }
      toast.error(response?.message || 'Unable to preview clone', toastconfig)
    },
    onError: () => {
      toast.error('Unable to preview clone', toastconfig)
    },
  })

  const cloneMutation = useMutation({
    mutationFn: () => cloneMasterData(accessToken, clonePayload),
    onSuccess: (response) => {
      if (response?.status === 200) {
        setPreview(response.data)
        toast.success(
          response?.message || 'Master data cloned successfully',
          toastconfig,
        )
        onSuccess?.(response.data)
        return
      }
      toast.error(
        response?.message || 'Unable to clone master data',
        toastconfig,
      )
    },
    onError: () => {
      toast.error('Unable to clone master data', toastconfig)
    },
  })

  const handleTypeToggle = (key) => {
    setPreview(null)
    setSelectedTypes((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    )
  }

  const handleSelectAll = () => {
    setPreview(null)
    setSelectedTypes(MASTER_DATA_CLONE_TYPES.map((item) => item.key))
  }

  const handleClearTypes = () => {
    setPreview(null)
    setSelectedTypes([])
  }

  const totals = useMemo(() => {
    const results = preview?.results || {}
    return Object.values(results).reduce(
      (acc, item) => ({
        created: acc.created + Number(item?.created || 0),
        skipped: acc.skipped + Number(item?.skipped || 0),
        updated: acc.updated + Number(item?.updated || 0),
        sourceCount: acc.sourceCount + Number(item?.sourceCount || 0),
      }),
      { created: 0, skipped: 0, updated: 0, sourceCount: 0 },
    )
  }, [preview])

  const nothingToClone =
    preview && !preview.dryRun && totals.created === 0 && totals.updated === 0

  const cloneDisabled =
    !preview?.dryRun ||
    cloneMutation.isPending ||
    previewMutation.isPending ||
    (totals.created === 0 && totals.updated === 0)

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', pr: 1 }}>
        <ContentCopyIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6">Clone Master Data</Typography>
          <Typography variant="body2" color="text.secondary">
            Copy branch-specific tests, scans and other setup from one branch to
            another
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Stack spacing={2.5}>
          <Alert severity="info">
            Global lists such as cities, departments, coupons and pharmacy items
            are shared across branches and do not need cloning. Existing records
            on the target branch are skipped unless you choose to update them.
          </Alert>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Autocomplete
              fullWidth
              options={branches}
              loading={loadingBranches}
              value={sourceBranch}
              getOptionLabel={getBranchLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                setSourceBranch(value)
                setPreview(null)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Clone from branch"
                  placeholder="Select source branch"
                />
              )}
            />
            <Autocomplete
              fullWidth
              options={branches.filter(
                (branch) => branch.id !== sourceBranch?.id,
              )}
              loading={loadingBranches}
              value={targetBranch}
              getOptionLabel={getBranchLabel}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              onChange={(_, value) => {
                setTargetBranch(value)
                setPreview(null)
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Clone to branch"
                  placeholder="Select target branch"
                />
              )}
            />
          </Stack>

          <Box>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 1 }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                What should be cloned?
              </Typography>
              <Stack direction="row" spacing={1}>
                <Button size="small" onClick={handleSelectAll}>
                  Select all
                </Button>
                <Button size="small" onClick={handleClearTypes}>
                  Clear
                </Button>
              </Stack>
            </Stack>
            <FormGroup>
              {MASTER_DATA_CLONE_TYPES.map((item) => (
                <FormControlLabel
                  key={item.key}
                  control={
                    <Checkbox
                      checked={selectedTypes.includes(item.key)}
                      onChange={() => handleTypeToggle(item.key)}
                    />
                  }
                  label={
                    <Box sx={{ py: 0.5 }}>
                      <Typography variant="body1">{item.label}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </FormGroup>
          </Box>

          <FormControlLabel
            control={
              <Switch
                checked={overwriteExisting}
                onChange={(e) => {
                  setOverwriteExisting(e.target.checked)
                  setPreview(null)
                }}
              />
            }
            label="Update matching records already present on the target branch"
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
            Off by default. Layouts always skip buildings that already exist by
            name so occupied beds are not overwritten.
          </Typography>

          {preview?.results && (
            <>
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                  {preview.dryRun ? 'Preview' : 'Clone complete'}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 1.5 }}
                >
                  {getBranchLabel(preview.sourceBranch)} →{' '}
                  {getBranchLabel(preview.targetBranch)}
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Chip
                    color="primary"
                    label={`${totals.created} ${
                      preview.dryRun ? 'will be created' : 'created'
                    }`}
                  />
                  <Chip
                    color="warning"
                    variant="outlined"
                    label={`${totals.skipped} already exist`}
                  />
                  {overwriteExisting || totals.updated > 0 ? (
                    <Chip
                      color="info"
                      variant="outlined"
                      label={`${totals.updated} ${
                        preview.dryRun ? 'will be updated' : 'updated'
                      }`}
                    />
                  ) : null}
                </Stack>
                <Stack spacing={1} sx={{ mt: 2 }}>
                  {MASTER_DATA_CLONE_TYPES.filter(
                    (item) => preview.results[item.key],
                  ).map((item) => {
                    const result = preview.results[item.key]
                    return (
                      <Box
                        key={item.key}
                        sx={{
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 1,
                          p: 1.5,
                        }}
                      >
                        <Typography sx={{ fontWeight: 600 }}>
                          {item.label}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Source: {result.sourceCount} · Create:{' '}
                          {result.created} · Skip: {result.skipped}
                          {result.updated ? ` · Update: ${result.updated}` : ''}
                          {item.key === 'layouts'
                            ? ` · Buildings ${result.buildingsCreated || 0}, floors ${result.floorsCreated || 0}, rooms ${result.roomsCreated || 0}, beds ${result.bedsCreated || 0}`
                            : ''}
                        </Typography>
                      </Box>
                    )
                  })}
                </Stack>
                {preview.dryRun &&
                  totals.created === 0 &&
                  totals.updated === 0 && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Nothing new to clone. The target branch already has the
                      selected records.
                    </Alert>
                  )}
                {!preview.dryRun && (
                  <Alert
                    severity={nothingToClone ? 'warning' : 'success'}
                    sx={{ mt: 2 }}
                  >
                    {nothingToClone
                      ? 'No records were cloned.'
                      : `Cloned ${totals.created} record(s)${
                          totals.updated ? ` and updated ${totals.updated}` : ''
                        } to ${getBranchLabel(preview.targetBranch)}.`}
                  </Alert>
                )}
              </Box>
            </>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="outlined"
          disabled={!canPreview || previewMutation.isPending}
          onClick={() => previewMutation.mutate()}
          startIcon={
            previewMutation.isPending ? <CircularProgress size={16} /> : null
          }
        >
          Preview
        </Button>
        <Button
          variant="contained"
          disabled={cloneDisabled}
          onClick={() => cloneMutation.mutate()}
          startIcon={
            cloneMutation.isPending ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <ContentCopyIcon />
            )
          }
        >
          Clone now
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default MasterDataCloneDialog
