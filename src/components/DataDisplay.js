import React from 'react'
import {
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material'

const camelToNormalCase = str => {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
}

const DataDisplay = ({ title, sectionData, keys }) => {
  // const { grnDetails, grnItemDetails, grnPaymentDetails } = data;

  return (
    <div className="mb-5">
      <Typography
        variant="h6"
        className="mb-2 font-semibold text-secondary bg-primary px-6"
      >
        {title}
      </Typography>
      <div className="grid grid-cols-5 gap-3 p-3">
        {sectionData &&
          keys?.map(eachKey => (
            <div key={eachKey}>
              <Tooltip title={camelToNormalCase(eachKey)} placement="top-start">
                <Typography
                  variant="body2"
                  color="textSecondary"
                  className="truncate"
                >
                  {camelToNormalCase(eachKey)}
                </Typography>
              </Tooltip>
              <Tooltip title={sectionData[eachKey]} placement="top-start">
                <Typography variant="body1" className="truncate">
                  {/* {value !== null && value !== undefined ? value.toString() : 'N/A'} */}
                  {sectionData[eachKey]}
                </Typography>
              </Tooltip>
            </div>
          ))}
      </div>
    </div>
  )

  // const renderItemDetails = () => (
  //     <Paper elevation={3} className="p-4 mb-4">
  //         <Typography variant="h6" className="mb-2">GRN Item Details</Typography>
  //         <TableContainer component={Paper}>
  //             <Table size="small">
  //                 <TableHead>
  //                     <TableRow>
  //                         {grnItemDetails?.length > 0 && Object.keys(grnItemDetails[0]).map((key) => (
  //                             <TableCell key={key}>{camelToNormalCase(key)}</TableCell>
  //                         ))}
  //                     </TableRow>
  //                 </TableHead>
  //                 <TableBody>
  //                     {grnItemDetails?.map((item, index) => (
  //                         <TableRow key={index}>
  //                             {Object.values(item).map((value, idx) => (
  //                                 <TableCell key={idx}>
  //                                     {value !== null && value !== undefined ? value.toString() : 'N/A'}
  //                                 </TableCell>
  //                             ))}
  //                         </TableRow>
  //                     ))}
  //                 </TableBody>
  //             </Table>
  //         </TableContainer>
  //     </Paper>
  // );
}

export default DataDisplay
