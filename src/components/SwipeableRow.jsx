import React, { useRef, useState, useEffect, useCallback } from 'react'

export default function SwipeableRow({ children, onDelete, isOpen, onOpenChange }) {
  const [offset, setOffset] = useState(0)
  const [animate, setAnimate] = useState(true)
  const drag = useRef(null)
  const justSwiped = useRef(false)

  useEffect(() => {
    if (!isOpen) {
      setAnimate(true)
      setOffset(0)
    }
  }, [isOpen])

  const isInteractive = useCallback((target) => {
    return target && target.closest('button, a, input, select, [data-no-swipe]')
  }, [])

  const start = (x, y) => {
    drag.current = {
      x, y,
      base: isOpen ? -80 : 0,
      dir: null,
      moved: false
    }
  }

  const move = (x, y) => {
    const d = drag.current
    if (!d || d.dir === 'v') return

    const dx = x - d.x
    const dy = y - d.y

    if (!d.dir) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
      d.dir = Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
      if (d.dir === 'v') { drag.current = null; return }
      setAnimate(false)
    }

    d.moved = true
    setOffset(Math.max(Math.min(dx + d.base, 0), -80))
  }

  const end = () => {
    const d = drag.current
    drag.current = null
    if (!d || !d.moved) return

    setAnimate(true)
    justSwiped.current = true
    setTimeout(() => { justSwiped.current = false }, 150)

    if (offset < -35) {
      setOffset(-80)
      onOpenChange?.(true)
    } else {
      setOffset(0)
      onOpenChange?.(false)
    }
  }

  const handleClickCapture = (e) => {
    if (justSwiped.current) {
      e.stopPropagation()
      e.preventDefault()
      return
    }
    if (isOpen) {
      e.stopPropagation()
      e.preventDefault()
      setAnimate(true)
      setOffset(0)
      onOpenChange?.(false)
    }
  }

  const onTouchStart = (e) => {
    if (isInteractive(e.target)) return
    start(e.touches[0].clientX, e.touches[0].clientY)
  }

  const onMouseDown = (e) => {
    if (isInteractive(e.target)) return
    start(e.clientX, e.clientY)
    e.preventDefault()
  }

  const showAction = offset < -2 || isOpen

  return (
    <div className="swipe-container">
      {showAction && (
        <div className="swipe-action" onClick={onDelete}>
          Excluir
        </div>
      )}
      <div
        className="swipe-content"
        style={{
          transform: offset !== 0 ? `translateX(${offset}px)` : 'none',
          transition: animate ? 'transform 0.25s ease-out' : 'none'
        }}
        onTouchStart={onTouchStart}
        onTouchMove={e => { if (drag.current) move(e.touches[0].clientX, e.touches[0].clientY) }}
        onTouchEnd={end}
        onMouseDown={onMouseDown}
        onMouseMove={e => { if (drag.current) move(e.clientX, e.clientY) }}
        onMouseUp={end}
        onMouseLeave={() => { if (drag.current) end() }}
        onClickCapture={handleClickCapture}
      >
        {children}
      </div>
    </div>
  )
}
