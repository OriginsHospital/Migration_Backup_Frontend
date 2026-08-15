import React, { useEffect, useState } from 'react'
import { TabContext, TabList, TabPanel } from '@mui/lab'
import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Tab,
  TextField,
  Typography,
  Autocomplete,
  IconButton,
} from '@mui/material'
import {
  addSubCategoryByCategoryId,
  createPharmacyMasterData,
  deleteSubCategoryByCategoryId,
  editPharmacyMasterData,
  editSubCategoryByCategoryId,
  getLoggedUserInfo,
  getPharmacyMasterData,
  getSubCategoryListByCategoryId,
} from '@/constants/apis'
import { useDispatch, useSelector } from 'react-redux'
import { setUser } from '@/redux/userSlice'
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query'
import { closeModal, openModal } from '@/redux/modalSlice'
import { ACCESS_TYPES, API_ROUTES } from '@/constants/constants'
import PharmacyMasterTable from '@/components/PharmacyMasterTable'
import PharmacyKitMasterPanel from '@/components/PharmacyKitMasterPanel'
import Modal from '@/components/Modal'
import Accordion from '@mui/material/Accordion'
import AccordionDetails from '@mui/material/AccordionDetails'
import AccordionSummary from '@mui/material/AccordionSummary'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import {
  Add,
  DeleteOutlined,
  EditOutlined,
  DocumentScannerOutlined,
  Close,
} from '@mui/icons-material'
import { withPermission } from '@/components/withPermission'
import { useRouter } from 'next/router'
import dayjs from 'dayjs'
import { DatePicker } from '@mui/x-date-pickers'
import { toast } from 'react-toastify'
import { toastconfig } from '@/utils/toastconfig'
import SearchIcon from '@mui/icons-material/Search'

const VENDOR_DEPARTMENTS = [
  'Pharmacy',
  'Lab',
  'IT',
  'IVF',
  'Facilities',
  'Marketing',
  'Administration',
]

