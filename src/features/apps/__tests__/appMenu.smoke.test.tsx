/* @vitest-environment node */

import React from 'react'
import { test, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import AppMenu from '../AppMenu'

test('AppMenu server-render smoke', () => {
  const mockApp = { id: 'a1', name: 'app1' }
  const s = renderToString(<AppMenu app={mockApp} />)
  // ensure markup contains the menu ellipsis
  expect(s).toContain('⋯')
})
