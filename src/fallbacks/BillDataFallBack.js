import {
  Skeleton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Box,
} from '@mui/material'

export default function BillDataFallBack() {
  return (
    <div className="flex flex-col gap-3 min-h-[80vh]">
      {/* Skeleton for notes section */}
      <Skeleton
        variant="rectangular"
        className="p-3 rounded max-h-20"
        height={80}
      />

      {/* Skeleton for tabs and content */}
      <div className="flex flex-col shadow px-2 my-2">
        {/* Tab headers skeleton */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', p: 1.5 }}>
          <div className="flex gap-4">
            <Skeleton variant="rectangular" width={100} height={30} />
            <Skeleton variant="rectangular" width={100} height={30} />
            <Skeleton variant="rectangular" width={100} height={30} />
          </div>
        </Box>

        {/* Tab content skeleton */}
        <div className="p-3">
          {/* Bill details skeleton */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <Skeleton variant="text" width={200} />
              <Skeleton variant="text" width={100} />
            </div>

            {/* Table skeleton */}
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    {[1, 2, 3, 4].map(i => (
                      <TableCell key={i}>
                        <Skeleton variant="text" width={80} />
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {[1, 2, 3].map(row => (
                    <TableRow key={row}>
                      {[1, 2, 3, 4].map(cell => (
                        <TableCell key={cell}>
                          <Skeleton variant="text" width={60} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Action buttons skeleton */}
            <div className="flex justify-between mt-4">
              <Skeleton variant="rectangular" width={120} height={35} />
              <Skeleton variant="rectangular" width={120} height={35} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
