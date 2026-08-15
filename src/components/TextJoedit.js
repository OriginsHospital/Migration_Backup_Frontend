import React, { useState, useRef, useMemo } from 'react'
// import JoditEditor from 'jodit-react';
import dynamic from 'next/dynamic'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
const Content = `
<h1 style="text-align: center;">FATAL 2-D ECHO</h1>
<p style="text-align: left;">GA -</p>
<p style="text-align: left;">FOETUS -&nbsp;<br /><br /></p>
<p style="text-align: left;"><strong>ECHO DETAILS:</strong></p>
<div>
<table style="width: 708px; height: 10px; border: 1px solid black; border-collapse: collapse;">
<tbody>
<tr style="height: 35px;">
<td style="width: 363.8px; height: 35px; border: 1px solid black;">
<p>Cardiac views</p>
</td>
<td style="width: 351.2px; height: 35px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Abdominal Situs<br /><br /></td>
<td style="width: 351.2px; height: 35px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Stomach<br /><br /></td>
<td style="width: 351.2px; height: 35px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Heart Size<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Apex<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Cardiac Axis<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">FHR<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Rhythm<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Atria<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 27px;">
<td style="width: 363.8px; height: 27px; border: 1px solid black;">Inter-Atrial Septum<br /><br /></td>
<td style="width: 351.2px; height: 27px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">Foramen Ovale<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">A.V.Junction<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">A.V Regurgitation<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">Ventricles<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">
<p>Inter-Ventricular Septum</p>
</td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">Outflow Tracts<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">Aortic Arch<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">Side of Aortic Arch<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">Branch PAS<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">
<p>Ductus Arteriosus</p>
</td>
<td style="width: 351.2px; text-align: center; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">V.A Valve Regurgitation<br /><br /></td>
<td style="width: 351.2px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">3VV<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 13px;">
<td style="width: 363.8px; height: 13px; border: 1px solid black;">3VT View<br /><br /></td>
<td style="width: 351.2px; height: 13px; border: 1px solid black;">&nbsp;</td>
</tr>
<tr style="height: 9.00003px;">
<td style="width: 363.8px; height: 9.00003px; border: 1px solid black;">
<p>Pulmonary Veins</p>
</td>
<td style="width: 351.2px; height: 9.00003px; border: 1px solid black;">&nbsp;</td>
</tr>
</tbody>
</table>
</div>
<div>
<p><strong><br />IMPRESSION:</strong></p>
<table style="width: 701.4px; border-collapse: collapse;">
<tbody>
<tr style="height: 35.475px;">
<td style="width: 703.4px; height: 35.475px; border: 1px solid black;">&nbsp;</td>
</tr>
</tbody>
</table>
<p>&nbsp;</p>
</div>`
function TextJoedit({ placeholder }) {
  const editor = useRef(null)
  const [content, setContent] = useState(Content)

  // const config = useMemo(
  //     {
  //         readonly: false, // all options from https://xdsoft.net/jodit/docs/,
  //         placeholder: placeholder || 'Start typings...'
  //     },
  //     [placeholder]
  // );
  // console.log(content)
  return (
    <div>
      <JoditEditor
        ref={editor}
        value={content}
        // config={config}
        tabIndex={1} // tabIndex of textarea
        onBlur={newContent => setContent(newContent)} // preferred to use only this option to update the content for performance reasons
        // onChange={newContent => {
        //     setContent(newContent);
        // }}
        config={{
          readonly: false,
          removeButtons: [
            // 'image',
            'video',
            'table',
            'code',

            // 'font',
            // 'fontsize',
            // 'paragraph',
            // 'blockquote',
            // 'list',
            // 'indent',
            'link',
            // 'clean',
            // 'speechRecognize',
            'source',
            'speech',
            // 'mode'
          ],
        }}
      />
    </div>
  )
}

export default TextJoedit
