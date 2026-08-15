import React, { useState, useRef, useMemo } from 'react'
// import JoditEditor from 'jodit-react';
import dynamic from 'next/dynamic'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})

function TextDisableJoeditor({ data }) {
  const editor = useRef(null)
  // const [content, setContent] = useState(Content)

  return (
    <div>
      <JoditEditor
        ref={editor}
        value={data}
        tabIndex={1} // tabIndex of textarea
        config={{
          readonly: true,
          removeButtons: [
            'image',
            'video',
            'table',
            'code',

            'font',
            'fontsize',
            'paragraph',
            'blockquote',
            'list',
            'indent',
            'link',
            'clean',
            'speechRecognize',
            'source',
            'speech',
            'mode',
          ],
        }}
      />
    </div>
  )
}

export default TextDisableJoeditor
