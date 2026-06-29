import { useEffect, useRef } from 'react'

/**
 * Viewport background hook.
 *
 * The content scrolls inside .main-viewport, while this hook maps that scroll
 * progress onto the background photo's own overflow distance. On desktop and
 * landscape viewports, it also adds only enough scroll space to reveal the
 * hidden bottom of the background when the page content is shorter than the
 * rendered photo.
 *
 * @param {string} imageUrl Path to the background image
 * @returns {React.RefObject} Attach to the page container element
 */
export default function useBgFit(imageUrl) {
  const ref = useRef(null)

  useEffect(() => {
    if (!imageUrl || !ref.current) return

    const el = ref.current
    const viewport = window.visualViewport
    const scroller = el.closest('.main-viewport')
    const img = new Image()
    let raf = null
    let resizeObserver = null
    let hasMeasured = false

    const getViewportHeight = () => viewport?.height || window.innerHeight

    const update = () => {
      raf = null

      if (!img.naturalWidth || !img.naturalHeight) return

      const viewportWidth = Math.max(1, window.innerWidth)
      const viewportHeight = Math.max(1, getViewportHeight())
      const rect = scroller?.getBoundingClientRect()
      const width = Math.max(1, rect?.width || viewportWidth)
      const height = Math.max(1, rect?.height || viewportHeight)
      const fitLeft = Math.max(0, rect?.left || 0)
      const fitRight = Math.min(viewportWidth, rect?.right || viewportWidth)
      const scale = Math.max(width / img.naturalWidth, height / img.naturalHeight)
      const renderedWidth = Math.ceil(img.naturalWidth * scale)
      const renderedHeight = Math.ceil(img.naturalHeight * scale)
      const bgOffsetX = Math.round(fitLeft + ((width - renderedWidth) / 2))
      const bgOverflowY = Math.max(0, renderedHeight - height)
      const canUseBgScroll = window.matchMedia('(min-width: 901px), (orientation: landscape)').matches
      const contentHeight = Math.max(
        el.scrollHeight,
        el.offsetHeight,
        Math.ceil(el.getBoundingClientRect().height)
      )
      const bgScrollSpacer = canUseBgScroll
        ? Math.max(0, renderedHeight - contentHeight)
        : 0
      const scrollTop = scroller?.scrollTop || window.scrollY || 0
      const bgOffsetY = -Math.min(bgOverflowY, Math.max(0, scrollTop))

      document.documentElement.style.setProperty('--app-viewport-height', `${viewportHeight}px`)
      el.style.setProperty('--bg-image', `url("${imageUrl}")`)
      el.style.setProperty('--bg-viewport-height', `${height}px`)
      el.style.setProperty('--bg-render-width', `${renderedWidth}px`)
      el.style.setProperty('--bg-render-height', `${renderedHeight}px`)
      el.style.setProperty('--bg-fit-left', `${fitLeft}px`)
      el.style.setProperty('--bg-fit-right', `${fitRight}px`)
      el.style.setProperty('--bg-position-x', `${bgOffsetX}px`)
      el.style.setProperty('--bg-position-y', `${bgOffsetY}px`)
      scroller?.style.setProperty('--bg-scroll-spacer', `${Math.ceil(bgScrollSpacer)}px`)

      if (!hasMeasured) {
        hasMeasured = true
        el.setAttribute('data-bg-mode', 'pan')
      }
    }

    const scheduleUpdate = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }

    img.onload = scheduleUpdate
    img.src = imageUrl

    scroller?.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate, { passive: true })
    viewport?.addEventListener('resize', scheduleUpdate, { passive: true })

    if ('ResizeObserver' in window && scroller) {
      resizeObserver = new ResizeObserver(scheduleUpdate)
      resizeObserver.observe(scroller)
    }

    scheduleUpdate()

    return () => {
      if (raf) cancelAnimationFrame(raf)
      resizeObserver?.disconnect()
      scroller?.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
      viewport?.removeEventListener('resize', scheduleUpdate)
      el.removeAttribute('data-bg-mode')
      el.style.removeProperty('--bg-viewport-height')
      el.style.removeProperty('--bg-render-width')
      el.style.removeProperty('--bg-render-height')
      el.style.removeProperty('--bg-fit-left')
      el.style.removeProperty('--bg-fit-right')
      el.style.removeProperty('--bg-position-x')
      el.style.removeProperty('--bg-position-y')
      scroller?.style.removeProperty('--bg-scroll-spacer')
    }
  }, [imageUrl])

  return ref
}
