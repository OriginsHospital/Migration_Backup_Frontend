import * as React from 'react'
import PropTypes from 'prop-types'
import { useTheme } from '@mui/material/styles'
import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableFooter from '@mui/material/TableFooter'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import FirstPageIcon from '@mui/icons-material/FirstPage'
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft'
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'
import LastPageIcon from '@mui/icons-material/LastPage'

import { Edit } from '@mui/icons-material'
import {
  Button,
  InputAdornment,
  TableHead,
  TextField,
  Typography,
} from '@mui/material'
import Modal from './Modal'
import { useDispatch } from 'react-redux'
import { openModal } from '@/redux/modalSlice'

function ManageTaxFields({ taxCategories, createTaxCategoryMutation }) {
  const [page, setPage] = React.useState(0)
  const [rowsPerPage, setRowsPerPage] = React.useState(5)
  const dispatch = useDispatch()
  const [newCategory, setNewCategory] = React.useState({
    categoryName: '',
    taxPercent: 0,
  })
  // Avoid a layout jump when reaching the last page with empty rows.
  const emptyRows =
    page > 0 ? Math.max(0, (1 + page) * rowsPerPage - taxCategories.length) : 0

  const handleChangePage = (event, newPage) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = event => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }
  const handleCreateTaxCategory = () => {
    console.log('MODAL OPENED')

    // const payload = {
    //     categoryName: 'New Tax',
    //     taxPercent: 10
    // }
    if (newCategory?.categoryName != '' && newCategory?.taxPercent != 0) {
      createTaxCategoryMutation.mutate(newCategory)
    }
  }
  const handleFormChange = event => {
    setNewCategory({ ...newCategory, [event.target.name]: event.target.value })
  }
  return (
    <div>
      <div className="flex justify-end">
        <Button
          variant="outlined"
          className="mb-5"
          onClick={() => dispatch(openModal('taxCategory'))}
        >
          Create
        </Button>
      </div>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell className="font-bold">ID</TableCell>
              <TableCell align="left" className="font-bold">
                Category Name
              </TableCell>
              <TableCell align="left" className="font-bold">
                Tax Percent
              </TableCell>
              <TableCell align="left" className="font-bold">
                Created By
              </TableCell>
              <TableCell align="left" className="font-bold">
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(rowsPerPage > 0
              ? taxCategories?.slice(
                  page * rowsPerPage,
                  page * rowsPerPage + rowsPerPage,
                )
              : taxCategories
            )?.map(row => (
              <TableRow
                key={row.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  {row.id}
                </TableCell>
                <TableCell align="left">{row.categoryName}</TableCell>
                <TableCell align="left">{row.taxPercent}</TableCell>
                <TableCell align="left">{row.createdBy}</TableCell>
                <TableCell align="left">
                  <Edit className="cursor-pointer hover:bg-slate-50 hover:rounded-full" />
                </TableCell>
              </TableRow>
            ))}
            {emptyRows > 0 && (
              <TableRow style={{ height: 53 * emptyRows }}>
                <TableCell colSpan={6} />
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 8, 10, 25, { label: 'All', value: -1 }]}
                colSpan={3}
                count={taxCategories?.length}
                rowsPerPage={rowsPerPage}
                page={page}
                slotProps={{
                  select: {
                    inputProps: {
                      'aria-label': 'rows per page',
                    },
                    native: true,
                  },
                }}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                ActionsComponent={TablePaginationActions}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
      <Modal
        // open={true}
        title={'Create new Tax Category'}
        uniqueKey="taxCategory"
        closeOnOutsideClick={true}
        maxWidth={'xs'}
        // handleClose={handleClose}
        // handleSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-5 p-3">
          <TextField
            label="Category Name"
            variant="outlined"
            name="categoryName"
            value={newCategory?.categoryName}
            onChange={handleFormChange}
          />
          <TextField
            label="Tax Percent"
            variant="outlined"
            name="taxPercent"
            value={newCategory?.taxPercent}
            onChange={handleFormChange}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <Typography variant="">%</Typography>
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" onClick={handleCreateTaxCategory}>
            Create
          </Button>
        </div>
      </Modal>
    </div>
  )
}
function TablePaginationActions(props) {
  const theme = useTheme()
  const { count, page, rowsPerPage, onPageChange } = props

  const handleFirstPageButtonClick = event => {
    onPageChange(event, 0)
  }

  const handleBackButtonClick = event => {
    onPageChange(event, page - 1)
  }

  const handleNextButtonClick = event => {
    onPageChange(event, page + 1)
  }

  const handleLastPageButtonClick = event => {
    onPageChange(event, Math.max(0, Math.ceil(count / rowsPerPage) - 1))
  }

  return (
    <Box sx={{ flexShrink: 0, ml: 2.5 }}>
      <IconButton
        onClick={handleFirstPageButtonClick}
        disabled={page === 0}
        aria-label="first page"
      >
        {theme.direction === 'rtl' ? <LastPageIcon /> : <FirstPageIcon />}
      </IconButton>
      <IconButton
        onClick={handleBackButtonClick}
        disabled={page === 0}
        aria-label="previous page"
      >
        {theme.direction === 'rtl' ? (
          <KeyboardArrowRight />
        ) : (
          <KeyboardArrowLeft />
        )}
      </IconButton>
      <IconButton
        onClick={handleNextButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="next page"
      >
        {theme.direction === 'rtl' ? (
          <KeyboardArrowLeft />
        ) : (
          <KeyboardArrowRight />
        )}
      </IconButton>
      <IconButton
        onClick={handleLastPageButtonClick}
        disabled={page >= Math.ceil(count / rowsPerPage) - 1}
        aria-label="last page"
      >
        {theme.direction === 'rtl' ? <FirstPageIcon /> : <LastPageIcon />}
      </IconButton>
    </Box>
  )
}

TablePaginationActions.propTypes = {
  count: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
}

export default ManageTaxFields
