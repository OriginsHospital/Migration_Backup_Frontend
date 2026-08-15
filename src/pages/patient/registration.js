import React, { useState } from 'react'
import { TextField } from '@mui/material'
import { useSelector } from 'react-redux'
import { ToastContainer, toast, Bounce } from 'react-toastify'

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
export default function registration() {
  return (
    <div className="w-full">
      {/* <ToastContainer /> */}
      <HorizontalLinearStepper />
    </div>
  )
}

import Box from '@mui/material/Box'
import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { Search } from '@mui/icons-material'
import { getPatientByAadharOrMobile } from '@/constants/apis'

const steps = ['Search Patient', 'Enter Details', 'Preview']

export function HorizontalLinearStepper() {
  const userDetails = useSelector(store => store.user)
  const [activeStep, setActiveStep] = React.useState(0)
  const [skipped, setSkipped] = React.useState(new Set())
  const [searchValue, setSearchValue] = useState()
  // const isStepOptional = (step) => {
  //   return step === 2;
  // };

  const isStepSkipped = step => {
    return skipped.has(step)
  }

  const handleNext = () => {
    // let newSkipped = skipped;
    // if (isStepSkipped(activeStep)) {
    //   newSkipped = new Set(newSkipped.values());
    //   newSkipped.delete(activeStep);
    // }
    if (activeStep === 0) {
      const patientRecord = getPatientByAadharOrMobile(
        userDetails.accessToken,
        searchValue,
      )
      if (patientRecord.status === 200) {
        console.log(patientRecord.data)
        toast.success('patientRecord found')
      }

      setActiveStep(prevActiveStep => prevActiveStep + 1)
    }
    // setSkipped(newSkipped);
  }

  const handleBack = () => {
    setActiveStep(prevActiveStep => prevActiveStep - 1)
  }

  // const handleSkip = () => {
  //   if (!isStepOptional(activeStep)) {
  //     // You probably want to guard against something like this,
  //     // it should never occur unless someone's actively trying to break something.
  //     throw new Error("You can't skip a step that isn't optional.");
  //   }

  //   setActiveStep((prevActiveStep) => prevActiveStep + 1);
  //   setSkipped((prevSkipped) => {
  //     const newSkipped = new Set(prevSkipped.values());
  //     newSkipped.add(activeStep);
  //     return newSkipped;
  //   });
  // };

  const handleReset = () => {
    setActiveStep(0)
  }
  const getStepWiseComponent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Step1
            activeStep={activeStep}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
          />
        )
      case 1:
        return <Step2 activeStep={activeStep} />
      case 2:
        return <Step3 activeStep={activeStep} />
      default:
        return <Step1 activeStep={activeStep} />
    }
  }
  return (
    <Box sx={{ height: '80vh' }} className="grid flex-col">
      <Stepper activeStep={activeStep}>
        {steps.map((label, index) => {
          const stepProps = {}
          const labelProps = {}
          return (
            <Step key={label} {...stepProps}>
              <StepLabel {...labelProps}>{label}</StepLabel>
            </Step>
          )
        })}
      </Stepper>
      {activeStep === steps.length ? (
        <React.Fragment>
          <Typography sx={{ mt: 2, mb: 1 }}>
            All steps completed - you&apos;re finished
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', pt: 2 }}>
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={handleReset}>Reset</Button>
          </Box>
        </React.Fragment>
      ) : (
        <React.Fragment>
          <div className="w-full  pb-[30px]">{getStepWiseComponent()}</div>
        </React.Fragment>
      )}
      <Box className="w-full overflow-hidden shadow-xl shadow-black fixed bottom-0 flex justify-center p-3 first-step-width">
        <div className="flex gap-3">
          <Button
            color="inherit"
            disabled={activeStep === 0}
            onClick={handleBack}
            sx={{ mr: 1 }}
          >
            Back
          </Button>

          <Button onClick={handleNext} variant="contained">
            {activeStep === steps.length - 1 ? 'Register' : 'Next'}
          </Button>
        </div>
      </Box>
      {/* <div className="w-full overflow-hidden shadow-xl shadow-black fixed bottom-0 flex justify-center p-3 first-step-width">
        <div className="flex gap-3">

          {activeStep > 1 ? (
            <Button
              variant="contained"
              onClick={handleBack}
              // style={{ height: "52px", width: "130px" }}
              // displayName={back}
              classes="legal-services-steps-button"
              titleClass="reporttest-search-class"
            >Back</Button>
          ) : <Button
            variant="contained"
            // onClickHandler={() => { router.push("/talktolandexperts") }}
            displayName=""
            classes="legal-services-steps-button"
            titleClass="reporttest-search-class"
          >Back</Button>}
          {activeStep <= 4 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              // style={{ height: "52px", width: "130px" }}
              // displayName={next}
              classes="legal-services-steps-button"
              titleClass="reporttest-search-class"
            >Next</Button>
          ) : <Button
            variant="contained"
            // onClick={handelCart}
            // style={{ height: "52px", width: "fit-content" }}
            displayName=''
            classes="legal-services-steps-button"
            titleClass="reporttest-search-class"

          >Add to Cart</Button>}
        </div>
      </div> */}
    </Box>
  )
}

export function Step1({ activeStep, searchValue, setSearchValue }) {
  return (
    <div className="flex flex-col items-center gap-5">
      {/* <p className='font-semibold'>Enter Aadhaar or Mobile Number <span className='pl-2'>step {activeStep + 1}</span></p> */}
      {/* <div className='w-full'>
      <span className='text-thin text-left'>Enter Aadhaar or Mobile Number</span>

    </div> */}
      <div className="w-[50%]">
        <label for="search" className="text-sm font-medium p-2">
          Aadhaar or Mobile Number
        </label>
        <input
          id="search"
          placeholder="Enter Aadhaar or Mobile Number"
          className="w-full p-2 rounded-lg bg-slate-100 outline-none"
          type="search"
          value={searchValue}
          onChange={e => setSearchValue(e.target.value)}
        />
      </div>
      {/* <Button variant='contained'>Search</Button>   */}
    </div>
  )
}
export function Step2({ activeStep }) {
  return <div>Step{activeStep + 1}</div>
}
export function Step3({ activeStep }) {
  return <div>Step{activeStep + 1}</div>
}
