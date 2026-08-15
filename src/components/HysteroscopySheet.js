import dynamic from 'next/dynamic'

const JoditEditor = dynamic(() => import('jodit-react'), {
  ssr: false,
})
import React from 'react'

export default function HysteroscopySheet({
  hysteroscopyTemplate,
  setHysteroscopyTemplate,
}) {
  return (
    <div>
      <JoditEditor
        value={hysteroscopyTemplate}
        tabIndex={1}
        onBlur={setHysteroscopyTemplate}
      />
    </div>
  )
}
