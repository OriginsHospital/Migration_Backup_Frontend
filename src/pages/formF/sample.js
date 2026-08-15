// import { Button } from '@mui/material';
// import React, { useState, useRef } from 'react';

// const FollicularScanForm = () => {
//     const days = Array.from({ length: 15 }, (_, i) => `D${i + 1}`);
//     const dates = ["09/10", "10/10", "11/10", "12/10", "13/10", "14/10", "15/10", "16/10", "17/10", "18/10", "19/10", "20/10", "21/10", "22/10", "23/10"];
//     const sizes = ["<=10", "10.5", "11", "11.5", "12", "12.5", "13", "13.5", "14", "14.5", "15", "15.5", "16", "16.5", "17", "17.5", "18"];

//     const [formData, setFormData] = useState({
//         'D1-L-<=10': 99,
//         'D1-R-<=10': 99,
//         'D1-L-10.5': 99,
//         'D1-R-10.5': 99,
//         'D1-L-11': 99,
//         'D1-R-11': 99,
//     });
//     const tableRef = useRef(null);

//     const handleInputChange = (day, side, size, value) => {
//         const newValue = value === '' ? '' : parseFloat(value);
//         if (isNaN(newValue) || newValue < 0 || newValue > 99) return;

//         setFormData(prevData => ({
//             ...prevData,
//             [`${day}-${side}-${size}`]: newValue
//         }));
//     };

//     const handlePrint = () => {
//         const printContent = tableRef.current;
//         const winPrint = window.open('', '', 'left=0,top=0,width=800,height=1200,toolbar=0,scrollbars=0,status=0');

//         winPrint.document.write(`
//       <html>
//         <head>
//           <title>Follicular Scan Form</title>
//           <style>
//             body { margin: 0; padding: 0; }
//             .table-container { width: 100%; overflow-x: auto; }
//             table { border-collapse: collapse; table-layout: fixed; }
//             th, td { border: 1px solid black; padding: 2px; number-align: center; font-size: 6px; overflow: hidden; white-space: nowrap; }
//             th { background-color: #e2e8f0 !important; -webkit-print-color-adjust: exact; }
//             tr:nth-child(even) { background-color: #f0fff4 !important; -webkit-print-color-adjust: exact; }
//             input { width: 100%; border: none; font-size: 6px; number-align: center; }
//             @page {  margin: 10mm; }
//             @media print {
//               body { -webkit-print-color-adjust: exact; }
//               .table-container { overflow-x: visible; }
//               table { width: 100% !important; }
//             }
//           </style>
//         </head>
//         <body>
//           <div class="table-container">
//             ${printContent.outerHTML}
//           </div>
//           <script>
//             window.onload = function() {
//               const table = document.querySelector('table');
//               const containerWidth = document.body.clientWidth;
//               const columnCount = table.rows[0].cells.length;
//               const columnWidth = (containerWidth / columnCount) + 'px';
//               const cells = table.getElementsByTagName('th');
//               for (let i = 0; i < cells.length; i++) {
//                 cells[i].style.width = columnWidth;
//               }
//               setTimeout(() => {
//                 window.print();
//                 window.close();
//               }, 250);
//             };
//           </script>
//         </body>
//       </html>
//     `);

//         winPrint.document.close();
//         winPrint.focus();
//     };

