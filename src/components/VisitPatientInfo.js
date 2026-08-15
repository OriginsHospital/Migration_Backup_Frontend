import { createConsultationOrTreatment } from '@/constants/apis'
import {
  Button,
  FormControl,
  Select,
  MenuItem,
  Box,
  Grid,
  Card,
} from '@mui/material'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import Modal from './Modal'
import VerticalTabs from './VerticalConsultationTabs'
import Image from 'next/image'

export default function VisitPatientInfo({ imagePreview, formData, photo }) {
  console.log('aa:', formData)
  return (
    <div className="p-5 bg-white border rounded-xl shadow flex items-center mb-5">
      <Grid container spacing={4}>
        <Grid item xs={12}>
          <h1 className="text-2xl font-semibold">Patient</h1>
        </Grid>
        <Grid container item xs={12} spacing={4}>
          <Grid item xs={2}>
            <div className="relative p-5 rounded-full flex items-center">
              {imagePreview ? (
                <Image
                  src={imagePreview}
                  alt="Preview"
                  width={150}
                  height={150}
                  className="object-cover rounded-full aspect-square"
                />
              ) : (
                <Image
                  src={formData?.photoPath || photo}
                  width={150}
                  height={150}
                  className="object-cover rounded-full aspect-square"
                />
              )}
            </div>
          </Grid>
          <Grid item xs={10}>
            <Card variant="outlined" className="p-5 mx-0 my-5 w-full">
              <Grid container spacing={2}>
                <Grid item xs={2}>
                  <h1 className="text-2 font-semibold">Patient Name</h1>
                </Grid>
                <Grid item xs={1} className="flex justify-center">
                  <span className="text-2 font-semibold">:</span>
                </Grid>
                <Grid item xs={3}>
                  <h1 className="text-2 font-semibold">
                    {formData.lastName} {formData.firstName}
                  </h1>
                </Grid>
                <Grid item xs={2}>
                  <h1 className="text-2 font-semibold">Mobile Number</h1>
                </Grid>
                <Grid item xs={1} className="flex justify-center">
                  <span className="text-2 font-semibold">:</span>
                </Grid>
                <Grid item xs={3}>
                  <h1 className="text-2 font-semibold">{formData.mobileNo}</h1>
                </Grid>
                <Grid item xs={2}>
                  <h1 className="text-2 font-semibold">Date of Birth</h1>
                </Grid>
                <Grid item xs={1} className="flex justify-center">
                  <span className="text-2 font-semibold">:</span>
                </Grid>
                <Grid item xs={3}>
                  <h1 className="text-2 font-semibold">
                    {formData.dateOfBirth}
                  </h1>
                </Grid>
                <Grid item xs={2}>
                  <h1 className="text-2 font-semibold">Aadhaar No</h1>
                </Grid>
                <Grid item xs={1} className="flex justify-center">
                  <span className="text-2 font-semibold">:</span>
                </Grid>
                <Grid item xs={3}>
                  <h1 className="text-2 font-semibold">{formData.aadhaarNo}</h1>
                </Grid>
                <Grid item xs={2}>
                  <h1 className="text-2 font-semibold">Marital Status</h1>
                </Grid>
                <Grid item xs={1} className="flex justify-center">
                  <span className="text-2 font-semibold">:</span>
                </Grid>
                <Grid item xs={3}>
                  <h1 className="text-2 font-semibold">
                    {formData.maritalStatus}
                  </h1>
                </Grid>
              </Grid>
            </Card>
          </Grid>
        </Grid>
      </Grid>
    </div>
  )
}
