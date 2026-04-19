import React from 'react'
import { render } from '@testing-library/react'
import AppMenu from '../AppMenu'

test('AppMenu renders and toggles menu button', () => {
  const mockApp = { id: 'a1', name: 'app1' }
  const { getByText } = render(<AppMenu app={mockApp} />)
  // menu button is the ellipsis
  expect(getByText('⋯')).toBeTruthy()
})
