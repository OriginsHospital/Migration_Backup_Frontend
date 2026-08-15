import React, { useRef, useState } from 'react'
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  IconButton,
} from '@mui/material'
import { Close, Print, ZoomIn, ZoomOut } from '@mui/icons-material'
import Modal from './Modal'
import dynamic from 'next/dynamic'
import { closeModal } from '@/redux/modalSlice'
import { useDispatch } from 'react-redux'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
export const PrintPreview = ({ htmlContent, onClose, uniqueKey }) => {
  const [zoom, setZoom] = useState(0.7)
  const contentRef = useRef()
  const dispatch = useDispatch()
  const handlePrint = async () => {
    const { default: html2pdf } = await import('html2pdf.js')
    if (contentRef.current) {
      const element = contentRef.current
      const opt = {
        margin: 10,
        filename: 'document.pdf',
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      }

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(pdf => {
          const blob = pdf.output('blob')
          const url = URL.createObjectURL(blob)
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          iframe.src = url
          document.body.appendChild(iframe)
          iframe.contentWindow.print()
          // Clean up
          // setTimeout(() => {
          //     document.body.removeChild(iframe);
          //     URL.revokeObjectURL(url);
          // }, 1000);
        })
    }
  }

  return (
    <Modal
      uniqueKey={'print-preview' + uniqueKey}
      closeOnOutsideClick={true}
      maxWidth={'md'}
    >
      <div className="flex justify-end items-center p-2 border-b">
        <IconButton onClick={() => dispatch(closeModal())}>
          <Close />
        </IconButton>
        {/* <Button onClick={handlePrint}>Print</Button> */}
      </div>
      {/* <div className="flex justify-between items-center p-2 border-b">


        <div className="flex items-center gap-2">
          <Button
            startIcon={<ZoomOut />}
            onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
          >
            Zoom Out
          </Button>
          <span>{Math.round(zoom * 100)}%</span>
          <Button
            startIcon={<ZoomIn />}
            onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
          >
            Zoom In
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button startIcon={<Print />} onClick={handlePrint}>
            Print
          </Button>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </div>
      </div>
      <DialogContent>
        <div
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top left',
            transition: 'transform 0.2s',
          }}
        >
          <div
            ref={contentRef}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </DialogContent> */}
      <JoditEditor
        ref={contentRef}
        value={`
          ${htmlContent}`}
        // config={config}
        tabIndex={1} // tabIndex of textarea
        // preferred to use only this option to update the content for performance reasons
        // onChange={newContent => {
        //     setContent(newContent);
        // }}
        config={{
          // readonly: true,
          removeButtons: [
            'video',
            'table',
            'code',
            'link',
            'speechRecognize',
            'speech',
            'image',
            'file',
            // 'print',
            'copy',
            'cut',
            'paste',
            'undo',
            'redo',
            'bold',
            'italic',
            'underline',
            'strikethrough',
            'superscript',
            'subscript',
            'align',
            'lineHeight',
            'letterSpacing',
            'text',
            'color',
            'backgroundColor',
            'font',
            'fontsize',
            'paragraph',
            'blockquote',
            'hr',
            'list',
            'indent',
            'outdent',
            'align',
            'fullScreen',
            'preview',
            'left',
            'center',
            'right',
            'justify',
            'clean',
            'symbols',
            'ai-commands',
            'about',
            'eraser',
            'ul',
            'ol',
            'spellcheck',
            'ai-assistant',
            'brush',
            'dots',
            'copyformat',
            'selectall',
            'classSpan',
            'source',
            // 'find',
            // 'replace',
            // 'mode',
            // 'fullScreen',
            // 'preview',
            // 'print',
          ],
        }}
      />
    </Modal>
  )
}