//     return (
//         <div>
//             <div className="overflow-x-auto">
//                 <table ref={tableRef} className="w-full border-collapse">
//                     <thead>
//                         <tr>
//                             <th className="bg-purple-200 p-2 border">Follicular Scan</th>
//                             {days.map((day, index) => (
//                                 <th key={day} className="bg-purple-200 p-2 border number-center" colSpan={2}>
//                                     <div>{day}</div>
//                                     <div className="number-xs">{dates[index]}</div>
//                                 </th>
//                             ))}
//                         </tr>
//                         <tr>
//                             <th></th>
//                             {days.flatMap(day => [
//                                 <th key={`${day}-L`} className="p-2 border number-center">L</th>,
//                                 <th key={`${day}-R`} className="p-2 border number-center">R</th>
//                             ])}
//                         </tr>
//                     </thead>
//                     <tbody>
//                         {sizes.map(size => (
//                             <tr key={size} className={size % 2 === 0 ? "bg-green-100" : ""}>
//                                 <td className="p-2 border font-medium">{size} mm</td>
//                                 {days.flatMap(day => [
//                                     <td key={`${day}-L-${size}`} className="p-0 border">
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="99"
//                                             step="0.1"
//                                             value={formData[`${day}-L-${size}`] || ''}
//                                             onChange={(e) => handleInputChange(day, 'L', size, e.target.value)}
//                                             className="w-full h-8 number-center"
//                                         />
//                                     </td>,
//                                     <td key={`${day}-R-${size}`} className="p-0 border">
//                                         <input
//                                             type="number"
//                                             min="0"
//                                             max="99"
//                                             step="0.1"
//                                             value={formData[`${day}-R-${size}`] || ''}
//                                             onChange={(e) => handleInputChange(day, 'R', size, e.target.value)}
//                                             className="w-full h-8 number-center"
//                                         />
//                                     </td>
//                                 ])}
//                             </tr>
//                         ))}
//                     </tbody>
//                 </table>
//             </div>
//             <button
//                 onClick={handlePrint}
//                 className="mt-4 px-4 py-2 bg-blue-500 number-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
//             >
//                 Print to PDF
//             </button>
//             <Button
//                 onClick={() => {
//                     // TODO: Save form data to database
//                     console.log(formData);
//                 }}
//             >
//                 Save
//             </Button>
//         </div>
//     );
// };

// export default FollicularScanForm;

import dynamic from 'next/dynamic'
import React, { useRef, useState } from 'react'
const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
const MyComponent = () => {
  const editor = useRef(null)
  const [
    content,
    setContent,
  ] = useState(`<table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;">
<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px; text-align: left; background-color: #e6b3ff;">Follicular Scan</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D1<br>09/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D2<br>10/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D3<br>11/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D4<br>12/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D5<br>13/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D6<br>14/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D7<br>15/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D8<br>16/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D9<br>17/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D10<br>18/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D11<br>19/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D12<br>20/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D13<br>21/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D14<br>22/10</th>
        <th colspan="2" style="border: 1px solid #ccc; padding: 8px;">D15<br>23/10</th>
</tr>

<tr style="background-color: #f8f0ff;">
    <th style="border: 1px solid #ccc; padding: 8px;"></th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
        <th style="border: 1px solid #ccc; padding: 8px;">L</th>
        <th style="border: 1px solid #ccc; padding: 8px;">R</th>
</tr>

<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">&lt;&#x3D;10 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; background-color: #e6ffb3;">
     <input type="text" style="width: 100%; cursor: not-allowed;" disabled value=" 10.5 mm">
   </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">11 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">11.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">12 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">12.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">13 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">13.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">14 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">14.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">15 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">15.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">16 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">16.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">17 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">17.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">18 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">18.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">19 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">19.5 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
<tr>
    <td style="border: 1px solid #ccc; padding: 8px; background-color: #e6ffb3;">&gt;&#x3D;20 mm</td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 1px solid #ccc; padding: 4px; background-color: #e0e0e0;">
                <input type="text" style="width: 100%; box-sizing: border-box; padding: 4px; background-color: #d3d3d3; cursor: not-allowed;" disabled>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
            <td style="border: 2px solid black; padding: 4px;">
                <span style="width: 100%; box-sizing: border-box; padding: 4px;"></span>
            </td>
</tr>
</table>`)

  const handleSave = () => {
    console.log(content)
  }

  return (
    <div>
      <JoditEditor
        ref={editor}
        value={content}
        onBlur={newContent => setContent(newContent)}
      />
      <input type="button" value="Save" onClick={handleSave} />
    </div>
  )
}

export default MyComponent