const tabs = {
  taxCategory: {
    label: 'Tax Categories',
    getUrl: API_ROUTES.GET_TAX_CATEGORIES,
    fields: [
      // 'categoryName', "taxPercent", "createdBy"
      {
        headerName: 'Category Name',
        field: 'categoryName',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Tax Percent',
        field: 'taxPercent',
        type: 'number',
        width: 150,
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'select',
        width: 150,
      },
    ],
    createUrl: API_ROUTES.CREATE_TAX_CATEGORIES,
    createFields: [
      {
        label: 'Category Name',
        name: 'categoryName',
        type: 'text',
        required: true,
      },
      {
        label: 'Tax Percent',
        name: 'taxPercent',
        type: 'number',
        required: true,
      },
    ],
    editUrl: API_ROUTES.EDIT_TAX_CATEGORIES,
  },
  inventory: {
    label: 'Inventory',
    getUrl: API_ROUTES.GET_INVENTORY_TYPE,
    fields: [
      // 'name', "createdBy"
      {
        headerName: 'Name',
        field: 'name',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'select',
        width: 150,
      },
    ],
    createUrl: API_ROUTES.CREATE_INVENTORY_TYPE,
    createFields: [
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
    ],
    editUrl: API_ROUTES.EDIT_INVENTORY_TYPE,
  },

  supplier: {
    label: 'Supplier',
    getUrl: API_ROUTES.GET_SUPPLIERS,
    fields: [
      // 'supplier', "gstNumber", "contactPerson", "contactNumber", "emailId", "tinNumber", "panNumber", "dlNumber", "address", "accountDetails", "remarks", "isActive"
      {
        headerName: 'Supplier',
        field: 'supplier',
        type: 'text',
        width: 250,
      },
      {
        headerName: 'GST Number',
        field: 'gstNumber',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Contact Person',
        field: 'contactPerson',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Contact Number',
        field: 'contactNumber',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Email ID',
        field: 'emailId',
        type: 'email',
        width: 150,
      },
      {
        headerName: 'TIN Number',
        field: 'tinNumber',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'PAN Number',
        field: 'panNumber',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'DL Number',
        field: 'dlNumber',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Address',
        field: 'address',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Account Details',
        field: 'accountDetails',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Remarks',
        field: 'remarks',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Active',
        field: 'isActive',
        type: 'boolean',
        width: 150,
        renderCell: ({ row }) => {
          return <>{row.isActive == 1 ? 'Yes' : 'No'}</>
        },
      },
    ],

    createUrl: API_ROUTES.CREATE_SUPPLIERS,
    createFields: [
      {
        label: 'Supplier',
        name: 'supplier',
        type: 'text',
        required: true,
      },
      {
        label: 'GST Number',
        name: 'gstNumber',
        type: 'text',
        required: false,
      },
      {
        label: 'Contact Person',
        name: 'contactPerson',
        type: 'text',
        required: true,
      },
      {
        label: 'Contact Number',
        name: 'contactNumber',
        type: 'text',
        required: true,
      },
      {
        label: 'Email ID',
        name: 'emailId',
        type: 'email',
        required: true,
      },
      {
        label: 'TIN Number',
        name: 'tinNumber',
        type: 'text',
        required: false,
      },
      {
        label: 'PAN Number',
        name: 'panNumber',
        type: 'text',
        required: false,
      },
      {
        label: 'DL Number',
        name: 'dlNumber',
        type: 'text',
        required: false,
      },
      {
        label: 'Address',
        name: 'address',
        type: 'text',
        required: true,
      },
      {
        label: 'Account Details',
        name: 'accountDetails',
        type: 'text',
        required: true,
      },
      {
        label: 'Remarks',
        name: 'remarks',
        type: 'text',
        required: false,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_SUPPLIERS,
  },

  manufacturer: {
    label: 'Manufacturer',
    getUrl: API_ROUTES.GET_MANUFACTURER,
    fields: [
      // "manufacturer", "address", "contactNumber", "emailId", "isActive"
      {
        headerName: 'Manufacturer',
        field: 'manufacturer',
        type: 'text',
        width: 220,
      },
      {
        headerName: 'Address',
        field: 'address',
        type: 'text',
      },
      {
        headerName: 'Contact Number',
        field: 'contactNumber',
        type: 'text',
      },
      {
        headerName: 'Email ID',
        field: 'emailId',
        type: 'email',
      },
      {
        headerName: 'IsActive',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.CREATE_MANUFACTURER,
    createFields: [
      {
        label: 'Manufacturer',
        name: 'manufacturer',
        type: 'text',
        required: true,
      },
      {
        label: 'Address',
        name: 'address',
        type: 'text',
        required: true,
      },
      {
        label: 'Contact Number',
        name: 'contactNumber',
        type: 'text',
        required: true,
      },
      {
        label: 'Email ID',
        name: 'emailId',
        type: 'email',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_MANUFACTURER,
  },
  otpersons: {
    label: 'Clinical Professionals',
    getUrl: API_ROUTES.GET_ALL_PERSONS_LIST,
    fields: [
      // "manufacturer", "address", "contactNumber", "emailId", "isActive"
      // {
      //     headerName: 'ID',
      //     field: 'id',
      //     type: 'text',
      // },
      {
        headerName: 'Person Name',
        field: 'personName',
        type: 'text',
        width: 200,
      },
      // name
      {
        headerName: 'Designation',
        field: 'name',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Phone Number',
        field: 'phoneNumber',
        type: 'number',
        width: 200,
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
        width: 120,
        renderCell: ({ row }) => {
          return <>{row.isActive == 1 ? 'Yes' : 'No'}</>
        },
      },
    ],
    createUrl: API_ROUTES.CREATE_PERSON,
    createFields: [
      {
        label: 'Person Name',
        name: 'personName',
        type: 'text',
        required: true,
      },
      {
        label: 'Designation',
        name: 'designationId',
        type: 'select',
        required: true,
        id: 'designationId',
      },
      {
        label: 'Phone Number',
        name: 'phoneNumber',
        type: 'number',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_PERSON,
  },
  Coupons: {
    label: 'Coupons',
    getUrl: API_ROUTES.GET_COUPONS,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Coupon Code',
        field: 'couponCode',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Discount Percentage',
        field: 'discountPercentage',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
        width: 200,
        renderCell: ({ row }) => {
          return <>{row.isActive == 1 ? 'Yes' : 'No'}</>
        },
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
        width: 200,
      },
    ],
    createUrl: API_ROUTES.CREATE_COUPON,
    createFields: [
      {
        label: 'Coupon Code',
        name: 'couponCode',
        type: 'text',
        required: true,
      },
      {
        label: 'Discount Percentage',
        name: 'discountPercentage',
        type: 'text',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_COUPON,
  },
  AppointmentReasons: {
    label: 'Appointment Reasons',
    getUrl: API_ROUTES.GET_ALL_APPOINTMENT_REASONS,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Reason',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Appointment Charges',
        field: 'appointmentCharges',
        type: 'text',
      },
      {
        headerName: 'Visit Type',
        field: 'visitTypeName',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
      {
        headerName: 'Is Spouse',
        field: 'isSpouse',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_APPOINTMENT_REASON,
    createFields: [
      {
        label: 'Reason',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Appointment Charges',
        name: 'appointmentCharges',
        type: 'number',
        required: true,
      },
      {
        label: 'Visit Type',
        name: 'visit_type',
        type: 'select',
        required: true,
        id: 'visit_type',
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
      {
        label: 'Is Spouse',
        name: 'isSpouse',
        type: 'trueOrFalse',
        required: true,
        id: 'isSpouse',
      },
    ],
    editUrl: API_ROUTES.EDIT_APPOINTMENT_REASON,
    deleteUrl: API_ROUTES.DELETE_APPOINTMENT_REASON,
  },
  labTestGroups: {
    label: 'Lab Test Groups',
    getUrl: API_ROUTES.GET_ALL_LAB_TEST_GROUPS,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
      },
      {
        headerName: 'Updated By',
        field: 'updatedBy',
        type: 'text',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_LAB_TEST_GROUP,
    createFields: [
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_LAB_TEST_GROUP,
  },
  labTestSampleTypes: {
    label: 'Lab Test Sample Types',
    getUrl: API_ROUTES.GET_ALL_LAB_TEST_SAMPLE_TYPES,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
      },
      {
        headerName: 'Updated By',
        field: 'updatedBy',
        type: 'text',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_LAB_TEST_SAMPLE_TYPE,
    createFields: [
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_LAB_TEST_SAMPLE_TYPE,
  },
  labTests: {
    label: 'Lab Tests',
    getUrl: API_ROUTES.GET_ALL_LAB_TESTS_LIST,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Branch',
        field: 'branchName',
        type: 'select',
      },
      {
        headerName: 'Test Name',
        field: 'name',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Is Out Sourced',
        field: 'isOutSourced',
        type: 'boolean',
        width: 100,
      },
      {
        headerName: 'Amount',
        field: 'amount',
        type: 'number',
        width: 120,
      },
      {
        headerName: 'Lab Test Group',
        field: 'labTestGroupName',
        type: 'text',
        width: 180,
      },
      {
        headerName: 'Sample Type',
        field: 'labTestSampleTypeName',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
        width: 100,
        renderCell: ({ row }) => {
          return <>{row.isActive === 1 ? 'Yes' : 'No'}</>
        },
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'select',
        width: 150,
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_LAB_TEST,
    createFields: [
      {
        label: 'Test Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Lab Test ID',
        name: 'labTestId',
        required: true,
      },
      {
        label: 'Branch',
        name: 'branchId',
        type: 'select',
        required: true,
        id: 'branchId',
        optionsUrl: API_ROUTES.GET_BRANCHES,
        selectedLabel: 'name',
      },
      {
        label: 'Is Out Sourced',
        name: 'isOutSourced',
        type: 'trueOrFalse',
        required: true,
        id: 'isOutSourced',
      },
      {
        label: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
      },
      {
        label: 'Lab Test Group',
        name: 'labTestGroupId',
        type: 'select',
        required: true,
        id: 'labTestGroupId',
      },
      {
        label: 'Sample Type',
        name: 'sampleTypeId',
        type: 'select',
        required: true,
        id: 'sampleTypeId',
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_LAB_TEST,
  },
  scans: {
    label: 'Scans',
    getUrl: API_ROUTES.GET_ALL_SCANS_LIST,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Branch',
        field: 'branchName',
        type: 'text',
      },
      {
        headerName: 'Scan Name',
        field: 'name',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Is Form-F Required',
        field: 'isFormFRequired',
        type: 'boolean',
        width: 100,
      },
      {
        headerName: 'Amount',
        field: 'amount',
        type: 'number',
        width: 120,
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
        width: 100,
        renderCell: ({ row }) => {
          return <>{row.isActive === 1 ? 'Yes' : 'No'}</>
        },
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
        width: 150,
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_SCAN,
    createFields: [
      {
        label: 'Scan Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Scan ID',
        name: 'scanId',
        required: true,
      },
      {
        label: 'Branch',
        name: 'branchId',
        type: 'select',
        required: true,
        id: 'branchId',
        optionsUrl: API_ROUTES.GET_BRANCHES,
        selectedLabel: 'name',
      },
      {
        label: 'Is Form-F Required',
        name: 'isFormFRequired',
        type: 'trueOrFalse',
        required: true,
        id: 'isFormFRequired',
      },
      {
        label: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_SCAN,
  },
  embryology: {
    label: 'Embryology',
    getUrl: API_ROUTES.GET_ALL_EMBRYOLOGY_LIST,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Branch',
        field: 'branchName',
        type: 'text',
      },
      {
        headerName: 'Embryology Name',
        field: 'name',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Amount',
        field: 'amount',
        type: 'number',
        width: 120,
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
        width: 100,
        renderCell: ({ row }) => {
          return <>{row.isActive === 1 ? 'Yes' : 'No'}</>
        },
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
        width: 150,
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_EMBRYOLOGY,
    createFields: [
      {
        label: 'Embryology Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Embryology ID',
        name: 'embryologyId',
        required: true,
      },
      {
        label: 'Branch',
        name: 'branchId',
        type: 'select',
        required: true,
        id: 'branchId',
        optionsUrl: API_ROUTES.GET_BRANCHES,
        selectedLabel: 'name',
      },
      {
        label: 'Amount',
        name: 'amount',
        type: 'number',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_EMBRYOLOGY,
  },
  pharmacyItems: {
    label: 'Pharmacy Items',
    getUrl: API_ROUTES.GET_ALL_PHARMACY_ITEMS,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Name',
        field: 'itemName',
        type: 'text',
        width: 200,
      },
      {
        headerName: 'Inventory Type',
        field: 'inventoryType',
        type: 'text',
        width: 150,
        renderCell: ({ row }) => {
          return <>{row.inventoryType.name}</>
        },
      },
      {
        headerName: 'Manufacturer Name',
        field: 'manufacturerName',
        type: 'text',
        width: 150,
        renderCell: ({ row }) => {
          return <>{row.manufacturer.manufacturer}</>
        },
      },
      {
        headerName: 'HSN Code',
        field: 'hsnCode',
        type: 'text',
        width: 150,
      },
      {
        headerName: 'Tax Category',
        field: 'taxCategory',
        type: 'text',
        width: 150,
        renderCell: ({ row }) => {
          return <>{row.taxCategory.categoryName}</>
        },
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
      {
        headerName: 'Department',
        field: 'departmentName',
        type: 'text',
        width: 150,
        renderCell: ({ row }) => {
          return <>{row.departmentName}</>
        },
      },
      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
        width: 150,
        renderCell: ({ row }) => {
          return <>{row.createdBy.fullName}</>
        },
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_PHARMACY_ITEM,
    createFields: [
      {
        label: 'Name',
        name: 'itemName',
        type: 'text',
        required: true,
      },
      {
        label: 'Inventory Type',
        name: 'inventoryType',
        type: 'select',
        required: true,
        id: 'inventoryType',
        optionsUrl: API_ROUTES.GET_INVENTORY_TYPE,
        selectedLabel: 'name',
      },
      {
        label: 'Manufacturer Name',
        name: 'manufacturer',
        type: 'select',
        required: true,
        id: 'manufacturer',
        optionsUrl: API_ROUTES.GET_MANUFACTURER,
        selectedLabel: 'manufacturer',
      },
      {
        label: 'HSN Code',
        name: 'hsnCode',
        type: 'text',
        required: true,
        id: 'hsnCode',
      },
      {
        label: 'Tax Category',
        name: 'taxCategory',
        type: 'select',
        required: true,
        id: 'taxCategory',
        optionsUrl: API_ROUTES.GET_TAX_CATEGORIES,
        selectedLabel: 'categoryName',
      },
      {
        label: 'Department',
        name: 'departmentId',
        type: 'select',
        required: true,
        optionsUrl: API_ROUTES.GET_DEPARTMENTS_LIST,
        id: 'departmentId',
        selectedLabel: 'name',
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        required: true,
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_PHARMACY_ITEM,
  },
  pharmacyKit: {
    label: 'Pharmacy Kit',
    useCustomPanel: true,
  },
  departments: {
    label: 'Departments',
    getUrl: API_ROUTES.GET_DEPARTMENTS_LIST,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_DEPARTMENT,
    createFields: [
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        id: 'isActive',
        type: 'trueOrFalse',
        required: true,
      },
    ],
    editUrl: API_ROUTES.EDIT_DEPARTMENT,
  },
  vendors: {
    label: 'Vendors',
    getUrl: API_ROUTES.GET_VENDORS_LIST,
    fields: [
      {
        headerName: 'Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Department',
        field: 'departmentName',
        type: 'text',
        renderCell: ({ row }) => {
          return <>{row.departmentName}</>
        },
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_VENDOR,
    createFields: [
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Department',
        name: 'departmentId',
        type: 'select',
        required: true,
        id: 'departmentId',
        optionsUrl: API_ROUTES.GET_DEPARTMENTS_LIST,
        selectedLabel: 'name',
        allowedNames: VENDOR_DEPARTMENTS,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        id: 'isActive',
        required: true,
      },
    ],
    editUrl: API_ROUTES.EDIT_VENDOR,
  },
  supplies: {
    label: 'Supplies',
    getUrl: API_ROUTES.GET_SUPPLIES_LIST,
    fields: [
      // {
      //   headerName: 'ID',
      //   field: 'id',
      //   type: 'text',
      // },
      {
        headerName: 'Supply Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Department',
        field: 'departmentName',
        type: 'select',
        renderCell: ({ row }) => {
          return <>{row.departmentName}</>
        },
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_SUPPLY,
    createFields: [
      {
        label: 'Supply Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Department',
        name: 'departmentId',
        type: 'select',
        required: true,
        id: 'departmentId',
        selectedLabel: 'name',
        optionsUrl: API_ROUTES.GET_DEPARTMENTS_LIST,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_SUPPLY,
  },
  cities: {
    label: 'Cities',
    getUrl: API_ROUTES.GET_ALL_CITIES,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'City Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'State',
        field: 'stateName',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_CITY,
    createFields: [
      {
        label: 'City Name',
        name: 'name',
        type: 'text',
        required: true,
        id: 'name',
      },
      {
        label: 'State',
        name: 'stateId',
        type: 'select',
        required: true,
        id: 'stateId',
        // optionsUrl: API_ROUTES.GET_ALL_STATES,
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_CITY,
  },
  branches: {
    label: 'Branch',
    getUrl: API_ROUTES.GET_ALL_BRANCHES_MASTER,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Branch Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'City',
        field: 'cityName',
        type: 'text',
      },
      {
        headerName: 'Branch Code',
        field: 'branchCode',
        type: 'text',
      },
      {
        headerName: 'Address',
        field: 'address',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_BRANCH_MASTER,
    createFields: [
      {
        label: 'Branch Name',
        name: 'name',
        type: 'text',
        required: true,
        id: 'name',
      },
      {
        label: 'City',
        name: 'cityId',
        type: 'select',
        required: false,
        id: 'cityId',
        optionsUrl: API_ROUTES.GET_ALL_CITIES,
        selectedLabel: 'name',
      },
      {
        label: 'Branch Code',
        name: 'branchCode',
        type: 'text',
        required: false,
        id: 'branchCode',
      },
      {
        label: 'Address',
        name: 'address',
        type: 'text',
        required: false,
        id: 'address',
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_BRANCH_MASTER,
  },
  referrals: {
    label: 'Referrals',
    getUrl: API_ROUTES.GET_ALL_REFERRALS,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Referral Name',
        field: 'name',
        type: 'text',
      },
      {
        headerName: 'Is Active',
        field: 'isActive',
        type: 'boolean',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_REFERRAL,
    createFields: [
      {
        label: 'Referral Name',
        name: 'name',
        type: 'text',
        required: true,
        id: 'name',
      },
      {
        label: 'Is Active',
        name: 'isActive',
        type: 'trueOrFalse',
        id: 'isActive',
      },
    ],
    editUrl: API_ROUTES.EDIT_REFERRAL,
  },
  DefaultOTPersons: {
    label: 'Default OT Persons',
    getUrl: API_ROUTES.GET_DEFAULT_OT_PERSONS,
    fields: [
      {
        headerName: 'ID',
        field: 'id',
        type: 'text',
      },
      {
        headerName: 'Branch',
        field: 'branchName',
        type: 'text',
      },
      {
        headerName: 'Designation Name',
        field: 'designationName',
        type: 'text',
      },
      {
        headerName: 'Persons List',
        field: 'personsList',
        type: 'text',
        renderCell: ({ row }) => {
          return (
            <>
              {row.personsList?.map((person) => person.personName).join(', ')}
            </>
          )
        },
      },

      {
        headerName: 'Created By',
        field: 'createdBy',
        type: 'text',
      },
      {
        headerName: 'Updated By',
        field: 'updatedBy',
        type: 'text',
      },
    ],
    createUrl: API_ROUTES.ADD_NEW_DEFAULT_OT_PERSONS,
    createFields: [
      {
        label: 'Branch',
        name: 'branchId',
        type: 'select',
        required: false,
        id: 'branchId',
        optionsUrl: API_ROUTES.GET_BRANCHES,
        selectedLabel: 'name',
      },
      {
        label: 'Designation Name',
        name: 'designationId',
        type: 'select',
        required: false,
        id: 'designationId',
      },
      {
        label: 'Persons List',
        name: 'personId',
        type: 'multiSelect',
        required: true,
        id: 'personsList',
        selectedLabel: 'personName',
        optionsUrl: API_ROUTES.GET_ALL_PERSONS_LIST,
      },
    ],
    editUrl: API_ROUTES.EDIT_DEFAULT_OT_PERSONS,
  },
}

function Managefields() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTab, setSelectedTab] = useState(() => {
    return (
      router.query.tab ||
      Object.keys(tabs).sort((a, b) =>
        tabs[a].label.localeCompare(tabs[b].label),
      )[0]
    )
  })
  const userDetails = useSelector((state) => state.user)
  const [subCategoryPayload, setSubCategoryPayload] = useState({
    name: '',
    categoryId: '',
  })
  const [editingSubCategory, setEditingSubCategory] = useState(null)
  const queryClient = useQueryClient()
  const dispatch = useDispatch()
  const dropdowns = useSelector((store) => store.dropdowns)

  const refreshBranchAccess = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dropdowns'] })
    const token = userDetails?.accessToken
    if (!token) return
    const response = await getLoggedUserInfo(token)
    if (response?.status === 200) {
      dispatch(
        setUser({
          ...userDetails,
          ...response.data,
          accessToken: token,
          isAuthenticated: true,
        }),
      )
    }
  }

  const { data: MasterData } = useQuery({
    queryKey: ['pharmacyMasterData', selectedTab],
    queryFn: () =>
      getPharmacyMasterData(userDetails?.accessToken, tabs[selectedTab].getUrl),
    enabled: !!tabs[selectedTab]?.getUrl,
  })

  const createHandler = useMutation({
    mutationKey: ['createPharmacyMasterData'],
    mutationFn: async (data) => {
      if (data) {
        const response = await createPharmacyMasterData(
          userDetails?.accessToken,
          data,
          tabs[selectedTab].createUrl,
        )
        return response
      } else {
        toast.error('Please fill all the fields', toastconfig)
      }
    },
    onSuccess: async (data, variables) => {
      console.log('created', data)
      if (data?.status === 200) {
        queryClient.invalidateQueries(selectedTab)
        if (selectedTab === 'branches') {
          await refreshBranchAccess()
        }
        dispatch(closeModal())
        toast.success(data?.message, toastconfig)
      } else {
        toast.error(data?.message, toastconfig)
      }
    },
    onError: (error, variables) => {
      console.error('Error creating', error)
    },
  })
  // useEffect(() => {
  //   console.log(MasterData)
  //   setPayload(null)
  // }, [MasterData])
  const [payload, setPayload] = useState()
  const handleCreate = () => {
    console.log('payload', payload, selectedTab)
    if (selectedTab === 'DefaultOTPersons') {
      payload.personId =
        payload.personId?.length > 0
          ? payload.personId?.map((each) => each.value).join(',')
          : payload.personId
    }
    createHandler.mutate(payload)
  }
  const [formData, setFormData] = useState({})
  const handleFormChange = (event) => {
    const { name, value } = event.target

    if (selectedRow) {
      // For edit mode
      setSelectedRow((prev) => ({ ...prev, [name]: value }))
      setPayload((prev) => ({ ...prev, [name]: value }))
    } else {
      // For create mode
      setFormData((prev) => ({ ...prev, [name]: value }))
      setPayload((prev) => ({ ...prev, [name]: value }))
      // console.log('formData , paylaod', formData, payload)
    }
  }
  const editRowHandler = useMutation({
    mutationKey: ['editPharmacyMasterData'],
    mutationFn: async (data) => {
      const { createdBy, updatedBy, createdAt, updatedAt, ...paylaod } = data
      const response = await editPharmacyMasterData(
        userDetails?.accessToken,
        paylaod,
        tabs[selectedTab].editUrl,
      )
      return response
    },
    onSuccess: async (data, variables) => {
      console.log('Edit', data)
      queryClient.invalidateQueries(selectedTab)
      if (selectedTab === 'branches' && data?.status === 200) {
        await refreshBranchAccess()
      }
      if (data?.status === 200) {
        toast.success(data?.message, toastconfig)
        dispatch(closeModal())
      } else {
        toast.error(data?.message, toastconfig)
      }
    },
    onError: (error, variables) => {
      console.error('Error creating', error)
      toast.error(error?.message, toastconfig)
    },
  })
  const [selectedRow, setSelectedRow] = useState()
  const handleRowEdit = (e, row) => {
    // console.log('edit clicked', row)

    // Create a flattened version of the row for easier form handling
    const flattenedRow = {
      ...row,
      // Extract nested values
      inventoryType: row.inventoryType?.id,
      manufacturer: row.manufacturer?.id,
      taxCategory: row.taxCategory?.id,
    }

    setSelectedRow(flattenedRow)
    setPayload(flattenedRow) // Also set the payload with the flattened data
    dispatch(openModal('editModalInPharmacyMasterData'))
  }

  // Get all unique optionsUrls from the current tab's fields
  const optionsUrls = React.useMemo(() => {
    const fields = tabs[selectedTab]?.createFields || []
    return fields
      .filter((field) => field.optionsUrl)
      .map((field) => ({
        id: field.id,
        url: field.optionsUrl,
      }))
  }, [selectedTab])

  // Single useQuery hook for all dynamic options
  const { data: dynamicOptionsData } = useQuery({
    queryKey: ['dynamicOptions', selectedTab, optionsUrls],
    queryFn: async () => {
      const results = {}
      for (const { id, url } of optionsUrls) {
        try {
          const response = await getPharmacyMasterData(
            userDetails?.accessToken,
            url,
          )
          console.log('response', response)
          // Ensure we store the data array, assuming response has a data property
          results[id] = response?.data || []
        } catch (error) {
          console.error(`Error fetching options for ${id}:`, error)
          results[id] = []
        }
      }
      return results
    },
    enabled: optionsUrls.length > 0,
    staleTime: 5 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
  })

  const getDynamicOptions = (field) => {
    // If field has static options configured, return them directly
    if (Array.isArray(field.options)) {
      return field.options
    }

    // First check for static dropdowns from redux store
    switch (field.id) {
      case 'visit_type':
        return dropdowns?.visitTypes?.map((each) => ({
          value: each.id,
          label: each.name,
        }))
      case 'designationId':
        return dropdowns?.otPersonDesignation?.map((each) => ({
          value: each.id,
          label: each.name,
        }))
      case 'labTestGroupId':
        return dropdowns?.labTestGroupList?.map((each) => ({
          value: each.id,
          label: each.name,
        }))
      case 'sampleTypeId':
        return dropdowns?.labTestSampleTypeList?.map((each) => ({
          value: each.id,
          label: each.name,
        }))
      // case 'inventoryType':
      //   return dropdowns?.inventoryTypeList?.map(each => ({
      //     value: each.id,
      //     label: each.name,
      //   }))
      // case 'taxCategory':
      //   return dropdowns?.taxCategoryList?.map(each => ({
      //     value: each.id,
      //     label: each.name,
      //   }))
      // case 'manufacturer':
      //   return dropdowns?.manufacturerList?.map(each => ({
      //     value: each.id,
      //     label: each.name,
      //   }))
      case 'stateId':
        return dropdowns?.states?.map((each) => ({
          value: each.id,
          label: each.name,
        }))
    }

    // Then check for dynamic options from API
    if (field.optionsUrl) {
      // console.log('field.optionsUrl', field.optionsUrl)
      const options = dynamicOptionsData?.[field.id]
      // console.log('options', options)
      // console.log('field.selectedLabel', field.selectedLabel)
      // Ensure options is an array before mapping
      if (Array.isArray(options)) {
        let mapped = options.map((option) => ({
          value: option.id,
          label: option[field.selectedLabel],
        }))

        if (Array.isArray(field.allowedNames) && field.allowedNames.length) {
          mapped = mapped.filter((opt) =>
            field.allowedNames.includes(opt.label),
          )
        }

        return mapped
      }
      return [] // Return empty array if options is not an array
    }

    return []
  }

  const [expandedAcc, setExpandedAcc] = useState()
  const handleChangeAccordian = (value) => (event, isExpanded) => {
    setExpandedAcc(isExpanded ? value : false)
  }
  const { data: subCategoriesData, isLoading: issubCategoriesDataLoading } =
    useQuery({
      queryKey: ['subCategoriesData', expandedAcc],
      queryFn: async () => {
        const res = await getSubCategoryListByCategoryId(
          userDetails?.accessToken,
          expandedAcc,
        )
        console.log(res)
        return res.data
      },
      enabled: !!expandedAcc,
    })
  const handleAddSubcategory = () => {
    setEditingSubCategory()
    setSubCategoryPayload({ ledgerName: '', categoryId: expandedAcc })
    dispatch(openModal('addSubcategory'))
  }

  const handleEditSubcategory = (subcategory) => {
    setEditingSubcategory(subcategory)
    setSubCategoryPayload({
      ledgerName: subcategory.ledgerName,
      categoryId: expandedAcc,
      id: subcategory.id,
    })
    dispatch(openModal('editSubcategory'))
  }
  const editSubCategoryMutation = useMutation({
    mutationKey: ['editSubCategory'],
    mutationFn: async (data) => {
      const response = await editSubCategoryByCategoryId(
        userDetails?.accessToken,
        data,
      )
      return response
    },
    onSuccess: (data, variables) => {
      console.log('Edit', data)
      queryClient.invalidateQueries(selectedTab)
      dispatch(closeModal())
    },
    onError: (error, variables) => {
      console.error('Error creating', error)
    },
  })
  const addSubCategoryMutation = useMutation({
    mutationKey: ['addSubCategory'],
    mutationFn: async (data) => {
      const response = await addSubCategoryByCategoryId(
        userDetails?.accessToken,
        data,
      )
      return response
    },
    onSuccess: (data, variables) => {
      console.log('Edit', data)
      queryClient.invalidateQueries(selectedTab)
      dispatch(closeModal())
    },
    onError: (error, variables) => {
      console.error('Error creating', error)
    },
  })
  const deleteSubCategoryMutation = useMutation({
    mutationKey: ['deleteSubCategory'],
    mutationFn: async (data) => {
      const response = await deleteSubCategoryByCategoryId(
        userDetails?.accessToken,
        data,
      )
      return response
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(selectedTab)
    },
    onError: (error, variables) => {
      console.error('Error creating', error)
    },
  })
  const handleSubcategorySubmit = () => {
    if (editingSubCategory) {
      editSubCategoryMutation.mutate(subCategoryPayload)
    } else {
      addSubCategoryMutation.mutate(subCategoryPayload)
    }
    dispatch(closeModal())
  }

  const handleDeleteSubcategory = (id) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      let payload = {
        categoryId: expandedAcc,
        id: id,
      }
      deleteSubCategoryMutation.mutate(payload)
    }
  }

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue)
    router.push(
      {
        pathname: router.pathname,
        query: { ...router.query, tab: newValue },
      },
      undefined,
      { shallow: true },
    )
  }

  // Add this function to filter tabs based on search query
  const filteredTabs = React.useMemo(() => {
    return Object.keys(tabs)
      .sort((a, b) => tabs[a].label.localeCompare(tabs[b].label))
      .filter((tab) =>
        tabs[tab].label.toLowerCase().includes(searchQuery.toLowerCase()),
      )
  }, [searchQuery])

  const handleOpenCreateModal = () => {
    if (tabs[selectedTab]?.useCustomPanel || !tabs[selectedTab]?.createFields) {
      return
    }
    setFormData({})
    setPayload({})
    dispatch(openModal(selectedTab + 'createModal'))
  }

  return (
    <div className="w-full h-[calc(100vh-160px)] p-5 flex gap-5">
      <TabContext value={selectedTab}>
        <div className="min-w-60 h-full flex flex-col gap-3 shadow rounded bg-white">
          <span className="text-3xl font-semibold text-secondary p-5 text-center border-b">
            {'Master Data'}
          </span>

          <div className="px-4">
            <Button
              fullWidth
              variant="contained"
              onClick={() => router.push('/admin/layouts')}
            >
              Master Layouts
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              className="block mt-1 text-center"
            >
              Floors, rooms & beds
            </Typography>
          </div>

          {/* Add the search input */}
          <div className="px-4">
            <TextField
              fullWidth
              size="small"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon className="mr-2 text-gray-400" />,
              }}
            />
          </div>

          <div className="overflow-y-auto ">
            <TabList
              onChange={handleTabChange}
              orientation="vertical"
              sx={{
                '.MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  textTransform: 'none',
                  fontSize: '0.95rem',
                  padding: '12px 24px',
                  minHeight: 'unset',
                  color: '#637580',
                  borderLeft: '3px solid transparent',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: 'rgba(176, 233, 250, 0.1)',
                    borderLeft: '3px solid #b0e9fa',
                  },
                },
                '.Mui-selected': {
                  backgroundColor: 'rgba(176, 233, 250, 0.15) !important',
                  color: '#06aee9 !important',
                  fontWeight: '500',
                  borderLeft: '3px solid #06aee9 !important',
                },
                '.MuiTabs-indicator': {
                  display: 'none',
                },
              }}
            >
              {filteredTabs.map((tab) => (
                <Tab
                  key={tab + 'tab'}
                  value={tab}
                  label={
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{tabs[tab].label}</span>
                      </div>
                    </div>
                  }
                />
              ))}
              {/* Keep the categories tab outside the filter if needed */}
              {searchQuery.toLowerCase().startsWith('e') ||
                (searchQuery.toLowerCase().startsWith('') && (
                  <Tab
                    value={'categories'}
                    label={
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            Expense Categories
                          </span>
                        </div>
                      </div>
                    }
                  />
                ))}
            </TabList>
          </div>
        </div>
        <div className="grow h-full rounded bg-white ">
          {Object.keys(tabs)
            .sort((a, b) => tabs[a].label.localeCompare(tabs[b].label))
            .map((tab) => (
              <TabPanel value={tab} key={tab + 'tabPanel'}>
                {tabs[tab]?.useCustomPanel ? (
                  <PharmacyKitMasterPanel
                    accessToken={userDetails?.accessToken}
                  />
                ) : (
                  <>
                    <div>
                      <div className="flex justify-end">
                        <Button
                          variant="outlined"
                          className="mb-3"
                          startIcon={<Add />}
                          onClick={handleOpenCreateModal}
                        >
                          Add New
                        </Button>
                      </div>
                    </div>
                    <PharmacyMasterTable
                      rows={MasterData?.data}
                      fields={tabs[selectedTab]?.fields}
                      createFields={tabs[selectedTab]?.createFields}
                      editRowHandler={editRowHandler}
                      selectedRow={selectedRow}
                      setSelectedRow={setSelectedRow}
                      handleRowEdit={handleRowEdit}
                      getDynamicOptions={getDynamicOptions}
                    />
                  </>
                )}
              </TabPanel>
            ))}
          <TabPanel value={'categories'}>
            <div className="">
              {dropdowns?.expenseCategories?.map((each) => {
                return (
                  <Accordion
                    expanded={expandedAcc === each?.id}
                    onChange={handleChangeAccordian(each.id)}
                    key={each.id + 'acc' + each.name}
                    className=""
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography
                        sx={{ width: '33%', flexShrink: 0 }}
                        className="font-semibold text-secondary"
                      >
                        {each.name}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails className="flex flex-wrap gap-3 items-center">
                      {subCategoriesData?.length > 0 ? (
                        subCategoriesData?.map((each) => {
                          return (
                            <span key={each.id + 'cat' + each.ledgerName}>
                              <span className="border  border-secondary bg-primary p-2 rounded-full flex  items-center gap-5">
                                <span className="font-semibold text-sm">
                                  {each.ledgerName}
                                </span>
                                <div className="flex  gap-2">
                                  <EditOutlined
                                    color="primary"
                                    className="cursor-pointer "
                                    onClick={() => handleEditSubcategory(each)}
                                  />
                                  <DeleteOutlined
                                    color="error"
                                    className="cursor-pointer"
                                    onClick={() =>
                                      handleDeleteSubcategory(each.id)
                                    }
                                  />
                                </div>
                              </span>
                            </span>
                          )
                        })
                      ) : (
                        <span>No Subcategories Found</span>
                      )}
                      {issubCategoriesDataLoading && (
                        <>
                          <Skeleton
                            variant="rectangular"
                            width={150}
                            height={30}
                          />
                          <Skeleton variant="circular" width={30} height={30} />
                        </>
                      )}
                      <Button
                        onClick={handleAddSubcategory}
                        variant="outlined"
                        size="small"
                      >
                        <Add /> {`Add subcategory`}
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                )
              })}
            </div>
          </TabPanel>
        </div>
      </TabContext>
      {tabs[selectedTab]?.createFields && (
        <Modal
          uniqueKey={selectedTab + 'createModal'}
          closeOnOutsideClick={false}
          maxWidth={'xs'}
        >
          <div className="flex justify-between items-center">
            <Typography variant="h6">
              Add New {tabs[selectedTab]?.label}
            </Typography>
            <IconButton onClick={() => dispatch(closeModal())}>
              <Close />
            </IconButton>
          </div>
          <div className="flex flex-col gap-5 p-3">
            {tabs[selectedTab].createFields.map((field) =>
              getEachFieldBasedOnType(
                field,
                formData,
                selectedRow,
                handleFormChange,
                true,
                getDynamicOptions,
              ),
            )}
            <div className="flex justify-end">
              <Button
                onClick={handleCreate}
                className="capitalize "
                variant="outlined"
              >
                Add
              </Button>
            </div>
          </div>
        </Modal>
      )}
      <Modal
        uniqueKey="addSubcategory"
        maxWidth="xs"
        title={editingSubCategory ? 'Edit Subcategory' : 'Add Subcategory'}
        closeOnOutsideClick={true}
      >
        <div className="flex flex-col gap-5 p-3">
          <TextField
            autoFocus
            margin="dense"
            label="Subcategory Name"
            fullWidth
            value={subCategoryPayload.name}
            onChange={(e) =>
              setSubCategoryPayload({
                ...subCategoryPayload,
                ledgerName: e.target.value,
              })
            }
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => dispatch(closeModal())}>Cancel</Button>
            <Button onClick={handleSubcategorySubmit}>
              {editingSubCategory ? 'Update' : 'Add'}
            </Button>
          </div>
        </div>
      </Modal>
      <Modal
        uniqueKey="editSubcategory"
        maxWidth="xs"
        title="Edit Subcategory"
        closeOnOutsideClick={true}
      >
        <div className="flex flex-col gap-5 p-3">
          <TextField
            autoFocus
            margin="dense"
            label="Subcategory Name"
            fullWidth
            value={subCategoryPayload.ledgerName}
            onChange={(e) =>
              setSubCategoryPayload({
                ...subCategoryPayload,
                ledgerName: e.target.value,
              })
            }
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => dispatch(closeModal())}>Cancel</Button>
            <Button onClick={handleSubcategorySubmit}>Update</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
const getEachFieldBasedOnType = (
  field,
  formData,
  selectedRow,
  handleFormChange,
  isCreateMode = false,
  getDynamicOptions,
) => {
  // Use the appropriate data source based on mode
  const dataSource = isCreateMode ? formData : selectedRow

  switch (field.type) {
    case 'text':
    case 'number':
    case 'email':
      return (
        <TextField
          key={field.name}
          label={field.label}
          type={field.type}
          variant="outlined"
          name={field.name}
          value={dataSource?.[field.name] ?? ''}
          onChange={handleFormChange}
          autoComplete="off"
          required={field.required}
          fullWidth
        />
      )

    case 'select':
      const options = getDynamicOptions(field) || []
      const selectedValue = dataSource?.[field.id] || dataSource?.[field.name]
      const selectedOption =
        options.find((option) => option.value === selectedValue) || null

      return (
        <Autocomplete
          key={field.id}
          options={options}
          value={selectedOption}
          getOptionLabel={(option) => option?.label || ''}
          onChange={(event, newValue) => {
            handleFormChange({
              target: {
                name: field.name || field.id,
                value: newValue?.value || '',
              },
            })
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label={field.label}
              variant="outlined"
              required={field.required}
              fullWidth
            />
          )}
        />
      )

    case 'trueOrFalse':
      return (
        <FormControl key={field.id} fullWidth>
          <InputLabel id={field.id}>{field.label}</InputLabel>
          <Select
            label={field.label}
            name={field.name || field.id}
            labelId={field.id}
            value={dataSource?.[field.name] ?? dataSource?.[field.id] ?? ''}
            onChange={handleFormChange}
            required={field.required}
          >
            <MenuItem value={1}>Yes</MenuItem>
            <MenuItem value={0}>No</MenuItem>
          </Select>
        </FormControl>
      )

    case 'date':
      return (
        <DatePicker
          value={
            dataSource?.[field.name] ? dayjs(dataSource[field.name]) : null
          }
          onChange={(newValue) => {
            handleFormChange({
              target: {
                name: field.name,
                value: newValue ? dayjs(newValue).format('YYYY-MM-DD') : null,
              },
            })
          }}
          key={field.name}
          label={field.label}
          name={field.name}
          format="DD-MM-YYYY"
          autoComplete="off"
        />
      )
    case 'multiSelect':
      return (
        <FormControl key={field.name} fullWidth>
          <Autocomplete
            multiple
            options={getDynamicOptions(field)}
            getOptionLabel={(option) => option.label || ''}
            onChange={(event, newValue) => {
              handleFormChange({
                target: { name: field.name, value: newValue },
              })
            }}
            renderInput={(params) => (
              <TextField {...params} label={field.label} variant="outlined" />
            )}
          />
        </FormControl>
      )
  }
}
export default withPermission(Managefields, true, 'masterData', [
  ACCESS_TYPES.READ,
  ACCESS_TYPES.WRITE,
])
