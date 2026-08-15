import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ToastContainer, toast, Bounce } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import { getUsersList } from '@/constants/apis'
import { getModules } from '@/constants/apis'
import { getRoleDetails } from '@/constants/apis'
import { getUserDetails } from '@/constants/apis'
import { validateUser } from '@/constants/apis'
import { getRoles } from '@/constants/apis'
import { deleteUser } from '@/constants/apis'
import { useSelector } from 'react-redux'
import IconButton from '@mui/material/IconButton'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import { Button } from '@mui/material'
import TabList from '@mui/lab/TabList'
import TabPanel from '@mui/lab/TabPanel'
import { TabContext } from '@mui/lab'
import { Tab } from '@mui/material'
import Checkbox from '@mui/material/Checkbox'
import Skeleton from '@mui/material/Skeleton'

const toastconfig = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: 'light',
  transition: Bounce,
}

const Manageusers = () => {
  const userDetails = useSelector((store) => store.user)
  const [isvalidusers, setIsValidUsers] = useState('0')
  const [open, setOpen] = useState(null)
  const [selectRoleid, setSelectRole] = useState()

  const usersList = useQuery({
    queryKey: ['usersList', userDetails?.accessToken, isvalidusers],
    queryFn: () => getUsersList(userDetails?.accessToken, isvalidusers),

    enabled: !!userDetails?.accessToken, // Query runs only if userId is truthy
  })
  const QueryClient = useQueryClient()

  const validateMutate = useMutation({
    mutationFn: async ({ row, Permissions }) => {
      const res = await validateUser(row, Permissions)
      console.log('under mutation fn', res)
      // setIsValidUsers(1)
    },
    onSuccess: () => {
      QueryClient.invalidateQueries({
        queryKey: ['usersList'],
      })
    },
  })

  const deleteUserMutate = useMutation({
    mutationFn: async (userId) => {
      const res = await deleteUser(userDetails?.accessToken, userId)
      if (res.status !== 200) {
        throw new Error(res.message || 'Failed to delete user')
      }
      return res
    },
    onSuccess: (data) => {
      QueryClient.invalidateQueries({
        queryKey: ['usersList'],
      })
      toast.success(data?.data || 'User deleted successfully', toastconfig)
    },
    onError: (error) => {
      toast.error(error?.message || 'Failed to delete user', toastconfig)
      console.error('Delete user error:', error)
    },
  })
  const roles = useQuery({
    queryKey: ['roles'],
    queryFn: () => getRoles(),

    enabled: true,
  })

  // console.log(data?.data, isError, isSuccess)
  const handleChangeTab = (event, newValue) => {
    setIsValidUsers(newValue)
  }
  const UserDetails = useQuery({
    queryKey: ['userDetails', open],
    queryFn: () => getUserDetails(open),
    enabled: !!open,
  })

  // Check if current user has delete access
  const userEmail = userDetails?.email || userDetails?.userDetails?.email || ''
  const hasDeleteAccess = userEmail.toLowerCase() === 'nikhilsuvva77@gmail.com'
  const showDeleteColumn = isvalidusers === '1' && hasDeleteAccess

  return (
    <div>
      {/* <span className={`p-3 hover:cursor-pointer ${!isvalidusers ? 'bg-[#1D3C6E] rounded-md text-white' : ''}`} onClick={() => setIsValidUsers(0)}>Non Verified users</span>
            <span className={`p-3 hover:cursor-pointer ${isvalidusers ? 'bg-[#1D3C6E] text-white rounded-md' : ''}`} onClick={() => setIsValidUsers(1)}>Verified users</span> */}
      <TabContext value={isvalidusers}>
        <div className="p-3 flex">
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <TabList
              onChange={handleChangeTab}
              aria-label="lab API tabs example"
            >
              <Tab label="Invalid Users" value="0" />
              <Tab label="Valid Users" value="1" />
            </TabList>
          </Box>
        </div>
        <div className="p-5">
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 700 }} aria-label="customized table">
              <TableHead>
                <TableRow>
                  <StyledTableCell></StyledTableCell>
                  <StyledTableCell>ID</StyledTableCell>
                  <StyledTableCell align="left">Full Name</StyledTableCell>
                  <StyledTableCell align="left">Email</StyledTableCell>
                  <StyledTableCell align="left">User Name</StyledTableCell>
                  <StyledTableCell align="left">Role</StyledTableCell>
                  <StyledTableCell align="left">Branch</StyledTableCell>
                  {showDeleteColumn && (
                    <StyledTableCell align="left">Action</StyledTableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody className="  ">
                {usersList?.isLoading &&
                  ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']?.map(
                    (each, index) => (
                      <TableRow key={index} className="" colSpan={7}>
                        {['a', 'b', 'c', 'd', 'e', 'f', 'g']?.map((e, i) => (
                          <StyledTableCell key={i}>
                            <Skeleton />
                          </StyledTableCell>
                        ))}
                      </TableRow>
                    ),
                  )}
                {usersList?.data?.status == 200 &&
                  usersList?.data?.data?.map((row, index) => (
                    <CustomRow
                      row={row}
                      key={index}
                      isvalidusers={isvalidusers}
                      setIsValidUsers={setIsValidUsers}
                      roles={roles}
                      validateMutate={validateMutate}
                      open={open}
                      setOpen={setOpen}
                      UserDetails={UserDetails}
                      selectRoleid={selectRoleid}
                      setSelectRole={setSelectRole}
                      deleteUserMutate={deleteUserMutate}
                      userDetails={userDetails}
                      showDeleteColumn={showDeleteColumn}
                    />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </div>
        {/* <div>

                    <ToastContainer />
                </div> */}
      </TabContext>
    </div>
  )
}

function CustomRow({
  row,
  isvalidusers,
  setIsValidUsers,
  roles,
  validateMutate,
  open,
  setOpen,
  UserDetails,
  selectRoleid,
  setSelectRole,
  deleteUserMutate,
  userDetails,
  showDeleteColumn,
}) {
  // console.log(row)

  const [Permissions, setPermissions] = React.useState([])
  // console.log(row)

  const roleDetails = useQuery({
    queryKey: ['RoleDetails', selectRoleid],
    queryFn: () => getRoleDetails(selectRoleid),
    enabled: !!selectRoleid,
  })

  return (
    <>
      <StyledTableRow key={row.id} className="bg-white">
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            // name={row.id}
            onClick={(e) => {
              if (row.id == open) {
                setOpen(null)
                setPermissions([])
              } else {
                setOpen(row.id)
                setSelectRole(Number(row?.roleDetails?.id))
              } // console.log(e.target.name)
            }}
          >
            {open == row.id ? (
              <KeyboardArrowUpIcon />
            ) : (
              <KeyboardArrowDownIcon />
            )}
          </IconButton>
        </TableCell>
        <StyledTableCell component="th" scope="row">
          {row.id}
        </StyledTableCell>
        <StyledTableCell align="left">{row.fullName}</StyledTableCell>
        <StyledTableCell align="left">{row.email}</StyledTableCell>
        <StyledTableCell align="left">{row.userName}</StyledTableCell>
        <StyledTableCell align="left">{row.roleDetails?.name}</StyledTableCell>
        <StyledTableCell align="left">
          {row.branchDetails?.map((each, index) => (
            <span className="flex gap-2" key={index}>
              {each?.name}
            </span>
          ))}
        </StyledTableCell>
        {showDeleteColumn && (
          <StyledTableCell align="left">
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to delete user "${row.fullName}" (${row.email})?`,
                  )
                ) {
                  deleteUserMutate.mutate(row.id)
                }
              }}
              disabled={deleteUserMutate?.isPending}
              sx={{ minWidth: '80px' }}
            >
              {deleteUserMutate?.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </StyledTableCell>
        )}
      </StyledTableRow>
      {
        // isvalidusers ?
        <TableRow>
          <TableCell
            style={{ paddingBottom: 0, paddingTop: 0 }}
            colSpan={showDeleteColumn ? 8 : 7}
          >
            <Collapse in={open == row.id} timeout="auto">
              <Box sx={{ margin: 1 }}>
                <TabPanel value="0">
                  {' '}
                  <InvalidSubRow
                    row={row}
                    roles={roles}
                    setIsValidUsers={setIsValidUsers}
                    validateMutate={validateMutate}
                    Permissions={Permissions}
                    setPermissions={setPermissions}
                    open={open}
                    roleDetails={roleDetails}
                    selectRoleid={selectRoleid}
                    setSelectRole={setSelectRole}
                  />
                </TabPanel>
                <TabPanel value="1">
                  <ValidSubRow row={row} UserDetails={UserDetails} />
                </TabPanel>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      }
    </>
  )
}

import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// import * as React from 'react';
import { styled } from '@mui/material/styles'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell, { tableCellClasses } from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import Collapse from '@mui/material/Collapse'

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: '#b0e9fa',
    // backgroundColor: '#06aee9',

    color: '#06aee9',
    fontSize: 16,
    fontWeight: 'bold',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
  },
}))

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}))

const InvalidSubRow = ({
  row,
  roles,
  setIsValidUsers,
  validateMutate,
  Permissions,
  setPermissions,
  open,
  roleDetails,
  selectRoleid,
  setSelectRole,
}) => {
  const modulesList = [
    {
      id: 1,
      name: 'Doctors',
    },
    {
      id: 2,
      name: 'Patients',
    },
    {
      id: 3,
      name: 'Pharmacy',
    },
    {
      id: 4,
      name: 'Lab Assistant',
    },
    {
      id: 5,
      name: 'Reports',
    },
    {
      id: 6,
      name: 'Manage Users',
    },
    {
      id: 7,
      name: 'Manage Modules',
    },
    {
      id: 8,
      name: 'Manage Roles',
    },
    {
      id: 9,
      name: 'Manage Permissions',
    },
  ]

  const permissionsSetter = () => {
    let modList = roleDetails?.data?.data?.moduleList || []
    console.log('modList', modList)
    let perm = modList?.map((mod) =>
      modList[modList?.findIndex((obj) => obj.id == mod.id)]?.accessType
        ? {
            id: mod.id,
            name: mod.name,
            accessType:
              modList[modList?.findIndex((obj) => obj.id == mod.id)]
                ?.accessType,
          }
        : {
            id: mod.id,
            name: mod.name,
            accessType: 'N',
          },
    )
    return perm
  }
  useEffect(() => {
    // console.log(roleDetails?.data)
    // if (open)
    setPermissions(permissionsSetter())
    // console.log('initial permisions ', perm)
  }, [roleDetails?.data?.data?.moduleList, open])

  const handlePermissionsChange = (e, index) => {
    let obj = Permissions[index]

    obj['accessType'] = e.target.value
    console.log('permissions change', obj)
    console.log(Permissions)
    setPermissions([
      ...Permissions.slice(0, index),
      obj,
      ...Permissions.slice(index + 1),
    ])
  }

  const handleValidate = async (row) => {
    const mut = await validateMutate.mutate({ row, Permissions })
    toast.success('Successfully validated', toastconfig)
    console.log('returned from muteed', mut)
  }
  return (
    <>
      <TableHead>
        <TableRow>
          <TableCell align="center">
            <select
              name="roles"
              value={selectRoleid}
              onChange={(e) => setSelectRole(+e.target.value)}
            >
              {roles.data?.status == 200 &&
                roles.data?.data?.map((eachRole) => (
                  <option value={eachRole.id} key={eachRole.id}>
                    {eachRole.name}
                  </option>
                ))}
            </select>
          </TableCell>
        </TableRow>
      </TableHead>

      <TableCell colSpan={3} align="left" className="font-bold">
        Module
      </TableCell>
      <TableCell align="left" className="font-semibold">
        Hidden
      </TableCell>
      <TableCell align="left" className="font-semibold">
        View
      </TableCell>
      <TableCell align="left" className="font-semibold">
        Modify
      </TableCell>

      <TableBody>
        {roleDetails?.isLoading ? (
          <>
            <TableRow>
              <TableCell align="left" colSpan={2}>
                <Skeleton />
              </TableCell>
              <TableCell align="center" colSpan={2}>
                <Skeleton />
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <Skeleton />
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <Skeleton />
              </TableCell>
            </TableRow>
          </>
        ) : (
          roleDetails?.data?.data?.moduleList?.map((eachModule, index) => (
            <TableRow key={index}>
              <TableCell align="left" className="font-medium" colSpan={2}>
                {eachModule.name}
              </TableCell>
              <TableCell align="center" colSpan={2}>
                <Checkbox
                  value="N"
                  // value={Permissions[index]?.accessType}
                  checked={
                    Permissions[
                      Permissions?.findIndex((obj) => obj.id == eachModule.id)
                    ]?.accessType == 'N'
                  }
                  onChange={(e) => handlePermissionsChange(e, index)}
                  // defaultChecked={(e) => checkAccess(e, eachModule.id)}
                  name={`${eachModule?.name}`}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <Checkbox
                  value="R"
                  // value={Permissions[Permissions?.findIndex(obj => obj.id == eachModule.id)]?.accessType}
                  checked={
                    Permissions[
                      Permissions?.findIndex((obj) => obj.id == eachModule.id)
                    ]?.accessType == 'R'
                  }
                  name={`${eachModule?.name}`}
                  onChange={(e) => handlePermissionsChange(e, index)}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <Checkbox
                  value="W"
                  // value={Permissions[Permissions?.findIndex(obj => obj.id == eachModule.id)]?.accessType}
                  checked={
                    Permissions[
                      Permissions?.findIndex((obj) => obj.id == eachModule.id)
                    ]?.accessType == 'W'
                  }
                  name={`${eachModule?.name}`}
                  onChange={(e) => handlePermissionsChange(e, index)}
                  inputProps={{ 'aria-label': 'controlled' }}
                />
              </TableCell>
            </TableRow>
          ))
        )}
        <TableRow>
          <TableCell align="left"></TableCell>
          <TableCell align="left"></TableCell>
          <TableCell align="left"></TableCell>
          {!roleDetails?.isLoading && (
            <TableCell colSpan={3} align="right">
              <Button
                onClick={() => handleValidate(row)}
                variant="contained"
                disabled={validateMutate?.isPending}
                sx={{ color: 'white' }}
              >
                {validateMutate?.isPending ? 'Validating' : ' Validate'}
              </Button>
            </TableCell>
          )}
        </TableRow>
      </TableBody>
    </>
  )
}
import CheckRoundedIcon from '@mui/icons-material/CheckRounded'
import { withPermission } from '@/components/withPermission'
import { ACCESS_TYPES } from '@/constants/constants'
const ValidSubRow = ({ row, UserDetails }) => {
  // useEffect(() => {
  //     console.log(UserDetails?.data)
  // }, [UserDetails?.data])
  // console.log(UserDetails?.data, UserDetails.isLoading, UserDetails.error)
  return (
    <>
      <TableHead>
        <TableRow>
          <TableCell className="font-bold">Module</TableCell>
          <TableCell align="left" className="font-semibold">
            Hidden
          </TableCell>
          <TableCell align="left" className="font-semibold">
            View
          </TableCell>
          <TableCell align="left" className="font-semibold">
            Modify
          </TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {UserDetails?.isLoading ? (
          <>
            <TableRow>
              <TableCell align="left" colSpan={2}>
                <Skeleton />
              </TableCell>
              <TableCell align="center" colSpan={2}>
                <Skeleton />
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <Skeleton />
              </TableCell>
              <TableCell align="center" colSpan={1}>
                <Skeleton />
              </TableCell>
            </TableRow>
          </>
        ) : (
          UserDetails?.data?.data[0]?.moduleList?.map((eachModule, index) => (
            <TableRow key={eachModule.name + index}>
              <TableCell className="font-medium	">{eachModule.name}</TableCell>
              <TableCell align="left">
                {eachModule.accessType == 'N' ? (
                  <CheckRoundedIcon color="primary" />
                ) : (
                  ''
                )}
              </TableCell>
              <TableCell align="left">
                {eachModule.accessType == 'R' ? (
                  <CheckRoundedIcon color="primary" />
                ) : (
                  ''
                )}
              </TableCell>
              <TableCell align="left">
                {eachModule.accessType == 'W' ? (
                  <CheckRoundedIcon color="primary" />
                ) : (
                  ''
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </>
  )
}
export default withPermission(Manageusers, true, 'manageUsers', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
