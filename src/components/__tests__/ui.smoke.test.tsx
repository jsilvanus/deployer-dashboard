import React from 'react'
import { render } from '@testing-library/react'
import { describe, test, expect } from 'vitest'
import { renderToString } from 'react-dom/server'
import Button from '../ui/Button'
import Pill from '../ui/Pill'
import Menu from '../ui/Menu'
import Modal from '../ui/Modal'
import Drawer from '../ui/Drawer'
import Sparkline from '../ui/Sparkline'
import AreaChart from '../ui/AreaChart'
import StatusStrip from '../ui/StatusStrip'
import MetricTile from '../MetricTile'

describe('UI primitives smoke', () => {
  test('Button mounts', () => {
    const s = renderToString(<Button>Hi</Button>)
    expect(s).toBeTruthy()
  })

  test('Pill mounts', () => {
    const s = renderToString(<Pill>AB</Pill>)
    expect(s).toContain('AB')
  })

  test('Menu mounts', () => {
    const s = renderToString(<Menu label="menu" items={[]} />)
    expect(s).toBeTruthy()
  })

  test('Modal mounts closed', () => {
    const s = renderToString(<Modal isOpen={false} onClose={() => {}} />)
    expect(s).toBe('')
  })

  test('Drawer mounts', () => {
    const s = renderToString(<Drawer isOpen={true} onClose={() => {}} />)
    expect(s).toBeTruthy()
  })

  test('Sparkline mounts', () => {
    const s = renderToString(<Sparkline data={[1,2,3,2,4]} />)
    expect(s).toContain('<svg')
  })

  test('AreaChart mounts', () => {
    const s = renderToString(<AreaChart data={[1,2,3]} />)
    expect(s).toContain('<svg')
  })

  test('StatusStrip mounts', () => {
    const s = renderToString(<StatusStrip segments={[{value:1},{value:2}]} />)
    expect(s).toBeTruthy()
  })

  test('MetricTile mounts', () => {
    const s = renderToString(<MetricTile label="Metric" value="42" data={[1,2,3]} />)
    expect(s).toContain('42')
  })
})
