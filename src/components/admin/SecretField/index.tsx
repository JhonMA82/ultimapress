'use client'

import React, { useState } from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'

/** A text field shown as dots, with a Show button: for passwords and secret keys. */
export const SecretField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path: path || field.name })
  const [show, setShow] = useState(false)
  return (
    <div className="field-type text" style={{ flex: '1 1 auto' }}>
      <FieldLabel label={field.label || field.name} path={path} />
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          type={show ? 'text' : 'password'}
          autoComplete="new-password"
          value={value || ''}
          onChange={(e) => setValue(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn--style-secondary btn--size-small" style={{ margin: 0 }} onClick={() => setShow((s) => !s)}>
          {show ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}
