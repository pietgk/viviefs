import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { useSettledText } from './settled-text.ts'

const Probe = ({
  value,
  onSettle,
}: {
  value: string
  onSettle: (text: string) => void
}) => {
  const field = useSettledText(value, onSettle, 50)
  return (
    <input
      aria-label="Title"
      value={field.text}
      onChange={(event) => field.change(event.target.value)}
      onBlur={field.settle}
    />
  )
}

describe('useSettledText', () => {
  it('does not settle on each keystroke', () => {
    vi.useFakeTimers()
    const settled: string[] = []
    render(<Probe value="" onSettle={(text) => settled.push(text)} />)
    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Q3' } })
    expect(settled).toEqual([])
    vi.advanceTimersByTime(50)
    expect(settled).toEqual(['Q3'])
    vi.useRealTimers()
  })
})
