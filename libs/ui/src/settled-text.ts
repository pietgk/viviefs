import { useEffect, useRef, useState } from 'react'

/** Idle delay before in-flight text settles into a datom (D41). */
export const TEXT_SETTLE_MS = 500

/**
 * In-flight text stays in component state until idle, blur, or Enter.
 * Unmount settles rather than discards.
 */
export const useSettledText = (
  value: string,
  onSettle: (text: string) => void,
  settleMs = TEXT_SETTLE_MS,
) => {
  const [text, setText] = useState(value)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draft = useRef(value)
  const settled = useRef(value)
  const latest = useRef({ value, onSettle })
  latest.current = { value, onSettle }

  useEffect(() => {
    if (timer.current) return
    draft.current = value
    settled.current = value
    setText(value)
  }, [value])

  const settle = () => {
    if (timer.current) {
      clearTimeout(timer.current)
      timer.current = null
    }
    if (draft.current === settled.current) return
    settled.current = draft.current
    latest.current.onSettle(draft.current)
  }

  const settleRef = useRef(settle)
  settleRef.current = settle

  useEffect(() => () => settleRef.current(), [])

  const change = (next: string) => {
    draft.current = next
    setText(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => settleRef.current(), settleMs)
  }

  return { text, change, settle }
}
