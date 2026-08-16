import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts'
import dayjs from 'dayjs'
import { getPatientTrackerSummaryAutomated } from '@/constants/apis'

const COLORS = [
  '#06aee9',
  '#6366f1',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#3b82f6',
  '#ec4899',
]

const FUNNEL_STAGES = [
  'Registered',
  'Initial Appointment',
  'Follow up',
  'Treatment',
  'Cycle Started',
  'OPU',
  'FET-D1',
  'FET',
  'UPT',
  'UPT Positive',
  'UPT Negative',
]

const ANALYSIS_MODES = [
  { id: 'overview', label: 'Overview' },
  { id: 'funnel', label: 'Funnel' },
  { id: 'clinical', label: 'Clinical' },
  { id: 'financial', label: 'Financial' },
  { id: 'embryology', label: 'Embryology' },
  { id: 'sources', label: 'Sources' },
]

const blank = (value) =>
  value == null || value === '' || value === '-' || value === 'Unknown'

const labelOr = (value, fallback = 'Unknown') => {
  if (blank(value)) return fallback
  if (typeof value === 'object') {
    return value.referralSource || value.name || fallback
  }
  return String(value).trim() || fallback
}

const toNumber = (value) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const inr = (value) =>
  `₹${toNumber(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

const pct = (part, total) =>
  total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '0%'

const countBy = (rows, keyFn) => {
  const map = {}
  rows.forEach((row) => {
    const key = keyFn(row)
    map[key] = (map[key] || 0) + 1
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const sumBy = (rows, keyFn, valueFn) => {
  const map = {}
  rows.forEach((row) => {
    const key = keyFn(row)
    map[key] = (map[key] || 0) + valueFn(row)
  })
  return Object.entries(map)
    .map(([name, value]) => ({ name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
}

const ChartCard = ({ title, subtitle, height = 320, children }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          mb: 1,
          gap: 1,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
        {subtitle ? (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        ) : null}
      </Box>
      <Box sx={{ height, mt: 1 }}>{children}</Box>
    </CardContent>
  </Card>
)

const KpiCard = ({ label, value, hint }) => (
  <Card variant="outlined">
    <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.3 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </CardContent>
  </Card>
)

const BreakdownTable = ({ rows, valueLabel = 'Count' }) => {
  const total = rows.reduce((sum, row) => sum + (row.value || 0), 0)
  return (
    <Box sx={{ overflowX: 'auto' }}>
      <Box
        component="table"
        sx={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.8125rem',
          '& th, & td': {
            borderBottom: '1px solid #eee',
            py: 0.75,
            px: 1,
            textAlign: 'left',
          },
          '& th': { color: 'text.secondary', fontWeight: 600 },
          '& td:nth-of-type(2), & th:nth-of-type(2), & td:nth-of-type(3), & th:nth-of-type(3)':
            {
              textAlign: 'right',
            },
        }}
      >
        <thead>
          <tr>
            <th>Segment</th>
            <th>{valueLabel}</th>
            <th>Share</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>
                {typeof row.display === 'string' ? row.display : row.value}
              </td>
              <td>{pct(row.value, total)}</td>
            </tr>
          ))}
        </tbody>
      </Box>
    </Box>
  )
}

export default function DataAnalyticsTab({
  accessToken,
  isActive,
  branchOptions = [],
  referralOptions = [],
  treatmentOptions = [],
}) {
  const [fromDate, setFromDate] = useState(dayjs().startOf('month'))
  const [toDate, setToDate] = useState(dayjs())
  const [branch, setBranch] = useState('ALL')
  const [referral, setReferral] = useState('')
  const [treatment, setTreatment] = useState('')
  const [mode, setMode] = useState('overview')
  const [trendGrain, setTrendGrain] = useState('week')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (!isActive || !accessToken || !fromDate || !toDate) return
    const from = dayjs(fromDate).format('YYYY-MM-DD')
    const to = dayjs(toDate).format('YYYY-MM-DD')
    if (!dayjs(from).isValid() || !dayjs(to).isValid()) return

    setLoading(true)
    try {
      const response = await getPatientTrackerSummaryAutomated(accessToken, {
        fromDate: from,
        toDate: to,
        branch: branch && branch !== 'ALL' ? branch : undefined,
      })
      const data =
        response?.status === 200 && Array.isArray(response.data)
          ? response.data
          : []
      setRows(data)
    } catch (err) {
      console.error('Error loading data analytics', err)
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [isActive, accessToken, fromDate, toDate, branch])

  useEffect(() => {
    load()
  }, [load])

  const filteredRows = useMemo(() => {
    return rows.filter((patient) => {
      if (referral) {
        const source = labelOr(
          patient.referralSource?.referralSource || patient.referralSource,
          '',
        )
        if (source !== referral) return false
      }
      if (treatment) {
        const type = labelOr(patient.treatmentType, '')
        if (type !== treatment && !type.includes(treatment)) return false
      }
      return true
    })
  }, [rows, referral, treatment])

  const analytics = useMemo(() => {
    const total = filteredRows.length
    const uptPositive = filteredRows.filter(
      (r) => String(r.uptResult || '').toLowerCase() === 'positive',
    ).length
    const uptNegative = filteredRows.filter(
      (r) => String(r.uptResult || '').toLowerCase() === 'negative',
    ).length
    const uptKnown = uptPositive + uptNegative
    const paid = filteredRows.reduce((s, r) => s + toNumber(r.paidAmount), 0)
    const pending = filteredRows.reduce(
      (s, r) => s + toNumber(r.pendingAmount),
      0,
    )
    const packageAmt = filteredRows.reduce(
      (s, r) => s + toNumber(r.marketingPackage),
      0,
    )
    const embryos = filteredRows.reduce(
      (s, r) => s + toNumber(r.numberOfEmbryos),
      0,
    )
    const embryosUsed = filteredRows.reduce(
      (s, r) => s + toNumber(r.numberOfEmbryosUsed),
      0,
    )
    const embryosRemaining = filteredRows.reduce(
      (s, r) => s + toNumber(r.embryosRemaining),
      0,
    )
    const embryosDiscarded = filteredRows.reduce(
      (s, r) => s + toNumber(r.numberOfEmbryosDiscarded),
      0,
    )
    const reachedOpu = filteredRows.filter((r) => !blank(r.opu)).length
    const reachedFet = filteredRows.filter((r) => !blank(r.fet)).length

    const branchData = countBy(filteredRows, (r) => labelOr(r.branch))
    const referralData = countBy(filteredRows, (r) =>
      labelOr(r.referralSource?.referralSource || r.referralSource),
    )
    const treatmentData = countBy(filteredRows, (r) => labelOr(r.treatmentType))
    const cycleData = countBy(filteredRows, (r) =>
      labelOr(r.cycleStatus || r.visitType),
    )
    const stageData = FUNNEL_STAGES.map((stage) => ({
      name: stage,
      value: filteredRows.filter((r) => labelOr(r.stageOfCycle) === stage)
        .length,
    })).filter((row) => row.value > 0)

    const stageIndex = (stage) => {
      const i = FUNNEL_STAGES.indexOf(stage)
      return i < 0 ? 0 : i
    }
    const funnelData = FUNNEL_STAGES.map((stage, index) => ({
      name: stage,
      value: filteredRows.filter(
        (r) => stageIndex(labelOr(r.stageOfCycle, 'Registered')) >= index,
      ).length,
    })).filter(
      (row, index, all) =>
        index === 0 || row.value > 0 || all[index - 1]?.value > 0,
    )

    const uptData = countBy(filteredRows, (r) => {
      const v = String(r.uptResult || '').trim()
      if (!v || v === '-') return 'Not recorded'
      return v
    })

    const trendMap = {}
    filteredRows.forEach((patient) => {
      const d = dayjs(
        patient.registeredDate || patient.createdAt || patient.registrationDate,
      )
      if (!d.isValid()) return
      const bucket =
        trendGrain === 'month'
          ? d.startOf('month')
          : trendGrain === 'day'
            ? d.startOf('day')
            : d.startOf('week')
      const key = bucket.format(trendGrain === 'month' ? 'MMM YYYY' : 'DD MMM')
      if (!trendMap[key])
        trendMap[key] = { name: key, value: 0, sort: bucket.valueOf() }
      trendMap[key].value += 1
    })
    const trendData = Object.values(trendMap).sort((a, b) => a.sort - b.sort)

    const financialByBranch = sumBy(
      filteredRows,
      (r) => labelOr(r.branch),
      (r) => toNumber(r.paidAmount),
    ).map((row) => ({ ...row, display: inr(row.value) }))

    const pendingByBranch = sumBy(
      filteredRows,
      (r) => labelOr(r.branch),
      (r) => toNumber(r.pendingAmount),
    ).map((row) => ({ ...row, display: inr(row.value) }))

    const embryosByBranch = sumBy(
      filteredRows,
      (r) => labelOr(r.branch),
      (r) => toNumber(r.embryosRemaining),
    )

    const branchCompare = branchData.map((b) => {
      const subset = filteredRows.filter((r) => labelOr(r.branch) === b.name)
      const pos = subset.filter(
        (r) => String(r.uptResult || '').toLowerCase() === 'positive',
      ).length
      const neg = subset.filter(
        (r) => String(r.uptResult || '').toLowerCase() === 'negative',
      ).length
      const paidAmt = subset.reduce((s, r) => s + toNumber(r.paidAmount), 0)
      const pkg = subset.reduce((s, r) => s + toNumber(r.marketingPackage), 0)
      return {
        name: b.name,
        patients: subset.length,
        uptRate:
          pos + neg > 0 ? `${((pos / (pos + neg)) * 100).toFixed(1)}%` : '-',
        collection: pkg > 0 ? `${((paidAmt / pkg) * 100).toFixed(1)}%` : '-',
        pending: inr(subset.reduce((s, r) => s + toNumber(r.pendingAmount), 0)),
      }
    })

    return {
      total,
      uptPositive,
      uptNegative,
      uptKnown,
      paid,
      pending,
      packageAmt,
      embryos,
      embryosUsed,
      embryosRemaining,
      embryosDiscarded,
      reachedOpu,
      reachedFet,
      branchData,
      referralData,
      treatmentData,
      cycleData,
      stageData,
      funnelData,
      uptData,
      trendData,
      financialByBranch,
      pendingByBranch,
      embryosByBranch,
      branchCompare,
    }
  }, [filteredRows, trendGrain])

  const dateLabel = `${dayjs(fromDate).format('DD MMM YYYY')} – ${dayjs(toDate).format('DD MMM YYYY')}`

  return (
    <CardContent sx={{ p: 1.5 }}>
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          gap: 1.5,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="From Date"
            value={fromDate}
            onChange={setFromDate}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
          <DatePicker
            label="To Date"
            value={toDate}
            onChange={setToDate}
            format="DD/MM/YYYY"
            slotProps={{ textField: { size: 'small', sx: { width: 160 } } }}
          />
        </LocalizationProvider>
        <FormControl sx={{ width: 140 }} size="small">
          <InputLabel>Branch</InputLabel>
          <Select
            value={branch}
            label="Branch"
            onChange={(e) => setBranch(e.target.value)}
          >
            {branchOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ width: 180 }} size="small">
          <InputLabel>Referral</InputLabel>
          <Select
            value={referral}
            label="Referral"
            onChange={(e) => setReferral(e.target.value)}
          >
            {referralOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 180 }} size="small">
          <InputLabel>Treatment</InputLabel>
          <Select
            value={treatment}
            label="Treatment"
            onChange={(e) => setTreatment(e.target.value)}
          >
            {treatmentOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <ToggleButtonGroup
          exclusive
          size="small"
          value={mode}
          onChange={(_, next) => next && setMode(next)}
        >
          {ANALYSIS_MODES.map((item) => (
            <ToggleButton
              key={item.id}
              value={item.id}
              sx={{ textTransform: 'none', px: 1.5 }}
            >
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
        {mode === 'overview' ? (
          <ToggleButtonGroup
            exclusive
            size="small"
            value={trendGrain}
            onChange={(_, next) => next && setTrendGrain(next)}
          >
            <ToggleButton value="day" sx={{ textTransform: 'none' }}>
              Day
            </ToggleButton>
            <ToggleButton value="week" sx={{ textTransform: 'none' }}>
              Week
            </ToggleButton>
            <ToggleButton value="month" sx={{ textTransform: 'none' }}>
              Month
            </ToggleButton>
          </ToggleButtonGroup>
        ) : null}
      </Box>

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: 360,
          }}
        >
          <CircularProgress />
        </Box>
      ) : analytics.total === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 320,
            bgcolor: '#f5f5f5',
            borderRadius: 1,
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
            No data for the selected filters
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Change date, branch, referral, or treatment and try again.
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            <Grid item xs={6} md={2}>
              <KpiCard
                label="Patients"
                value={analytics.total}
                hint={dateLabel}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <KpiCard
                label="UPT positive rate"
                value={pct(analytics.uptPositive, analytics.uptKnown)}
                hint={`${analytics.uptPositive} / ${analytics.uptKnown || 0} known`}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <KpiCard
                label="Reached OPU"
                value={analytics.reachedOpu}
                hint={pct(analytics.reachedOpu, analytics.total)}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <KpiCard
                label="Collection"
                value={pct(analytics.paid, analytics.packageAmt)}
                hint={`${inr(analytics.paid)} paid`}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <KpiCard
                label="Pending"
                value={inr(analytics.pending)}
                hint={`${inr(analytics.packageAmt)} package`}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <KpiCard
                label="Embryos remaining"
                value={analytics.embryosRemaining}
                hint={`${analytics.embryos} total / ${analytics.embryosUsed} used`}
              />
            </Grid>
          </Grid>

          {mode === 'overview' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Patients by branch" subtitle={dateLabel}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.branchData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Patients" fill="#06aee9" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartCard
                  title="Registration trend"
                  subtitle={`Grouped by ${trendGrain}`}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={analytics.trendData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Line
                        type="monotone"
                        dataKey="value"
                        name="Patients"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Branch comparison
                    </Typography>
                    <Box
                      component="table"
                      sx={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '0.8125rem',
                        '& th, & td': {
                          borderBottom: '1px solid #eee',
                          py: 0.75,
                          px: 1,
                          textAlign: 'left',
                        },
                        '& th': { color: 'text.secondary', fontWeight: 600 },
                      }}
                    >
                      <thead>
                        <tr>
                          <th>Branch</th>
                          <th>Patients</th>
                          <th>UPT + rate</th>
                          <th>Collection</th>
                          <th>Pending</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analytics.branchCompare.map((row) => (
                          <tr key={row.name}>
                            <td>{row.name}</td>
                            <td>{row.patients}</td>
                            <td>{row.uptRate}</td>
                            <td>{row.collection}</td>
                            <td>{row.pending}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {mode === 'funnel' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <ChartCard
                  title="Journey funnel"
                  subtitle="Patients who reached each stage or beyond"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis type="category" dataKey="name" width={130} />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Reached" fill="#6366f1" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Current stage mix
                    </Typography>
                    <BreakdownTable rows={analytics.stageData} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {mode === 'clinical' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Treatment type">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.treatmentData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                      >
                        {analytics.treatmentData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartCard title="UPT result">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.uptData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Patients" fill="#ec4899" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Cycle status
                    </Typography>
                    <BreakdownTable rows={analytics.cycleData} />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Clinical milestones
                    </Typography>
                    <BreakdownTable
                      rows={[
                        { name: 'Reached OPU', value: analytics.reachedOpu },
                        { name: 'Reached FET', value: analytics.reachedFet },
                        { name: 'UPT positive', value: analytics.uptPositive },
                        { name: 'UPT negative', value: analytics.uptNegative },
                      ]}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {mode === 'financial' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Amount collected by branch">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.financialByBranch}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => inr(value)} />
                      <Bar dataKey="value" name="Paid" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <ChartCard title="Pending by branch">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.pendingByBranch}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => inr(value)} />
                      <Bar dataKey="value" name="Pending" fill="#f59e0b" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Collection by branch
                    </Typography>
                    <BreakdownTable
                      rows={analytics.financialByBranch}
                      valueLabel="Paid"
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {mode === 'embryology' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <ChartCard title="Embryos remaining by branch">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics.embryosByBranch}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <RechartsTooltip />
                      <Bar dataKey="value" name="Remaining" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Embryo inventory
                    </Typography>
                    <BreakdownTable
                      rows={[
                        { name: 'Total embryos', value: analytics.embryos },
                        { name: 'Used', value: analytics.embryosUsed },
                        {
                          name: 'Remaining',
                          value: analytics.embryosRemaining,
                        },
                        {
                          name: 'Discarded',
                          value: analytics.embryosDiscarded,
                        },
                      ]}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}

          {mode === 'sources' && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={7}>
                <ChartCard title="Referral source mix">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.referralData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={110}
                      >
                        {analytics.referralData.map((entry, index) => (
                          <Cell
                            key={entry.name}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>
              </Grid>
              <Grid item xs={12} md={5}>
                <Card variant="outlined" sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography
                      variant="subtitle1"
                      fontWeight={700}
                      sx={{ mb: 1 }}
                    >
                      Referral breakdown
                    </Typography>
                    <BreakdownTable rows={analytics.referralData} />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </>
      )}
    </CardContent>
  )
}
